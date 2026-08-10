'use client';

import { useState, useTransition } from 'react';

import { parseAsString, useQueryStates } from 'nuqs';

import { FILTER_ALL, USER_ROLE_FILTERS, USER_STATUS_FILTERS } from '@/constants/users.const';

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Spinner } from '@/components/ui';

import type { UsersLabels } from './users.types';

const SEARCH_THROTTLE_MS = 400;

type UsersFiltersProps = {
  labels: UsersLabels;
};

/*
  Filters live in the URL rather than component state, so a filtered view can be
  bookmarked, shared and survives a refresh. `shallow: false` is what makes that work:
  the change reaches the server component, which re-runs the query.
*/
export function UsersFilters({ labels }: UsersFiltersProps) {
  /*
    `startTransition` handed to nuqs so `isPending` follows the `shallow: false` round trip
    that re-runs the server query — without it a filter change gives no sign the list is
    refetching. The spinner by the search field and `aria-busy` on the group are that sign.
  */
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(
    {
      role: parseAsString.withDefault(FILTER_ALL),
      status: parseAsString.withDefault(FILTER_ALL),
      query: parseAsString.withDefault(''),
    },
    { shallow: false, clearOnDefault: true, startTransition }
  );

  /*
    The text box keeps its own copy so typing stays instant. The URL — and with it the
    server round trip — follows on a throttle rather than on every keystroke.
  */
  const [search, setSearch] = useState(filters.query);

  const roleItems: Record<string, string> = {
    [USER_ROLE_FILTERS.ALL]: labels.all,
    [USER_ROLE_FILTERS.ADMIN]: labels.roleAdmin,
    [USER_ROLE_FILTERS.TEACHER]: labels.roleTeacher,
    [USER_ROLE_FILTERS.STUDENT]: labels.roleStudent,
  };

  const statusItems: Record<string, string> = {
    [USER_STATUS_FILTERS.ALL]: labels.all,
    [USER_STATUS_FILTERS.PENDING]: labels.statusPending,
    [USER_STATUS_FILTERS.ACTIVE]: labels.statusActive,
    [USER_STATUS_FILTERS.INACTIVE]: labels.statusInactive,
  };

  const isFiltered = filters.role !== FILTER_ALL || filters.status !== FILTER_ALL || filters.query !== '';

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.target.value);

    void setFilters({ query: event.target.value || null }, { throttleMs: SEARCH_THROTTLE_MS });
  };

  const handleRoleChange = (value: unknown): void => {
    void setFilters({ role: String(value) });
  };

  const handleStatusChange = (value: unknown): void => {
    void setFilters({ status: String(value) });
  };

  const handleClearClick = (): void => {
    setSearch('');

    void setFilters({ role: null, status: null, query: null });
  };

  return (
    /*
      Stacked on a phone, one row from `sm` up. A wrapping flex row was the wrong tool:
      the two selects carried fixed widths to stay readable, which left a ragged gap
      beside the search box at the widths in between.
    */
    <div aria-busy={isPending} className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="users-search">{labels.search}</Label>
          {isPending && <Spinner className="text-muted-foreground size-3.5" />}
        </div>
        <Input id="users-search" type="search" value={search} placeholder={labels.searchPlaceholder} onChange={handleSearchChange} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="users-role">{labels.roleFilter}</Label>
        <Select items={roleItems} value={filters.role} onValueChange={handleRoleChange}>
          <SelectTrigger id="users-role" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(roleItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="users-status">{labels.statusFilter}</Label>
        <Select items={statusItems} value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger id="users-status" className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFiltered && (
        <Button type="button" variant="outline" className="sm:col-span-3 sm:justify-self-start" onClick={handleClearClick}>
          {labels.clearFilters}
        </Button>
      )}
    </div>
  );
}
