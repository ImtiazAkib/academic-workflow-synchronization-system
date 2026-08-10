import { Course } from '@/models/course.model';
import { Material } from '@/models/material.model';
import { MaterialDto, SessionUser, materialFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import {
  EmptyResult,
  ListResult,
  SingleResult,
  createError,
  emptyFailureWithError,
  emptySuccess,
  listFailure,
  listSuccess,
  singleFailure,
  singleSuccess,
} from '@/lib/result';
import type { MaterialUploadOutput } from '@/lib/schemas';
import { storage } from '@/lib/storage';
import type { StoredFileStream } from '@/lib/storage';
import { fileMatchesDeclaredType, toId } from '@/lib/utils';

import { hasStorageRoomFor } from './storage.guard';

import type { CourseEntity } from '@/models/course.model';
import type { MaterialAttributes, MaterialEntity } from '@/models/material.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('material.service');

const DATABASE = CODES.DATABASE.MATERIALS;
const VALIDATION = CODES.VALIDATION.MATERIALS;
const AUTH = CODES.AUTH.MATERIALS;
const BUSINESS = CODES.BUSINESS.COMMON;

export class MaterialService {
  /**
   * List materials, newest first.
   *
   * @param courseId - Narrow to one course, or every course when omitted.
   *
   * @returns Matching materials as DTOs.
   */
  public async list(courseId?: string): Promise<ListResult<MaterialDto>> {
    try {
      await connectToDatabase();

      const conditions: QueryFilter<MaterialAttributes> = {};

      if (courseId) {
        conditions.course = courseId;
      }

      const materials = await Material.find(conditions).sort({ createdAt: -1 }).lean<MaterialEntity[]>();

      return listSuccess(materials.map(materialFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing materials failed');

      return listFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * Store a file against a course.
   *
   * Three things have to hold, and all three are checked here rather than in the route:
   * the course exists, the uploader is allowed to publish to it, and the bytes are what
   * they claim to be. The schema already bounded the size and the declared type — this
   * is the part a hand-built request cannot talk its way past.
   *
   * @param input - Validated upload input.
   * @param uploader - The signed-in user making the request.
   *
   * @returns The stored material, or a failure.
   */
  public async upload(input: MaterialUploadOutput, uploader: SessionUser): Promise<SingleResult<MaterialDto>> {
    try {
      await connectToDatabase();

      const course = await Course.findById(input.courseId).lean<CourseEntity | null>();

      if (!course) {
        return singleFailure(createError(VALIDATION.COURSE_NOT_FOUND.CODE, VALIDATION.COURSE_NOT_FOUND.MESSAGE, 'courseId'));
      }

      /*
        A teacher publishes to their own courses only. An administrator is not scoped —
        they assign the courses in the first place.
      */
      if (uploader.role === USER_ROLES.TEACHER && (!course.assignedTeacher || toId(course.assignedTeacher) !== uploader.userId)) {
        return singleFailure(createError(AUTH.NOT_OWN_COURSE.CODE, AUTH.NOT_OWN_COURSE.MESSAGE, 'courseId'));
      }

      // The one type check the client cannot fake.
      if (!(await fileMatchesDeclaredType(input.file))) {
        return singleFailure(createError(VALIDATION.FILE_TYPE_NOT_ALLOWED.CODE, VALIDATION.FILE_TYPE_NOT_ALLOWED.MESSAGE, 'file'));
      }

      /*
        The exact room check, now that the size is finally known. The route already turned
        the request away if the bucket was over the line before it arrived; this catches the
        file that is itself the one to tip it over. Kept here beside the type and ownership
        checks so a request that reaches the service another way cannot skip it.
      */
      if (!(await hasStorageRoomFor(input.file.size))) {
        return singleFailure(createError(BUSINESS.STORAGE_FULL.CODE, BUSINESS.STORAGE_FULL.MESSAGE, 'file'));
      }

      const stored = await storage.save(input.file);

      try {
        const created = await Material.create({
          course: input.courseId,
          uploadedBy: uploader.userId,
          title: input.title,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          size: stored.size,
          storageKey: stored.storageKey,
        });

        return singleSuccess(materialFromEntity(created));
      } catch (error) {
        /*
          The bytes landed but the row did not. Without this the file would sit in the
          bucket forever with nothing pointing at it — invisible, undeletable and still
          counting against storage.
        */
        await storage.remove(stored.storageKey);

        throw error;
      }
    } catch (error) {
      log.error({ err: error }, 'Uploading a material failed');

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
  }

  /**
   * Delete a material and the bytes behind it.
   *
   * @param materialId - Material to remove.
   * @param requester - The signed-in user making the request.
   *
   * @returns Empty success, or a failure.
   */
  public async remove(materialId: string, requester: SessionUser): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const target = await Material.findById(materialId).lean<MaterialEntity | null>();

      if (!target) {
        return emptyFailureWithError(createError(VALIDATION.MATERIAL_NOT_FOUND.CODE, VALIDATION.MATERIAL_NOT_FOUND.MESSAGE));
      }

      // A teacher deletes what they uploaded; an administrator deletes anything.
      if (requester.role === USER_ROLES.TEACHER && toId(target.uploadedBy) !== requester.userId) {
        return emptyFailureWithError(createError(AUTH.NOT_OWN_MATERIAL.CODE, AUTH.NOT_OWN_MATERIAL.MESSAGE));
      }

      if (requester.role === USER_ROLES.STUDENT) {
        return emptyFailureWithError(createError(AUTH.NOT_OWN_MATERIAL.CODE, AUTH.NOT_OWN_MATERIAL.MESSAGE));
      }

      await Material.findByIdAndDelete(materialId);

      // Row first, bytes second: an orphaned file is recoverable, a dangling row is not.
      await storage.remove(target.storageKey);

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Deleting a material failed');

      return emptyFailureWithError(createError(DATABASE.DELETE_FAILED.CODE, DATABASE.DELETE_FAILED.MESSAGE));
    }
  }

  /**
   * Open a material for download, if the requester may have it.
   *
   * Students and teachers read anything the department publishes; the rule that matters
   * is that there is a session at all, which is why the route cannot simply stream the
   * bucket by key. Resolving the key here is what keeps `storageKey` off the client.
   *
   * @param materialId - Material to read.
   * @param requester - The signed-in user making the request.
   *
   * @returns The file stream and its metadata, or a failure.
   */
  public async openForDownload(materialId: string, requester: SessionUser | null): Promise<SingleResult<StoredFileStream>> {
    try {
      if (!requester) {
        return singleFailure(createError(AUTH.DOWNLOAD_NOT_ALLOWED.CODE, AUTH.DOWNLOAD_NOT_ALLOWED.MESSAGE));
      }

      await connectToDatabase();

      const target = await Material.findById(materialId).lean<MaterialEntity | null>();

      if (!target) {
        return singleFailure(createError(VALIDATION.MATERIAL_NOT_FOUND.CODE, VALIDATION.MATERIAL_NOT_FOUND.MESSAGE));
      }

      const file = await storage.read(target.storageKey);

      if (!file) {
        // The row outlived its bytes — report it as missing rather than as a server fault.
        return singleFailure(createError(VALIDATION.MATERIAL_NOT_FOUND.CODE, VALIDATION.MATERIAL_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(file);
    } catch (error) {
      log.error({ err: error }, 'Opening a material for download failed');

      return singleFailure(createError(DATABASE.STORAGE_FAILED.CODE, DATABASE.STORAGE_FAILED.MESSAGE));
    }
  }
}
