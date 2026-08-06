import type { LucideIcon } from 'lucide-react';

type StudentEmptyProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * The one empty state the student area uses, for all four of its answers: no semester
 * set yet, no classes, no files, no teachers.
 *
 * Takes its icon rather than choosing one, because the four cases are not the same
 * shape of nothing — an unset semester is something an administrator has to fix, while
 * an empty week is simply an empty week.
 */
export function StudentEmpty({ icon: Icon, title, description }: StudentEmptyProps) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center">
      <Icon className="text-muted-foreground size-7" aria-hidden />

      <p className="text-regular-semibold">{title}</p>

      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
    </div>
  );
}
