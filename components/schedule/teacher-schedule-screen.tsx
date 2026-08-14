'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';
import { ClassSessionDto, DayOfWeek } from '@/types';

import { isSuccess } from '@/lib/result';
import { resolveScheduleErrorMessage } from '@/lib/utils';

import { setClassSessionCancelledAction } from './actions';
import { ScheduleEmpty } from './schedule-empty';
import { ScheduleWeekView } from './schedule-week-view';
import { SessionDeleteDialog } from './session-delete.dialog';
import { SessionEditDialog } from './session-edit.dialog';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type TeacherScheduleScreenProps = {
  sessions: ClassSessionDto[];
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  today: DayOfWeek;
};

/*
  The teacher's own week: they may move a class or call it off, but not delete one -
  removing a slot from the department's timetable stays with the administrator.

  Rescheduling happens over the calendar rather than on a blank form: the week stays
  rendered behind the dialog, so the slots already taken are visible while a class is
  being moved. The service refuses a clash regardless, but seeing the week first means
  fewer refusals to read.

  Ownership is enforced in the service, not here - a teacher editing a class they do not
  teach is refused even if they reach the action directly.
*/
export function TeacherScheduleScreen({ sessions, courses, teachers, labels, today }: TeacherScheduleScreenProps) {
  const router = useRouter();
  const [isWorking, startWorking] = useTransition();

  const [editing, setEditing] = useState<ClassSessionDto | null>(null);
  const [cancelling, setCancelling] = useState<ClassSessionDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEdit = (session: ClassSessionDto): void => {
    setEditing(session);
  };

  const handleUpdated = (): void => {
    setEditing(null);
    toast.success(labels.toastUpdated);
    router.refresh();
  };

  const handleToggleCancel = (session: ClassSessionDto): void => {
    setActionError(null);
    setCancelling(session);
  };

  const handleCancelConfirm = (): void => {
    if (!cancelling) {
      return;
    }

    const target = cancelling;
    const isCancelled = !target.isCancelled;

    startWorking(async () => {
      const result = await setClassSessionCancelledAction({ classSessionId: target.classSessionId, isCancelled: isCancelled });

      if (!isSuccess(result)) {
        setActionError(resolveScheduleErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setCancelling(null);
      toast.success(isCancelled ? labels.toastCancelled : labels.toastRestored);
      router.refresh();
    });
  };

  const handleEditOpenChange = (open: boolean): void => {
    if (!open) {
      setEditing(null);
    }
  };

  const handleCancellingOpenChange = (open: boolean): void => {
    if (!open) {
      setCancelling(null);
    }
  };

  if (sessions.length === 0) {
    return <ScheduleEmpty title={labels.emptyTitle} description={labels.emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ScheduleWeekView
        sessions={sessions}
        courses={courses}
        teachers={teachers}
        labels={labels}
        today={today}
        canManage
        canDelete={false}
        onEdit={handleEdit}
        onToggleCancel={handleToggleCancel}
        onRemove={handleEdit}
      />

      {editing && (
        <SessionEditDialog
          key={editing.classSessionId}
          session={editing}
          courses={courses}
          teachers={teachers}
          labels={labels}
          lockReferences
          onUpdated={handleUpdated}
          onOpenChange={handleEditOpenChange}
        />
      )}

      <SessionDeleteDialog
        session={cancelling}
        courses={courses}
        labels={cancelling?.isCancelled ? labels.restoreDialog : labels.cancelDialog}
        cancelLabel={labels.dialogCancel}
        workingLabel={labels.working}
        isWorking={isWorking}
        error={actionError}
        onConfirm={handleCancelConfirm}
        onOpenChange={handleCancellingOpenChange}
      />
    </div>
  );
}
