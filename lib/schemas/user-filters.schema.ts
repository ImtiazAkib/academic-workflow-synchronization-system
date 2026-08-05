import { z } from 'zod';

import { USER_QUERY_MAX_LENGTH, USER_ROLE_FILTERS, USER_STATUS_FILTERS } from '@/constants/users.const';

/*
  Filters arrive from the URL, where anyone can type anything. Each field ends in
  `.catch()` rather than raising: a nonsense `?role=wizard` should quietly fall back to
  the unfiltered list, not throw an error page at someone who mistyped a query string.
  Form input is validated strictly — this is the one place where degrading is right.
*/
export const UserFiltersSchema = z.object({
  role: z.enum(Object.values(USER_ROLE_FILTERS)).catch(USER_ROLE_FILTERS.ALL),
  status: z.enum(Object.values(USER_STATUS_FILTERS)).catch(USER_STATUS_FILTERS.ALL),
  query: z.string().trim().max(USER_QUERY_MAX_LENGTH).catch(''),
});

export type UserFiltersInput = z.input<typeof UserFiltersSchema>;
export type UserFiltersOutput = z.output<typeof UserFiltersSchema>;
