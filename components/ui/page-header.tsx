import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  /** The screen's primary action (and any quiet secondaries), right-aligned on wider screens. */
  actions?: React.ReactNode;
  className?: string;
};

/*
  The one page-header shape (R3b): title, an optional one-line description, and an optional
  actions slot - replacing the title+description+action row hand-rolled across ~32 pages, where
  the description size in particular had drifted (18px on some, 14px on others). The title is a
  plain h1, so it inherits the calm 600-weight page-title scale set in R1; the description is
  fixed at 14px muted. Screens adopt this from R4 on.
*/
function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1>{title}</h1>

        {description && <p className="text-muted-foreground text-sm text-pretty">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export { PageHeader };
