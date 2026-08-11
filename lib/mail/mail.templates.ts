import { APP_DATA } from '@/constants/app-data.const';

import type { MailMessage } from './mail.types';

/**
 * Wrap a body in the one piece of chrome every message shares.
 *
 * Inline styles and a table-free layout on purpose: an email client is not a browser,
 * and a stylesheet it strips leaves the link unreadable. Plain enough to survive one.
 *
 * @param heading - The message's own title.
 * @param body - Paragraphs, already escaped.
 *
 * @returns The full HTML document.
 */
function wrap(heading: string, body: string): string {
  return [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#191c2b;max-width:34rem">',
    `<h1 style="font-size:1.25rem;margin:0 0 1rem">${heading}</h1>`,
    body,
    `<p style="margin:2rem 0 0;font-size:0.8rem;color:#666c85">${APP_DATA.NAME}</p>`,
    '</div>',
  ].join('');
}

/**
 * Escape text destined for an HTML body.
 *
 * Every value interpolated below is applicant-supplied — a name typed into a public
 * registration form — so it is escaped rather than trusted. An email client that renders
 * a script tag is rarer than a browser, but the name also reaches an administrator's
 * inbox, and "it is only an email" is how injection gets a foothold.
 *
 * @param value - Untrusted text.
 *
 * @returns The same text, safe to interpolate.
 */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The first message: prove the address.
 *
 * It carries the link and nothing else. The identifier is deliberately absent — it does
 * not exist yet, and it is issued by the act of following this link.
 *
 * @param to - The address being proven.
 * @param name - The applicant's name, as typed.
 * @param verifyUrl - Absolute URL carrying the token.
 *
 * @returns The rendered message.
 */
export function buildVerifyAddressMail(to: string, name: string, verifyUrl: string): MailMessage {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verifyUrl);

  return {
    to,
    subject: `Confirm your email address — ${APP_DATA.SHORT_NAME}`,
    text: [
      `Hello ${name},`,
      '',
      'Confirm this address to finish registering. Your login ID is issued once you do, and arrives in a second email.',
      '',
      verifyUrl,
      '',
      'If you did not register, ignore this message — nothing was created in your name that can be used.',
    ].join('\n'),
    html: wrap(
      'Confirm your email address',
      [
        `<p>Hello ${safeName},</p>`,
        '<p>Confirm this address to finish registering. Your login ID is issued once you do, and arrives in a second email.</p>',
        `<p><a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:0.6rem 1.1rem;border-radius:6px;text-decoration:none">Confirm my address</a></p>`,
        `<p style="font-size:0.85rem;color:#666c85">Or paste this into your browser:<br>${safeUrl}</p>`,
        '<p style="font-size:0.85rem;color:#666c85">If you did not register, ignore this message — nothing was created in your name that can be used.</p>',
      ].join('')
    ),
  };
}

/**
 * Prove an address somebody has moved to.
 *
 * Sent to the new address and only to it, because it is the new address that has to
 * answer. It says which account is asking, since this arrives in an inbox that has never
 * heard of the application before — an unexplained "confirm your address" is
 * indistinguishable from a phishing attempt, and deserves to be ignored.
 *
 * The closing line is aimed at the other case: somebody who did not ask for this, whose
 * address has been typed into a stranger's profile by mistake. Ignoring the message is
 * genuinely enough — the change cannot happen without this link, and the account keeps
 * running on the address it already had.
 *
 * @param to - The address being proven.
 * @param name - The account holder's name.
 * @param confirmUrl - Absolute URL carrying the token.
 *
 * @returns The rendered message.
 */
export function buildVerifyNewAddressMail(to: string, name: string, confirmUrl: string): MailMessage {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(confirmUrl);

  return {
    to,
    subject: `Confirm your new email address — ${APP_DATA.SHORT_NAME}`,
    text: [
      `Hello ${name},`,
      '',
      `This address was given as the new email for the ${APP_DATA.SHORT_NAME} account belonging to ${name}. Confirm it to make the change:`,
      '',
      confirmUrl,
      '',
      'Until then the account keeps its previous address, and sign-in is unchanged.',
      '',
      'If you were not expecting this, ignore the message. Nothing changes without this link.',
    ].join('\n'),
    html: wrap(
      'Confirm your new email address',
      [
        `<p>Hello ${safeName},</p>`,
        `<p>This address was given as the new email for the ${APP_DATA.SHORT_NAME} account belonging to ${safeName}. Confirm it to make the change:</p>`,
        `<p><a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:0.6rem 1.1rem;border-radius:6px;text-decoration:none">Confirm my new address</a></p>`,
        `<p style="font-size:0.85rem;color:#666c85">Or paste this into your browser:<br>${safeUrl}</p>`,
        '<p style="font-size:0.85rem;color:#666c85">Until then the account keeps its previous address, and sign-in is unchanged.</p>',
        '<p style="font-size:0.85rem;color:#666c85">If you were not expecting this, ignore the message. Nothing changes without this link.</p>',
      ].join('')
    ),
  };
}

