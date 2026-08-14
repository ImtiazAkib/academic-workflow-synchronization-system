'use client';

import { useEffect, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';

import { NOTICE_AUDIENCES, NOTICE_CATEGORIES, NOTICE_IMAGE_ACCEPT } from '@/constants/notice.const';
import { ROUTES } from '@/constants/routes.const';

import { NoticeCreateInput, NoticeCreateOutput, NoticeCreateSchema } from '@/lib/schemas';
import { resolveNoticeErrorMessage } from '@/lib/utils';

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui';

import type { NoticeCreateFormLabels } from './notices.types';

type NoticeCreateFormProps = {
  labels: NoticeCreateFormLabels;
  /** The intake sessions a session notice may target - the department's current batches. */
  sessions: string[];
  /**
   * Whether the audience picker is offered. An administrator chooses it; a teacher does
   * not - their general notices always go to students, so the field is simply absent.
   */
  canChooseAudience: boolean;
  /** Where publishing or cancelling returns to - the admin or the teacher notices list. */
  listHref: typeof ROUTES.ADMIN_NOTICES.HREF | typeof ROUTES.TEACHER_NOTICES.HREF;
  /** The bucket is over the block line - an image cannot be attached, but text still publishes. */
  storageBlocked: boolean;
  /** Past the warn line but not the block line - attaching still works, but say so. */
  storageNearFull: boolean;
};

/**
 * Release an object URL, if there is one to release.
 *
 * @param url - The URL to revoke, or null.
 */
function revoke(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

/*
  A page rather than a dialog, matching the account, course and class screens - the work
  gets its own URL, so it survives a refresh and can be linked.

  The plan named this a dialog, and the body is why it is not one. Five thousand characters
  is several paragraphs of announcement, and a modal gives them a box inside a box: on a
  phone it fills the screen and still scrolls, and closing it by mistake loses everything
  typed. Every other create in the admin area had already moved to its own route for the
  same reason.

  It posts `FormData` to `/api/notices` rather than calling a Server Action, because a
  notice may carry a picture and an action serializes its arguments. The text fields still
  go through react-hook-form and `NoticeCreateSchema`, so the browser and the server ask
  exactly the same questions - including "is there a body or an image", which neither
  field can answer alone. That is why the file lives in the form's values rather than in a
  ref beside them: the rule is about the pair.

  `all` is the default audience deliberately. It is the answer that reaches everybody the
  notice might concern, so a slip of attention over-delivers rather than silently missing
  the people it was written for.
*/
export function NoticeCreateForm({ labels, sessions, canChooseAudience, listHref, storageBlocked, storageNearFull }: NoticeCreateFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  /*
    The live object URL, mirrored in a ref so it can be revoked without reading state.
    An object URL is a document-lifetime handle rather than a string: without this a
    publisher who tried four pictures would leave four decoded images in memory until the
    tab closed.
  */
  const previewUrlRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoticeCreateInput, undefined, NoticeCreateOutput>({
    resolver: zodResolver(NoticeCreateSchema),
    /*
      `all` is the default audience for an administrator deliberately - it reaches everybody
      the notice might concern, so a slip of attention over-delivers rather than silently
      missing the people it was for. A teacher has no audience choice, so their default is
      the only value it can take: students.
    */
    defaultValues: {
      title: '',
      body: '',
      audience: canChooseAudience ? NOTICE_AUDIENCES.ALL : NOTICE_AUDIENCES.STUDENTS,
      category: NOTICE_CATEGORIES.GENERAL,
      sessions: [],
    },
  });

  // The audience picker and the session picker are alternatives, chosen by the category.
  const category = useWatch({ control, name: 'category' });
  const isSession = category === NOTICE_CATEGORIES.SESSION;

  // A notice attachment may be a picture or a PDF; only a picture gets an inline preview,
  // so a chosen PDF shows its name rather than a broken image.
  const selectedImage = useWatch({ control, name: 'image' });
  const previewIsImage = selectedImage instanceof File && selectedImage.type.startsWith('image/');

  // Only the last one can still be live; the rest were revoked as they were replaced.
  useEffect(() => () => revoke(previewUrlRef.current), []);

  /*
    Made in the change handler rather than in an effect keyed on the file. Creating the URL
    is a consequence of somebody picking a file, not of the component rendering, and an
    effect that set state on every file change is the same work with a wasted render in
    the middle.

    @param file - The newly chosen file, or null when the picker was cleared.
  */
  const showPreview = (file: File | null): void => {
    revoke(previewUrlRef.current);

    const url = file ? URL.createObjectURL(file) : null;

    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const audienceItems: Record<string, string> = {
    [NOTICE_AUDIENCES.ALL]: labels.audiences.all,
    [NOTICE_AUDIENCES.TEACHERS]: labels.audiences.teachers,
    [NOTICE_AUDIENCES.STUDENTS]: labels.audiences.students,
  };

  const categoryItems: Record<string, string> = {
    [NOTICE_CATEGORIES.GENERAL]: labels.categories.general,
    [NOTICE_CATEGORIES.SESSION]: labels.categories.session,
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const [file] = event.target.files ?? [];
    selectImage(file ?? null);
  };

  const selectImage = (file: File | null): void => {
    showPreview(file);
    setValue('image', file ?? undefined, { shouldValidate: true });
  };

  const handleImageClear = (): void => {
    showPreview(null);
    setValue('image', undefined, { shouldValidate: true });

    /*
      React does not own a file input's value, so clearing the form field leaves the
      picker still showing the file name. The DOM node has to be cleared directly.
    */
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (values: NoticeCreateOutput): Promise<void> => {
    setFormError(null);

    const payload = new FormData();

    payload.set('title', values.title);
    payload.set('body', values.body ?? '');
    payload.set('audience', values.audience);
    payload.set('category', values.category);
    // One entry per session; the route reads them back with `getAll`.
    values.sessions.forEach(session => payload.append('sessions', session));

    if (values.image) {
      payload.set('image', values.image);
    }

    const response = await fetch('/api/notices', { method: 'POST', body: payload });

    if (response.ok) {
      toast.success(labels.published);
      router.push(listHref);
      router.refresh();

      return;
    }

    const refusal = await response.json().catch(() => null);

    setFormError(resolveNoticeErrorMessage(refusal?.errors?.[0]?.code ?? 0, labels.errors));
  };

  const handleCancelClick = (): void => {
    router.push(listHref);
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="notice-title">{labels.fields.title}</Label>
        <Input id="notice-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
        {errors.title && (
          <p className="text-destructive text-sm">
            {errors.title.type === 'too_big' ? labels.fieldErrors.titleTooLong : labels.fieldErrors.titleRequired}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notice-category">{labels.fields.category}</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select items={categoryItems} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="notice-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-muted-foreground text-xs">{labels.categoryHint}</p>
      </div>

      {/* A general notice is addressed by role, and only an administrator chooses which. */}
      {!isSession && canChooseAudience && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="notice-audience">{labels.fields.audience}</Label>
          <Controller
            control={control}
            name="audience"
            render={({ field }) => (
              <Select items={audienceItems} value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="notice-audience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(audienceItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.audience && <p className="text-destructive text-sm">{labels.fieldErrors.audienceInvalid}</p>}
          <p className="text-muted-foreground text-xs">{labels.audienceHint}</p>
        </div>
      )}

      {/* A session notice is addressed by intake - the batches it should reach, and no others. */}
      {isSession && (
        <div className="flex flex-col gap-2">
          <span className="text-foreground text-sm font-medium">{labels.fields.sessions}</span>

          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">{labels.noSessions}</p>
          ) : (
            <Controller
              control={control}
              name="sessions"
              render={({ field }) => (
                <div role="group" aria-label={labels.fields.sessions} className="flex flex-wrap gap-x-4 gap-y-2">
                  {sessions.map(session => (
                    <label key={session} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(field.value ?? []).includes(session)}
                        onChange={event =>
                          field.onChange(event.target.checked ? [...(field.value ?? []), session] : (field.value ?? []).filter(x => x !== session))
                        }
                        className="accent-primary size-4"
                      />
                      {session}
                    </label>
                  ))}
                </div>
              )}
            />
          )}

          {errors.sessions && <p className="text-destructive text-sm">{labels.fieldErrors.sessionsRequired}</p>}
          <p className="text-muted-foreground text-xs">{labels.sessionsHint}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="notice-body">{labels.fields.body}</Label>
        <Textarea id="notice-body" rows={8} aria-invalid={Boolean(errors.body)} {...register('body')} />
        {/*
          Three different things can be wrong here, and they are told apart because the
          remedies differ: shorten it, or write something, or attach something instead.
        */}
        {errors.body && (
          <p className="text-destructive text-sm">
            {errors.body.type === 'too_big' ? labels.fieldErrors.bodyTooLong : labels.fieldErrors.bodyOrImageRequired}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notice-image">{labels.fields.image}</Label>
        {/* Once an attachment is chosen, its preview below replaces the dropzone so the picker is not offered twice; Remove brings it back. */}
        {!previewUrl && (
          <div
            role="button"
            tabIndex={storageBlocked ? -1 : 0}
            onClick={() => imageInputRef.current?.click()}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                imageInputRef.current?.click();
              }
            }}
            onDragEnter={event => {
              event.preventDefault();
              if (!storageBlocked) setIsDragging(true);
            }}
            onDragOver={event => event.preventDefault()}
            onDragLeave={event => {
              // The dropzone wraps text nodes, so a bare currentTarget===target check flips
              // off every time the cursor crosses a child. Only clear when the cursor has
              // actually left the dropzone - relatedTarget is where it went, null off-window.
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
            }}
            onDrop={event => {
              event.preventDefault();
              setIsDragging(false);
              // The click and keyboard paths are closed when the bucket is full; the drop
              // path has to be closed with them, or a full bucket still takes an attachment.
              if (storageBlocked) return;
              selectImage(event.dataTransfer.files.item(0));
            }}
            className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 text-center text-sm transition-colors ${isDragging ? 'border-primary bg-primary-muted text-primary' : 'border-border hover:border-primary/40 hover:bg-primary-muted/40'}`}>
            <span className="font-medium">{labels.dropTitle}</span>
            <span className="text-muted-foreground text-xs">{labels.dropHint}</span>
          </div>
        )}
        {/*
          A plain input, not the styled `Input`: the component carries `w-full`, which beats
          `sr-only`'s 1px and left this hidden, absolutely-positioned picker at full width -
          overrunning the page to the right on wide screens.
        */}
        <input
          id="notice-image"
          type="file"
          accept={NOTICE_IMAGE_ACCEPT}
          ref={imageInputRef}
          aria-invalid={Boolean(errors.image)}
          disabled={storageBlocked}
          className="sr-only"
          onChange={handleImageChange}
        />
        {errors.image && (
          <p className="text-destructive text-sm">
            {errors.image.type === 'too_big' ? labels.fieldErrors.imageTooLarge : labels.fieldErrors.imageType}
          </p>
        )}
        <p className="text-muted-foreground text-xs">{labels.imageHint}</p>

        {/*
          Only the picture is refused when the bucket is full - a text notice still goes out,
          so the message sits under the image field rather than at the top of the form.
        */}
        {storageBlocked ? (
          <p role="status" className="text-destructive text-xs">
            {labels.storageFull}
          </p>
        ) : (
          storageNearFull && (
            <p role="status" className="text-warning text-xs">
              {labels.storageWarning}
            </p>
          )
        )}

        {/*
          Shown before publishing, because a picture is the one field whose mistake is
          invisible in the form - a wrong file has a plausible name, and the only way to
          know it is the wrong page of the circular is to look at it.
        */}
        {previewUrl && (
          <div className="border-border flex flex-col items-start gap-2 rounded-lg border p-3">
            {previewIsImage ? (
              // `max-w-full` caps the width so a wide photograph fits the form; `w-auto` alone caps only the height and let a landscape scan scroll the page sideways.
              // eslint-disable-next-line @next/next/no-img-element -- a local object URL of unknown dimensions; next/image cannot optimize it
              <img src={previewUrl} alt={labels.imagePreviewAlt} className="max-h-64 w-auto max-w-full rounded-md" />
            ) : (
              <span className="text-muted-foreground max-w-full text-sm break-all">{selectedImage instanceof File ? selectedImage.name : ''}</span>
            )}

            <Button type="button" variant="outline" size="sm" onClick={handleImageClear}>
              {labels.attachmentRemove}
            </Button>
          </div>
        )}
      </div>

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleCancelClick}>
          {labels.cancel}
        </Button>

        <Button type="submit" variant="default" disabled={isSubmitting}>
          {isSubmitting ? labels.working : labels.submit}
        </Button>
      </div>
    </form>
  );
}
