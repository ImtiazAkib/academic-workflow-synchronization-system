'use client';

import { parseAsString, useQueryStates } from 'nuqs';

import { SEMESTER } from '@/constants/schedule.const';
import { FILTER_ALL } from '@/constants/users.const';

import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import type { CoursesLabels } from './courses.types';

type CoursesFiltersProps = {
  labels: CoursesLabels;
};

/*
  The filter lives in the URL rather than component state, so a filtered view can be
  bookmarked and survives a refresh. `shallow: false` is what makes that work — the
  change reaches the server component, which re-runs the query.
*/
export function CoursesFilters({ labels }: CoursesFiltersProps) {
  const [filters, setFilters] = useQueryStates({ semester: parseAsString.withDefault(FILTER_ALL) }, { shallow: false, clearOnDefault: true });

  const semesterItems: Record<string, string> = { [FILTER_ALL]: labels.all };

  for (let semester = SEMESTER.MIN; semester <= SEMESTER.MAX; semester++) {
    semesterItems[String(semester)] = String(semester);
  }

  const handleSemesterChange = (value: unknown): void => {
    void setFilters({ semester: String(value) });
  };

  const handleClearClick = (): void => {
    void setFilters({ semester: null });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="courses-semester">{labels.semesterFilter}</Label>
        <Select items={semesterItems} value={filters.semester} onValueChange={handleSemesterChange}>
          <SelectTrigger id="courses-semester" className="w-full sm:w-44">
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

      {filters.semester !== FILTER_ALL && (
        <Button type="button" variant="outline" onClick={handleClearClick}>
          {labels.clearFilter}
        </Button>
      )}
    </div>
  );
}
