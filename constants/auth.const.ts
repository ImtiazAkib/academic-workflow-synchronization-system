const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const SESSION = {
  COOKIE: {
    NAME: 'academic.session',
    MAX_AGE: ONE_WEEK_IN_SECONDS,
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
