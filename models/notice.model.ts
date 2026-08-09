import mongoose, { Model, Schema, Types } from 'mongoose';

import { NoticeAudience } from '@/types';

import { NOTICE_AUDIENCES } from '@/constants/notice.const';

/**
 * The picture a notice carries, if it carries one.
 *
 * Kept together as one object rather than four loose columns, because they are only ever
 * present or absent as a set — a `storageKey` with no `mimeType` is not a state a notice
 * can be in, and nesting says so without a rule to enforce it.
 */
export type NoticeImage = {
  /**
   * Where the bytes live, in whatever the storage driver understands. Never leaves the
   * server: the DTO reports only whether an image exists, and the route that serves it
   * resolves this behind the access check — so the bucket cannot be read by guessing.
   */
  storageKey: string;
  fileName: string;
  mimeType: string;
  /** Size in bytes. */
  size: number;
};

export type NoticeAttributes = {
  title: string;
  /**
   * Optional, because a notice may be nothing but a picture — a scanned circular says
   * everything it needs to. `NoticeCreateSchema` is what refuses one that is neither.
   */
  body?: string;
  image?: NoticeImage;
  audience: NoticeAudience;
  publishedBy: Types.ObjectId;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type NoticeEntity = NoticeAttributes & { _id: Types.ObjectId };

type NoticeModel = Model<NoticeAttributes>;

const noticeSchema = new Schema<NoticeAttributes, NoticeModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 5000 },
    /*
      `_id: false` because this is one notice's image, not a document in its own right —
      an id on it would be a second identifier for something that is never addressed
      separately.
    */
    image: {
      type: new Schema<NoticeImage>(
        {
          storageKey: { type: String, required: true, trim: true, maxlength: 512 },
          fileName: { type: String, required: true, trim: true, maxlength: 255 },
          mimeType: { type: String, required: true, trim: true, maxlength: 120 },
          size: { type: Number, required: true, min: 0 },
        },
        { _id: false }
      ),
      required: false,
    },
    audience: { type: String, required: true, enum: Object.values(NOTICE_AUDIENCES), default: NOTICE_AUDIENCES.ALL },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /*
      Separate from `createdAt` so a notice can be written now and dated later
      without the audit trail lying about when the record appeared.
    */
    publishedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

noticeSchema.index({ audience: 1, publishedAt: -1 });

export const Notice = (mongoose.models.Notice as NoticeModel) ?? mongoose.model<NoticeAttributes, NoticeModel>('Notice', noticeSchema);
