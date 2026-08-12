'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailWarning } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';
import { UserDto } from '@/types';

import { isSuccess } from '@/lib/result';
import { ProfileUpdateInput, ProfileUpdateOutput, ProfileUpdateSchema } from '@/lib/schemas';
import { resolveUserErrorMessage, toBangladeshPhoneInput } from '@/lib/utils';

import { Button, Input, Label, PhoneInput } from '@/components/ui';

import { updateProfileAction } from './actions';

import type { ProfileEditLabels } from './profile.types';

type ProfileEditFormProps = {
  user: UserDto;
  labels: ProfileEditLabels;
};

/*
  The four fields that are actually somebody's own to correct: their name, the address to
  reach them at, a phone number and a postal address. Everything else on this screen is
  read-only, and everything else is read-only because it is issued rather than chosen -
  see `ProfileSummary`.

  Changing the address does not change it. The new one is stored as pending and a link
  goes to it; the account keeps signing in and receiving password recovery at the old one
  until that link is clicked. That is not caution for its own sake - the address is the
  recovery channel, so an address change that took effect unproven would turn a borrowed
  session into a permanent theft: change it, ask for a reset, own the account.
*/
export function ProfileEditForm({ user, labels }: ProfileEditFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  /*
    Seeded from the record rather than left blank, because this form edits something that
    already exists - an empty name box on a profile invites somebody to retype what is
    already right, and clearing a field they never meant to touch.
  */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput, undefined, ProfileUpdateOutput>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      // The +880 field shows the local digits; the schema puts the dial code back on save.
      phone: toBangladeshPhoneInput(user.phone),
      address: user.address ?? '',
    },
  });

  const handleFormSubmit = async (values: ProfileUpdateOutput): Promise<void> => {
    setFormError(null);

    const result = await updateProfileAction(values);

    if (!isSuccess(result) || !result.result) {
      setFormError(resolveUserErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

      return;
    }

    const saved = result.result;

    /*
      Two different confirmations, because two different things happened. A name and a
      phone number are saved by the time this runs; an address is not, and saying "saved"
      about one that is still waiting on an inbox is how somebody ends up believing the
      change took and never clicking the link.
    */
    toast.success(saved.pendingEmail ? labels.toastEmailSent : labels.toastSaved);

    /*
      Reset to what came back rather than to what was submitted. The address is the field
      where those differ - it is still the old one until the link is clicked - so the box
      goes back to showing the address that is actually in force, with the pending one
      named in the notice below it.
    */
    reset({ name: saved.name, email: saved.email, phone: toBangladeshPhoneInput(saved.phone), address: saved.address ?? '' });

    // The summary beside this form, and the greeting in the topbar, are both server-rendered.
    router.refresh();
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-name">{labels.fields.name}</Label>
          <Input id="profile-name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          {errors.name && (
            <p className="text-destructive text-sm">
              {errors.name.type === 'too_big' ? labels.fieldErrors.nameTooLong : labels.fieldErrors.nameRequired}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-email">{labels.fields.email}</Label>
          <Input id="profile-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-destructive text-sm">{labels.fieldErrors.emailInvalid}</p>}
          <p className="text-muted-foreground text-xs">{labels.emailHint}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-phone">
            {labels.fields.phone} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
          </Label>
          <PhoneInput id="profile-phone" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
          {errors.phone && <p className="text-destructive text-sm">{labels.fieldErrors.phoneInvalid}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-address">
            {labels.fields.address} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
          </Label>
          <Input id="profile-address" autoComplete="street-address" aria-invalid={Boolean(errors.address)} {...register('address')} />
          {errors.address && <p className="text-destructive text-sm">{labels.fieldErrors.addressTooLong}</p>}
        </div>
      </div>

      {/*
        Rendered from the saved record, so it survives a refresh and is still here tomorrow
        - a change waiting on an inbox can wait a day, and a notice that only existed in
        the tab that made it would be gone long before the person came back to it.

        It names the address, because the commonest reason a link never gets clicked is
        that it went somewhere with a typo in it - and seeing the typo is the whole remedy.
      */}
      {user.pendingEmail && (
        <div className="border-border bg-muted/30 flex gap-3 rounded-lg border border-dashed p-4">
          <MailWarning className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-regular-semibold text-sm">{labels.pendingTitle}</p>
            <p className="text-muted-foreground text-sm">{labels.pendingDescription}</p>
            <p className="font-mono text-sm break-all">{user.pendingEmail}</p>
            <p className="text-muted-foreground text-xs">{labels.pendingCancelHint}</p>
          </div>
        </div>
      )}

      <div className="border-border flex border-t pt-5 sm:justify-end">
        <Button type="submit" variant="default" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? labels.working : labels.submit}
        </Button>
      </div>
    </form>
  );
}
