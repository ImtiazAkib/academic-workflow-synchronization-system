import { toId } from '@/lib/utils';

import { FileConversionFailure, FileConversionStatus, FileConversionTarget } from './file-conversion';

import type { FileConversionEntity } from '@/models/file-conversion.model';

export type FileConversionDto = {
  conversionId: string;
  target: FileConversionTarget;
  fileName: string;
  status: FileConversionStatus;
  /** Set only on a failed job — why it failed, as a code the screen localizes. */
  failure: FileConversionFailure | null;
  /** Bytes the upload arrived as. */
  originalSize: number;
  /** Bytes it takes on disk once compressed — null until the job finishes. */
  finalSize: number | null;
  startedById: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Map a stored conversion job to its DTO.
 *
 * @param entity - Stored conversion.
 *
 * @returns Instance of FileConversionDto.
 */
export function fileConversionFromEntity(entity: FileConversionEntity): FileConversionDto {
  return {
    conversionId: toId(entity._id),
    target: entity.target,
    fileName: entity.fileName,
    status: entity.status,
    failure: entity.failure ?? null,
    originalSize: entity.originalSize,
    finalSize: entity.finalSize ?? null,
    startedById: toId(entity.startedBy),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
