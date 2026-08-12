import { Link } from '@/l10n/navigation';

import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

type DashboardStatProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** When set, the whole tile links there — e.g. the pending-approvals tile to the users queue. */
  href?: string;
  /** `warning`/`danger` color the number when the count is something to act on (conflicts, a backlog). */
  tone?: 'default' | 'warning' | 'danger';
};

/*
  A compact overview tile (R4): a small labelled number, not the 250px vanity card the brief warns
  against. A row of these answers "what needs attention today" at a glance — today's classes, open
  conflicts, the approval backlog — with the number in tabular figures so a row of tiles lines up.
*/
export function DashboardStat({ label, value, icon: Icon, href, tone = 'default' }: DashboardStatProps) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        {Icon && <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />}
      </span>

      <span className={cn('text-2xl font-semibold tabular-nums', tone === 'warning' && 'text-warning', tone === 'danger' && 'text-destructive')}>
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="border-border bg-card hover:border-primary/40 flex flex-col gap-1.5 rounded-lg border p-3 transition-colors">
        {body}
      </Link>
    );
  }

  return <div className="border-border bg-card flex flex-col gap-1.5 rounded-lg border p-3">{body}</div>;
}
