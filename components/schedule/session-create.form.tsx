'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';
import { SEMESTER, TEACHING_DAYS } from '@/constants/schedule.const';

import { ErrorDto, isSuccess } from '@/lib/result';
import { ClassSessionCreateInput, ClassSessionCreateOutput, ClassSessionCreateSchema } from '@/lib/schemas';

import { Button } from '@/components/ui';

import { createClassSessionAction } from './actions';
import { SessionConflictNotice } from './session-conflict-notice';
import { SessionFields } from './session-fields';

import type { CourseOption, SessionFormLabels, TeacherOption } from './schedule.types';

type SessionCreateFormProps = {
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: SessionFormLabels;
};

export function SessionCreateForm({ courses, teachers, labels }: SessionCreateFormProps) {
  const router = useRouter();
  const [conflicts, setConflicts] = useState<ErrorDto[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClassSessionCreateInput, undefined, ClassSessionCreateOutput>({
    resolver: zodResolver(ClassSessionCreateSchema),
    defaultValues: {
      courseId: courses[0]?.courseId ?? '',
      teacherId: teachers[0]?.userId ?? '',
      dayOfWeek: TEACHING_DAYS[0],
      startTime: '09:00',
      endTime: '10:00',
      semester: SEMESTER.MIN,
    },
  });

  const handleFormSubmit = async (values: ClassSessionCreateOutput): Promise<void> => {
    setConflicts([]);

    const result = await createClassSessionAction(values);

    if (isSuccess(result)) {
      toast.success(labels.saved);
      router.push(ROUTES.ADMIN_SCHEDULE.HREF);
      router.refresh();

      return;
    }

    // Every clash at once, not just the first.
    setConflicts(result.errors);
  };

  const handleCancelClick = (): void => {
    router.push(ROUTES.ADMIN_SCHEDULE.HREF);
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      <SessionConflictNotice errors={conflicts} title={labels.conflictTitle} labels={labels.errors} />

      <SessionFields
        register={register as never}
        control={control as never}
        errors={errors}
        courses={courses}
        teachers={teachers}
        labels={labels.fields}
        fieldErrors={labels.fieldErrors}
        days={labels.days}
        idPrefix="create-session"
      />

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleCancelClick}>
          {labels.cancel}
        </Button>

        <Button type="submit" variant="default" disabled={isSubmitting}>
          {isSubmitting ? labels.working : labels.submit}
        </Button>
      </div>
    </form>
  );
}
