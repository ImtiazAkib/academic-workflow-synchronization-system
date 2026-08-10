import { promisify } from 'node:util';
import zlib from 'node:zlib';

import mongoose from 'mongoose';
import sharp from 'sharp';

import { MATERIAL } from '@/constants/material.const';
import { STORAGE, STORAGE_INCOMPRESSIBLE_MIME_TYPES } from '@/constants/storage.const';

import { connectToDatabase } from '@/lib/mongodb';

import type { ConvertedFile, StorageDriver, StoredFile, StoredFileStream } from './storage.types';

/*
  Files live in MongoDB rather than on disk.

  The plan called for `public/uploads/{courseCode}/`, which works on the PM2 box and
  silently fails on Vercel: the filesystem there is read-only apart from `/tmp`, and
  `/tmp` is wiped between invocations — the upload would succeed and the download would
  404 some minutes later. GridFS needs no bucket, no credentials and no second service,
  and behaves the same on both deployments.

  The trade is database storage and a poor fit for very large files. The 25 MB cap in
  `MATERIAL` is what keeps that honest; anything bigger belongs in object storage, which
  is a new driver rather than a change here.

  Shrinking a file is split off from storing it. `save` writes the bytes as they arrive —
  streamed, so the upload returns without a 25 MB file sitting in memory being re-encoded
  while the caller waits — and `compress` does the re-encoding and gzipping afterwards, in
  the background, then the caller swaps the row to the new file. What was squeezed rides in
  the file's metadata so `read` can undo it, and `usage` sums what actually landed on disk.
*/

const gzipAsync = promisify(zlib.gzip);

/**
 * The bucket, opened against the connection `connectToDatabase()` caches.
 *
 * Not memoized: `GridFSBucket` is a thin handle over the existing connection, and
 * holding one across a hot reload would outlive the connection it wraps.
 *
 * @returns The materials bucket.
 */
async function openBucket(): Promise<mongoose.mongo.GridFSBucket> {
  await connectToDatabase();

  if (!mongoose.connection.db) {
    throw new Error('No database connection for the materials bucket');
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: MATERIAL.BUCKET });
}

/**
 * The name a file is stored and offered back under, once it is a WebP.
 *
 * The extension has to follow the bytes: a file re-encoded to WebP but still called `.png`
 * would be saved by the browser under a name that lies about its contents.
 *
 * @param fileName - Name as uploaded.
 *
 * @returns The same stem with a `.webp` extension.
 */
function toWebpFileName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;

  return `${stem}.webp`;
}

/**
 * Whether a document type is worth gzipping.
 *
 * @param mimeType - The declared type.
 *
 * @returns True unless the type is already a compressed container.
 */
function shouldGzip(mimeType: string): boolean {
  return !STORAGE_INCOMPRESSIBLE_MIME_TYPES.includes(mimeType as (typeof STORAGE_INCOMPRESSIBLE_MIME_TYPES)[number]);
}

/**
 * Write a whole buffer to an open upload stream and wait for it to land.
 *
 * @param upload - The GridFS write stream.
 * @param bytes - The bytes to store.
 */
async function writeBuffer(upload: mongoose.mongo.GridFSBucketWriteStream, bytes: Buffer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    upload.once('error', reject);
    upload.once('finish', () => resolve());
    upload.end(bytes);
  });
}

/**
 * Read a whole stored file into memory.
 *
 * Only `compress` uses this, and only on files already bounded by the upload caps —
 * `sharp` needs the whole image decoded and `gzip` sees the whole document, so by that
 * point the bytes have to be in hand. The download path never buffers; it streams.
 *
 * @param bucket - The opened bucket.
 * @param id - The stored file's id.
 *
 * @returns The file's bytes.
 */
async function downloadToBuffer(bucket: mongoose.mongo.GridFSBucket, id: mongoose.Types.ObjectId): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of bucket.openDownloadStream(id)) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
}

