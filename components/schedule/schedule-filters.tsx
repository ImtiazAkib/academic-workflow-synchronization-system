'use client';

import { useTransition } from 'react';

import { parseAsString, useQueryStates } from 'nuqs';

import { SEMESTER } from '@/constants/schedule.const';
import { FILTER_ALL } from '@/constants/users.const';

import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Spinner } from '@/components/ui';

import type { ScheduleLabels, TeacherOption } from './schedule.types';

type ScheduleFiltersProps = {
  teachers: TeacherOption[];
  labels: ScheduleLabels;
};

/*
  Filters live in the URL, so a filtered week can be bookmarked and survives a refresh.
  `shallow: false` is what makes that work — the change reaches the server component,
  which re-runs the query.
*/
export function ScheduleFilters({ teachers, labels }: ScheduleFiltersProps) {
  // Passed to nuqs so `isPending` follows the `shallow: false` server re-query.
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(
    {
      semester: parseAsString.withDefault(FILTER_ALL),
      teacher: parseAsString.withDefault(FILTER_ALL),
    },
    { shallow: false, clearOnDefault: true, startTransition }
  );

  const semesterItems: Record<string, string> = { [FILTER_ALL]: labels.all };

  for (let semester = SEMESTER.MIN; semester <= SEMESTER.MAX; semester++) {
    semesterItems[String(semester)] = String(semester);
  }

  const teacherItems: Record<string, string> = { [FILTER_ALL]: labels.all };

  teachers.forEach(x => {
    teacherItems[x.userId] = x.name;
  });

  const isFiltered = filters.semester !== FILTER_ALL || filters.teacher !== FILTER_ALL;

  const handleSemesterChange = (value: unknown): void => {
    void setFilters({ semester: String(value) });
  };

  const handleTeacherChange = (value: unknown): void => {
    void setFilters({ teacher: String(value) });
  };

  const handleClearClick = (): void => {
    void setFilters({ semester: null, teacher: null });
  };

  return (
    <div aria-busy={isPending} className="grid items-end gap-3 sm:grid-cols-[auto_auto_1fr]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="schedule-semester">{labels.semesterFilter}</Label>
          {isPending && <Spinner className="text-muted-foreground size-3.5" />}
        </div>
        <Select items={semesterItems} value={filters.semester} onValueChange={handleSemesterChange}>
          <SelectTrigger id="schedule-semester" className="w-full sm:w-auto sm:min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(semesterItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-teacher">{labels.teacherFilter}</Label>
        <Select items={teacherItems} value={filters.teacher} onValueChange={handleTeacherChange}>
          <SelectTrigger id="schedule-teacher" className="w-full sm:w-auto sm:max-w-72 sm:min-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(teacherItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFiltered && (
        <Button type="button" variant="outline" className="sm:justify-self-start" onClick={handleClearClick}>
          {labels.clearFilters}
        </Button>
      )}
    </div>
  );
}
