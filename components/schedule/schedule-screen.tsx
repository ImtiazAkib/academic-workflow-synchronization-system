'use client';

import { useState, useTransition } from 'react';

import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/l10n/navigation';
import { ClassSessionDto, DayOfWeek } from '@/types';

import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { resolveScheduleErrorMessage } from '@/lib/utils';

import { Button } from '@/components/ui';

import { deleteClassSessionAction, setClassSessionCancelledAction } from './actions';
import { ScheduleEmpty } from './schedule-empty';
import { ScheduleFilters } from './schedule-filters';
import { ScheduleWeekView } from './schedule-week-view';
import { SessionDeleteDialog } from './session-delete.dialog';
import { SessionEditDialog } from './session-edit.dialog';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type ScheduleScreenProps = {
  sessions: ClassSessionDto[];
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  today: DayOfWeek;
};

/*
  The administrator's timetable. The teacher view reuses `ScheduleWeekView` directly
  rather than this screen — it has no filters, no dialogs and no state, so wrapping it
  in an orchestrator would only give it machinery it never uses.
*/
export function ScheduleScreen({ sessions, courses, teachers, labels, today }: ScheduleScreenProps) {
  const router = useRouter();
  const [isWorking, startWorking] = useTransition();

  const [editing, setEditing] = useState<ClassSessionDto | null>(null);
  const [removing, setRemoving] = useState<ClassSessionDto | null>(null);
  const [cancelling, setCancelling] = useState<ClassSessionDto | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleEdit = (session: ClassSessionDto): void => {
    setEditing(session);
  };

  const handleUpdated = (): void => {
    setEditing(null);
    toast.success(labels.toastUpdated);
    router.refresh();
  };

  const handleRemove = (session: ClassSessionDto): void => {
    setRemoveError(null);
    setRemoving(session);
  };

  const handleToggleCancel = (session: ClassSessionDto): void => {
    setRemoveError(null);
    setCancelling(session);
  };

  const handleCancelConfirm = (): void => {
    if (!cancelling) {
      return;
    }

    const target = cancelling;
    const isCancelled = !target.isCancelled;

    startWorking(async () => {
      const result = await setClassSessionCancelledAction(target.classSessionId, isCancelled);

      if (!isSuccess(result)) {
        setRemoveError(resolveScheduleErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setCancelling(null);
      toast.success(isCancelled ? labels.toastCancelled : labels.toastRestored);
      router.refresh();
    });
  };

  const handleCancellingOpenChange = (open: boolean): void => {
    if (!open) {
      setCancelling(null);
    }
  };

  const handleRemoveConfirm = (): void => {
    if (!removing) {
      return;
    }

    const target = removing;

    startWorking(async () => {
      const result = await deleteClassSessionAction(target.classSessionId);

      if (!isSuccess(result)) {
        setRemoveError(resolveScheduleErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setRemoving(null);
      toast.success(labels.toastDeleted);
      router.refresh();
    });
  };

  const handleEditOpenChange = (open: boolean): void => {
    if (!open) {
      setEditing(null);
    }
  };

  const handleRemovingOpenChange = (open: boolean): void => {
    if (!open) {
      setRemoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{labels.title}</h1>
          <p className="text-muted-foreground text-sm">{labels.intro}</p>
          <p className="text-muted-foreground text-xs">{labels.count}</p>
        </div>

        <Button variant="appPrimary" nativeButton={false} render={<Link href={ROUTES.ADMIN_SCHEDULE_NEW.HREF} />}>
          <CalendarPlus className="size-4" />
          {labels.createCta}
        </Button>
      </div>

      <ScheduleFilters teachers={teachers} labels={labels} />

      {sessions.length === 0 ? (
        <ScheduleEmpty title={labels.emptyTitle} description={labels.emptyDescription} />
      ) : (
        <ScheduleWeekView
          sessions={sessions}
          courses={courses}
          teachers={teachers}
          labels={labels}
          today={today}
          canManage
          canDelete
          onEdit={handleEdit}
          onToggleCancel={handleToggleCancel}
          onRemove={handleRemove}
        />
      )}

      {editing && (
        <SessionEditDialog
          key={editing.classSessionId}
          session={editing}
          courses={courses}
          teachers={teachers}
          labels={labels}
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
        error={removeError}
        onConfirm={handleCancelConfirm}
        onOpenChange={handleCancellingOpenChange}
      />

      <SessionDeleteDialog
        session={removing}
        courses={courses}
        labels={labels.deleteDialog}
        cancelLabel={labels.dialogCancel}
        workingLabel={labels.working}
        isWorking={isWorking}
        error={removeError}
        onConfirm={handleRemoveConfirm}
        onOpenChange={handleRemovingOpenChange}
      />
    </div>
  );
}
