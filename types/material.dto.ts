import { toId } from '@/lib/utils';

import type { MaterialEntity } from '@/models/material.model';

/**
 * A course material as the UI sees one.
 *
 * `storageKey` is deliberately absent: it describes where the bytes sit on the
 * server, which is nobody's business on the client. Downloads go through a route
 * handler that checks access and resolves the key itself.
 */
export type MaterialDto = {
  materialId: string;
  courseId: string;
  uploadedById: string;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Map a stored material to its DTO.
 *
 * @param entity - Stored material.
 *
 * @returns Instance of MaterialDto.
 */
export function materialFromEntity(entity: MaterialEntity): MaterialDto {
  return {
    materialId: toId(entity._id),
    courseId: toId(entity.course),
    uploadedById: toId(entity.uploadedBy),
    title: entity.title,
    description: entity.description ?? '',
    fileName: entity.fileName,
    mimeType: entity.mimeType,
    size: entity.size,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
