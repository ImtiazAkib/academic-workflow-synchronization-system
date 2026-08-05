import mongoose, { Model, Schema, Types } from 'mongoose';

import { SEMESTER } from '@/constants/schedule.const';

export type CourseAttributes = {
  /**
   * Department course code, uppercased on write — `CSE-401`.
   */
  code: string;
  title: string;
  semester: number;
  credits: number;
  /**
   * The teacher responsible for the course. Optional because a course can be
   * created before it is assigned.
   */
  assignedTeacher?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseEntity = CourseAttributes & { _id: Types.ObjectId };

type CourseModel = Model<CourseAttributes>;

const courseSchema = new Schema<CourseAttributes, CourseModel>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    semester: { type: Number, required: true, min: SEMESTER.MIN, max: SEMESTER.MAX },
    credits: { type: Number, required: true, min: 0, max: 10 },
    assignedTeacher: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

// The two lists the UI asks for: courses in a semester, and a teacher's courses.
courseSchema.index({ semester: 1, code: 1 });
courseSchema.index({ assignedTeacher: 1 });

export const Course = (mongoose.models.Course as CourseModel) ?? mongoose.model<CourseAttributes, CourseModel>('Course', courseSchema);
