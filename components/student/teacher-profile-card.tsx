import { Mail } from 'lucide-react';

import { TeacherDirectoryDto } from '@/types';

import { resolveSemesterLabel } from '@/lib/utils';

import { Avatar, AvatarFallback, Badge } from '@/components/ui';

import type { TeacherDirectoryLabels } from './student.types';

type TeacherProfileCardProps = {
  teacher: TeacherDirectoryDto;
  labels: TeacherDirectoryLabels;
};

/*
  Renders every field `TeacherDirectoryDto` carries, which is the point of that type
  existing: the decision about what a student may see was made once, in the mapper, and
  this card cannot widen it by reaching for another property — there is no other
  property to reach for.

  The email is a `mailto:` rather than text to copy, because "find a teacher's contact
  details" ends in writing to them.
*/
export function TeacherProfileCard({ teacher, labels }: TeacherProfileCardProps) {
  return (
    <article className="grid items-center gap-3 p-4 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(14rem,1fr)] sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="text-xs">
            {teacher.name
              .split(/\s+/)
              .map(part => part[0])
              .join('')
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="text-regular-semibold">{teacher.name}</h2>
          {teacher.designation && <p className="text-muted-foreground truncate text-sm">{teacher.designation}</p>}
        </div>
      </div>

      <dl className="flex flex-col gap-1 text-sm">
        <dt className="sr-only">{labels.email}</dt>
        <dd className="flex items-center gap-1.5">
          <Mail className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          <a href={`mailto:${teacher.email}`} className="hover:text-foreground text-muted-foreground truncate transition-colors">
            {teacher.email}
          </a>
        </dd>
      </dl>

      <div className="flex flex-col gap-1.5">
        <p className="text-muted-foreground text-xs font-medium">{labels.courses}</p>

        {teacher.courses.length === 0 ? (
          <p className="text-muted-foreground text-xs">{labels.noCourses}</p>
        ) : (
          <ul className="flex flex-wrap gap-1">
            {teacher.courses.slice(0, 3).map(x => (
              <li key={x.courseId}>
                {/* Code and year, not the full title: a card is a summary, and the titles wrap badly. */}
                <Badge variant="secondary">
                  {x.code} · {resolveSemesterLabel(x.semester)}
                </Badge>
              </li>
            ))}
            {teacher.courses.length > 3 && (
              <li>
                <Badge variant="neutral">+{teacher.courses.length - 3}</Badge>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
