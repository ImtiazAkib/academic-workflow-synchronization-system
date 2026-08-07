import { createLoggerWithContext } from '@/lib/logger';

import type { MailDriver, MailMessage } from './mail.types';

const log = createLoggerWithContext('mail.log');

/**
 * The driver used when no mail server is configured.
 *
 * It writes the whole message to the log — including the verification link and the
 * issued identifier — so the entire registration flow can be walked end to end on a
 * laptop with no SMTP credentials, no sending domain and no third-party account.
 *
 * This is a development convenience and it is chosen by absence: `lib/mail/index.ts`
 * falls back to it only when the SMTP variables are unset. That is deliberate rather
 * than clever — a production deploy that forgets its credentials gets a loud log line
 * containing a link nobody received, which is a visible failure rather than a silent
 * one.
 */
export const logMail: MailDriver = {
  async send(message: MailMessage): Promise<boolean> {
    log.warn(
      { to: message.to, subject: message.subject, body: message.text },
      'No mail transport configured — the message was written to the log instead of sent'
    );

    return true;
  },
};
