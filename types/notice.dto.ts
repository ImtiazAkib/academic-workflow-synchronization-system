import { toId } from '@/lib/utils';

import { NoticeAudience } from './notice-audience';

import type { NoticeEntity } from '@/models/notice.model';

export type NoticeDto = {
  noticeId: string;
  title: string;
  /** Empty when the notice is nothing but a picture. */
  body: string;
  /**
   * Whether there is a picture to fetch — deliberately not where it is.
   *
   * The `storageKey` stays on the server, the same way `MaterialDto` withholds it. A
   * screen asks for `/api/notices/{noticeId}/image`, which resolves the key behind the
   * audience check; publishing the key instead would put the bucket one guess away.
   */
  hasImage: boolean;
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
    body: entity.body ?? '',
    hasImage: Boolean(entity.image),
    audience: entity.audience,
    publishedById: toId(entity.publishedBy),
    publishedAt: entity.publishedAt.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
