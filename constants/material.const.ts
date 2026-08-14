/**
 * What a teacher may upload against a course.
 *
 * Enforced on the server. The `accept` attribute on the file input is a convenience
 * for the picker, not a control - anything can POST to the route handler.
 */
export const MATERIAL = {
  /** 25 MB. Slides and PDFs, not video. */
  MAX_SIZE_BYTES: 25 * 1024 * 1024,
  /** The GridFS bucket files are stored under. */
  BUCKET: 'materials',
} as const;

export const MATERIAL_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/ogg',
  'application/zip',
] as const;

/*
  Checked alongside the MIME type, because the browser supplies that and a request made
  by hand supplies whatever it likes. An extension is no harder to fake, but the two
  agreeing rules out the careless case - a `.exe` announced as a PDF - at no cost.

  Neither is proof of what the bytes are. Only reading the file's magic number is, and
  that belongs with the upload handler rather than a schema.
*/
export const MATERIAL_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.mp4',
  '.webm',
  '.mp3',
  '.ogg',
  '.zip',
] as const;

/**
 * The same list as the file picker's `accept` attribute - a convenience for the picker,
 * never a control.
 */
export const MATERIAL_ACCEPT = [...MATERIAL_MIME_TYPES, ...MATERIAL_EXTENSIONS].join(',');
