import { NOTICE_CATEGORIES } from '@/constants/notice.const';

import { MultimediaViewer } from '@/components/shared';
import { Badge } from '@/components/ui';

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
    <article className="border-border bg-card flex max-w-full min-w-0 flex-col gap-3 overflow-hidden rounded-lg border p-3 sm:p-4">
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
        The attachment is not rendered inline. A scanned circular shown at up to 384px turned
        a list of notices into an enormous scroll, so a picture is offered as a compact "View"
        that opens the viewer, and a PDF as the link below - the same way a material
        lists its file rather than embedding it. The title carries the alt text in the viewer.

        Served from a route that checks the audience, not a public path: the id in the URL is
        guessable, so the picture is refused rather than merely unlinked.
      */}
      {!preview && notice.imageUrl && notice.attachmentMimeType?.startsWith('image/') && (
        <MultimediaViewer title={notice.title} mimeType={notice.attachmentMimeType} source={notice.imageUrl} labels={labels.viewer} />
      )}

      {!preview && notice.imageUrl && notice.attachmentMimeType === 'application/pdf' && (
        <a
          href={notice.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary max-w-full text-sm font-medium break-all underline underline-offset-4">
          {labels.attachment}
          {notice.attachmentName ? `: ${notice.attachmentName}` : ''}
        </a>
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
