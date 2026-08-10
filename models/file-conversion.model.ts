import mongoose, { Model, Schema, Types } from 'mongoose';

import { FileConversionFailure, FileConversionStatus, FileConversionTarget } from '@/types';

import { FILE_CONVERSION_FAILURE, FILE_CONVERSION_STATUS, FILE_CONVERSION_TARGET } from '@/constants/storage.const';

export type FileConversionAttributes = {
  target: FileConversionTarget;
  /** The material or notice this conversion belongs to — the row swapped when it finishes. */
  targetId: Types.ObjectId;
  /** The uploaded name, so the progress screen can name the file without joining back. */
  fileName: string;
  status: FileConversionStatus;
  /** Present only when `status` is `failed`. */
  failure?: FileConversionFailure;
  /** Bytes the upload arrived as. */
  originalSize: number;
  /** Bytes on disk once compressed — absent until the job finishes. */
  finalSize?: number;
  startedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type FileConversionEntity = FileConversionAttributes & { _id: Types.ObjectId };

type FileConversionModel = Model<FileConversionAttributes>;

const fileConversionSchema = new Schema<FileConversionAttributes, FileConversionModel>(
  {
    target: { type: String, required: true, enum: Object.values(FILE_CONVERSION_TARGET) },
    targetId: { type: Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    status: { type: String, required: true, enum: Object.values(FILE_CONVERSION_STATUS), default: FILE_CONVERSION_STATUS.PROCESSING },
    failure: { type: String, enum: Object.values(FILE_CONVERSION_FAILURE) },
    originalSize: { type: Number, required: true, min: 0 },
    finalSize: { type: Number, min: 0 },
    startedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// The progress screen reads newest first — everyone's, and one account's own.
fileConversionSchema.index({ createdAt: -1 });
fileConversionSchema.index({ startedBy: 1, createdAt: -1 });

export const FileConversion =
  (mongoose.models.FileConversion as FileConversionModel) ??
  mongoose.model<FileConversionAttributes, FileConversionModel>('FileConversion', fileConversionSchema);
