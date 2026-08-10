import { FILE_CONVERSION_STATUS } from '@/constants/storage.const';

import { formatFileSize } from './material.utils';

import type { FileConversionDto, FileConversionFailure } from '@/types';

export type ConversionStatusLabels = {
  processing: string;
  done: string;
  failed: string;
};

export type ConversionFailureLabels = Record<FileConversionFailure, string>;

/**
 * The one-line detail a conversion row shows beside its status.
 *
 * A failed job says why, in the caller's language. A finished one that shrank the file
 * shows the before and after; one that did not simply shows its size. A running one shows
 * what it arrived as, so the row is not blank while it works.
 *
 * @param conversion - The job.
 * @param failureLabels - Translated reasons, one per failure code.
 *
 * @returns The detail to render.
 */
export function resolveConversionDetail(conversion: FileConversionDto, failureLabels: ConversionFailureLabels): string {
  if (conversion.status === FILE_CONVERSION_STATUS.FAILED) {
    return conversion.failure ? failureLabels[conversion.failure] : failureLabels.conversion_failed;
  }

  const original = formatFileSize(conversion.originalSize);

  if (conversion.status === FILE_CONVERSION_STATUS.DONE && conversion.finalSize !== null && conversion.finalSize < conversion.originalSize) {
    return `${original} → ${formatFileSize(conversion.finalSize)}`;
  }

  return original;
}
