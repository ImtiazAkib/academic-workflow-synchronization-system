import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional primary action (a Button), rendered under the copy - kept width-tolerant for Bengali. */
  action?: React.ReactNode;
  className?: string;
};

/*
  The shared empty state (R2b), lifting the pattern the domain empties already share (dashed
  1px border, a single muted size-7 icon, title + description) into one primitive and adding
  the optional action slot the brief asks for, so a first-run empty can offer its next step
  in place. The per-domain empties (courses/materials/notices/student) migrate onto this in
  their own steps; strings still arrive already translated from the call site.
*/
function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center', className)}>
      {Icon && <Icon className="text-muted-foreground size-7" aria-hidden />}

      <p className="text-card-title">{title}</p>

      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { EmptyState };
