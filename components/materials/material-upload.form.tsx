'use client';

import { useRef, useState } from 'react';

import { Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';

import { MATERIAL_ACCEPT } from '@/constants/material.const';

import type { ErrorDto } from '@/lib/result';
import { resolveMaterialErrorMessage } from '@/lib/utils';

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialUploadFormProps = {
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  /** The bucket is over the block line — refuse to upload at all. */
  storageBlocked: boolean;
  /** Past the warn line but not the block line — let the upload through, but say so. */
  storageNearFull: boolean;
};

/*
  Posts to `/api/materials/upload` rather than calling a Server Action: an action
  serializes its arguments, and a 25 MB file has no business going through that.
  `FormData` streams the body instead.

  Nothing here is a control. The size, the type, the course and whether the bucket has
  room are all re-checked on the server — this only saves the teacher a round trip when the
  answer is obvious. `storageBlocked` disables the picker and the button so a full bucket is
  visible before a file is chosen, not discovered after it uploads.
*/
export function MaterialUploadForm({ courses, labels, storageBlocked, storageNearFull }: MaterialUploadFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [courseId, setCourseId] = useState(courses[0]?.courseId ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const courseItems: Record<string, string> = {};

  courses.forEach(x => {
    courseItems[x.courseId] = `${x.code} — ${x.title}`;
  });

  const handleCourseChange = (value: unknown): void => {
    setCourseId(String(value));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setIsUploading(true);

    try {
      const body = new FormData(event.currentTarget);
      // The Select is not a native input, so its value is attached by hand.
      body.set('courseId', courseId);

      const response = await fetch('/api/materials/upload', { method: 'POST', body });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { errors?: ErrorDto[] };

        setFormError(resolveMaterialErrorMessage(payload.errors?.[0]?.code ?? 0, labels.errors));

        return;
      }

      formRef.current?.reset();
      toast.success(labels.toastUploaded);
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {storageBlocked ? (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {labels.storageFull}
        </p>
      ) : (
        storageNearFull && (
          <p role="status" className="border-warning/40 bg-warning/10 text-warning rounded-md border px-3 py-2 text-sm">
            {labels.storageWarning}
          </p>
        )
      )}

      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="material-course">{labels.fieldCourse}</Label>
          <Select items={courseItems} value={courseId} onValueChange={handleCourseChange}>
            <SelectTrigger id="material-course" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(courseItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="material-title">{labels.fieldTitle}</Label>
          <Input id="material-title" name="title" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="material-file">{labels.fieldFile}</Label>
          <Input id="material-file" name="file" type="file" accept={MATERIAL_ACCEPT} required disabled={storageBlocked} className="py-1.5" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="appPrimary" disabled={isUploading || courses.length === 0 || storageBlocked}>
          <Upload className="size-4" />
          {isUploading ? labels.uploading : labels.uploadSubmit}
        </Button>
      </div>
    </form>
  );
}
