import { ClassSession } from '@/models/class-session.model';
import { Course } from '@/models/course.model';
import { User } from '@/models/user.model';
import { ClassSessionDto, DayOfWeek, SessionUser, classSessionFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import {
  EmptyResult,
  ErrorDto,
  ListResult,
  SingleResult,
  createError,
  emptyFailureWithError,
  emptySuccess,
  listFailure,
  listSuccess,
  singleFailure,
  singleFailureWithErrors,
  singleSuccess,
} from '@/lib/result';
import type { ClassSessionCreateOutput, ClassSessionUpdateOutput } from '@/lib/schemas';
import { timeRangesOverlap, toId } from '@/lib/utils';

import type { ClassSessionAttributes, ClassSessionEntity } from '@/models/class-session.model';
import type { CourseEntity } from '@/models/course.model';
import type { UserEntity } from '@/models/user.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('class-session.service');

const DATABASE = CODES.DATABASE.SCHEDULE;
const VALIDATION = CODES.VALIDATION.SCHEDULE;
const BUSINESS = CODES.BUSINESS.SCHEDULE;
const AUTH = CODES.AUTH.SCHEDULE;

type ScheduleFilters = {
  semester?: number;
  teacherId?: string;
};

/**
 * What a slot is being asked to hold. The id is present only when an existing session
 * is being moved, so it can be excluded from its own conflict check.
 */
type SlotCandidate = {
  classSessionId?: string;
  courseId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  semester: number;
};

export class ClassSessionService {
  /**
   * List sessions for the timetable.
   *
   * @param filters - Semester and teacher, both optional.
   *
   * @returns Matching sessions, ordered for a week grid.
   */
  public async list(filters: ScheduleFilters): Promise<ListResult<ClassSessionDto>> {
    try {
      await connectToDatabase();

      const conditions: QueryFilter<ClassSessionAttributes> = {};

      if (filters.semester) {
        conditions.semester = filters.semester;
      }

      if (filters.teacherId) {
        conditions.teacher = filters.teacherId;
      }

      const sessions = await ClassSession.find(conditions).sort({ dayOfWeek: 1, startTime: 1 }).lean<ClassSessionEntity[]>();

      return listSuccess(sessions.map(classSessionFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing class sessions failed');

      return listFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * Put a class on the timetable.
   *
   * @param input - Validated create input.
   *
   * @returns The created session, or a failure naming every clash it hit.
   */
  public async create(input: ClassSessionCreateOutput): Promise<SingleResult<ClassSessionDto>> {
    try {
      await connectToDatabase();

      const refusal = await this.refuseUnusableReferences(input.courseId, input.teacherId);

      if (refusal) {
        return refusal;
      }

      const conflicts = await this.findConflicts(input);

      if (conflicts.length > 0) {
        return singleFailureWithErrors(conflicts);
      }

      const created = await ClassSession.create({
        course: input.courseId,
        teacher: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        semester: input.semester,
      });

      return singleSuccess(classSessionFromEntity(created));
    } catch (error) {
      log.error({ err: error }, 'Creating a class session failed');

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
  }

  /**
   * Move or re-point an existing class.
   *
   * @param input - Validated update input.
   *
   * @returns The updated session, or a failure naming every clash it hit.
   */
  public async update(input: ClassSessionUpdateOutput, requester: SessionUser): Promise<SingleResult<ClassSessionDto>> {
    try {
      await connectToDatabase();

      const target = await ClassSession.findById(input.classSessionId).lean<ClassSessionEntity | null>();

      if (!target) {
        return singleFailure(createError(VALIDATION.SESSION_NOT_FOUND.CODE, VALIDATION.SESSION_NOT_FOUND.MESSAGE));
      }

      /*
        A teacher may move only their own class, and only its day and time — not its course,
        the teacher who takes it, or its semester. Those three are pinned to the stored values
        so a widened gate or a hand-built request cannot reassign a class to someone else or
        shift it to another cohort. An administrator may change anything. Decided from the whole
        `requester`, the way `setCancelled` is, so the rule cannot be turned off by omitting an
        argument.
      */
      let courseId = input.courseId;
      let teacherId = input.teacherId;
      let semester = input.semester;

      if (requester.role === USER_ROLES.TEACHER) {
        if (toId(target.teacher) !== requester.userId) {
          return singleFailure(createError(AUTH.NOT_OWN_CLASS.CODE, AUTH.NOT_OWN_CLASS.MESSAGE));
        }

        courseId = toId(target.course);
        teacherId = toId(target.teacher);
        semester = target.semester;
      }

      const refusal = await this.refuseUnusableReferences(courseId, teacherId);

      if (refusal) {
        return refusal;
      }

      const conflicts = await this.findConflicts({
        classSessionId: input.classSessionId,
        courseId,
        teacherId,
        semester,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
      });

      if (conflicts.length > 0) {
        return singleFailureWithErrors(conflicts);
      }

      const updated = await ClassSession.findByIdAndUpdate(
        input.classSessionId,
        {
          course: courseId,
          teacher: teacherId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          semester,
        },
        { returnDocument: 'after' }
      ).lean<ClassSessionEntity | null>();

      if (!updated) {
        return singleFailure(createError(VALIDATION.SESSION_NOT_FOUND.CODE, VALIDATION.SESSION_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(classSessionFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Updating a class session failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Call a class off for the week, or put it back.
   *
   * The row stays and the slot stays blocked — a cancelled class is off, not given
   * away — so students see it struck through rather than silently missing.
   *
   * A teacher may only touch a class they are teaching; an administrator may touch any.
   * Both halves of that are decided here, from the whole `requester`, rather than from a
   * scope the caller worked out first — this took an optional teacher id until step 15a,
   * and the check read `if (requestedBy && ...)`, so any caller that omitted the argument
   * silently turned the rule off. Taking the session itself is what every other row-level
   * check in the app does, and it cannot be under-supplied.
   *
   * @param classSessionId - Session to change.
   * @param isCancelled - The new state.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated session, or a failure.
   */
  public async setCancelled(classSessionId: string, isCancelled: boolean, requester: SessionUser): Promise<SingleResult<ClassSessionDto>> {
    try {
      await connectToDatabase();

      const target = await ClassSession.findById(classSessionId).lean<ClassSessionEntity | null>();

      if (!target) {
        return singleFailure(createError(VALIDATION.SESSION_NOT_FOUND.CODE, VALIDATION.SESSION_NOT_FOUND.MESSAGE));
      }

      if (requester.role === USER_ROLES.TEACHER && toId(target.teacher) !== requester.userId) {
        return singleFailure(createError(AUTH.NOT_OWN_CLASS.CODE, AUTH.NOT_OWN_CLASS.MESSAGE));
      }

      const updated = await ClassSession.findByIdAndUpdate(
        classSessionId,
        { isCancelled },
        { returnDocument: 'after' }
      ).lean<ClassSessionEntity | null>();

      if (!updated) {
        return singleFailure(createError(VALIDATION.SESSION_NOT_FOUND.CODE, VALIDATION.SESSION_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(classSessionFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Cancelling a class session failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Take a class off the timetable.
   *
   * Sessions are deleted rather than deactivated: unlike an account, a slot that was
   * never taught leaves nothing behind that needs a valid author.
   *
   * @param classSessionId - Session to remove.
   *
   * @returns Empty success, or a failure.
   */
  public async remove(classSessionId: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const deleted = await ClassSession.findByIdAndDelete(classSessionId).lean<ClassSessionEntity | null>();

      if (!deleted) {
        return emptyFailureWithError(createError(VALIDATION.SESSION_NOT_FOUND.CODE, VALIDATION.SESSION_NOT_FOUND.MESSAGE));
      }

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Deleting a class session failed');

      return emptyFailureWithError(createError(DATABASE.DELETE_FAILED.CODE, DATABASE.DELETE_FAILED.MESSAGE));
    }
  }

  /**
   * The two clashes a slot can have: the teacher is busy, or the course is already
   * being taught in that slot.
   *
   * Both are reported together rather than the first one found, so moving a class does
   * not turn into a guessing game of one error at a time.
   *
   * Candidates are narrowed in the query to the same day and semester — sessions in a
   * different week or semester cannot clash — and the overlap itself is decided in
   * code, because `HH:mm` comparison is exact.
   *
   * A cancelled class still holds its slot: it is off for the week, not given away.
   *
   * @param candidate - The slot being claimed.
   *
   * @returns One error per clash, empty when the slot is free.
   */
  private async findConflicts(candidate: SlotCandidate): Promise<ErrorDto[]> {
    // The weekday and "not the moving session itself" are common to both clash queries.
    const base: QueryFilter<ClassSessionAttributes> = { dayOfWeek: candidate.dayOfWeek };

    if (candidate.classSessionId) {
      base._id = { $ne: candidate.classSessionId };
    }

    /*
      A teacher is one physical person, so a teacher clash spans every semester — two classes
      at the same hour in different semesters are still one teacher in two rooms. A course
      clash is only a clash within its own semester. Narrowing both by semester (as this once
      did) let a teacher be double-booked across semesters with no refusal — the read-only
      dashboard detector caught it after the fact, but the write path never did.
    */
    const [teacherSlots, courseSlots] = await Promise.all([
      ClassSession.find({ ...base, teacher: candidate.teacherId }).lean<ClassSessionEntity[]>(),
      ClassSession.find({ ...base, semester: candidate.semester, course: candidate.courseId }).lean<ClassSessionEntity[]>(),
    ]);

    const overlaps = (x: ClassSessionEntity): boolean => timeRangesOverlap(candidate.startTime, candidate.endTime, x.startTime, x.endTime);

    const errors: ErrorDto[] = [];

    if (teacherSlots.some(overlaps)) {
      errors.push(createError(BUSINESS.TEACHER_BUSY.CODE, BUSINESS.TEACHER_BUSY.MESSAGE, 'teacherId'));
    }

    if (courseSlots.some(overlaps)) {
      errors.push(createError(BUSINESS.COURSE_ALREADY_SCHEDULED.CODE, BUSINESS.COURSE_ALREADY_SCHEDULED.MESSAGE, 'courseId'));
    }

    return errors;
  }

  /**
   * Refuse a session pointing at a course or teacher that cannot hold it.
   *
   * @param courseId - Course the session teaches.
   * @param teacherId - Teacher taking it.
   *
   * @returns A failure to return, or null when both references are usable.
   */
  private async refuseUnusableReferences(courseId: string, teacherId: string): Promise<SingleResult<ClassSessionDto> | null> {
    const course = await Course.findById(courseId).lean<CourseEntity | null>();

    if (!course) {
      return singleFailure(createError(VALIDATION.COURSE_NOT_FOUND.CODE, VALIDATION.COURSE_NOT_FOUND.MESSAGE, 'courseId'));
    }

    const teacher = await User.findById(teacherId).lean<UserEntity | null>();

    if (!teacher) {
      return singleFailure(createError(VALIDATION.TEACHER_NOT_FOUND.CODE, VALIDATION.TEACHER_NOT_FOUND.MESSAGE, 'teacherId'));
    }

    if (teacher.role !== USER_ROLES.TEACHER) {
      return singleFailure(createError(VALIDATION.TEACHER_INVALID_ROLE.CODE, VALIDATION.TEACHER_INVALID_ROLE.MESSAGE, 'teacherId'));
    }

    return null;
  }
}
