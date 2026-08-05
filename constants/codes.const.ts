import { COMMON_AUTH, COMMON_BUSINESS, COMMON_DATABASE, COMMON_VALIDATION } from './codes-common.const';
import { USERS_AUTH, USERS_BUSINESS, USERS_DATABASE, USERS_VALIDATION } from './codes-users.const';

/*
  Central codes registry organized by layers.

  Format: five digits — [layer][feature][sequence]
  - Layer (1st digit):    1=Database, 2=Validation, 3=Business, 4=External, 5=Auth
  - Feature (2nd digit):  0=Common, 1=Users, 2=Courses, 3=Schedule, 4=Materials, 5=Notices
  - Sequence (last three): 000-999

  A feature adds its own `codes-{feature}.const.ts` and registers it here, so every
  code in the application is reachable from one place and none of them collide.
*/
export const CODES = {
  /**
   * Layer 1: Database/persistence errors (1xxxx)
   */
  DATABASE: {
    COMMON: COMMON_DATABASE, // 10xxx
    USERS: USERS_DATABASE, // 11xxx
  },

  /**
   * Layer 2: Validation errors (2xxxx)
   */
  VALIDATION: {
    COMMON: COMMON_VALIDATION, // 20xxx
    USERS: USERS_VALIDATION, // 21xxx
  },

  /**
   * Layer 3: Business logic errors (3xxxx)
   */
  BUSINESS: {
    COMMON: COMMON_BUSINESS, // 30xxx
    USERS: USERS_BUSINESS, // 31xxx
  },

  /**
   * Layer 5: Authentication and authorization errors (5xxxx)
   */
  AUTH: {
    COMMON: COMMON_AUTH, // 50xxx
    USERS: USERS_AUTH, // 51xxx
  },
} as const;
