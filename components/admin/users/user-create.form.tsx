'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { UserCreateInput, UserCreateOutput, UserCreateSchema } from '@/lib/schemas';
import { resolveUserErrorMessage } from '@/lib/utils';

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import { createUserAction } from './actions';
import { UserDepartmentFields } from './user-department.fields';
import { UserSemesterField } from './user-semester.field';

import type { UserCreateFormLabels, UsersViewer } from './users.types';

type UserCreateFormProps = {
  labels: UserCreateFormLabels;
  viewer: UsersViewer;
};

/*
  A page rather than a dialog. Seven fields plus their validation messages never sat
  comfortably in a popup — on a phone it filled the screen and still scrolled — and a
  page gives the work its own URL, which is what makes it linkable and survivable on a
  refresh.

*/
export function UserCreateForm({ labels, viewer }: UserCreateFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateInput, undefined, UserCreateOutput>({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: USER_ROLES.TEACHER,
      designation: '',
      roll: '',
      registrationNo: '',
      session: '',
      department: '',
      semester: '',
      phone: '',
    },
  });

  /*
    An administrator account is the super administrator's to create, so only they are
    offered the option. Super administrator is offered to nobody — that account is
    seeded, and `UserService` refuses the role whoever asks.
  */
  const roleItems: Record<string, string> = {
    ...(viewer.isSuperAdmin ? { [USER_ROLES.ADMIN]: labels.roleAdmin } : {}),
    [USER_ROLES.TEACHER]: labels.roleTeacher,
    [USER_ROLES.STUDENT]: labels.roleStudent,
  };

  const handleFormSubmit = async (values: UserCreateOutput): Promise<void> => {
    setFormError(null);

    const result = await createUserAction(values);

    if (isSuccess(result)) {
      toast.success(labels.created);
      router.push(ROUTES.ADMIN_USERS.HREF);
      router.refresh();

      return;
    }

    setFormError(resolveUserErrorMessage(result.errors[0]?.code ?? 0, labels.errors));
  };

  const handleCancelClick = (): void => {
    router.push(ROUTES.ADMIN_USERS.HREF);
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
          <Label htmlFor="create-name">{labels.fields.name}</Label>
          <Input id="create-name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          {errors.name && (
            <p className="text-destructive text-sm">
              {errors.name.type === 'too_big' ? labels.fieldErrors.nameTooLong : labels.fieldErrors.nameRequired}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-email">{labels.fields.email}</Label>
          <Input id="create-email" type="email" autoComplete="off" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-destructive text-sm">{labels.fieldErrors.emailInvalid}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-password">{labels.fields.password}</Label>
          <Input id="create-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
          {errors.password && <p className="text-destructive text-sm">{labels.fieldErrors.passwordTooShort}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-role">{labels.fields.role}</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select items={roleItems} value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="create-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.role && <p className="text-destructive text-sm">{labels.fieldErrors.roleInvalid}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-designation">
            {labels.fields.designation} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
          </Label>
          <Input id="create-designation" aria-invalid={Boolean(errors.designation)} {...register('designation')} />
          {errors.designation && <p className="text-destructive text-sm">{labels.fieldErrors.designationTooLong}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-student-id">
            {labels.fields.roll} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
          </Label>
          <Input id="create-student-id" aria-invalid={Boolean(errors.roll)} {...register('roll')} />
          {errors.roll && <p className="text-destructive text-sm">{labels.fieldErrors.rollTooLong}</p>}
        </div>

        <UserSemesterField control={control as never} errors={errors} labels={labels.fields} fieldErrors={labels.fieldErrors} idPrefix="create" />

        <UserDepartmentFields
          register={register as never}
          control={control as never}
          errors={errors}
          labels={labels.fields}
          fieldErrors={labels.fieldErrors}
          idPrefix="create"
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-phone">
            {labels.fields.phone} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
          </Label>
          <Input id="create-phone" type="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
          {errors.phone && <p className="text-destructive text-sm">{labels.fieldErrors.phoneTooLong}</p>}
        </div>
      </div>

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleCancelClick}>
          {labels.cancel}
        </Button>

        <Button type="submit" variant="appPrimary" disabled={isSubmitting}>
          {isSubmitting ? labels.working : labels.submit}
        </Button>
      </div>
    </form>
  );
}
