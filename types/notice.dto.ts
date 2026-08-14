import { toId } from '@/lib/utils';

import { NoticeAudience } from './notice-audience';
import { NoticeCategory } from './notice-category';

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
  /** Metadata needed to render an attachment safely; its storage location never leaves the server. */
  attachmentMimeType?: string | null;
  attachmentName?: string | null;
  audience: NoticeAudience;
  category: NoticeCategory;
  /** The intake sessions a session notice targets — empty on a general one. */
  sessions: string[];
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
    attachmentMimeType: entity.image?.mimeType ?? null,
    attachmentName: entity.image?.fileName ?? null,
    audience: entity.audience,
    category: entity.category,
    sessions: entity.sessions ?? [],
    publishedById: toId(entity.publishedBy),
    publishedAt: entity.publishedAt.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
