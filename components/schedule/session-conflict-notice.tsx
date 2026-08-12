import { TriangleAlert } from 'lucide-react';

import type { ErrorDto } from '@/lib/result';
import { resolveScheduleErrorMessage } from '@/lib/utils';
import type { ScheduleErrorLabels } from '@/lib/utils';

type SessionConflictNoticeProps = {
  errors: ErrorDto[];
  title: string;
  labels: ScheduleErrorLabels;
};

/*
  Conflict detection reports every clash at once - room, teacher and course can all be
  busy in the same slot - so this renders the whole list rather than the first one.
  Fixing them one error at a time is the guessing game the service was built to avoid.
*/
export function SessionConflictNotice({ errors, title, labels }: SessionConflictNoticeProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div role="alert" className="border-destructive/40 bg-destructive/10 text-destructive flex flex-col gap-2 rounded-md border px-3 py-2 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        {title}
      </span>

      <ul className="flex list-disc flex-col gap-1 ps-5">
        {errors.map(x => (
          <li key={x.code}>{resolveScheduleErrorMessage(x.code, labels)}</li>
        ))}
      </ul>
    </div>
  );
}
