/**
 * What kind of notice this is, and therefore how its audience is decided.
 *
 * `general` keeps the old behavior — addressed by role through `NoticeAudience`.
 * `session` is narrower: it names one or more intake sessions, and only the students of
 * those sessions are meant to see it. The two are kept apart rather than folded into the
 * audience enum because they answer different questions — "which role" versus "which
 * batch" — and a screen filters on one or the other, never both at once.
 */
export type NoticeCategory = 'general' | 'session';
