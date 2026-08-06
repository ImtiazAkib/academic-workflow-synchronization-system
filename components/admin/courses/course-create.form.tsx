'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';
import { SEMESTER } from '@/constants/schedule.const';

import { isSuccess } from '@/lib/result';
import { CourseCreateInput, CourseCreateOutput, CourseCreateSchema } from '@/lib/schemas';
import { resolveCourseErrorMessage } from '@/lib/utils';

import { Button } from '@/components/ui';

import { createCourseAction } from './actions';
import { CourseFields } from './course-fields';

import type { CourseCreateFormLabels, TeacherOption } from './courses.types';

type CourseCreateFormProps = {
  teachers: TeacherOption[];
  labels: CourseCreateFormLabels;
};

/**
 * A page rather than a dialog, matching the account screen — the work gets its own URL,
 * so it survives a refresh and can be linked.
 */
export function CourseCreateForm({ teachers, labels }: CourseCreateFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CourseCreateInput, undefined, CourseCreateOutput>({
    resolver: zodResolver(CourseCreateSchema),
    defaultValues: {
      code: '',
      title: '',
      semester: SEMESTER.MIN,
      credits: 3,
      assignedTeacherId: '',
    },
  });

  const handleFormSubmit = async (values: CourseCreateOutput): Promise<void> => {
    setFormError(null);

    const result = await createCourseAction(values);

    if (isSuccess(result)) {
      toast.success(labels.created);
      router.push(ROUTES.ADMIN_COURSES.HREF);
      router.refresh();

      return;
    }

    setFormError(resolveCourseErrorMessage(result.errors[0]?.code ?? 0, labels.errors));
  };

  const handleCancelClick = (): void => {
    router.push(ROUTES.ADMIN_COURSES.HREF);
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <CourseFields
        register={register as never}
        control={control as never}
        errors={errors}
        teachers={teachers}
        labels={labels.fields}
        fieldErrors={labels.fieldErrors}
        idPrefix="create-course"
      />

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleCancelClick}>
          {labels.cancel}
        </Button>

        <Button type="submit" variant="appPrimary" disabled={isSubmitting}>
          {isSubmitting ? labels.working : labels.submit}
        </Button>
      </div>
    </form>
  );
}
