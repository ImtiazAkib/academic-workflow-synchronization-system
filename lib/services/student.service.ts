import { ClassSession } from '@/models/class-session.model';
import { Course } from '@/models/course.model';
import { Material } from '@/models/material.model';
import { User } from '@/models/user.model';
import {
  ClassSessionDto,
  CourseDto,
  MaterialDto,
  TeacherDirectoryDto,
  UserDto,
  classSessionFromEntity,
  courseFromEntity,
  materialFromEntity,
  teacherDirectoryFromEntity,
  userFromEntity,
} from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import { toId } from '@/lib/utils';

import type { ClassSessionEntity } from '@/models/class-session.model';
import type { CourseEntity } from '@/models/course.model';
import type { MaterialEntity } from '@/models/material.model';
import type { UserEntity } from '@/models/user.model';

const log = createLoggerWithContext('student.service');

/*
  No `codes-students.const.ts`, and deliberately. This service raises no refusal of its
  own: every method is a read, and the only way one fails is the collection it reads
  failing — which the owning feature already has a code for. Inventing a sixth block
  would mean two codes for "listing materials failed" and a guess at which one a screen
  should recognize.
*/
const USERS_VALIDATION = CODES.VALIDATION.USERS;

const COURSES = CODES.DATABASE.COURSES;
const MATERIALS = CODES.DATABASE.MATERIALS;
const SCHEDULE = CODES.DATABASE.SCHEDULE;
const USERS = CODES.DATABASE.USERS;

/**
 * Everything a student is allowed to read, and nothing they can change.
 *
 * The class deliberately has no create, update or delete: the student area has no
 * write path at all, and the absence is easier to keep true here than to check on
 * every screen. Each method takes the semester as an argument rather than a session,
 * because the caller has already resolved it from the signed-in account — the pages
 * never take it from a query string.
 */
