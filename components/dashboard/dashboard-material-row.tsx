import { FileText } from 'lucide-react';

type DashboardMaterialRowProps = {
  title: string;
  courseCode?: string;
  /** Human file size, from `formatFileSize`. */
  sizeLabel: string;
  /** Relative upload time ("2 hours ago"), formatted by the caller via next-intl's formatter. */
  agoLabel: string;
};

/*
  One recently-uploaded file in a dashboard's "recent materials" list (R4): a compact read-only row
  giving the human touch the brief asks for — the file, its course, and how long ago it landed. A
  generic file icon for now; the per-type icons (PDF / slides / assignment) come with the materials
  repository in R7, where telling the types apart actually matters.
*/
export function DashboardMaterialRow({ title, courseCode, sizeLabel, agoLabel }: DashboardMaterialRowProps) {
  const meta = [courseCode, sizeLabel, agoLabel].filter(Boolean).join(' · ');

  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-lg border p-3">
      <FileText className="text-muted-foreground size-5 shrink-0" aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{title}</span>

        <span className="text-muted-foreground truncate text-xs">{meta}</span>
      </div>
    </div>
  );
}
