import { promisify } from 'node:util';
import zlib from 'node:zlib';

import mongoose from 'mongoose';
import sharp from 'sharp';

import { MATERIAL } from '@/constants/material.const';
import { STORAGE, STORAGE_INCOMPRESSIBLE_MIME_TYPES } from '@/constants/storage.const';

import { connectToDatabase } from '@/lib/mongodb';

import type { StorageDriver, StoredFile, StoredFileStream } from './storage.types';

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

  Every file is shrunk on the way in — that is the whole reason `save` is no longer the
  thin passthrough it started as. An image is re-encoded to WebP, bounded to a sane size;
  a document that compresses is gzipped. What was squeezed is recorded in the file's
  metadata so `read` can undo it, and `usage` sums what actually landed on disk — the
  compressed sizes — because that, not the size the upload claimed, is what fills the cap.
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
 * The name an image is stored and offered back under, once it is a WebP.
 *
 * The extension has to follow the bytes: a file re-encoded to WebP but still called
 * `.png` would be saved by the browser under a name that lies about its contents.
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
 * A buffer rather than the streaming, backpressured loop the driver started with:
 * compression needs the bytes in hand — `sharp` decodes a whole image and `gzip` sees the
 * whole document — so by this point they already are, and the 25 MB cap is what keeps that
 * safe to hold. Anything larger belongs in object storage, which is a new driver.
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
 * Re-encode an image to a bounded WebP and store it.
 *
 * `rotate()` with no argument bakes in the EXIF orientation before stripping it, so a
 * photo taken sideways on a phone is not served on its side once the metadata is gone.
 * The resize bounds the longest edge without ever enlarging a small image, and WebP at a
 * middling quality is a fraction of the JPEG or PNG that arrived.
 *
 * @param bucket - The opened bucket.
 * @param file - The uploaded image.
 * @param input - The image bytes.
 *
 * @returns The stored WebP's key and metadata.
 */
async function storeImage(bucket: mongoose.mongo.GridFSBucket, file: File, input: Buffer): Promise<StoredFile> {
  const output = await sharp(input)
    .rotate()
    .resize({ width: STORAGE.IMAGE_MAX_DIMENSION, height: STORAGE.IMAGE_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: STORAGE.IMAGE_WEBP_QUALITY })
    .toBuffer();

  const fileName = toWebpFileName(file.name);
  const upload = bucket.openUploadStream(fileName, { metadata: { mimeType: 'image/webp', encoding: 'identity' } });

  await writeBuffer(upload, output);

  // The stored facts are the WebP's, not the upload's — the type changed and the size shrank.
  return { storageKey: String(upload.id), size: output.length, mimeType: 'image/webp', fileName };
}

/**
 * Store a document, gzipped when that helps.
 *
 * The logical size and type reported back are the original's, because that is what the
 * material row records and what a download offers — the gzip is an on-disk detail undone
 * on the way out. `originalSize` rides in the metadata so `read` can report a correct
 * `Content-Length` for the decompressed stream.
 *
 * @param bucket - The opened bucket.
 * @param file - The uploaded document.
 * @param input - The document bytes.
 *
 * @returns The stored file's key and original metadata.
 */
async function storeDocument(bucket: mongoose.mongo.GridFSBucket, file: File, input: Buffer): Promise<StoredFile> {
  const gzip = shouldGzip(file.type);
  const bytes = gzip ? await gzipAsync(input) : input;

  const metadata = gzip ? { mimeType: file.type, encoding: 'gzip', originalSize: file.size } : { mimeType: file.type, encoding: 'identity' };

  const upload = bucket.openUploadStream(file.name, { metadata });

  await writeBuffer(upload, bytes);

  return { storageKey: String(upload.id), size: file.size, mimeType: file.type, fileName: file.name };
}

export const gridFsStorage: StorageDriver = {
  async save(file: File): Promise<StoredFile> {
    const bucket = await openBucket();

    // Buffered rather than streamed, because every branch below transforms the whole file.
    const input = Buffer.from(await file.arrayBuffer());

    if (file.type.startsWith('image/')) {
      return storeImage(bucket, file, input);
    }

    return storeDocument(bucket, file, input);
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
      When the bytes were gzipped on the way in, they are unzipped on the way out — piped
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
      disk. The bucket's own tally cannot miss it. `length` is the stored byte count, so
      this is the compressed total — the number the cap is meant to bound.
    */
    const files = mongoose.connection.db.collection(`${MATERIAL.BUCKET}.files`);
    const [row] = await files.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: '$length' } } }]).toArray();

    return row?.total ?? 0;
  },
};