export const gridFsStorage: StorageDriver = {
  async save(file: File): Promise<StoredFile> {
    const bucket = await openBucket();

    // Stored as it arrives — `encoding: 'identity'` says nothing was done to it. `compress` changes that later.
    const upload = bucket.openUploadStream(file.name, { metadata: { mimeType: file.type, encoding: 'identity' } });

    /*
      The web `File` gives a `ReadableStream`; GridFS wants a Node writable. Piping by hand
      rather than reaching for `Readable.fromWeb` keeps this working on both the Node and
      edge builds without a conversion helper.
    */
    const reader = file.stream().getReader();

    try {
      for (;;) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Backpressure: wait when the buffer is full rather than growing it.
        if (!upload.write(value)) {
          await new Promise(resolve => upload.once('drain', resolve));
        }
      }

      await new Promise<void>((resolve, reject) => {
        upload.once('finish', () => resolve());
        upload.once('error', reject);
        upload.end();
      });
    } finally {
      reader.releaseLock();
    }

    return { storageKey: String(upload.id), size: file.size, mimeType: file.type, fileName: file.name };
  },

  async compress(storageKey: string): Promise<ConvertedFile | null> {
    if (!mongoose.Types.ObjectId.isValid(storageKey)) {
      return null;
    }

    const bucket = await openBucket();
    const id = new mongoose.Types.ObjectId(storageKey);

    const [record] = await bucket.find({ _id: id }).limit(1).toArray();

    if (!record) {
      return null;
    }

    const mimeType = String(record.metadata?.mimeType ?? 'application/octet-stream');
    const fileName = record.filename;
    const input = await downloadToBuffer(bucket, id);

    if (mimeType.startsWith('image/')) {
      /*
        `rotate()` with no argument bakes in the EXIF orientation before it is stripped, so
        a photo taken sideways on a phone is not served on its side. The resize bounds the
        longest edge without enlarging a small image, and WebP at a middling quality is a
        fraction of the JPEG or PNG that arrived.
      */
      const output = await sharp(input)
        .rotate()
        .resize({ width: STORAGE.IMAGE_MAX_DIMENSION, height: STORAGE.IMAGE_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: STORAGE.IMAGE_WEBP_QUALITY })
        .toBuffer();

      // A re-encode that did not shrink the file is not worth swapping the original for.
      if (output.length >= input.length) {
        return null;
      }

      const webpName = toWebpFileName(fileName);
      const upload = bucket.openUploadStream(webpName, { metadata: { mimeType: 'image/webp', encoding: 'identity' } });

      await writeBuffer(upload, output);

      return {
        stored: { storageKey: String(upload.id), size: output.length, mimeType: 'image/webp', fileName: webpName },
        physicalSize: output.length,
      };
    }

    if (shouldGzip(mimeType)) {
      const compressed = await gzipAsync(input);

      // Nothing gained means nothing swapped — a gzip that grew the file is left undone.
      if (compressed.length >= input.length) {
        return null;
      }

      const upload = bucket.openUploadStream(fileName, { metadata: { mimeType, encoding: 'gzip', originalSize: input.length } });

      await writeBuffer(upload, compressed);

      /*
        The logical size stays the original's — a gzipped document is still that document,
        unzipped on the way out — while the physical size is the compressed length, which is
        what actually fills the disk.
      */
      return { stored: { storageKey: String(upload.id), size: input.length, mimeType, fileName }, physicalSize: compressed.length };
    }

    // An already-compressed document: nothing to do, and the caller keeps the original.
    return null;
  },

  async read(storageKey: string): Promise<StoredFileStream | null> {
    if (!mongoose.Types.ObjectId.isValid(storageKey)) {
      return null;
    }

    const bucket = await openBucket();
    const id = new mongoose.Types.ObjectId(storageKey);

    const [record] = await bucket.find({ _id: id }).limit(1).toArray();

    if (!record) {
      return null;
    }

    const download = bucket.openDownloadStream(id);
    const gunzip = record.metadata?.encoding === 'gzip';

    /*
      When the bytes were gzipped by `compress`, they are unzipped on the way out — piped
      through a `gunzip` transform so the caller never learns the file was compressed. The
      length reported is then the original's, from metadata, not `record.length` (which is
      the compressed size the download and notice routes would otherwise send as
      `Content-Length`, leaving the browser waiting for bytes that never come).
    */
    const source = gunzip ? download.pipe(zlib.createGunzip()) : download;

    return {
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          source.on('data', chunk => controller.enqueue(new Uint8Array(chunk)));
          source.on('end', () => controller.close());
          source.on('error', error => controller.error(error));

          // `pipe` does not forward a read error to the transform, so surface it here too.
          if (gunzip) {
            download.on('error', error => controller.error(error));
          }
        },
        cancel() {
          download.destroy();
        },
      }),
      size: gunzip ? Number(record.metadata?.originalSize ?? record.length) : record.length,
      mimeType: String(record.metadata?.mimeType ?? 'application/octet-stream'),
      fileName: record.filename,
    };
  },

  async remove(storageKey: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(storageKey)) {
      return;
    }

    const bucket = await openBucket();

    // Deleting a file that is already gone is not an error worth surfacing.
    await bucket.delete(new mongoose.Types.ObjectId(storageKey)).catch(() => undefined);
  },

  async usage(): Promise<number> {
    await connectToDatabase();

    if (!mongoose.connection.db) {
      return 0;
    }

    /*
      Summed straight off the `.files` collection rather than counted from the material and
      notice rows, because those record the logical size and can drift: a save that landed
      its bytes but failed its row leaves an orphan the rows never mention, and it is real
      disk. `length` is the stored byte count, so this is what actually fills the cap.
    */
    const files = mongoose.connection.db.collection(`${MATERIAL.BUCKET}.files`);
    const [row] = await files.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: '$length' } } }]).toArray();

    return row?.total ?? 0;
  },
};
