'use client';

import { useCallback, useRef, useState } from 'react';

import { Eye, FileDown, Minus, Plus, RotateCcw } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui';

export type MultimediaViewerLabels = {
  view: string;
  download: string;
  preview: string;
  zoomHint: string;
  zoomOut: string;
  zoomIn: string;
  reset: string;
};

/*
  English defaults so the viewer still renders outside a localized caller, mirroring the
  dialog's own `close` fallback. Every caller in the app passes a translated bundle; this
  only keeps a stray render from showing blank chrome.
*/
const DEFAULT_LABELS: MultimediaViewerLabels = {
  view: 'View',
  download: 'Download',
  preview: 'Preview attachment',
  zoomHint: 'Scroll or pinch to zoom. Drag to move.',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  reset: 'Reset image view',
};

type MultimediaViewerProps = {
  title: string;
  mimeType: string;
  source: string;
  downloadSource?: string;
  labels?: MultimediaViewerLabels;
  /** The trigger's size - `xs` for a dense list like a notice card, `sm` (default) elsewhere. */
  triggerSize?: 'xs' | 'sm';
};

export function MultimediaViewer({ title, mimeType, source, downloadSource, labels = DEFAULT_LABELS, triggerSize = 'sm' }: MultimediaViewerProps) {
  const downloadable = downloadSource ?? source;
  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');
  const isPdf = mimeType === 'application/pdf';
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // A functional updater, so the imperatively-attached wheel listener (below) can call it
  // without closing over a stale `zoom` - each wheel tick reads the latest value.
  const adjustZoom = useCallback((amount: number): void => {
    setZoom(current => {
      const next = Math.min(5, Math.max(1, Number((current + amount).toFixed(1))));
      // Back at 1 the image fits and dragging is disabled, so a leftover pan offset can no
      // longer be dragged away and the picture sits off-center. Recenter as zoom returns to 1.
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  /*
    Wheel-to-zoom is attached imperatively and non-passive, rather than through React's
    `onWheel`. React registers wheel listeners as passive, where `preventDefault` is ignored
    and the browser logs "Unable to preventDefault inside passive event listener invocation"
    while the page behind the dialog scrolls anyway. A ref callback (not an effect) is used
    because the frame only mounts when the dialog opens, which does not re-render this component.
  */
  const setImageFrame = useCallback(
    (node: HTMLDivElement | null): (() => void) => {
      imageFrameRef.current = node;
      if (!node) return () => {};

      const handleWheel = (event: WheelEvent): void => {
        event.preventDefault();
        adjustZoom(event.deltaY < 0 ? 0.2 : -0.2);
      };

      node.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        node.removeEventListener('wheel', handleWheel);
        imageFrameRef.current = null;
      };
    },
    [adjustZoom]
  );

  if (!isImage && !isVideo && !isAudio && !isPdf) return null;

  const resetImage = (): void => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const constrainPosition = (next: { x: number; y: number }): { x: number; y: number } => {
    const frame = imageFrameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return next;

    // The scaled image grows evenly from its centre. Keep at least its edge aligned with
    // the frame edge, so panning can reveal every pixel but never leaves an empty canvas.
    const maxX = Math.max(0, (image.clientWidth * zoom - frame.clientWidth) / 2);
    const maxY = Math.max(0, (image.clientHeight * zoom - frame.clientHeight) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" size={triggerSize} />}>
        <Eye className="size-3.5" /> {labels.view}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-1rem)] overflow-hidden p-0 sm:max-w-6xl" showCloseButton>
        <DialogHeader className="border-border border-b px-6 py-4 pr-12">
          <DialogTitle className="truncate">{title}</DialogTitle>
          <DialogDescription>{labels.preview}</DialogDescription>
        </DialogHeader>
        {isImage && (
          <div className="border-border flex flex-wrap items-center justify-end gap-2 border-b px-3 py-2 sm:justify-between sm:px-6">
            <p className="text-muted-foreground hidden text-xs sm:block">{labels.zoomHint}</p>
            <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="icon-xs" aria-label={labels.zoomOut} disabled={zoom === 1} onClick={() => adjustZoom(-0.5)}>
                <Minus />
              </Button>
              <span className="text-muted-foreground w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
              <Button type="button" variant="ghost" size="icon-xs" aria-label={labels.zoomIn} disabled={zoom === 5} onClick={() => adjustZoom(0.5)}>
                <Plus />
              </Button>
              <Button type="button" variant="ghost" size="icon-xs" aria-label={labels.reset} onClick={resetImage}>
                <RotateCcw />
              </Button>
            </div>
          </div>
        )}
        <div
          ref={isImage ? setImageFrame : undefined}
          className={`bg-muted/40 flex min-h-72 items-center justify-center overflow-hidden p-4 ${isImage ? 'h-[calc(100dvh-15rem)] max-h-[42rem] touch-none' : ''}`}
          onPointerDown={
            isImage
              ? event => {
                  if (zoom > 1) {
                    event.preventDefault();
                    dragStart.current = { x: event.clientX, y: event.clientY, originX: position.x, originY: position.y };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }
                }
              : undefined
          }
          onPointerMove={
            isImage
              ? event => {
                  if (dragStart.current) {
                    event.preventDefault();
                    setPosition(
                      constrainPosition({
                        x: dragStart.current.originX + event.clientX - dragStart.current.x,
                        y: dragStart.current.originY + event.clientY - dragStart.current.y,
                      })
                    );
                  }
                }
              : undefined
          }
          onPointerUp={
            isImage
              ? () => {
                  dragStart.current = null;
                }
              : undefined
          }
          onPointerCancel={
            isImage
              ? () => {
                  dragStart.current = null;
                }
              : undefined
          }>
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element -- protected route needs the session cookie and cannot use the optimizer.
            <img
              src={source}
              ref={imageRef}
              alt={title}
              draggable={false}
              onDoubleClick={() => (zoom === 1 ? setZoom(2) : resetImage())}
              className={`max-h-full max-w-full rounded-md object-contain shadow-lg ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
              style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` }}
            />
          )}
          {isVideo && <video src={source} controls className="max-h-[70vh] max-w-full rounded-md" />}
          {isAudio && <audio src={source} controls className="w-full max-w-xl" />}
          {isPdf && <iframe title={title} src={source} className="h-[70vh] w-full rounded-md border bg-white" />}
        </div>
        <div className="border-border flex justify-end border-t px-3 py-3 sm:px-6">
          {/* `download` makes this save the file rather than navigate the tab to it - a notice
              image is served inline, so without it the anchor replaced the whole dashboard. */}
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={downloadable} download />}>
            <FileDown className="size-3.5" /> {labels.download}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
