import mongoose, { Model, Schema, Types } from 'mongoose';

export type MaterialAttributes = {
  course: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  title: string;
  description?: string;
  /**
   * The name the file is offered back under when downloaded.
   */
  fileName: string;
  mimeType: string;
  /**
   * Size in bytes.
   */
  size: number;
  /**
   * Where the bytes live, in whatever the storage driver understands. A path today,
   * an object key if this ever moves to S3 — nothing else reads it.
   */
  storageKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MaterialEntity = MaterialAttributes & { _id: Types.ObjectId };

type MaterialModel = Model<MaterialAttributes>;

const materialSchema = new Schema<MaterialAttributes, MaterialModel>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, trim: true, maxlength: 120 },
    size: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true, trim: true, maxlength: 512 },
  },
  { timestamps: true }
);

// Newest first, within a course — the only way this list is ever read.
materialSchema.index({ course: 1, createdAt: -1 });
materialSchema.index({ uploadedBy: 1 });

export const Material = (mongoose.models.Material as MaterialModel) ?? mongoose.model<MaterialAttributes, MaterialModel>('Material', materialSchema);
