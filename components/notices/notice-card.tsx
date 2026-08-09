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
*/
export function NoticeCard({ notice, labels }: NoticeCardProps) {
  return (
    <article className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-regular-semibold">{notice.title}</h3>
        <NoticeBadge audience={notice.audience} label={notice.audienceLabel} />
      </div>

      <p className="text-sm whitespace-pre-wrap">{notice.body}</p>

      <p className="text-muted-foreground text-xs">
        {notice.publishedOn} · {labels.publishedBy} {notice.publisherName ?? labels.unknownPublisher}
      </p>
    </article>
  );
}
