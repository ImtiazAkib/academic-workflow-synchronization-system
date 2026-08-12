import { NoticeAudience, NoticeCategory } from '@/types';

export const NOTICE_AUDIENCES = {
  ALL: 'all',
  TEACHERS: 'teachers',
  STUDENTS: 'students',
} as const satisfies Record<string, NoticeAudience>;

export const NOTICE_CATEGORIES = {
  GENERAL: 'general',
  SESSION: 'session',
} as const satisfies Record<string, NoticeCategory>;

/**
 * The most sessions one notice may target.
 *
 * A bound rather than a rule anybody asked for: a session notice names a handful of
 * intakes, and an unbounded array is a request built by hand asking the database to match
 * against a thousand strings. Generous enough that a real "every current batch" never hits
 * it.
 */
export const NOTICE_MAX_SESSIONS = 20;

/**
 * The picture a notice may carry.
 *
 * A notice is text, a picture, or both - a scanned circular and a routine photographed
 * off a noticeboard are how a department actually announces things, and retyping one into
 * a textarea is work nobody does.
 *
 * Enforced on the server. The `accept` attribute on the file input is a convenience for
 * the picker, not a control - anything can POST to the route handler.
 */
export const NOTICE_IMAGE = {
  /** 5 MB. A photograph of a page, not a scan archive. */
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
} as const;

/*
  Three raster formats, and the omission is the point: **no SVG**.

  A notice image is displayed inline, unlike a material, which is served as an attachment
  precisely so the browser never renders it. An SVG is a document that can carry script,
  so serving one inline from this origin would run somebody's markup on a page every
  account in the department loads, with their session attached. PNG, JPEG and WebP cannot
  execute anything, which is what makes inline display safe.
*/
export const NOTICE_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/*
  Checked alongside the MIME type, for the same reason materials does it: the browser
  supplies the type and a request made by hand supplies whatever it likes. The two
  agreeing rules out the careless case at no cost, and neither is proof of what the bytes
  are - only the magic number is, and that is checked in the service.
*/
export const NOTICE_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

/**
 * The file picker's `accept` attribute - a convenience for the picker, never a control.
 */
export const NOTICE_IMAGE_ACCEPT = [...NOTICE_IMAGE_MIME_TYPES, ...NOTICE_IMAGE_EXTENSIONS].join(',');
