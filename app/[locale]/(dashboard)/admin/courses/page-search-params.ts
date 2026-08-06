import { createLoader, parseAsString } from 'nuqs/server';

import { FILTER_ALL } from '@/constants/users.const';

/*
  One definition of the screen's URL state, read from both sides: `CoursesFilters`
  writes it with the client hooks, the page reads it on the server.
*/
export const coursesSearchParams = {
  semester: parseAsString.withDefault(FILTER_ALL),
};

export const loadCoursesSearchParams = createLoader(coursesSearchParams);
