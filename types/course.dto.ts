import { toId } from '@/lib/utils';

import type { CourseEntity } from '@/models/course.model';

export type CourseDto = {
  courseId: string;
  code: string;
  title: string;
  semester: number;
  credits: number;
  assignedTeacherId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Map a stored course to its DTO.
 *
 * @param entity - Stored course.
 *
 * @returns Instance of CourseDto.
 */
export function courseFromEntity(entity: CourseEntity): CourseDto {
  return {
    courseId: toId(entity._id),
    code: entity.code,
    title: entity.title,
    semester: entity.semester,
    credits: entity.credits,
    assignedTeacherId: entity.assignedTeacher ? toId(entity.assignedTeacher) : null,
    isActive: entity.isActive,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