/**
 * Set a new password from a link.
 *
 * Sent only to an address that already belongs to an account, so it can speak plainly
 * rather than hedging. It carries the link and one reassurance: the closing line is for
 * somebody who did not ask — nothing changes until this link is followed, so an
 * unexpected message is safe to ignore and the current password still works.
 *
 * @param to - The account's address.
 * @param name - The account holder's name.
 * @param resetUrl - Absolute URL carrying the token.
 *
 * @returns The rendered message.
 */
export function buildPasswordResetMail(to: string, name: string, resetUrl: string): MailMessage {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);

  return {
    to,
    subject: `Reset your password — ${APP_DATA.SHORT_NAME}`,
    text: [
      `Hello ${name},`,
      '',
      'Use this link to set a new password. It works once and expires in a day:',
      '',
      resetUrl,
      '',
      'If you did not ask to reset your password, ignore this message — nothing changes and your current password still works.',
    ].join('\n'),
    html: wrap(
      'Reset your password',
      [
        `<p>Hello ${safeName},</p>`,
        '<p>Use this link to set a new password. It works once and expires in a day.</p>',
        `<p><a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:0.6rem 1.1rem;border-radius:6px;text-decoration:none">Set a new password</a></p>`,
        `<p style="font-size:0.85rem;color:#666c85">Or paste this into your browser:<br>${safeUrl}</p>`,
        '<p style="font-size:0.85rem;color:#666c85">If you did not ask to reset your password, ignore this message — nothing changes and your current password still works.</p>',
      ].join('')
    ),
  };
}

/**
 * The second message: here is what you sign in with.
 *
 * It has three jobs and must do all of them. Name the identifier, say plainly that it —
 * not the email address — is the login, and warn that the department still has to
 * approve the account. Without that last line the identifier arrives, the first sign-in
 * is refused, and it reads as the identifier being wrong.
 *
 * @param to - The proven address.
 * @param name - The account holder's name.
 * @param loginId - The issued identifier.
 * @param signInUrl - Absolute URL of the sign-in page.
 *
 * @returns The rendered message.
 */
export function buildLoginIdMail(to: string, name: string, loginId: string, signInUrl: string): MailMessage {
  const safeName = escapeHtml(name);
  const safeLoginId = escapeHtml(loginId);
  const safeUrl = escapeHtml(signInUrl);

  return {
    to,
    subject: `Your login ID is ${loginId} — ${APP_DATA.SHORT_NAME}`,
    text: [
      `Hello ${name},`,
      '',
      'Your address is confirmed. This is your login ID:',
      '',
      `    ${loginId}`,
      '',
      'Sign in with this ID and your password — not with your email address. Keep it somewhere you can find it.',
      '',
      'One more step: an administrator has to approve your account before you can sign in. You will not be able to get in until they do.',
      '',
      signInUrl,
    ].join('\n'),
    html: wrap(
      'Your login ID',
      [
        `<p>Hello ${safeName},</p>`,
        '<p>Your address is confirmed. This is your login ID:</p>',
        `<p style="font-family:ui-monospace,Menlo,monospace;font-size:1.5rem;font-weight:700;letter-spacing:0.05em;background:#f4f5fa;border:1px solid #e3e4ef;border-radius:6px;padding:0.75rem 1rem;text-align:center">${safeLoginId}</p>`,
        '<p>Sign in with this ID and your password — <strong>not</strong> with your email address. Keep it somewhere you can find it.</p>',
        '<p><strong>One more step:</strong> an administrator has to approve your account before you can sign in. You will not be able to get in until they do.</p>',
        `<p><a href="${safeUrl}" style="color:#4f46e5">Go to sign in</a></p>`,
      ].join('')
    ),
  };
}
