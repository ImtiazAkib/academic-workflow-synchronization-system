'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { isSuccess } from '@/lib/result';
import { ChangePasswordInput, ChangePasswordOutput, ChangePasswordSchema } from '@/lib/schemas';
import { resolvePasswordChangeErrorMessage } from '@/lib/utils';

import { Button, Label, PasswordInput } from '@/components/ui';

import { changePasswordAction } from './actions';

import type { ProfilePasswordLabels } from './profile.types';

type ChangePasswordFormProps = {
  labels: ProfilePasswordLabels;
};

/*
  A second form on the profile screen, apart from the one that edits a name and an address.
  A password change proves the current password and confirms the new one, so it has its own
  three boxes and its own action - none of which belongs beside a phone number.

  Nothing on the page depends on the password, so there is no `router.refresh()` on success:
  the boxes are cleared and the toast is the whole confirmation. Available to every role,
  because it is reached from the one profile screen all three share.
*/
export function ChangePasswordForm({ labels }: ChangePasswordFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput, undefined, ChangePasswordOutput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleFormSubmit = async (values: ChangePasswordOutput): Promise<void> => {
    setFormError(null);

    const result = await changePasswordAction(values);

    if (!isSuccess(result)) {
      setFormError(resolvePasswordChangeErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

      return;
    }

    toast.success(labels.toastSaved);
    reset();
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="password-current">{labels.fields.current}</Label>
          <PasswordInput
            id="password-current"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
            {...register('currentPassword')}
          />
          {errors.currentPassword && <p className="text-destructive text-sm">{labels.fieldErrors.currentRequired}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password-new">{labels.fields.new}</Label>
          <PasswordInput
            id="password-new"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-destructive text-sm">
              {errors.newPassword.type === 'too_big' ? labels.fieldErrors.newTooLong : labels.fieldErrors.newTooShort}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password-confirm">{labels.fields.confirm}</Label>
          <PasswordInput
            id="password-confirm"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-destructive text-sm">{labels.fieldErrors.mismatch}</p>}
        </div>
      </div>

      <div className="border-border flex border-t pt-5 sm:justify-end">
        <Button type="submit" variant="default" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? labels.working : labels.submit}
        </Button>
      </div>
    </form>
  );
}
