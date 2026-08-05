import mongoose, { Model, Schema, Types } from 'mongoose';

import { NoticeAudience } from '@/types';

import { NOTICE_AUDIENCES } from '@/constants/notice.const';

export type NoticeAttributes = {
  title: string;
  body: string;
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
    body: { type: String, required: true, trim: true, maxlength: 5000 },
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
