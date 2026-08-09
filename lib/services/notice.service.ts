import { Notice } from '@/models/notice.model';
import { NoticeAudience, NoticeDto, SessionUser, UserRole, noticeFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { NOTICE_AUDIENCES } from '@/constants/notice.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { NoticeCreateOutput } from '@/lib/schemas';
import { storage } from '@/lib/storage';
import type { StoredFileStream } from '@/lib/storage';
import { fileMatchesDeclaredType } from '@/lib/utils';

import type { NoticeAttributes, NoticeEntity, NoticeImage } from '@/models/notice.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('notice.service');

const DATABASE = CODES.DATABASE.NOTICES;
const VALIDATION = CODES.VALIDATION.NOTICES;
const AUTH = CODES.AUTH.NOTICES;

export class NoticeService {
  /**
   * Every notice the department has published, newest first.
   *
   * The administrator's view, and deliberately unfiltered: somebody who publishes to three
   * audiences has to be able to see what they published to each, or the screen cannot
   * answer "did that go out?".
   *
   * @returns Every notice as a DTO.
   */
  public async list(): Promise<ListResult<NoticeDto>> {
    return this.find({});
  }

  /**
   * The notices a particular role is addressed by.
   *
   * **Filtered here rather than in the component**, which is the whole point of the
   * method existing. A feed that fetched everything and hid the rest with a `filter()` in
   * the browser would have already sent every notice to every dashboard — the payload is
   * the disclosure, whatever the screen chooses to paint. A student asking for their feed
   * gets a query that cannot return a teachers-only notice.
   *
   * An administrator sees everything, because `all` is a superset of nothing here: they
   * are the ones publishing, and a notice they cannot see is a notice they cannot check.
   *
   * @param role - The viewer's role.
   * @param limit - How many to return, newest first, or null for every one of them.
   *
   * @returns The notices addressed to that role.
   */
  public async listForRole(role: UserRole, limit: number | null = null): Promise<ListResult<NoticeDto>> {
    const audiences = this.audiencesFor(role);

    return this.find(audiences ? { audience: { $in: audiences } } : {}, limit);
  }

  /**
   * Publish a notice.
   *
   * The author comes from the session and the date from the clock; neither is a form
   * field, so there is nothing here for a hand-built request to sign somebody else's name
   * to. `publishedAt` is set explicitly rather than left to the model's default, because
   * "when was this announced" is the notice's own fact and should not depend on which
   * layer happened to fill it in.
   *
   * An image, when there is one, is written to storage first and the row second. If the
   * row then fails, the bytes are deleted again — otherwise a failed publish would leave
   * an orphan in the bucket that nothing points at and nothing will ever clean up. The
   * same compensating delete `MaterialService.upload()` does, for the same reason.
   *
   * @param input - Validated create input.
   * @param requester - The signed-in account publishing it.
   *
   * @returns The published notice, or a failure.
   */
  public async create(input: NoticeCreateOutput, requester: SessionUser): Promise<SingleResult<NoticeDto>> {
    let image: NoticeImage | undefined;

    try {
      await connectToDatabase();

      if (input.image) {
        // The one type check the client cannot fake — the declared type is only a claim.
        if (!(await fileMatchesDeclaredType(input.image))) {
          return singleFailure(createError(VALIDATION.IMAGE_TYPE_NOT_ALLOWED.CODE, VALIDATION.IMAGE_TYPE_NOT_ALLOWED.MESSAGE, 'image'));
        }

        const stored = await storage.save(input.image);

        image = { storageKey: stored.storageKey, fileName: stored.fileName, mimeType: stored.mimeType, size: stored.size };
      }

      const created = await Notice.create({
        title: input.title,
        // Stored as absent rather than as an empty string, so a picture-only notice reads as one.
        body: input.body ? input.body : undefined,
        image,
        audience: input.audience,
        publishedBy: requester.userId,
        publishedAt: new Date(),
      });

      return singleSuccess(noticeFromEntity(created));
    } catch (error) {
      log.error({ err: error }, 'Creating a notice failed');

      if (image) {
        await storage.remove(image.storageKey).catch(() => undefined);
      }

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
  }

  /**
   * Open a notice's image for somebody allowed to see it.
   *
   * The access check the feed does not need. A list simply never returns a notice outside
   * the viewer's audience, but an image URL contains an id and ids can be guessed — so
   * being addressed by the notice is checked here, against the same `audiencesFor()` rule
   * the list uses, rather than left to the fact that nothing links to it.
   *
   * The URL carries the notice's id, never the storage key: resolving one to the other
   * happens here, behind the check, so the bucket cannot be read by guessing.
   *
   * @param noticeId - Notice whose image is wanted.
   * @param viewer - The signed-in account asking, or null.
   *
   * @returns The image stream, or a failure.
   */
  public async openImage(noticeId: string, viewer: SessionUser | null): Promise<SingleResult<StoredFileStream>> {
    try {
      if (!viewer) {
        return singleFailure(createError(AUTH.NOT_IN_AUDIENCE.CODE, AUTH.NOT_IN_AUDIENCE.MESSAGE));
      }

      await connectToDatabase();

      const notice = await Notice.findById(noticeId).lean<NoticeEntity | null>();

      if (!notice || !notice.image) {
        return this.noticeNotFound();
      }

      const audiences = this.audiencesFor(viewer.role);

      if (audiences && !audiences.includes(notice.audience)) {
        return singleFailure(createError(AUTH.NOT_IN_AUDIENCE.CODE, AUTH.NOT_IN_AUDIENCE.MESSAGE));
      }

      const file = await storage.read(notice.image.storageKey);

      if (!file) {
        return this.noticeNotFound();
      }

      return singleSuccess(file);
    } catch (error) {
      log.error({ err: error }, 'Opening a notice image failed');

      return singleFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  private noticeNotFound(): SingleResult<StoredFileStream> {
    return singleFailure(createError(VALIDATION.NOTICE_NOT_FOUND.CODE, VALIDATION.NOTICE_NOT_FOUND.MESSAGE));
  }

  /**
   * The shared read, so the two list methods cannot sort or map differently.
   *
   * Sorted by `publishedAt` and not `createdAt`: the model keeps them apart so a notice
   * can be written now and dated deliberately, and a feed ordered by the wrong one would
   * put an announcement where its author did not mean it to sit.
   *
   * @param conditions - Audience narrowing, or nothing.
   * @param limit - How many to return, or null for all of them.
   *
   * @returns Matching notices as DTOs.
   */
  private async find(conditions: QueryFilter<NoticeAttributes>, limit: number | null = null): Promise<ListResult<NoticeDto>> {
    try {
      await connectToDatabase();

      const query = Notice.find(conditions).sort({ publishedAt: -1 });

      if (limit) {
        query.limit(limit);
      }

      const notices = await query.lean<NoticeEntity[]>();

      return listSuccess(notices.map(noticeFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing notices failed');

      return listFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * Which audiences a role is a member of.
   *
   * Written as "which values may this role see" rather than "which should be hidden",
   * because an allow-list fails closed: a fourth audience added tomorrow reaches nobody
   * until it is named here, where a deny-list would show it to everybody until somebody
   * remembered.
   *
   * @param role - The viewer's role.
   *
   * @returns The audiences to match, or null when every notice is visible.
   */
  private audiencesFor(role: UserRole): NoticeAudience[] | null {
    if (role === USER_ROLES.TEACHER) {
      return [NOTICE_AUDIENCES.ALL, NOTICE_AUDIENCES.TEACHERS];
    }

    if (role === USER_ROLES.STUDENT) {
      return [NOTICE_AUDIENCES.ALL, NOTICE_AUDIENCES.STUDENTS];
    }

    // The admin area, which publishes them and therefore sees all of them.
    return null;
  }
}
