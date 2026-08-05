import { toId } from '@/lib/utils';

import { NoticeAudience } from './notice-audience';

import type { NoticeEntity } from '@/models/notice.model';

export type NoticeDto = {
  noticeId: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  publishedById: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Map a stored notice to its DTO.
 *
 * @param entity - Stored notice.
 *
 * @returns Instance of NoticeDto.
 */
export function noticeFromEntity(entity: NoticeEntity): NoticeDto {
  return {
    noticeId: toId(entity._id),
    title: entity.title,
    body: entity.body,
    audience: entity.audience,
    publishedById: toId(entity.publishedBy),
    publishedAt: entity.publishedAt.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
