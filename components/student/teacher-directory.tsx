import { TeacherDirectoryDto } from '@/types';

import { TeacherProfileCard } from './teacher-profile-card';

import type { TeacherDirectoryLabels } from './student.types';

type TeacherDirectoryProps = {
  teachers: TeacherDirectoryDto[];
  listLabel: string;
  labels: TeacherDirectoryLabels;
};

/**
 * The department's teachers as cards.
 *
 * A list rather than a grid of `div`s, so a screen reader announces how many there are
 * before reading the first one.
 */
export function TeacherDirectory({ teachers, listLabel, labels }: TeacherDirectoryProps) {
  return (
    <ul aria-label={listLabel} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {teachers.map(x => (
        <li key={x.userId}>
          <TeacherProfileCard teacher={x} labels={labels} />
        </li>
      ))}
    </ul>
  );
}
