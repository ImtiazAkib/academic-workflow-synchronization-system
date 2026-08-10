import { NOTICE_CATEGORIES } from '@/constants/notice.const';

import { Badge } from '@/components/ui';

import { NoticeBadge } from './notice-badge';

import type { NoticeListLabels, NoticeView } from './notices.types';

type NoticeCardProps = {
  notice: NoticeView;
  labels: NoticeListLabels;
};

/*
  One notice, whole. There is no "read more" and no detail route, because a notice has
  nowhere else to be — an announcement that needed a second click to finish reading is an
  announcement half the department read half of.

  `whitespace-pre-wrap` on the body is what makes that true in practice. The field is a
  plain textarea, so the paragraph breaks somebody typed are the only structure the text
  has, and rendering it as HTML would collapse every one of them into a single wall.
  Rendered as text rather than markup for the same reason it is escaped in email: the body
  is typed by a person, and "it is only a notice" is how an injected script gets onto a
  page every account in the department loads.

  The body is optional and the image is optional, and never both at once — a notice is
  text, a picture, or both, and `NoticeCreateSchema` refuses one that is neither. So each
  is rendered only when it is there, rather than the card assuming a shape.
*/
export function NoticeCard({ notice, labels }: NoticeCardProps) {
  return (
    <article className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-regular-semibold min-w-0 wrap-break-word">{notice.title}</h3>

        {/*
          A session notice is not addressed by role, so its audience label ("students") would
          say less than nothing — it shows which intakes it reached instead. A general notice
          keeps the audience badge it always had.
        */}
        {notice.category === NOTICE_CATEGORIES.SESSION ? (
          <Badge variant="secondary">
            {labels.sessionsLabel} {notice.sessions.join(', ')}
          </Badge>
        ) : (
          <NoticeBadge audience={notice.audience} label={notice.audienceLabel} />
        )}
      </div>

      {/*
        `wrap-break-word` alongside `whitespace-pre-wrap`: the pre-wrap keeps the paragraphs
        somebody typed, and on its own it also keeps a pasted URL on one unbreakable line
        that pushes the card past the viewport and scrolls the whole page sideways.
      */}
      {notice.body && <p className="text-sm wrap-break-word whitespace-pre-wrap">{notice.body}</p>}

      {/*
        The title is the alt text, and for a picture-only notice that is the whole of what
        a screen reader gets — which is the honest answer. Nobody types a description of a
        scanned circular, and inventing one from the file name would describe the file
        rather than the announcement.

        Served from a route that checks the audience, not from a public path: the id in the
        URL is guessable, so the picture is refused rather than merely unlinked.

        `max-w-full` is what stops a wide photograph scrolling the page. `w-auto` caps the
        height but says nothing about width, so a 4000px scan rendered at its natural width
        until this was added.
      */}
      {notice.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- access-checked route; the optimizer fetches without the viewer's session
        <img
          src={notice.imageUrl}
          alt={notice.title}
          loading="lazy"
          className="border-border h-auto max-h-96 w-auto max-w-full rounded-md border object-contain"
        />
      )}

      <p className="text-muted-foreground text-xs">
        {notice.publishedOn} · {labels.publishedBy} {notice.publisherName ?? labels.unknownPublisher}
      </p>
    </article>
  );
}
