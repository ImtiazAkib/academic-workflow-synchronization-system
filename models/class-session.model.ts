import mongoose, { Model, Schema, Types } from 'mongoose';

import { DayOfWeek } from '@/types';

import { DAYS_OF_WEEK, SEMESTER, TIME_OF_DAY_PATTERN } from '@/constants/schedule.const';

export type ClassSessionAttributes = {
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  dayOfWeek: DayOfWeek;
  /**
   * 24-hour `HH:mm`. Zero-padded, so `startTime < endTime` is a plain string
   * comparison and so is the overlap test between two sessions.
   */
  startTime: string;
  endTime: string;
  semester: number;
  /**
   * A class the teacher has called off. The row stays and the slot stays blocked, so
   * students see it struck through rather than silently missing from their week — and
   * the teacher can put it back.
   */
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassSessionEntity = ClassSessionAttributes & { _id: Types.ObjectId };

type ClassSessionModel = Model<ClassSessionAttributes>;

const classSessionSchema = new Schema<ClassSessionAttributes, ClassSessionModel>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: Number, required: true, enum: DAYS_OF_WEEK },
    startTime: { type: String, required: true, match: TIME_OF_DAY_PATTERN },
    endTime: { type: String, required: true, match: TIME_OF_DAY_PATTERN },
    semester: { type: Number, required: true, min: SEMESTER.MIN, max: SEMESTER.MAX },
    isCancelled: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

/*
  A session that ends before it starts is not a conflict to report to the user, it is
  a malformed record — rejected at the schema rather than in a service.
*/
classSessionSchema.pre('validate', function () {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate('endTime', 'End time must be later than start time.');
  }
});

/*
  Conflict detection asks whether this teacher or this course is already busy, and the
  timetable asks for a semester's week. One index each. The room index went with the
  field — nothing tracks where a class physically sits any more.
*/
classSessionSchema.index({ semester: 1, dayOfWeek: 1, startTime: 1 });
classSessionSchema.index({ teacher: 1, dayOfWeek: 1, semester: 1 });
classSessionSchema.index({ course: 1, dayOfWeek: 1, semester: 1 });

export const ClassSession =
  (mongoose.models.ClassSession as ClassSessionModel) ??
  mongoose.model<ClassSessionAttributes, ClassSessionModel>('ClassSession', classSessionSchema);
