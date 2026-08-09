import type { NoticeAudienceLabels, NoticeErrorLabels } from '@/lib/utils';

/**
 * A notice reduced to what a card renders.
 *
 * The date arrives already formatted, and that is the point of this type existing rather
 * than passing `NoticeDto` straight down. Formatting is locale-aware and timezone-pinned,
 * which only the server can do here — `getFormatter()` reads the request's locale, and a
 * client component re-formatting an ISO string would quietly fall back to the browser's
 * locale and the visitor's own timezone. The department publishes on Dhaka time.
 */
export type NoticeView = {
  noticeId: string;
  title: string;
  body: string;
  audience: string;
  audienceLabel: string;
  publishedOn: string;
  publisherName: string | null;
};

export type NoticeAudienceOptionLabels = NoticeAudienceLabels;

export type NoticeFieldLabels = {
  title: string;
  body: string;
  audience: string;
};

export type NoticeFieldErrorLabels = {
  titleRequired: string;
  titleTooLong: string;
  bodyRequired: string;
  bodyTooLong: string;
  audienceInvalid: string;
};

/**
 * Every string the publish form renders.
 *
 * One bundle rather than a dozen props: the form is a client component and the convention
 * is that the server component does the lookup, so all of it crosses the boundary
 * together.
 */
export type NoticeCreateFormLabels = {
  fields: NoticeFieldLabels;
  fieldErrors: NoticeFieldErrorLabels;
  audiences: NoticeAudienceOptionLabels;
  audienceHint: string;
  submit: string;
  working: string;
  cancel: string;
  published: string;
  errors: NoticeErrorLabels;
};

export type NoticeListLabels = {
  emptyTitle: string;
  emptyDescription: string;
  publishedBy: string;
  unknownPublisher: string;
};
