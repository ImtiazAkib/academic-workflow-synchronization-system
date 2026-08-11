import { BANGLADESH_DIAL_CODE } from '@/constants/account.const';

/**
 * Fold any Bangladesh mobile number a form might submit onto the one shape it is stored
 * in — `+8801XXXXXXXXX`.
 *
 * The phone field shows a fixed `+880` and takes the ten local digits, but numbers arrive
 * in every form: with the leading zero (`01712345678`), without it (`1712345678`), already
 * international (`+8801712345678`), or carrying spaces and dashes. This keeps the digits,
 * drops a leading `880` or `0`, and re-attaches the dial code, so one pattern can validate
 * the result whoever produced it.
 *
 * Idempotent by construction: its own output is already `+880`-prefixed with the ten local
 * digits after it, so a second pass returns it unchanged. That is what lets the schema run
 * in the browser and again in the Server Action without the second parse rejecting the
 * first's output — the property `semester` relies on too.
 *
 * It only normalizes the shape; whether the result is a real number is the schema's
 * refine. A value with no digits is handed back untouched for that refine to refuse.
 *
 * @param value - Whatever was typed.
 *
 * @returns The normalized number, or an empty string when nothing was given.
 */
export function normalizeBangladeshPhone(value: string): string {
  const trimmed = value.trim();

  if (trimmed === '') {
    return '';
  }

  const digits = trimmed.replace(/\D/g, '');

  if (digits === '') {
    return trimmed;
  }

  const local = digits.startsWith('880') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;

  return `${BANGLADESH_DIAL_CODE}${local}`;
}

/**
 * The ten local digits a stored number is edited as, so the `+880` field shows `1712345678`
 * rather than the whole `+8801712345678` beside a prefix that already says `+880`.
 *
 * The inverse of what the field submits: strip the dial code or the leading zero and hand
 * back what sits after it. An empty or absent value is an empty box.
 *
 * @param stored - The number as the record holds it, or nothing.
 *
 * @returns The local digits to seed the input with.
 */
export function toBangladeshPhoneInput(stored: string | null | undefined): string {
  if (!stored) {
    return '';
  }

  const digits = stored.replace(/\D/g, '');

  if (digits.startsWith('880')) {
    return digits.slice(3);
  }

  if (digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
}
