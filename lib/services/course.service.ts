import { ClassSession } from '@/models/class-session.model';
import { Course } from '@/models/course.model';
import { User } from '@/models/user.model';
import { CourseDto, courseFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { CourseCreateOutput, CourseUpdateOutput } from '@/lib/schemas';

import type { CourseAttributes, CourseEntity } from '@/models/course.model';
import type { UserEntity } from '@/models/user.model';
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('course.service');

const DATABASE = CODES.DATABASE.COURSES;
const VALIDATION = CODES.VALIDATION.COURSES;
const BUSINESS = CODES.BUSINESS.COURSES;

export class CourseService {
  /**
   * List the department's courses, ordered by semester then code.
   *
   * @param semester - Narrow to one semester, or every semester when omitted.
   *
   * @returns Matching courses as DTOs.
   */
  public async list(semester?: number): Promise<ListResult<CourseDto>> {
    try {
      await connectToDatabase();

      const conditions: QueryFilter<CourseAttributes> = {};

      if (semester) {
        conditions.semester = semester;
      }

      const courses = await Course.find(conditions).sort({ semester: 1, code: 1 }).lean<CourseEntity[]>();

      return listSuccess(courses.map(courseFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing courses failed');

      return listFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * Create a course.
   *
   * @param input - Validated create input.
   *
   * @returns The created course, or a failure naming the field that refused it.
   */
  public async create(input: CourseCreateOutput): Promise<SingleResult<CourseDto>> {
    try {
      await connectToDatabase();

      const existing = await Course.findOne({ code: input.code }).lean<CourseEntity | null>();

      if (existing) {
        return singleFailure(createError(VALIDATION.CODE_ALREADY_USED.CODE, VALIDATION.CODE_ALREADY_USED.MESSAGE, 'code'));
      }

      const teacherRefusal = await this.refuseInvalidTeacher(input.assignedTeacherId);

      if (teacherRefusal) {
        return teacherRefusal;
      }

      const created = await Course.create({
        code: input.code,
        title: input.title,
        semester: input.semester,
        credits: input.credits,
        assignedTeacher: input.assignedTeacherId || undefined,
      });

      return singleSuccess(courseFromEntity(created));
    } catch (error) {
      log.error({ err: error }, 'Creating a course failed');

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
  }

  /**
   * Update a course.
   *
   * @param input - Validated update input.
   *
   * @returns The updated course, or a failure.
   */
  public async update(input: CourseUpdateOutput): Promise<SingleResult<CourseDto>> {
    try {
      await connectToDatabase();

      // Another course holding the code — the course's own code is left alone.
      const clash = await Course.findOne({ code: input.code, _id: { $ne: input.courseId } }).lean<CourseEntity | null>();

      if (clash) {
        return singleFailure(createError(VALIDATION.CODE_ALREADY_USED.CODE, VALIDATION.CODE_ALREADY_USED.MESSAGE, 'code'));
      }

      const teacherRefusal = await this.refuseInvalidTeacher(input.assignedTeacherId);

      if (teacherRefusal) {
        return teacherRefusal;
      }

      const updated = await Course.findByIdAndUpdate(
        input.courseId,
        {
          code: input.code,
          title: input.title,
          semester: input.semester,
          credits: input.credits,
          assignedTeacher: input.assignedTeacherId || undefined,
        },
        { returnDocument: 'after' }
      ).lean<CourseEntity | null>();

      if (!updated) {
        return singleFailure(createError(VALIDATION.COURSE_NOT_FOUND.CODE, VALIDATION.COURSE_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(courseFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Updating a course failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Switch a course on or off.
   *
   * Deactivating one that still has sessions on the timetable is refused rather than
   * cascaded — a silently emptied week is worse than an error message.
   *
   * @param courseId - Course to change.
   * @param isActive - The new state.
   *
   * @returns The updated course, or a failure.
   */
  public async setActive(courseId: string, isActive: boolean): Promise<SingleResult<CourseDto>> {
    try {
      await connectToDatabase();

      if (!isActive) {
        const scheduled = await ClassSession.countDocuments({ course: courseId });

        if (scheduled > 0) {
          return singleFailure(createError(BUSINESS.COURSE_HAS_SESSIONS.CODE, BUSINESS.COURSE_HAS_SESSIONS.MESSAGE));
        }
      }

      const updated = await Course.findByIdAndUpdate(courseId, { isActive }, { returnDocument: 'after' }).lean<CourseEntity | null>();

      if (!updated) {
        return singleFailure(createError(VALIDATION.COURSE_NOT_FOUND.CODE, VALIDATION.COURSE_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(courseFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Changing a course state failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Refuse an assigned teacher who does not exist or is not a teacher.
   *
   * The id arrives from a select whose options the server rendered, but a form field
   * is user input whatever put it there.
   *
   * @param teacherId - Assigned teacher, possibly blank.
   *
   * @returns A failure to return, or null when the assignment is acceptable.
   */
  private async refuseInvalidTeacher(teacherId: string | undefined): Promise<SingleResult<CourseDto> | null> {
    if (!teacherId) {
      return null;
    }

    const teacher = await User.findById(teacherId).lean<UserEntity | null>();

    if (!teacher) {
      return singleFailure(createError(VALIDATION.TEACHER_NOT_FOUND.CODE, VALIDATION.TEACHER_NOT_FOUND.MESSAGE, 'assignedTeacherId'));
    }

    if (teacher.role !== USER_ROLES.TEACHER) {
      return singleFailure(createError(VALIDATION.TEACHER_INVALID_ROLE.CODE, VALIDATION.TEACHER_INVALID_ROLE.MESSAGE, 'assignedTeacherId'));
    }

    return null;
  }
}
