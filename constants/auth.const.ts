/*
  A session lasts at most one hour. Paired with the live re-validation in `getSessionUser`,
  this bounds two things: a stolen token is useless an hour after it was minted, and a
  deactivation, de-approval or role change that the DB re-check misses cannot outlive the
  hour either. It is an absolute cap, not a sliding idle timeout, so no active session
  survives past the hour without signing in again.
*/
const ONE_HOUR_IN_SECONDS = 60 * 60;

export const SESSION = {
  COOKIE: {
    NAME: 'academic.session',
    MAX_AGE: ONE_HOUR_IN_SECONDS,
  },
  /*
    Pinned into the token and checked on the way back. They cost nothing and mean a
    token minted for some other service can never be replayed here.
  */
  ISSUER: 'academic-workflow',
  AUDIENCE: 'academic-workflow',
  /**
   * Hidden form field carrying the current locale into the sign-out action, which
   * cannot read the root param itself.
   */
  LOCALE_FIELD: 'locale',
  /**
   * The only algorithm accepted on verification. Naming it explicitly is what blocks
   * an algorithm-confusion attack, where a token arrives claiming `alg: none`.
   */
  ALGORITHM: 'HS256',
} as const;
