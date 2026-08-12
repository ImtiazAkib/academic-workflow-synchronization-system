'use client';

import { BANGLADESH_DIAL_CODE } from '@/constants/account.const';

import { cn } from '@/lib/utils';

import { Input } from './input';

type PhoneInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>;

/*
  A phone field fixed to Bangladesh: a static +880 sits in the leading slot and the input
  takes the ten local digits after it. The schema normalizes whatever is typed onto the
  stored `+8801XXXXXXXXX`, so the prefix is a label rather than part of the value - the
  field submits only what the user types, and an edit form seeds it with the local digits
  via `toBangladeshPhoneInput`.

  `{...props}` spreads onto the inner input exactly as it does for a bare Input - the
  react-hook-form ref, the id, aria-invalid - so a form wires this the same way it wires
  any other field.
*/
export function PhoneInput({ className, ...props }: PhoneInputProps) {
  return (
    <div className="flex">
      <span
        aria-hidden
        className="border-input bg-muted text-muted-foreground inline-flex items-center rounded-s-md border border-e-0 px-3 text-sm select-none">
        {BANGLADESH_DIAL_CODE}
      </span>
      <Input type="tel" inputMode="numeric" autoComplete="tel-national" className={cn('rounded-s-none', className)} {...props} />
    </div>
  );
}
