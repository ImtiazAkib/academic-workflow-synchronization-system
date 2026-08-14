'use client';

import { useRef, useState } from 'react';

import { FilePenLine, Paperclip, Upload, X } from 'lucide-react';

import { useRouter } from '@/l10n/navigation';

import { NOTICE_IMAGE_ACCEPT } from '@/constants/notice.const';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label, Textarea } from '@/components/ui';

import type { NoticeEditLabels, NoticeView } from './notices.types';

export function NoticeEditButton({ notice, labels }: { notice: NoticeView; labels: NoticeEditLabels }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = (): void => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const payload = new FormData(event.currentTarget);
    payload.set('removeAttachment', String(removeAttachment));
    if (file) payload.set('file', file);
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/notices/${notice.noticeId}`, { method: 'PATCH', body: payload });
      if (!response.ok) {
        setError(labels.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FilePenLine className="size-4" /> {labels.action}
      </Button>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
          {error && (
            <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor={`notice-title-${notice.noticeId}`}>{labels.fieldTitle}</Label>
            <Input id={`notice-title-${notice.noticeId}`} name="title" defaultValue={notice.title} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`notice-body-${notice.noticeId}`}>{labels.fieldBody}</Label>
            <Textarea id={`notice-body-${notice.noticeId}`} name="body" rows={6} defaultValue={notice.body} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`notice-file-${notice.noticeId}`}>{labels.replace}</Label>
            <label
              htmlFor={`notice-file-${notice.noticeId}`}
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
                setRemoveAttachment(false);
              }}
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 text-center transition-colors ${dragging ? 'border-primary bg-primary-muted' : 'border-border hover:border-primary/40 hover:bg-primary-muted/40'}`}>
              {file ? <Upload className="text-primary size-6" /> : <Paperclip className="text-muted-foreground size-6" />}
              <span className="max-w-full text-sm font-medium break-all">
                {dragging ? labels.dropActive : (file?.name ?? notice.attachmentName ?? labels.dropDefault)}
              </span>
              <span className="text-muted-foreground text-xs">{labels.keep}</span>
            </label>
            {/* Plain input, not the styled `Input`: its `w-full` overrides `sr-only`, leaving this hidden picker full-width and overrunning the page on wide screens. */}
            <input
              ref={fileInputRef}
              id={`notice-file-${notice.noticeId}`}
              type="file"
              accept={NOTICE_IMAGE_ACCEPT}
              className="sr-only"
              onChange={event => {
                setFile(event.target.files?.item(0) ?? null);
                setRemoveAttachment(false);
              }}
            />
            {file && (
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground self-start" onClick={clearFile}>
                <X className="size-3.5" />
                {labels.clearFile}
              </Button>
            )}
            {notice.imageUrl && !file && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={removeAttachment}
                  onChange={event => setRemoveAttachment(event.target.checked)}
                  className="accent-primary size-4"
                />
                {labels.remove}
              </label>
            )}
          </div>
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={working} onClick={() => setOpen(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={working}>
              {working ? labels.working : labels.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
