'use client';

import { useState, useTransition } from 'react';

import { BookPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/l10n/navigation';
import { CourseDto } from '@/types';

import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { resolveCourseErrorMessage } from '@/lib/utils';

import { Button } from '@/components/ui';

import { setCourseActiveAction } from './actions';
import { CourseConfirmDialog } from './course-confirm.dialog';
import { CourseEditDialog } from './course-edit.dialog';
import { CoursesEmpty } from './courses-empty';
import { CoursesFilters } from './courses-filters';
import { CoursesTable } from './courses-table';

import type { CoursesLabels, TeacherOption } from './courses.types';

type CoursesScreenProps = {
  courses: CourseDto[];
  teachers: TeacherOption[];
  labels: CoursesLabels;
};

/*
  The one client component here. The table and its dialogs share which row is selected
  and whether an action is in flight, so splitting that state would only mean lifting it
  back up. Every mutation ends in `router.refresh()`, which re-runs the server component
  and re-applies the current URL filter for free.
*/
export function CoursesScreen({ courses, teachers, labels }: CoursesScreenProps) {
  const router = useRouter();
  const [isWorking, startWorking] = useTransition();

  const [editing, setEditing] = useState<CourseDto | null>(null);
  const [activating, setActivating] = useState<CourseDto | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleEdit = (course: CourseDto): void => {
    setEditing(course);
  };

  const handleUpdated = (): void => {
    setEditing(null);
    toast.success(labels.toastUpdated);
    router.refresh();
  };

  const handleActivation = (course: CourseDto): void => {
    setConfirmError(null);
    setActivating(course);
  };

  const handleActivationConfirm = (): void => {
    if (!activating) {
      return;
    }

    const target = activating;
    const isActive = !target.isActive;

    startWorking(async () => {
      const result = await setCourseActiveAction(target.courseId, isActive);

      if (!isSuccess(result)) {
        setConfirmError(resolveCourseErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setActivating(null);
      toast.success(isActive ? labels.toastReactivated : labels.toastDeactivated);
      router.refresh();
    });
  };

  const handleEditOpenChange = (open: boolean): void => {
    if (!open) {
      setEditing(null);
    }
  };

  const handleActivatingOpenChange = (open: boolean): void => {
    if (!open) {
      setActivating(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{labels.tableLabel}</h1>
          <p className="text-muted-foreground text-sm">{labels.count}</p>
        </div>

        <Button variant="appPrimary" nativeButton={false} render={<Link href={ROUTES.ADMIN_COURSES_NEW.HREF} />}>
          <BookPlus className="size-4" />
          {labels.createCta}
        </Button>
      </div>

      <CoursesFilters labels={labels} />

      {courses.length === 0 ? (
        <CoursesEmpty title={labels.emptyTitle} description={labels.emptyDescription} />
      ) : (
        <CoursesTable courses={courses} teachers={teachers} labels={labels} onEdit={handleEdit} onActivation={handleActivation} />
      )}

      {editing && (
        <CourseEditDialog
          key={editing.courseId}
          course={editing}
          teachers={teachers}
          labels={labels}
          onUpdated={handleUpdated}
          onOpenChange={handleEditOpenChange}
        />
      )}

      <CourseConfirmDialog
        course={activating}
        labels={activating?.isActive ? labels.deactivateDialog : labels.reactivateDialog}
        cancelLabel={labels.cancel}
        workingLabel={labels.working}
        isWorking={isWorking}
        error={confirmError}
        onConfirm={handleActivationConfirm}
        onOpenChange={handleActivatingOpenChange}
      />
    </div>
  );
}
