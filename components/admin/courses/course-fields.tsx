'use client';

import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { SEMESTER } from '@/constants/schedule.const';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import type { CoursesFieldErrorLabels, CoursesFieldLabels, TeacherOption } from './courses.types';
import type { UseFormRegister } from 'react-hook-form';

/*
  The create page and the edit dialog ask for exactly the same five fields, so they
  share this body rather than keeping two copies that drift. Only the surrounding
  chrome — a page with a back link, or a dialog with a footer — differs.

  Typed loosely against the form because the two schemas differ by `courseId` alone;
  tightening it would mean a generic that buys nothing at these two call sites.
*/
type CourseFieldsProps = {
  register: UseFormRegister<never>;
  control: Control<never>;
  errors: FieldErrors;
  teachers: TeacherOption[];
  labels: CoursesFieldLabels;
  fieldErrors: CoursesFieldErrorLabels;
  idPrefix: string;
};

export function CourseFields({ register, control, errors, teachers, labels, fieldErrors, idPrefix }: CourseFieldsProps) {
  const teacherItems: Record<string, string> = { '': labels.unassigned };

  teachers.forEach(x => {
    teacherItems[x.userId] = x.name;
  });

  const semesterItems: Record<string, string> = {};

  for (let semester = SEMESTER.MIN; semester <= SEMESTER.MAX; semester++) {
    semesterItems[String(semester)] = String(semester);
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-code`}>{labels.code}</Label>
        <Input id={`${idPrefix}-code`} aria-invalid={Boolean(errors.code)} {...register('code' as never)} />
        {errors.code && (
          <p className="text-destructive text-sm">{errors.code.type === 'too_big' ? fieldErrors.codeTooLong : fieldErrors.codeRequired}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-title`}>{labels.title}</Label>
        <Input id={`${idPrefix}-title`} aria-invalid={Boolean(errors.title)} {...register('title' as never)} />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.type === 'too_big' ? fieldErrors.titleTooLong : fieldErrors.titleRequired}</p>
        )}
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
        {errors.semester && <p className="text-destructive text-sm">{fieldErrors.semesterInvalid}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-credits`}>{labels.credits}</Label>
        <Input
          id={`${idPrefix}-credits`}
          type="number"
          min={0}
          max={10}
          step={0.5}
          aria-invalid={Boolean(errors.credits)}
          {...register('credits' as never)}
        />
        {errors.credits && <p className="text-destructive text-sm">{fieldErrors.creditsInvalid}</p>}
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-teacher`}>
          {labels.teacher} <span className="text-muted-foreground text-xs">({labels.optional})</span>
        </Label>
        <Controller
          control={control}
          name={'assignedTeacherId' as never}
          render={({ field }) => (
            <Select items={teacherItems} value={String(field.value ?? '')} onValueChange={field.onChange}>
              <SelectTrigger id={`${idPrefix}-teacher`} className="w-full">
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
      </div>
    </div>
  );
}
