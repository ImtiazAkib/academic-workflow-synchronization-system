/**
 * Where a background file conversion stands.
 *
 * `processing` the moment the upload returns, then `done` or `failed` once the compression
 * that runs after the response has finished. The progress screen reads exactly these.
 */
export type FileConversionStatus = 'processing' | 'done' | 'failed';

/**
 * Which kind of upload a conversion belongs to — a course material or a notice's image.
 * One job collection serves both, so the target says which row to swap when it completes.
 */
export type FileConversionTarget = 'material' | 'notice';

/**
 * Why a conversion failed, as a code the screen turns into a sentence rather than a raw
 * error string — a stored exception message could leak internals and would never localize.
 */
export type FileConversionFailure = 'target_gone' | 'conversion_failed';
