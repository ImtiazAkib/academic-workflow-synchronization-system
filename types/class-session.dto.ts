import { toId } from '@/lib/utils';

import { DayOfWeek } from './day-of-week';

import type { ClassSessionEntity } from '@/models/class-session.model';

export type ClassSessionDto = {
  classSessionId: string;
  courseId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  semester: number;
  isCancelled: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Map a stored class session to its DTO.
 *
 * @param entity - Stored class session.
 *
 * @returns Instance of ClassSessionDto.
 */
export function classSessionFromEntity(entity: ClassSessionEntity): ClassSessionDto {
  return {
    classSessionId: toId(entity._id),
    courseId: toId(entity.course),
    teacherId: toId(entity.teacher),
    dayOfWeek: entity.dayOfWeek,
    startTime: entity.startTime,
    endTime: entity.endTime,
    semester: entity.semester,
    isCancelled: entity.isCancelled,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
