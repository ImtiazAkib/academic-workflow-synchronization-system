import mongoose, { Model, Schema, Types } from 'mongoose';

import { DayOfWeek } from '@/types';

import { DAYS_OF_WEEK, SEMESTER, TIME_OF_DAY_PATTERN } from '@/constants/schedule.const';

export type ClassSessionAttributes = {
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  room: string;
  dayOfWeek: DayOfWeek;
  /**
   * 24-hour `HH:mm`. Zero-padded, so `startTime < endTime` is a plain string
   * comparison and so is the overlap test between two sessions.
   */
  startTime: string;
  endTime: string;
  semester: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassSessionEntity = ClassSessionAttributes & { _id: Types.ObjectId };

type ClassSessionModel = Model<ClassSessionAttributes>;

const classSessionSchema = new Schema<ClassSessionAttributes, ClassSessionModel>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: String, required: true, trim: true, maxlength: 40 },
    dayOfWeek: { type: Number, required: true, enum: DAYS_OF_WEEK },
    startTime: { type: String, required: true, match: TIME_OF_DAY_PATTERN },
    endTime: { type: String, required: true, match: TIME_OF_DAY_PATTERN },
    semester: { type: Number, required: true, min: SEMESTER.MIN, max: SEMESTER.MAX },
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
  Conflict detection asks two questions on every write — is this room busy, is this
  teacher busy — and the timetable asks for a semester's week. One index each.
*/
classSessionSchema.index({ semester: 1, dayOfWeek: 1, startTime: 1 });
classSessionSchema.index({ room: 1, dayOfWeek: 1, semester: 1 });
classSessionSchema.index({ teacher: 1, dayOfWeek: 1, semester: 1 });

export const ClassSession =
  (mongoose.models.ClassSession as ClassSessionModel) ??
  mongoose.model<ClassSessionAttributes, ClassSessionModel>('ClassSession', classSessionSchema);
