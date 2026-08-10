/**
 * How much the bucket may hold, and what is done to a file on the way in to keep it
 * under that.
 *
 * The cap itself is an environment variable, not a constant here — it differs per
 * deployment the same way `MONGODB_URI` does: an Atlas free tier holds ~512 MB where the
 * self-hosted box has a disk. See `STORAGE_CAP_BYTES` in `env/server.ts`. What lives here
 * is the policy that does not move between deployments: when to warn, when to refuse, and
 * how hard to squeeze each upload.
 */
export const STORAGE = {
  /**
   * Warn the uploader once usage crosses this share of the cap.
   *
   * A soft line: the banner appears but the upload still goes through, so somebody has
   * notice to clear space before the hard line arrives rather than discovering it mid-term
   * with a file that will not save.
   */
  WARN_RATIO: 0.85,

  /**
   * Refuse new uploads once usage reaches this share of the cap.
   *
   * Short of 1.0 on purpose: the last slice is headroom, so a single upload straddling the
   * line cannot tip the shared database — the one that also holds users, courses and the
   * timetable — into a full disk that takes down every feature at once.
   */
  BLOCK_RATIO: 0.95,

  /**
   * How long a usage reading is trusted before it is measured again, in milliseconds.
   *
   * Measuring sums every file in the bucket, so it is not free to do on the render of
   * every upload page. A few seconds of staleness is harmless here — the per-file caps
   * bound how far usage can move inside the window, and the block ratio leaves headroom
   * for exactly that drift.
   */
  USAGE_CACHE_MS: 5000,

  /**
   * The longest edge an uploaded image is resized down to, in pixels.
   *
   * A phone photographs a noticeboard at four thousand pixels wide; nothing in this app
   * displays an image larger than a card. Bounding the longest edge is most of the saving,
   * before quality is even considered, and 2000 keeps a scanned page legible when zoomed.
   */
  IMAGE_MAX_DIMENSION: 2000,

  /**
   * The WebP quality every uploaded image is re-encoded at.
   *
   * 80 is the usual sweet spot: indistinguishable from the original at a glance, a
   * fraction of the bytes of the JPEG or PNG that arrived.
   */
  IMAGE_WEBP_QUALITY: 80,
} as const;

/**
 * The MIME types stored as they arrive, never gzipped.
 *
 * Each is already a compressed container, so a second pass spends CPU only to grow the
 * file by a gzip header. Images never reach this list — they are re-encoded to WebP before
 * the compression branch runs — so this is the document channel alone: PDFs, ZIPs and the
 * Office Open XML formats, which are ZIP archives under their extensions. Everything not
 * listed here (plain text, the legacy `.doc`/`.ppt`/`.xls` binary formats) compresses well
 * and is gzipped on the way in.
 */
export const STORAGE_INCOMPRESSIBLE_MIME_TYPES = [
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;
