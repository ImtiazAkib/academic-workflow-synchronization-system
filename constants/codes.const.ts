import { COMMON_AUTH, COMMON_BUSINESS, COMMON_DATABASE, COMMON_VALIDATION } from './codes-common.const';
import { COURSES_BUSINESS, COURSES_DATABASE, COURSES_VALIDATION } from './codes-courses.const';
import { MATERIALS_AUTH, MATERIALS_DATABASE, MATERIALS_VALIDATION } from './codes-materials.const';
import { NOTICES_AUTH, NOTICES_DATABASE, NOTICES_VALIDATION } from './codes-notices.const';
import { SCHEDULE_AUTH, SCHEDULE_BUSINESS, SCHEDULE_DATABASE, SCHEDULE_VALIDATION } from './codes-schedule.const';
import { USERS_AUTH, USERS_BUSINESS, USERS_DATABASE, USERS_VALIDATION } from './codes-users.const';

/*
  Central codes registry organized by layers.

  Format: five digits - [layer][feature][sequence]
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
    COURSES: COURSES_DATABASE, // 12xxx
    SCHEDULE: SCHEDULE_DATABASE, // 13xxx
    MATERIALS: MATERIALS_DATABASE, // 14xxx
    NOTICES: NOTICES_DATABASE, // 15xxx
  },

  /**
   * Layer 2: Validation errors (2xxxx)
   */
  VALIDATION: {
    COMMON: COMMON_VALIDATION, // 20xxx
    USERS: USERS_VALIDATION, // 21xxx
    COURSES: COURSES_VALIDATION, // 22xxx
    SCHEDULE: SCHEDULE_VALIDATION, // 23xxx
    MATERIALS: MATERIALS_VALIDATION, // 24xxx
    NOTICES: NOTICES_VALIDATION, // 25xxx
  },

  /**
   * Layer 3: Business logic errors (3xxxx)
   */
  BUSINESS: {
    COMMON: COMMON_BUSINESS, // 30xxx
    USERS: USERS_BUSINESS, // 31xxx
    COURSES: COURSES_BUSINESS, // 32xxx
    SCHEDULE: SCHEDULE_BUSINESS, // 33xxx
  },

  /**
   * Layer 5: Authentication and authorization errors (5xxxx)
   */
  AUTH: {
    COMMON: COMMON_AUTH, // 50xxx
    USERS: USERS_AUTH, // 51xxx
    SCHEDULE: SCHEDULE_AUTH, // 53xxx
    MATERIALS: MATERIALS_AUTH, // 54xxx
    NOTICES: NOTICES_AUTH, // 55xxx
  },
} as const;
