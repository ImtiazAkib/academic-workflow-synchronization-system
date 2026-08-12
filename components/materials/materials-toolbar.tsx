'use client';

import { Search } from 'lucide-react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialsToolbarProps = {
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  search: string;
  courseId: string;
  type: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

export function MaterialsToolbar({
  courses,
  labels,
  search,
  courseId,
  type,
  sort,
  onSearchChange,
  onCourseChange,
  onTypeChange,
  onSortChange,
}: MaterialsToolbarProps) {
  const courseItems = { all: labels.allCourses, ...Object.fromEntries(courses.map(x => [x.courseId, x.code])) };
  const typeItems = {
    all: labels.allTypes,
    pdf: labels.typePdf,
    document: labels.typeDocument,
    presentation: labels.typePresentation,
    spreadsheet: labels.typeSpreadsheet,
    image: labels.typeImage,
    archive: labels.typeArchive,
    text: labels.typeText,
  };
  const sortItems = { date: labels.sortDate, name: labels.sortName, size: labels.sortSize };

  return (
    <div className="border-border bg-surface-muted/50 grid gap-3 rounded-lg border p-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_11rem_10rem_10rem]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="materials-search" className="sr-only">
          {labels.searchLabel}
        </Label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
          <Input
            id="materials-search"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>
      <Select items={courseItems} value={courseId} onValueChange={value => onCourseChange(String(value))}>
        <SelectTrigger aria-label={labels.courseFilter} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(courseItems).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={typeItems} value={type} onValueChange={value => onTypeChange(String(value))}>
        <SelectTrigger aria-label={labels.typeFilter} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(typeItems).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={sortItems} value={sort} onValueChange={value => onSortChange(String(value))}>
        <SelectTrigger aria-label={labels.sortLabel} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(sortItems).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
