'use client';

import { TriangleAlert } from 'lucide-react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { SEMESTER, TEACHING_DAYS } from '@/constants/schedule.const';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import type { DayLabels, CourseOption, ScheduleFieldErrorLabels, ScheduleFieldLabels, TeacherOption } from './schedule.types';
import type { UseFormRegister } from 'react-hook-form';

/*
  The create page and the edit dialog ask for the same seven fields, so they share this
  body rather than keeping two copies that drift. Typed loosely because the two schemas
  differ by `classSessionId` alone.

  Times are plain `<input type="time">`, which submits `HH:mm` - exactly what the model
  stores. No Date, no timezone: a class at 09:30 is 09:30 in Dhaka wherever this runs.
*/
type SessionFieldsProps = {
  register: UseFormRegister<never>;
  control: Control<never>;
  errors: FieldErrors;
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleFieldLabels;
  fieldErrors: ScheduleFieldErrorLabels;
  days: DayLabels;
  /**
   * Server-side clash messages already resolved to sentences, split by the field each concerns -
   * so a "that teacher is busy" lands under the teacher, not only in a notice at the top.
   */
  conflicts: { course: string[]; teacher: string[] };
  idPrefix: string;
};

export function SessionFields({ register, control, errors, courses, teachers, labels, fieldErrors, days, conflicts, idPrefix }: SessionFieldsProps) {
  const courseItems: Record<string, string> = {};

  courses.forEach(x => {
    courseItems[x.courseId] = `${x.code} - ${x.title}`;
  });

  const teacherItems: Record<string, string> = {};

  teachers.forEach(x => {
    teacherItems[x.userId] = x.name;
  });

  const dayItems: Record<string, string> = {};

  TEACHING_DAYS.forEach(day => {
    dayItems[String(day)] = days[day];
  });

  const semesterItems: Record<string, string> = {};

  for (let semester = SEMESTER.MIN; semester <= SEMESTER.MAX; semester++) {
    semesterItems[String(semester)] = String(semester);
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-course`}>{labels.course}</Label>
        <Controller
          control={control}
          name={'courseId' as never}
          render={({ field }) => (
            <Select items={courseItems} value={String(field.value ?? '')} onValueChange={field.onChange}>
              <SelectTrigger id={`${idPrefix}-course`} className="w-full" aria-invalid={Boolean(errors.courseId) || conflicts.course.length > 0}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(courseItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.courseId && <p className="text-destructive text-sm">{fieldErrors.courseRequired}</p>}
        <FieldConflicts messages={conflicts.course} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-teacher`}>{labels.teacher}</Label>
        <Controller
          control={control}
          name={'teacherId' as never}
          render={({ field }) => (
            <Select items={teacherItems} value={String(field.value ?? '')} onValueChange={field.onChange}>
              <SelectTrigger id={`${idPrefix}-teacher`} className="w-full" aria-invalid={Boolean(errors.teacherId) || conflicts.teacher.length > 0}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(teacherItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.teacherId && <p className="text-destructive text-sm">{fieldErrors.teacherRequired}</p>}
        <FieldConflicts messages={conflicts.teacher} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-day`}>{labels.day}</Label>
        <Controller
          control={control}
          name={'dayOfWeek' as never}
          render={({ field }) => (
            <Select items={dayItems} value={String(field.value ?? '')} onValueChange={field.onChange}>
              <SelectTrigger id={`${idPrefix}-day`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(dayItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-semester`}>{labels.semester}</Label>
        <Controller
          control={control}
          name={'semester' as never}
          render={({ field }) => (
            <Select items={semesterItems} value={String(field.value ?? '')} onValueChange={field.onChange}>
              <SelectTrigger id={`${idPrefix}-semester`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(semesterItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-start`}>{labels.startTime}</Label>
        <Input id={`${idPrefix}-start`} type="time" aria-invalid={Boolean(errors.startTime)} {...register('startTime' as never)} />
        {errors.startTime && <p className="text-destructive text-sm">{fieldErrors.timeInvalid}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-end`}>{labels.endTime}</Label>
        <Input id={`${idPrefix}-end`} type="time" aria-invalid={Boolean(errors.endTime)} {...register('endTime' as never)} />
        {errors.endTime && <p className="text-destructive text-sm">{fieldErrors.endBeforeStart}</p>}
      </div>
    </div>
  );
}

/** The clash sentences for one field, rendered as alerts right under it. */
function FieldConflicts({ messages }: { messages: string[] }) {
  return messages.map((message, index) => (
    <p key={index} role="alert" className="text-destructive flex items-start gap-1.5 text-sm">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  ));
}
