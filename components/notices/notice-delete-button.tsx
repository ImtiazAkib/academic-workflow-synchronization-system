'use client';

import { useState } from 'react';

import { AlertTriangle, Trash2 } from 'lucide-react';

import { useRouter } from '@/l10n/navigation';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import type { NoticeDeleteLabels } from './notices.types';

export function NoticeDeleteButton({ noticeId, labels }: { noticeId: string; labels: NoticeDeleteLabels }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNotice = async (): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/notices/${noticeId}`, { method: 'DELETE' });
      if (!response.ok) {
        setError(labels.error);
        return;
      }

      setOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={() => setOpen(true)} aria-label={labels.ariaLabel}>
        <Trash2 className="size-4" />
        {labels.action}
      </Button>

      <DialogContent className="gap-5 overflow-hidden p-0" showCloseButton={!isDeleting}>
        <div className="bg-destructive/10 flex items-center gap-3 px-6 py-5">
          <span className="bg-destructive/15 text-destructive flex size-10 items-center justify-center rounded-full">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <DialogTitle>{labels.title}</DialogTitle>
            <p className="text-muted-foreground mt-1 text-xs">{labels.warning}</p>
          </div>
        </div>

        <div className="px-6">
          <DialogHeader>
            <DialogDescription>{labels.description}</DialogDescription>
          </DialogHeader>

          {error && (
            <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive mt-4 rounded-md border px-3 py-2 text-sm">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="bg-muted/40 border-border border-t px-6 py-4">
          <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setOpen(false)}>
            {labels.cancel}
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={deleteNotice}>
            <Trash2 className="size-4" />
            {isDeleting ? labels.working : labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
