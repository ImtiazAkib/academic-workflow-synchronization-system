import { COMMON_AUTH, COMMON_BUSINESS, COMMON_DATABASE, COMMON_VALIDATION } from './codes-common.const';

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
  },

  /**
   * Layer 2: Validation errors (2xxxx)
   */
  VALIDATION: {
    COMMON: COMMON_VALIDATION, // 20xxx
  },

  /**
   * Layer 3: Business logic errors (3xxxx)
   */
  BUSINESS: {
    COMMON: COMMON_BUSINESS, // 30xxx
  },

  /**
   * Layer 5: Authentication and authorization errors (5xxxx)
   */
  AUTH: {
    COMMON: COMMON_AUTH, // 50xxx
  },
} as const;
