import { Notice } from '@/models/notice.model';
import { User } from '@/models/user.model';
import { NoticeAudience, NoticeDto, SessionUser, UserRole, noticeFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import {
  NOTICE_ATTACHMENT_EXTENSIONS,
  NOTICE_ATTACHMENT_MIME_TYPES,
  NOTICE_AUDIENCES,
  NOTICE_CATEGORIES,
  NOTICE_IMAGE,
} from '@/constants/notice.const';
import { USER_ROLES } from '@/constants/roles.const';
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
import type { NoticeCreateOutput } from '@/lib/schemas';
import { storage } from '@/lib/storage';
import type { StoredFileStream } from '@/lib/storage';
import { fileMatchesDeclaredType, toId } from '@/lib/utils';

import { ConversionService } from './conversion.service';
import { hasStorageRoomFor } from './storage.guard';

import type { NoticeAttributes, NoticeEntity, NoticeImage } from '@/models/notice.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('notice.service');

const DATABASE = CODES.DATABASE.NOTICES;
const VALIDATION = CODES.VALIDATION.NOTICES;
const AUTH = CODES.AUTH.NOTICES;
const BUSINESS = CODES.BUSINESS.COMMON;

const conversions = new ConversionService();

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
  public async listForRole(role: UserRole, viewerSession: string | null = null, limit: number | null = null): Promise<ListResult<NoticeDto>> {
    return this.find(this.conditionsForViewer(role, viewerSession), limit);
  }

  /**
   * The notices one account published, newest first.
   *
   * The teacher notices screen's read. A teacher's own session notices are addressed to
   * students, so they never come back through `listForRole` for the teacher — this is how
   * the author sees what they sent. Scoped to the publisher, so one teacher's screen cannot
   * list another's.
   *
   * @param publisherId - The account whose notices to list.
   * @param limit - How many, newest first, or null for all.
   *
   * @returns Their notices as DTOs.
   */
  public async listForPublisher(publisherId: string, limit: number | null = null): Promise<ListResult<NoticeDto>> {
    return this.find({ publishedBy: publisherId }, limit);
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

      const isSession = input.category === NOTICE_CATEGORIES.SESSION;

      /*
        A teacher publishes to students — a general notice to all of them, or a session
        notice to the intakes it names. Posting to the staff room or department-wide is the
        administrator's. The form never offers a teacher those, so this refuses the request
        built by hand to try.
      */
      if (requester.role === USER_ROLES.TEACHER && !isSession && input.audience !== NOTICE_AUDIENCES.STUDENTS) {
        return singleFailure(createError(AUTH.TEACHER_STUDENTS_ONLY.CODE, AUTH.TEACHER_STUDENTS_ONLY.MESSAGE, 'audience'));
      }

      /*
        A session notice is addressed by its sessions and always reaches students, so its
        audience is fixed rather than read from the form. A general notice keeps its audience
        and carries no sessions. Deduplicated and de-blanked so the same intake picked twice,
        or an empty checkbox, cannot skew the match.
      */
      const audience = isSession ? NOTICE_AUDIENCES.STUDENTS : input.audience;
      const sessions = isSession ? [...new Set(input.sessions.map(session => session.trim()).filter(Boolean))] : [];

      if (input.image) {
        // The one type check the client cannot fake — the declared type is only a claim.
        if (!(await fileMatchesDeclaredType(input.image))) {
          return singleFailure(createError(VALIDATION.IMAGE_TYPE_NOT_ALLOWED.CODE, VALIDATION.IMAGE_TYPE_NOT_ALLOWED.MESSAGE, 'image'));
        }

        // Only the image spends the bucket. A text-only notice is never refused for room.
        if (!(await hasStorageRoomFor(input.image.size))) {
          return singleFailure(createError(BUSINESS.STORAGE_FULL.CODE, BUSINESS.STORAGE_FULL.MESSAGE, 'image'));
        }

        const extension = input.image.name.includes('.') ? input.image.name.slice(input.image.name.lastIndexOf('.')).toLowerCase() : '';
        const safeTitle = input.title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 80);
        const namedFile = new File([input.image], `${safeTitle || 'notice'}${extension}`, { type: input.image.type });
        const stored = await storage.save(namedFile);

        image = { storageKey: stored.storageKey, fileName: stored.fileName, mimeType: stored.mimeType, size: stored.size };
      }

      const created = await Notice.create({
        title: input.title,
        // Stored as absent rather than as an empty string, so a picture-only notice reads as one.
        body: input.body ? input.body : undefined,
        image,
        audience,
        category: input.category,
        sessions,
        publishedBy: requester.userId,
        publishedAt: new Date(),
      });

      /*
        The image was stored raw; compressing it is booked to run after the response, and
        swaps the notice's image to the smaller WebP once it finishes. A text-only notice
        has nothing to convert, so no job is booked.
      */
      if (image) {
        const jobId = await conversions.enqueue(FILE_CONVERSION_TARGET.NOTICE, toId(created._id), image.fileName, image.size, requester.userId);

        conversions.schedule(jobId);
      }

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

      if (!(await this.mayViewNotice(notice, viewer))) {
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

  /** Delete a notice and its attachment. Administrators may delete any notice; teachers only their own. */
  public async delete(noticeId: string, requester: SessionUser): Promise<EmptyResult> {
    try {
      await connectToDatabase();
      const notice = await Notice.findById(noticeId).lean<NoticeEntity | null>();

      if (!notice) return emptyFailureWithError(createError(VALIDATION.NOTICE_NOT_FOUND.CODE, VALIDATION.NOTICE_NOT_FOUND.MESSAGE));
      if (requester.role === USER_ROLES.TEACHER && toId(notice.publishedBy) !== requester.userId) {
        return emptyFailureWithError(createError(AUTH.NOT_OWN_NOTICE.CODE, AUTH.NOT_OWN_NOTICE.MESSAGE));
      }

      await Notice.findByIdAndDelete(noticeId);
      // The row is already gone, so a storage hiccup here must not report the delete as
      // failed - warn and leave the blob, exactly as the update() path does on replacement.
      if (notice.image) {
        await storage.remove(notice.image.storageKey).catch(error => log.warn({ err: error }, 'Removing deleted notice attachment failed'));
      }
      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Deleting a notice failed');
      return emptyFailureWithError(createError(DATABASE.DELETE_FAILED.CODE, DATABASE.DELETE_FAILED.MESSAGE));
    }
  }

  /** Update notice text and optionally replace or remove its attachment. */
  public async update(
    noticeId: string,
    input: { title: string; body?: string; file?: File; removeAttachment: boolean },
    requester: SessionUser
  ): Promise<SingleResult<NoticeDto>> {
    let replacement: NoticeImage | undefined;

    try {
      await connectToDatabase();
      const target = await Notice.findById(noticeId).lean<NoticeEntity | null>();
      if (!target) return singleFailure(createError(VALIDATION.NOTICE_NOT_FOUND.CODE, VALIDATION.NOTICE_NOT_FOUND.MESSAGE));
      if (requester.role === USER_ROLES.TEACHER && toId(target.publishedBy) !== requester.userId) {
        return singleFailure(createError(AUTH.NOT_OWN_NOTICE.CODE, AUTH.NOT_OWN_NOTICE.MESSAGE));
      }

      const keepsExisting = Boolean(target.image) && !input.removeAttachment && !input.file;
      if (!input.body?.trim() && !keepsExisting && !input.file) {
        return singleFailure(createError(VALIDATION.BODY_OR_IMAGE_REQUIRED.CODE, VALIDATION.BODY_OR_IMAGE_REQUIRED.MESSAGE, 'body'));
      }

      if (input.file) {
        const loweredName = input.file.name.toLowerCase();
        const declaredTypeAllowed = NOTICE_ATTACHMENT_MIME_TYPES.includes(input.file.type as (typeof NOTICE_ATTACHMENT_MIME_TYPES)[number]);
        const extensionAllowed = NOTICE_ATTACHMENT_EXTENSIONS.some(extension => loweredName.endsWith(extension));
        if (!declaredTypeAllowed || !extensionAllowed || input.file.size > NOTICE_IMAGE.MAX_SIZE_BYTES) {
          return singleFailure(createError(VALIDATION.IMAGE_TYPE_NOT_ALLOWED.CODE, VALIDATION.IMAGE_TYPE_NOT_ALLOWED.MESSAGE, 'file'));
        }
        if (!(await fileMatchesDeclaredType(input.file))) {
          return singleFailure(createError(VALIDATION.IMAGE_TYPE_NOT_ALLOWED.CODE, VALIDATION.IMAGE_TYPE_NOT_ALLOWED.MESSAGE, 'file'));
        }
        if (!(await hasStorageRoomFor(input.file.size))) {
          return singleFailure(createError(BUSINESS.STORAGE_FULL.CODE, BUSINESS.STORAGE_FULL.MESSAGE, 'file'));
        }
        const extension = input.file.name.includes('.') ? input.file.name.slice(input.file.name.lastIndexOf('.')).toLowerCase() : '';
        const safeTitle = input.title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 80);
        const stored = await storage.save(new File([input.file], `${safeTitle || 'notice'}${extension}`, { type: input.file.type }));
        replacement = { storageKey: stored.storageKey, fileName: stored.fileName, mimeType: stored.mimeType, size: stored.size };
      }

      const update: Record<string, unknown> = { title: input.title };
      if (input.body?.trim()) update.body = input.body.trim();
      if (replacement) update.image = replacement;
      const unset: Record<string, ''> = {};
      if (!input.body?.trim()) unset.body = '';
      if (input.removeAttachment && !replacement) unset.image = '';
      const operation = Object.keys(unset).length > 0 ? { $set: update, $unset: unset } : { $set: update };
      const updated = await Notice.findByIdAndUpdate(noticeId, operation, { returnDocument: 'after' }).lean<NoticeEntity | null>();
      if (!updated) throw new Error('Notice disappeared during update');

      if (target.image && (replacement || input.removeAttachment)) {
        await storage.remove(target.image.storageKey).catch(error => log.warn({ err: error }, 'Removing replaced notice attachment failed'));
      }

      /*
        A replacement was stored raw, so book the same after-response compression create()
        does - otherwise an edited image stays full-size forever while every image created
        through the normal path is swapped to WebP. `storage.compress` no-ops on a PDF, so a
        replaced PDF attachment is simply left as it is.
      */
      if (replacement) {
        const jobId = await conversions.enqueue(
          FILE_CONVERSION_TARGET.NOTICE,
          toId(updated._id),
          replacement.fileName,
          replacement.size,
          requester.userId
        );

        conversions.schedule(jobId);
      }

      return singleSuccess(noticeFromEntity(updated));
    } catch (error) {
      if (replacement) await storage.remove(replacement.storageKey).catch(() => undefined);
      log.error({ err: error }, 'Updating a notice failed');
      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
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
   * The query that returns exactly the notices a viewer may see.
   *
   * Admin sees every notice — they publish them. A teacher sees general notices addressed
   * to teachers or everyone; session notices are students'. A student sees general notices
   * addressed to students or everyone, plus the session notices naming their own intake —
   * which is why their session is threaded in rather than read from the token, where it
   * does not ride.
   *
   * @param role - The viewer's role.
   * @param viewerSession - The student's intake, or null when unknown or irrelevant.
   *
   * @returns Conditions for the feed query.
   */
  private conditionsForViewer(role: UserRole, viewerSession: string | null): QueryFilter<NoticeAttributes> {
    const audiences = this.audiencesFor(role);

    // Admin: no narrowing at all.
    if (!audiences) {
      return {};
    }

    const general = { category: NOTICE_CATEGORIES.GENERAL, audience: { $in: audiences } };

    // A teacher never sees session notices; a student with no known session sees general ones only.
    if (role !== USER_ROLES.STUDENT || !viewerSession) {
      return general;
    }

    return { $or: [general, { category: NOTICE_CATEGORIES.SESSION, sessions: viewerSession }] };
  }

  /**
   * Whether a signed-in viewer is allowed the image on a particular notice.
   *
   * The check `conditionsForViewer` makes for a list, made for one row — because an image
   * URL carries a guessable id rather than being reached from a feed. A session notice's
   * image is refused to anyone but a student of its sessions (and the admin who sees all);
   * a general one falls back to role-audience membership.
   *
   * @param notice - The notice whose image is wanted.
   * @param viewer - The signed-in account asking.
   *
   * @returns True when the image may be served.
   */
  private async mayViewNotice(notice: NoticeEntity, viewer: SessionUser): Promise<boolean> {
    // The author always sees their own notice's attachment. The teacher notices screen exists
    // for an author to check what they sent, and a teacher's notices are addressed to students,
    // so without this their own image or PDF fails the audience test below and 404s.
    if (toId(notice.publishedBy) === viewer.userId) {
      return true;
    }

    const audiences = this.audiencesFor(viewer.role);

    // Admin sees all.
    if (!audiences) {
      return true;
    }

    if (notice.category === NOTICE_CATEGORIES.SESSION) {
      if (viewer.role !== USER_ROLES.STUDENT) {
        return false;
      }

      const session = await this.viewerSession(viewer.userId);

      return session !== null && notice.sessions.includes(session);
    }

    return audiences.includes(notice.audience);
  }

  /**
   * The intake a signed-in student belongs to, read from their account.
   *
   * The token does not carry it, so a session-notice access check pays one indexed lookup —
   * only ever on a session notice's image, which is the rare path.
   *
   * @param userId - The student's account.
   *
   * @returns Their session, or null when none is set.
   */
  private async viewerSession(userId: string): Promise<string | null> {
    const user = await User.findById(userId).select('session').lean<{ session?: string } | null>();

    return user?.session ?? null;
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
