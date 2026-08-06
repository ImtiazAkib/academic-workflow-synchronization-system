import { BookOpen } from 'lucide-react';

type CoursesEmptyProps = {
  title: string;
  description: string;
};

/**
 * Shown when the filter matches nothing. Not an error: an empty result is a normal
 * answer to a narrow question.
 */
export function CoursesEmpty({ title, description }: CoursesEmptyProps) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center">
      <BookOpen className="text-muted-foreground size-7" aria-hidden />

      <p className="text-regular-semibold">{title}</p>

      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
    </div>
  );
}
