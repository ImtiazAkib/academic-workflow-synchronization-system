import { toId } from '@/lib/utils';

import type { CourseEntity } from '@/models/course.model';
import type { UserEntity } from '@/models/user.model';

/**
 * A course named beside a teacher in the directory — enough to recognize it, no more.
 */
export type TeacherCourseSummary = {
  courseId: string;
  code: string;
  title: string;
  semester: number;
};

/**
 * A teacher as a student may see one.
 *
 * A second, narrower projection of the same record `UserDto` describes, and the reason
 * it exists: a student is not an administrator, and the directory is the one screen
 * where one account reads another's. `phone` is absent by decision — a departmental
 * directory publishes a way to reach someone, and the number on this record is whatever
 * the administrator typed, which may well be personal. `isApproved`, `isActive` and the
 * timestamps are absent because they are the administrator's business.
 *
 * Because the mapper names every field, a column added to the user record later is
 * invisible here until somebody deliberately publishes it.
 */
export type TeacherDirectoryDto = {
  userId: string;
  name: string;
  email: string;
  designation?: string | null;
  courses: TeacherCourseSummary[];
};

/**
 * Map a stored teacher to the directory entry a student reads.
 *
 * @param entity - Stored user, already known to be a teacher.
 * @param courses - The courses assigned to them.
 *
 * @returns Instance of TeacherDirectoryDto.
 */
export function teacherDirectoryFromEntity(entity: UserEntity, courses: CourseEntity[]): TeacherDirectoryDto {
  return {
    userId: toId(entity._id),
    name: entity.name,
    email: entity.email,
    designation: entity.designation ?? null,
    courses: courses.map(x => ({
      courseId: toId(x._id),
      code: x.code,
      title: x.title,
      semester: x.semester,
    })),
  };
}
