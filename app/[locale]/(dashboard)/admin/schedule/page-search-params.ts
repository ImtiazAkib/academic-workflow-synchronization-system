import { createLoader, parseAsString } from 'nuqs/server';

import { FILTER_ALL } from '@/constants/users.const';

/*
  One definition of the screen's URL state, read from both sides: `ScheduleFilters`
  writes it with the client hooks, the page reads it on the server.
*/
export const scheduleSearchParams = {
  semester: parseAsString.withDefault(FILTER_ALL),
  teacher: parseAsString.withDefault(FILTER_ALL),
};

export const loadScheduleSearchParams = createLoader(scheduleSearchParams);
