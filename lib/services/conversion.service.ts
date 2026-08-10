import { after } from 'next/server';

import { FileConversion } from '@/models/file-conversion.model';
import { Material } from '@/models/material.model';
import { Notice } from '@/models/notice.model';
import { FileConversionDto, FileConversionFailure, FileConversionTarget, fileConversionFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { FILE_CONVERSION_FAILURE, FILE_CONVERSION_STATUS, FILE_CONVERSION_TARGET } from '@/constants/storage.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, createError, listFailure, listSuccess } from '@/lib/result';
import { storage } from '@/lib/storage';
import type { StoredFile } from '@/lib/storage';
import { toId } from '@/lib/utils';

import type { FileConversionAttributes, FileConversionEntity } from '@/models/file-conversion.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('conversion.service');

const DATABASE = CODES.DATABASE.COMMON;

/*
  The background half of every upload.

  A file is stored as it arrives — fast, so the teacher's upload returns — and its
  compression is booked here to run after the response. `enqueue` records a job the moment
  the row exists; `schedule` hands the work to `after()` so it runs off the response's back;
  `run` reads the stored original, compresses it, swaps the row to the smaller file and
  deletes the original, marking the job done or, if anything threw, failed with a reason the
  progress screen can show. Nothing here can fail the upload it belongs to: a job that
  cannot be booked is logged and skipped, and the file stays as it was stored.
*/
export class ConversionService {
  /**
   * Book a conversion for a freshly stored file.
   *
   * @param target - Whether the file is a material or a notice image.
   * @param targetId - The row that owns it.
   * @param fileName - The uploaded name, for the progress screen.
   * @param originalSize - Bytes the upload arrived as.
   * @param startedBy - The uploader, so they can find the job on their own screen.
   *
   * @returns The job's id, or null when it could not be booked.
   */
  public async enqueue(
    target: FileConversionTarget,
    targetId: string,
    fileName: string,
    originalSize: number,
    startedBy: string
  ): Promise<string | null> {
    try {
      await connectToDatabase();

      const job = await FileConversion.create({
        target,
        targetId,
        fileName,
        originalSize,
        startedBy,
        status: FILE_CONVERSION_STATUS.PROCESSING,
      });

      return toId(job._id);
    } catch (error) {
      // A conversion that cannot be booked must not take the upload down with it.
      log.error({ err: error }, 'Enqueuing a file conversion failed');

      return null;
    }
  }

  /**
   * Run a booked conversion after the response, not before it.
   *
   * @param jobId - The job to run, or null when none was booked.
   */
  public schedule(jobId: string | null): void {
    if (!jobId) {
      return;
    }

    try {
      after(() => this.run(jobId));
    } catch {
      // Outside a request — a verification script — there is no response to run after, so run it now.
      void this.run(jobId);
    }
  }

  /**
   * Compress a job's file and swap the row to it, or mark why it could not be.
   *
   * @param jobId - The job to run.
   */
  public async run(jobId: string): Promise<void> {
    try {
      await connectToDatabase();

      const job = await FileConversion.findById(jobId).lean<FileConversionEntity | null>();

      // A job already finished, or gone, is not run again — `schedule` may fire more than once on a retry.
      if (!job || job.status !== FILE_CONVERSION_STATUS.PROCESSING) {
        return;
      }

      const currentKey = await this.currentKey(job);

      if (!currentKey) {
        // The material or notice was deleted before the conversion ran — nothing left to compress.
        await this.markFailed(jobId, FILE_CONVERSION_FAILURE.TARGET_GONE);

        return;
      }

      const result = await storage.compress(currentKey);

      if (!result) {
        // Already as small as it usefully gets — the job is done, and the file is left as it was stored.
        await FileConversion.findByIdAndUpdate(jobId, { status: FILE_CONVERSION_STATUS.DONE, finalSize: job.originalSize });

        return;
      }

      await this.applyToTarget(job, result.stored);

      // Row first, then the original bytes — an orphaned old file is recoverable, a dangling key is not.
      await storage.remove(currentKey);

      await FileConversion.findByIdAndUpdate(jobId, { status: FILE_CONVERSION_STATUS.DONE, finalSize: result.physicalSize });
    } catch (error) {
      log.error({ err: error, jobId }, 'Running a file conversion failed');

      await this.markFailed(jobId, FILE_CONVERSION_FAILURE.CONVERSION_FAILED);
    }
  }

  /**
   * Every conversion job, newest first — the administrator's progress screen.
   *
   * @param limit - How many to return.
   *
   * @returns The jobs as DTOs.
   */
  public async list(limit: number): Promise<ListResult<FileConversionDto>> {
    return this.find({}, limit);
  }

  /**
   * One account's own conversion jobs — a teacher's progress screen.
   *
   * @param userId - The account whose uploads to list.
   * @param limit - How many to return.
   *
   * @returns Their jobs as DTOs.
   */
  public async listForUser(userId: string, limit: number): Promise<ListResult<FileConversionDto>> {
    return this.find({ startedBy: userId }, limit);
  }

  /**
   * The shared read, so the two list methods cannot order or map differently.
   *
   * @param conditions - Who to narrow to, or nothing.
   * @param limit - How many, newest first.
   *
   * @returns Matching jobs as DTOs.
   */
  private async find(conditions: QueryFilter<FileConversionAttributes>, limit: number): Promise<ListResult<FileConversionDto>> {
    try {
      await connectToDatabase();

      const jobs = await FileConversion.find(conditions).sort({ createdAt: -1 }).limit(limit).lean<FileConversionEntity[]>();

      return listSuccess(jobs.map(fileConversionFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing file conversions failed');

      return listFailure(createError(DATABASE.QUERY_FAILED.CODE, DATABASE.QUERY_FAILED.MESSAGE));
    }
  }

  /**
   * The storage key the target currently points at.
   *
   * @param job - The job being run.
   *
   * @returns The key, or null when the target is gone.
   */
  private async currentKey(job: FileConversionEntity): Promise<string | null> {
    if (job.target === FILE_CONVERSION_TARGET.MATERIAL) {
      const material = await Material.findById(job.targetId).select('storageKey').lean<{ storageKey: string } | null>();

      return material?.storageKey ?? null;
    }

    const notice = await Notice.findById(job.targetId).select('image').lean<{ image?: { storageKey: string } } | null>();

    return notice?.image?.storageKey ?? null;
  }

  /**
   * Point the target row at the compressed file, with its new size, type and name.
   *
   * @param job - The job being run.
   * @param stored - The new file the compression produced.
   */
  private async applyToTarget(job: FileConversionEntity, stored: StoredFile): Promise<void> {
    if (job.target === FILE_CONVERSION_TARGET.MATERIAL) {
      await Material.updateOne(
        { _id: job.targetId },
        { storageKey: stored.storageKey, size: stored.size, mimeType: stored.mimeType, fileName: stored.fileName }
      );

      return;
    }

    await Notice.updateOne(
      { _id: job.targetId },
      {
        $set: {
          'image.storageKey': stored.storageKey,
          'image.size': stored.size,
          'image.mimeType': stored.mimeType,
          'image.fileName': stored.fileName,
        },
      }
    );
  }

  /**
   * Mark a job failed with the reason the screen will show.
   *
   * @param jobId - The job that failed.
   * @param failure - Why.
   */
  private async markFailed(jobId: string, failure: FileConversionFailure): Promise<void> {
    await FileConversion.findByIdAndUpdate(jobId, { status: FILE_CONVERSION_STATUS.FAILED, failure }).catch(() => undefined);
  }
}
