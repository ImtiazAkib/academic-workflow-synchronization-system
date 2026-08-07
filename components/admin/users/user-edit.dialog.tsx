'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { UserDto } from '@/types';

import { USER_ROLES } from '@/constants/roles.const';

import { isSuccess } from '@/lib/result';
import { UserUpdateInput, UserUpdateOutput, UserUpdateSchema } from '@/lib/schemas';
import { resolveUserErrorMessage } from '@/lib/utils';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { updateUserAction } from './actions';
import { UserSemesterField } from './user-semester.field';

import type { UsersLabels, UsersViewer } from './users.types';

type UserEditDialogProps = {
  user: UserDto;
  labels: UsersLabels;
  viewer: UsersViewer;
  onUpdated: () => void;
  onOpenChange: (open: boolean) => void;
};

/*
  Mounted only while a row is selected, and keyed on that row's id. That is what fills
  the form: `defaultValues` is read once per mount, so a fresh mount per row replaces
  the effect that would otherwise have to copy the user into the form — and it clears a
  stale error from the previous attempt for free.
*/
export function UserEditDialog({ user, labels, viewer, onUpdated, onOpenChange }: UserEditDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserUpdateInput, undefined, UserUpdateOutput>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: {
      userId: user.userId,
      name: user.name,
      role: user.role,
      designation: user.designation ?? '',
      studentId: user.studentId ?? '',
      // Back to the string the select speaks; the schema turns it into a number again.
      semester: user.semester ? String(user.semester) : '',
      phone: user.phone ?? '',
    },
  });

  /*
    Same rule as the create form: only the super administrator is offered the
    administrator option, and nobody is offered super administrator.

    The row's current role is always included even when the viewer could not set it, so
    the select can render what the account actually is rather than falling back to a
    blank — a display concern, not a permission one. The service still refuses a move
    the viewer may not make.
  */
  const roleItems: Record<string, string> = {
    ...(viewer.isSuperAdmin || user.role === USER_ROLES.ADMIN ? { [USER_ROLES.ADMIN]: labels.roleAdmin } : {}),
    [USER_ROLES.TEACHER]: labels.roleTeacher,
    [USER_ROLES.STUDENT]: labels.roleStudent,
  };

  const handleFormSubmit = async (values: UserUpdateOutput): Promise<void> => {
    setFormError(null);

    const result = await updateUserAction(values);

    if (isSuccess(result)) {
      onUpdated();

      return;
    }

    setFormError(resolveUserErrorMessage(result.errors[0]?.code ?? 0, labels.errors));
  };

  const handleCancelClick = (): void => {
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      {/*
        The height cap and column layout are applied here rather than in
        `components/ui/dialog.tsx`: that file is shadcn's output and stays as generated.
        `flex-col` + a capped height is what lets the body scroll under a fixed footer.
      */}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.editTitle}</DialogTitle>
          <DialogDescription>{labels.editDescription}</DialogDescription>
        </DialogHeader>

        {/* The form owns the remaining height so its body can scroll under a fixed footer. */}
        <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col gap-4">
          {formError && (
            <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {formError}
            </p>
          )}

          <input type="hidden" {...register('userId')} />

          {/* `min-h-0` is load-bearing: a flex child will not shrink below its content without it. */}
          <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">{labels.fields.name}</Label>
              <Input id="edit-name" aria-invalid={Boolean(errors.name)} {...register('name')} />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.type === 'too_big' ? labels.fieldErrors.nameTooLong : labels.fieldErrors.nameRequired}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-email">{labels.fields.email}</Label>
              {/* Read-only on purpose: changing it moves the account's identity. */}
              <Input id="edit-email" value={user.email} readOnly disabled />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-role">{labels.fields.role}</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select items={roleItems} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-role" className="w-full">
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
              <Label htmlFor="edit-designation">
                {labels.fields.designation} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
              </Label>
              <Input id="edit-designation" aria-invalid={Boolean(errors.designation)} {...register('designation')} />
              {errors.designation && <p className="text-destructive text-sm">{labels.fieldErrors.designationTooLong}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-student-id">
                {labels.fields.studentId} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
              </Label>
              <Input id="edit-student-id" aria-invalid={Boolean(errors.studentId)} {...register('studentId')} />
              {errors.studentId && <p className="text-destructive text-sm">{labels.fieldErrors.studentIdTooLong}</p>}
            </div>

            <UserSemesterField control={control as never} errors={errors} labels={labels.fields} fieldErrors={labels.fieldErrors} idPrefix="edit" />

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-phone">
                {labels.fields.phone} <span className="text-muted-foreground text-xs">({labels.fields.optional})</span>
              </Label>
              <Input id="edit-phone" type="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
              {errors.phone && <p className="text-destructive text-sm">{labels.fieldErrors.phoneTooLong}</p>}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t-0 bg-transparent p-0 sm:mx-0 sm:mb-0">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleCancelClick}>
              {labels.cancel}
            </Button>

            <Button type="submit" variant="appPrimary" disabled={isSubmitting}>
              {isSubmitting ? labels.working : labels.editSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
