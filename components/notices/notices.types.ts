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
  /** Empty when the notice is nothing but a picture. */
  body: string;
  /**
   * Where to fetch the picture, or null when there is none.
   *
   * A URL rather than the bytes, and an access-checked route rather than a public path:
   * the route resolves the storage key behind the audience check, so the id in this URL
   * being guessable costs nothing.
   */
  imageUrl: string | null;
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
  image: string;
};

export type NoticeFieldErrorLabels = {
  titleRequired: string;
  titleTooLong: string;
  bodyOrImageRequired: string;
  bodyTooLong: string;
  audienceInvalid: string;
  imageTooLarge: string;
  imageType: string;
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
  imageHint: string;
  imagePreviewAlt: string;
  imageRemove: string;
  storageWarning: string;
  storageFull: string;
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
