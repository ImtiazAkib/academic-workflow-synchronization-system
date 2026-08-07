import { env } from '@/env/server';

import { logMail } from './log.mail';
import { smtpMail } from './smtp.mail';

import type { MailDriver } from './mail.types';

export type { MailDriver, MailMessage } from './mail.types';
export * from './mail.templates';

/**
 * Whether a real transport is configured.
 *
 * Exported because it is worth showing rather than hiding: the verification screen tells
 * a developer that the link went to the log instead of an inbox, which is the difference
 * between "the email is slow" and "there is no mail server".
 */
export const isMailConfigured = Boolean(env.SMTP_HOST);

/**
 * The driver the app uses.
 *
 * One binding, so swapping transports is this line plus a new file — nothing above the
 * mail layer names SMTP. Chosen by absence: with no `SMTP_HOST` the messages go to the
 * log, which is what lets the whole registration flow be walked on a laptop with no
 * credentials.
 */
export const mail: MailDriver = isMailConfigured ? smtpMail : logMail;
