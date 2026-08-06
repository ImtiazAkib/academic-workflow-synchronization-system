import { FileX } from 'lucide-react';

type MaterialsEmptyProps = {
  title: string;
  description: string;
};

/**
 * Shown when a teacher has published nothing yet. Not an error — an empty repository is
 * where every course starts.
 */
export function MaterialsEmpty({ title, description }: MaterialsEmptyProps) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center">
      <FileX className="text-muted-foreground size-7" aria-hidden />

      <p className="text-regular-semibold">{title}</p>

      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
    </div>
  );
}
