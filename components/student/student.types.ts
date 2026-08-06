import type { DayLabels } from '@/components/schedule';

/**
 * A course as a student's screens need one — enough to name it, nothing more.
 */
export type StudentCourseOption = {
  courseId: string;
  code: string;
  title: string;
};

export type StudentTeacherOption = {
  userId: string;
  name: string;
};

/*
  Deliberately small bundles, one per component, rather than the single large object the
  administrator's screens pass around. Those are client trees, so every string has to
  cross the boundary together; nothing under `components/student` is a client component,
  so each piece can be handed only what it renders — and a label that stops being used
  stops being passed.
*/
export type StudentRoutineCardLabels = {
  statusCancelled: string;
  /*
    Rendered `sr-only` as the `<dt>` for each value. The clock and person icons carry the
    meaning visually but are `aria-hidden`, so without these the card reads out as two
    bare values with nothing saying which is the time and which is the teacher.
  */
  time: string;
  teacher: string;
};

/**
 * The card's strings plus the ones only the week around it renders. Split because the
 * overview shows today's classes as bare cards, with no week and so no day names.
 */
export type StudentRoutineLabels = StudentRoutineCardLabels & {
  days: DayLabels;
  today: string;
  dayEmpty: string;
};

export type StudentMaterialLabels = {
  tableLabel: string;
  columnTitle: string;
  columnSize: string;
  columnActions: string;
  download: string;
  noFiles: string;
};

export type TeacherDirectoryLabels = {
  email: string;
  courses: string;
  noCourses: string;
};
