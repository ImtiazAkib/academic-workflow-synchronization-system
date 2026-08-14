'use client';

import { useRef, useState } from 'react';

import { RefreshCw, Upload, X } from 'lucide-react';

import { MATERIAL_ACCEPT } from '@/constants/material.const';

import { Button, Input, Label, Textarea } from '@/components/ui';

import type { MaterialsLabels } from './materials.types';
import type { MaterialDto } from '@/types';

type MaterialEditFormProps = {
  material: MaterialDto;
  working: boolean;
  error: string | null;
  labels: MaterialsLabels;
  onCancel: () => void;
  onSave: (payload: FormData) => void;
};

export function MaterialEditForm({ material, working, error, labels, onCancel, onSave }: MaterialEditFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = (): void => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const payload = new FormData(event.currentTarget);
    payload.set('courseId', material.courseId);
    if (file) payload.set('file', file);
    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
      {error && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-material-title">{labels.fieldTitle}</Label>
        <Input id="edit-material-title" name="title" defaultValue={material.title} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-material-description">{labels.fieldDescription}</Label>
        <Textarea id="edit-material-description" name="description" rows={4} defaultValue={material.description} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-material-file">{labels.editReplace}</Label>
        <label
          htmlFor="edit-material-file"
          onDragEnter={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={event => event.preventDefault()}
          onDragLeave={event => {
            // Only clear once the cursor has left the dropzone, not each time it crosses the
            // icon or label inside - relatedTarget is where it went, null when off-window.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            setFile(event.dataTransfer.files.item(0));
          }}
          className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 text-center transition-colors sm:min-h-56 ${dragging ? 'border-primary bg-primary-muted' : 'border-border hover:border-primary/40 hover:bg-primary-muted/40'}`}>
          {file ? <RefreshCw className="text-primary size-6" /> : <Upload className="text-muted-foreground size-6" />}
          <span className="max-w-full text-sm font-medium break-all">{dragging ? labels.editDropActive : (file?.name ?? material.fileName)}</span>
          <span className="text-muted-foreground text-xs">{labels.editKeep}</span>
        </label>
        {/* Plain input, not the styled `Input`: its `w-full` overrides `sr-only`, leaving this hidden picker full-width and overrunning the page on wide screens. */}
        <input
          ref={fileInputRef}
          id="edit-material-file"
          type="file"
          accept={MATERIAL_ACCEPT}
          className="sr-only"
          onChange={event => setFile(event.target.files?.item(0) ?? null)}
        />
        {file && (
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground self-start" onClick={clearFile}>
            <X className="size-3.5" />
            {labels.removeFile}
          </Button>
        )}
      </div>
      <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={working} onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button type="submit" disabled={working}>
          {working ? labels.updating : labels.editTitle}
        </Button>
      </div>
    </form>
  );
}
