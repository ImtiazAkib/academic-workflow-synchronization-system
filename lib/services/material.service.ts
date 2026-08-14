import { Course } from '@/models/course.model';
import { Material } from '@/models/material.model';
import { User } from '@/models/user.model';
import { MaterialDto, SessionUser, materialFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { ADMIN_AREA_ROLES, USER_ROLES } from '@/constants/roles.const';
import { FILE_CONVERSION_TARGET } from '@/constants/storage.const';

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
import type { MaterialUpdateOutput, MaterialUploadOutput } from '@/lib/schemas';
import { storage } from '@/lib/storage';
import type { StoredFileStream } from '@/lib/storage';
import { fileMatchesDeclaredType, toId } from '@/lib/utils';

import { ConversionService } from './conversion.service';
import { hasStorageRoomFor } from './storage.guard';

import type { CourseEntity } from '@/models/course.model';
import type { MaterialAttributes, MaterialEntity } from '@/models/material.model';
import type { UserEntity } from '@/models/user.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('material.service');

const DATABASE = CODES.DATABASE.MATERIALS;
const VALIDATION = CODES.VALIDATION.MATERIALS;
const AUTH = CODES.AUTH.MATERIALS;
const BUSINESS = CODES.BUSINESS.COMMON;

const conversions = new ConversionService();

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
          description: input.description || undefined,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          size: stored.size,
          storageKey: stored.storageKey,
        });

        /*
          The file is stored raw and the row points at it; compressing it is booked to run
          after the response so the upload does not wait. The job swaps the row to the
          smaller file once it finishes — and if it fails, the raw file still serves.
        */
        const jobId = await conversions.enqueue(FILE_CONVERSION_TARGET.MATERIAL, toId(created._id), stored.fileName, stored.size, uploader.userId);

        conversions.schedule(jobId);

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

  /** Update material metadata and, when supplied, safely replace its stored file. */
  public async update(input: MaterialUpdateOutput, requester: SessionUser): Promise<SingleResult<MaterialDto>> {
    let replacement: Awaited<ReturnType<typeof storage.save>> | null = null;

    try {
      await connectToDatabase();
      const target = await Material.findById(input.materialId).lean<MaterialEntity | null>();
      if (!target) return singleFailure(createError(VALIDATION.MATERIAL_NOT_FOUND.CODE, VALIDATION.MATERIAL_NOT_FOUND.MESSAGE));
      if (requester.role === USER_ROLES.TEACHER && toId(target.uploadedBy) !== requester.userId) {
        return singleFailure(createError(AUTH.NOT_OWN_MATERIAL.CODE, AUTH.NOT_OWN_MATERIAL.MESSAGE));
      }

      if (input.file) {
        if (!(await fileMatchesDeclaredType(input.file))) {
          return singleFailure(createError(VALIDATION.FILE_TYPE_NOT_ALLOWED.CODE, VALIDATION.FILE_TYPE_NOT_ALLOWED.MESSAGE, 'file'));
        }
        /*
          The old file is still in the bucket at this point (it is removed only after the
          row points at the new one, below), so charge only the growth. Without the `- target.size`
          a same-size or smaller replacement near the block line was refused although the
          swap would leave usage equal or lower.
        */
        if (!(await hasStorageRoomFor(Math.max(0, input.file.size - target.size)))) {
          return singleFailure(createError(BUSINESS.STORAGE_FULL.CODE, BUSINESS.STORAGE_FULL.MESSAGE, 'file'));
        }
        replacement = await storage.save(input.file);
      }

      const fields = {
        title: input.title,
        ...(replacement
          ? { fileName: replacement.fileName, mimeType: replacement.mimeType, size: replacement.size, storageKey: replacement.storageKey }
          : {}),
      };
      const updated = await Material.findByIdAndUpdate(
        input.materialId,
        {
          $set: { ...fields, ...(input.description ? { description: input.description } : {}) },
          ...(!input.description ? { $unset: { description: '' } } : {}),
        },
        { returnDocument: 'after' }
      ).lean<MaterialEntity | null>();

      if (!updated) throw new Error('Material disappeared during update');
      if (replacement) {
        await storage.remove(target.storageKey);
        // Compress the replacement the same way a fresh upload is (see upload()), or an edited
        // file would stay raw forever - full-size against the cap, and never swapped to WebP.
        const jobId = await conversions.enqueue(
          FILE_CONVERSION_TARGET.MATERIAL,
          input.materialId,
          replacement.fileName,
          replacement.size,
          requester.userId
        );
        conversions.schedule(jobId);
      }
      return singleSuccess(materialFromEntity(updated));
    } catch (error) {
      if (replacement) await storage.remove(replacement.storageKey).catch(() => undefined);
      log.error({ err: error }, 'Updating a material failed');
      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
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

      /*
        A material belongs to a course, so access follows the course, not merely "is signed in".
        Reported as not-found rather than forbidden when refused: the route turns any
        authenticated failure into 404, so a student guessing ids learns nothing about which
        materials exist for courses that are not theirs.
      */
      if (!(await this.mayAccessMaterial(target, requester))) {
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

  /**
   * Whether the requester may read this material, keyed on the course it belongs to.
   *
   * - An administrator or the super administrator oversees the whole department.
   * - A teacher may read a material they uploaded, or one on a course assigned to them.
   * - A student may read a material whose course is active and in the student's own semester
   *   — the same scope `StudentService.listMaterials` uses for the listing, applied here so
   *   the boundary is real rather than cosmetic (the listing decided what to show; this
   *   decides what may be held).
   *
   * @param material - The material being requested.
   * @param requester - The signed-in account asking.
   *
   * @returns True when access is allowed.
   */
  private async mayAccessMaterial(material: MaterialEntity, requester: SessionUser): Promise<boolean> {
    if (ADMIN_AREA_ROLES.some(role => role === requester.role)) {
      return true;
    }

    if (requester.role === USER_ROLES.TEACHER) {
      if (toId(material.uploadedBy) === requester.userId) {
        return true;
      }

      const course = await Course.findById(material.course).select('assignedTeacher').lean<CourseEntity | null>();

      return Boolean(course?.assignedTeacher && toId(course.assignedTeacher) === requester.userId);
    }

    if (requester.role === USER_ROLES.STUDENT) {
      const [course, account] = await Promise.all([
        Course.findById(material.course).select('semester isActive').lean<CourseEntity | null>(),
        User.findById(requester.userId).select('semester').lean<UserEntity | null>(),
      ]);

      return Boolean(course?.isActive && account?.semester != null && course.semester === account.semester);
    }

    return false;
  }
}
