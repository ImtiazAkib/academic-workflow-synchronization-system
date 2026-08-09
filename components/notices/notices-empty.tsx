import { Megaphone } from 'lucide-react';

type NoticesEmptyProps = {
  title: string;
  description: string;
};

/**
 * Shown when there is nothing to announce. Not an error: a quiet department is the normal
 * state, and most days the feed on a dashboard will be exactly this.
 */
export function NoticesEmpty({ title, description }: NoticesEmptyProps) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center">
      <Megaphone className="text-muted-foreground size-7" aria-hidden />

      <p className="text-regular-semibold">{title}</p>

      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
    </div>
  );
}
