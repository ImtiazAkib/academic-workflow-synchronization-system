'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { ClassSessionDto } from '@/types';

import { ErrorDto, isSuccess } from '@/lib/result';
import { ClassSessionUpdateInput, ClassSessionUpdateOutput, ClassSessionUpdateSchema } from '@/lib/schemas';
import { resolveScheduleErrorMessage } from '@/lib/utils';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import { updateClassSessionAction } from './actions';
import { SessionConflictNotice } from './session-conflict-notice';
import { SessionFields } from './session-fields';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type SessionEditDialogProps = {
  session: ClassSessionDto;
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  onUpdated: () => void;
  onOpenChange: (open: boolean) => void;
};

/*
  Mounted only while a session is selected and keyed on its id, so `defaultValues` fills
  the form on mount rather than needing an effect - and a stale conflict from the
  previous attempt is cleared for free.
*/
export function SessionEditDialog({ session, courses, teachers, labels, onUpdated, onOpenChange }: SessionEditDialogProps) {
  const [conflicts, setConflicts] = useState<ErrorDto[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClassSessionUpdateInput, undefined, ClassSessionUpdateOutput>({
    resolver: zodResolver(ClassSessionUpdateSchema),
    defaultValues: {
      classSessionId: session.classSessionId,
      courseId: session.courseId,
      teacherId: session.teacherId,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      semester: session.semester,
    },
  });

  const handleFormSubmit = async (values: ClassSessionUpdateOutput): Promise<void> => {
    setConflicts([]);

    const result = await updateClassSessionAction(values);

    if (isSuccess(result)) {
      onUpdated();

      return;
    }

    setConflicts(result.errors);
  };

  const handleCancelClick = (): void => {
    onOpenChange(false);
  };

  const fieldConflicts = {
    course: conflicts.filter(x => x.field === 'courseId').map(x => resolveScheduleErrorMessage(x.code, labels.errors)),
    teacher: conflicts.filter(x => x.field === 'teacherId').map(x => resolveScheduleErrorMessage(x.code, labels.errors)),
  };
  const genericConflicts = conflicts.filter(x => x.field !== 'courseId' && x.field !== 'teacherId');

  return (
    <Dialog open onOpenChange={onOpenChange}>
      {/* Capped height plus a column layout, so the body scrolls under a fixed footer. */}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.editTitle}</DialogTitle>
          <DialogDescription>{labels.editDescription}</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col gap-4">
          <SessionConflictNotice errors={genericConflicts} title={labels.conflictTitle} labels={labels.errors} />

          <input type="hidden" {...register('classSessionId')} />

          {/* `min-h-0` is load-bearing: a flex child will not shrink below its content without it. */}
          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            <SessionFields
              register={register as never}
              control={control as never}
              errors={errors}
              courses={courses}
              teachers={teachers}
              labels={labels.fields}
              fieldErrors={labels.fieldErrors}
              days={labels.days}
              conflicts={fieldConflicts}
              idPrefix="edit-session"
            />
          </div>

          <DialogFooter className="shrink-0 border-t-0 bg-transparent p-0 sm:mx-0 sm:mb-0">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleCancelClick}>
              {labels.cancel}
            </Button>

            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? labels.working : labels.editSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
