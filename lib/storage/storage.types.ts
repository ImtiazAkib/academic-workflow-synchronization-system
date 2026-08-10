/**
 * What a stored file is, once it is in.
 */
export type StoredFile = {
  /**
   * Where the driver put it. Opaque to everything above this layer — a GridFS file id
   * today, an S3 object key if the driver is ever swapped. Only the driver that wrote
   * it knows how to read it back.
   */
  storageKey: string;
  size: number;
  mimeType: string;
  fileName: string;
};

/**
 * A file on its way out.
 */
export type StoredFileStream = {
  stream: ReadableStream<Uint8Array>;
  size: number;
  mimeType: string;
  fileName: string;
};

/**
 * The result of compressing a stored file into a new one.
 *
 * `stored` is the new file the way everything above the driver sees it — its key, its
 * logical size, its effective type and name, all of which the domain row is updated to.
 * `physicalSize` is what actually landed on disk, which differs from the logical size for a
 * gzipped document (smaller) and is what the progress screen reports the saving from.
 */
export type ConvertedFile = {
  stored: StoredFile;
  physicalSize: number;
};

/**
 * The whole storage contract — three operations, no more.
 *
 * Kept this narrow on purpose: the plan calls for swapping in another backend later
 * touching one file, and that only holds if nothing above depends on how the current
 * one works. Nothing here mentions GridFS, a bucket or a path.
 */
export type StorageDriver = {
  /**
   * Write a file and report where it went.
   *
   * Stores the bytes as they arrive — no compression on this path, so the upload returns
   * quickly and a 25 MB file does not sit in memory being re-encoded while the caller
   * waits. Shrinking the file is `compress`'s job, run in the background afterwards.
   *
   * @param file - The uploaded file.
   *
   * @returns The stored file's key and metadata.
   */
  save(file: File): Promise<StoredFile>;

  /**
   * Compress an already-stored file into a new one, and report where that went.
   *
   * The background half of an upload: an image is re-encoded to a bounded WebP, a document
   * that compresses is gzipped, and anything already compact is left alone. Writes a new
   * file rather than mutating the original — a stored object has no in-place rewrite — so
   * the caller swaps the domain row to the new key and deletes the old one.
   *
   * @param storageKey - Key of the file to compress, from `save`.
   *
   * @returns The new file and its on-disk size, or null when compressing would not help.
   */
  compress(storageKey: string): Promise<ConvertedFile | null>;

  /**
   * Open a stored file for reading.
   *
   * Streams rather than buffers: a 25 MB download should not sit in memory on the way
   * through, and a route handler can hand the stream straight to the Response.
   *
   * @param storageKey - Key returned by `save`.
   *
   * @returns The file's stream and metadata, or null when it is not there.
   */
  read(storageKey: string): Promise<StoredFileStream | null>;

  /**
   * Delete a stored file.
   *
   * @param storageKey - Key returned by `save`.
   */
  remove(storageKey: string): Promise<void>;

  /**
   * How many bytes the driver is currently holding, across every stored file.
   *
   * The one measurement the quota guard needs, kept behind the same contract as the rest
   * so nothing above the storage layer has to know how the backend counts — a GridFS sum
   * today, an S3 `ListObjects` total if the driver is ever swapped. It reports what is
   * physically stored, which is the compressed size after `save` has done its work, so the
   * cap is measured against real disk rather than the sizes the files logically claim.
   *
   * @returns The total stored size in bytes.
   */
  usage(): Promise<number>;
};
