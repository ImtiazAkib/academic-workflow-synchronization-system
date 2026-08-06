import mongoose from 'mongoose';

import { MATERIAL } from '@/constants/material.const';

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
*/

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

export const gridFsStorage: StorageDriver = {
  async save(file: File): Promise<StoredFile> {
    const bucket = await openBucket();

    // The driver dropped `contentType` from the write options, so it rides in metadata.
    const upload = bucket.openUploadStream(file.name, { metadata: { mimeType: file.type } });

    /*
      The web `File` gives a `ReadableStream`; GridFS wants a Node writable. Piping by
      hand rather than reaching for `Readable.fromWeb` keeps this working on both the
      Node and edge builds without a conversion helper.
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
        upload.once('finish', resolve);
        upload.once('error', reject);
        upload.end();
      });
    } finally {
      reader.releaseLock();
    }

    return {
      storageKey: String(upload.id),
      size: file.size,
      mimeType: file.type,
      fileName: file.name,
    };
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

    return {
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          download.on('data', chunk => controller.enqueue(new Uint8Array(chunk)));
          download.on('end', () => controller.close());
          download.on('error', error => controller.error(error));
        },
        cancel() {
          download.destroy();
        },
      }),
      size: record.length,
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
};