export class StudentService {
  /**
   * The student's own account, for the one field the session token does not carry.
   *
   * The semester is read here rather than packed into the JWT on purpose. The token is
   * self-contained and only refreshed at sign-in, so a semester inside it would keep
   * showing last year's routine until the student signed out — the same staleness the
   * backlog already records for deactivation. One indexed lookup per page is the cheaper
   * side of that trade.
   *
   * @param studentId - The signed-in student.
   *
   * @returns Their account, or a failure.
   */
  public async getProfile(studentId: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const student = await User.findById(studentId).lean<UserEntity | null>();

      if (!student) {
        return singleFailure(createError(USERS_VALIDATION.USER_NOT_FOUND.CODE, USERS_VALIDATION.USER_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(userFromEntity(student));
    } catch (error) {
      log.error({ err: error }, "Reading a student's profile failed");

      return singleFailure(createError(USERS.FIND_BY_ID_FAILED.CODE, USERS.FIND_BY_ID_FAILED.MESSAGE));
    }
  }

  /**
   * The semester every student screen is scoped to, or null when none is set yet.
   *
   * The one method here that throws, and it earns it. Null is a real answer — an
   * administrator has not filled the field in — and the screens meet it with "ask an
   * administrator to set it". A read that simply failed must not arrive at that same
   * answer: it would send a student chasing their department over a database blip. The
   * dashboard error boundary offers a retry, which is what a failed read deserves.
   *
   * @param studentId - The signed-in student.
   *
   * @returns Their semester, or null when it has not been assigned.
   */
  public async resolveSemester(studentId: string): Promise<number | null> {
    const profile = await this.getProfile(studentId);

    if (!profile.success) {
      throw new Error('The student account could not be read');
    }

    return profile.result?.semester ?? null;
  }

  /**
   * The week's classes for one semester.
   *
   * Cancelled classes are included rather than filtered out: a class that is off for
   * the week still holds its slot, and a student needs to see that it was called off
   * rather than find a gap where it used to be.
   *
   * @param semester - The student's semester.
   *
   * @returns Sessions ordered for a week grid.
   */
  public async getRoutine(semester: number): Promise<ListResult<ClassSessionDto>> {
    try {
      await connectToDatabase();

      const sessions = await ClassSession.find({ semester }).sort({ dayOfWeek: 1, startTime: 1 }).lean<ClassSessionEntity[]>();

      return listSuccess(sessions.map(classSessionFromEntity));
    } catch (error) {
      log.error({ err: error }, "Listing a student's routine failed");

      return listFailure(createError(SCHEDULE.LIST_FAILED.CODE, SCHEDULE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * The courses a semester is made of.
   *
   * Inactive courses are left out. Unlike a cancelled class — off for one week — a
   * deactivated course is not being taught at all, so it has nothing to say on a
   * student's screen.
   *
   * @param semester - The student's semester.
   *
   * @returns Active courses in that semester, by code.
   */
  public async listCourses(semester: number): Promise<ListResult<CourseDto>> {
    try {
      await connectToDatabase();

      const courses = await this.findSemesterCourses(semester);

      return listSuccess(courses.map(courseFromEntity));
    } catch (error) {
      log.error({ err: error }, "Listing a student's courses failed");

      return listFailure(createError(COURSES.LIST_FAILED.CODE, COURSES.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * The files published against a semester's courses, newest first.
   *
   * Scoped to the semester rather than showing the whole department's repository:
   * "everything a student needs" is a handful of courses, and grouping four hundred
   * files by course code is a wall rather than a page.
   *
   * The scope is resolved here from the semester alone. A course id from the client
   * would let one student read another year's shelf by editing a URL — not a leak
   * worth much, since the download route admits any signed-in user, but the list is
   * still an answer to "what am I taking", and that is the student's own record.
   *
   * @param semester - The student's semester.
   *
   * @returns Materials for that semester's active courses.
   */
  public async listMaterials(semester: number): Promise<ListResult<MaterialDto>> {
    try {
      await connectToDatabase();

      const courses = await this.findSemesterCourses(semester);

      if (courses.length === 0) {
        // No courses is a normal answer, not a query for every material in the database.
        return listSuccess([]);
      }

      const materials = await Material.find({ course: { $in: courses.map(x => x._id) } })
        .sort({ createdAt: -1 })
        .lean<MaterialEntity[]>();

      return listSuccess(materials.map(materialFromEntity));
    } catch (error) {
      log.error({ err: error }, "Listing a student's materials failed");

      return listFailure(createError(MATERIALS.LIST_FAILED.CODE, MATERIALS.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * The department's teachers, with the courses each one takes.
   *
   * Only approved, active accounts appear: a pending or switched-off account is not
   * somebody a student should be told to contact.
   *
   * The entries are `TeacherDirectoryDto`, not `UserDto` — a narrower projection that
   * carries no phone number and no account state. See the mapper for why.
   *
   * @returns One entry per teacher, by name.
   */
  public async listTeachers(): Promise<ListResult<TeacherDirectoryDto>> {
    try {
      await connectToDatabase();

      const teachers = await User.find({ role: USER_ROLES.TEACHER, isApproved: true, isActive: true }).sort({ name: 1 }).lean<UserEntity[]>();

      if (teachers.length === 0) {
        return listSuccess([]);
      }

      /*
        One query for every teacher's courses rather than one per teacher: the
        directory is a single page, and a lookup per card would be a query per row.
      */
      const courses = await Course.find({ assignedTeacher: { $in: teachers.map(x => x._id) }, isActive: true })
        .sort({ code: 1 })
        .lean<CourseEntity[]>();

      const byTeacher = new Map<string, CourseEntity[]>();

      courses.forEach(x => {
        // `assignedTeacher` is in the query, so it is present — the guard is for the type.
        const teacherId = x.assignedTeacher ? toId(x.assignedTeacher) : '';
        const existing = byTeacher.get(teacherId);

        if (existing) {
          existing.push(x);

          return;
        }

        byTeacher.set(teacherId, [x]);
      });

      return listSuccess(teachers.map(x => teacherDirectoryFromEntity(x, byTeacher.get(toId(x._id)) ?? [])));
    } catch (error) {
      log.error({ err: error }, 'Listing the teacher directory failed');

      return listFailure(createError(USERS.LIST_FAILED.CODE, USERS.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * The active courses in a semester, as entities.
   *
   * Shared by the course list and the material list so the two cannot disagree about
   * what a semester contains — a file whose course is hidden from the course page
   * would otherwise still be downloadable from the materials page.
   *
   * @param semester - The student's semester.
   *
   * @returns Matching courses, by code.
   */
  private async findSemesterCourses(semester: number): Promise<CourseEntity[]> {
    return Course.find({ semester, isActive: true }).sort({ code: 1 }).lean<CourseEntity[]>();
  }
}
