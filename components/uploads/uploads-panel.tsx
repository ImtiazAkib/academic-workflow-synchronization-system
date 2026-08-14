import { getFormatter, getTranslations } from 'next-intl/server';

import { FILE_CONVERSION_FEED_LIMIT } from '@/constants/storage.const';

import { ConversionService } from '@/lib/services';
import { resolveConversionDetail } from '@/lib/utils';

import { UploadProgress } from './upload-progress';

import type { UploadRowView } from './upload-progress';
import type { FileConversionDto } from '@/types';

const conversionService = new ConversionService();

type UploadsPanelProps = {
  /** Only this account's uploads. Omit for every account's - the administrator's view. */
  userId?: string;
};

/*
  The uploads-in-progress panel, on the administrator's screen and the teacher's, built
  once here.

  An async server component rather than a client one handed props, for the same reason the
  notices feed is: the read is scoped on the server. A teacher passes their id and sees
  their own conversions; the administrator passes none and sees the department's. The
  localizing and formatting happen here too - status words, failure reasons, sizes and
  times - so the client half only paints the rows and re-polls while any is still running.
*/
export async function UploadsPanel({ userId }: UploadsPanelProps) {
  const l10n = await getTranslations();
  const format = await getFormatter();

  const result = userId
    ? await conversionService.listForUser(userId, FILE_CONVERSION_FEED_LIMIT)
    : await conversionService.list(FILE_CONVERSION_FEED_LIMIT);

  /*
    A failed read must not read as "nothing uploaded yet": `listFailure` carries an empty
    array, so passing it through would paint an empty table over a database that could not
    be reached. Said inline rather than thrown, so the rest of the screen still renders.
  */
  if (!result.success) {
    return (
      <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
        {l10n('UPLOADS_UNAVAILABLE')}
      </p>
    );
  }

  const statusLabels = {
    processing: l10n('UPLOADS_STATUS_PROCESSING'),
    done: l10n('UPLOADS_STATUS_DONE'),
    failed: l10n('UPLOADS_STATUS_FAILED'),
  };

  const failureLabels = {
    target_gone: l10n('UPLOADS_FAILURE_TARGET_GONE'),
    conversion_failed: l10n('UPLOADS_FAILURE_CONVERSION_FAILED'),
  };

  const toRow = (conversion: FileConversionDto): UploadRowView => ({
    conversionId: conversion.conversionId,
    fileName: conversion.fileName,
    status: conversion.status,
    statusLabel: statusLabels[conversion.status],
    // Every status carries a detail: the before/after size when done, the arriving size while
    // processing, the reason when failed. Guarding on `failed` left done/processing rows blank.
    detail: resolveConversionDetail(conversion, failureLabels),
    /*
      Formatted here and passed down as a string. `getFormatter()` knows the request's
      locale and the department's timezone; the browser knows the visitor's, which for a
      time near midnight in Dhaka is a different day.
    */
    when: format.dateTime(new Date(conversion.createdAt), 'short'),
  });

  return (
    <UploadProgress
      rows={result.result.map(toRow)}
      labels={{
        tableLabel: l10n('UPLOADS_TABLE_LABEL'),
        fileColumn: l10n('UPLOADS_TABLE_FILE'),
        statusColumn: l10n('UPLOADS_TABLE_STATUS'),
        detailColumn: l10n('UPLOADS_TABLE_DETAIL'),
        whenColumn: l10n('UPLOADS_TABLE_WHEN'),
        empty: l10n('UPLOADS_EMPTY'),
      }}
    />
  );
}
