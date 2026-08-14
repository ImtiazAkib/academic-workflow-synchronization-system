import { FileDown, FileImage, FileText } from 'lucide-react';

import { NOTICE_CATEGORIES } from '@/constants/notice.const';

import { MultimediaViewer } from '@/components/shared';
import { Badge, Button } from '@/components/ui';

import { NoticeBadge } from './notice-badge';
import { NoticeDeleteButton } from './notice-delete-button';
import { NoticeEditButton } from './notice-edit-button';

import type { NoticeListLabels, NoticeView } from './notices.types';

type NoticeCardProps = {
  notice: NoticeView;
  labels: NoticeListLabels;
  preview?: boolean;
  canDelete?: boolean;
};

/*
  One notice, whole. There is no "read more" and no detail route, because a notice has
  nowhere else to be - an announcement that needed a second click to finish reading is an
  announcement half the department read half of.

  `whitespace-pre-wrap` on the body is what makes that true in practice. The field is a
  plain textarea, so the paragraph breaks somebody typed are the only structure the text
  has, and rendering it as HTML would collapse every one of them into a single wall.
  Rendered as text rather than markup for the same reason it is escaped in email: the body
  is typed by a person, and "it is only a notice" is how an injected script gets onto a
  page every account in the department loads.

  The body is optional and the image is optional, and never both at once - a notice is
  text, a picture, or both, and `NoticeCreateSchema` refuses one that is neither. So each
  is rendered only when it is there, rather than the card assuming a shape.
*/
export function NoticeCard({ notice, labels, preview = false, canDelete = false }: NoticeCardProps) {
  return (
    <article className="border-border bg-card flex max-w-full min-w-0 flex-col gap-2 overflow-hidden rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-regular-semibold min-w-0 flex-1 wrap-break-word">{notice.title}</h3>

        {/*
          A session notice is not addressed by role, so its audience label ("students") would
          say less than nothing - it shows which intakes it reached instead. A general notice
          keeps the audience badge it always had.
        */}
        {notice.category === NOTICE_CATEGORIES.SESSION ? (
          <div className="flex max-w-full flex-wrap items-center justify-end gap-1 text-xs">
            <span className="text-muted-foreground">{labels.sessionsLabel}</span>
            {notice.sessions.map(session => (
              <Badge key={session} variant="secondary">
                {session}
              </Badge>
            ))}
          </div>
        ) : (
          <NoticeBadge audience={notice.audience} label={notice.audienceLabel} />
        )}
      </div>

      {/*
        `wrap-break-word` alongside `whitespace-pre-wrap`: the pre-wrap keeps the paragraphs
        somebody typed, and on its own it also keeps a pasted URL on one unbreakable line
        that pushes the card past the viewport and scrolls the whole page sideways.
      */}
      {notice.body && <p className={`text-sm leading-relaxed wrap-break-word whitespace-pre-wrap ${preview ? 'line-clamp-3' : ''}`}>{notice.body}</p>}

      {/*
        The attachment is shown as one compact row - an icon for its kind (a picture or a PDF),
        its file name, and a single action: a picture opens in the viewer, a PDF downloads. It
        is not embedded inline; a scanned circular rendered at up to 384px turned a list of
        notices into an enormous scroll, and a bare full-width "View" button read as an empty
        card that said nothing about what the attachment even was.

        Served from a route that checks the audience, not a public path: the id in the URL is
        guessable, so the file is refused rather than merely unlinked.
      */}
      {!preview && notice.imageUrl && notice.attachmentMimeType && (
        // Fills the card's content width so its padding matches the rest of the card; a long
        // file name truncates inside it (the name span is flex-1 + min-w-0). The card itself
        // is what caps the width now, so no separate max-width is needed here.
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 text-xs">
            {notice.attachmentMimeType.startsWith('image/') ? (
              <FileImage className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <FileText className="size-3.5 shrink-0" aria-hidden />
            )}
            <span className="min-w-0 truncate">{notice.attachmentName ?? labels.attachment}</span>
          </span>

          {notice.attachmentMimeType.startsWith('image/') ? (
            <MultimediaViewer
              title={notice.title}
              mimeType={notice.attachmentMimeType}
              source={notice.imageUrl}
              labels={labels.viewer}
              triggerSize="xs"
            />
          ) : (
            <Button variant="outline" size="xs" nativeButton={false} render={<a href={notice.imageUrl} download />}>
              <FileDown /> {labels.viewer.download}
            </Button>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        {notice.publishedOn} · {labels.publishedBy} {notice.publisherName ?? labels.unknownPublisher}
      </p>
      {canDelete && (
        <div className="flex flex-wrap items-center gap-2">
          <NoticeEditButton notice={notice} labels={labels.edit} />
          <NoticeDeleteButton noticeId={notice.noticeId} labels={labels.delete} />
        </div>
      )}
    </article>
  );
}
