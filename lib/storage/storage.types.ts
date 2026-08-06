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
   * @param file - The uploaded file.
   *
   * @returns The stored file's key and metadata.
   */
  save(file: File): Promise<StoredFile>;

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
};
