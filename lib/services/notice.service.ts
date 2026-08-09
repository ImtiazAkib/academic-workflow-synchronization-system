import { Notice } from '@/models/notice.model';
import { NoticeAudience, NoticeDto, SessionUser, UserRole, noticeFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { NOTICE_AUDIENCES } from '@/constants/notice.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { NoticeCreateOutput } from '@/lib/schemas';

import type { NoticeAttributes, NoticeEntity } from '@/models/notice.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('notice.service');

const DATABASE = CODES.DATABASE.NOTICES;

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
   * @param input - Validated create input.
   * @param requester - The signed-in account publishing it.
   *
   * @returns The published notice, or a failure.
   */
  public async create(input: NoticeCreateOutput, requester: SessionUser): Promise<SingleResult<NoticeDto>> {
    try {
      await connectToDatabase();

      const created = await Notice.create({
        title: input.title,
        body: input.body,
        audience: input.audience,
        publishedBy: requester.userId,
        publishedAt: new Date(),
      });

      return singleSuccess(noticeFromEntity(created));
    } catch (error) {
      log.error({ err: error }, 'Creating a notice failed');

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
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
