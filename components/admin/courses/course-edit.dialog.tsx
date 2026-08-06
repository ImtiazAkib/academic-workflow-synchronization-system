'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { CourseDto } from '@/types';

import { isSuccess } from '@/lib/result';
import { CourseUpdateInput, CourseUpdateOutput, CourseUpdateSchema } from '@/lib/schemas';
import { resolveCourseErrorMessage } from '@/lib/utils';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import { updateCourseAction } from './actions';
import { CourseFields } from './course-fields';

import type { CoursesLabels, TeacherOption } from './courses.types';

type CourseEditDialogProps = {
  course: CourseDto;
  teachers: TeacherOption[];
  labels: CoursesLabels;
  onUpdated: () => void;
  onOpenChange: (open: boolean) => void;
};

/*
  Mounted only while a row is selected, and keyed on that row's id, so `defaultValues`
  fills the form on mount rather than needing an effect to copy the course in — and a
  stale error from the previous attempt is cleared for free.
*/
export function CourseEditDialog({ course, teachers, labels, onUpdated, onOpenChange }: CourseEditDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CourseUpdateInput, undefined, CourseUpdateOutput>({
    resolver: zodResolver(CourseUpdateSchema),
    defaultValues: {
      courseId: course.courseId,
      code: course.code,
      title: course.title,
      semester: course.semester,
      credits: course.credits,
      assignedTeacherId: course.assignedTeacherId ?? '',
    },
  });

  const handleFormSubmit = async (values: CourseUpdateOutput): Promise<void> => {
    setFormError(null);

    const result = await updateCourseAction(values);

    if (isSuccess(result)) {
      onUpdated();

      return;
    }

    setFormError(resolveCourseErrorMessage(result.errors[0]?.code ?? 0, labels.errors));
  };

  const handleCancelClick = (): void => {
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      {/*
        The height cap and column layout live here rather than in `components/ui`: that
        file is shadcn's output. `flex-col` plus a cap lets the body scroll under a
        fixed footer.
      */}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.editTitle}</DialogTitle>
          <DialogDescription>{labels.editDescription}</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col gap-4">
          {formError && (
            <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {formError}
            </p>
          )}

          <input type="hidden" {...register('courseId')} />

          {/* `min-h-0` is load-bearing: a flex child will not shrink below its content without it. */}
          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            <CourseFields
              register={register as never}
              control={control as never}
              errors={errors}
              teachers={teachers}
              labels={labels.fields}
              fieldErrors={labels.fieldErrors}
              idPrefix="edit-course"
            />
          </div>

          <DialogFooter className="shrink-0 border-t-0 bg-transparent p-0 sm:mx-0 sm:mb-0">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleCancelClick}>
              {labels.cancel}
            </Button>

            <Button type="submit" variant="appPrimary" disabled={isSubmitting}>
              {isSubmitting ? labels.working : labels.editSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
