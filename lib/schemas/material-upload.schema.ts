import { z } from 'zod';

import { CODES } from '@/constants/codes.const';
import { MATERIAL, MATERIAL_EXTENSIONS, MATERIAL_MIME_TYPES } from '@/constants/material.const';

import { encodeZodMessage } from '@/lib/utils';

import { objectIdField } from './object-id.schema';

const MATERIALS = CODES.VALIDATION.MATERIALS;

/**
 * Whether the file's name ends in something the department accepts.
 *
 * @param fileName - Name as uploaded.
 *
 * @returns True when the extension is on the list.
 */
function hasAllowedExtension(fileName: string): boolean {
  const lowered = fileName.toLowerCase();

  return MATERIAL_EXTENSIONS.some(extension => lowered.endsWith(extension));
}

/*
  Every check here runs on the server, against the bytes that actually arrived. The
  `accept` attribute on the input and the size shown in the picker are conveniences for
  whoever is uploading — a request built by hand skips both.

  `file.size` is trustworthy: it is the length of what was received, not a number the
  client asserted. `file.type` is not — the browser fills it in, so it is checked
  together with the extension, and neither proves what the bytes contain.
*/
export const MaterialUploadSchema = z.object({
  courseId: objectIdField,

  title: z
    .string()
    .trim()
    .min(1, encodeZodMessage(MATERIALS.TITLE_REQUIRED.CODE, MATERIALS.TITLE_REQUIRED.MESSAGE))
    .max(200, encodeZodMessage(MATERIALS.TITLE_TOO_LONG.CODE, MATERIALS.TITLE_TOO_LONG.MESSAGE)),

  file: z
    .instanceof(File, { message: encodeZodMessage(MATERIALS.FILE_REQUIRED.CODE, MATERIALS.FILE_REQUIRED.MESSAGE) })
    // An empty picker submits a zero-byte file rather than nothing at all.
    .refine(x => x.size > 0, encodeZodMessage(MATERIALS.FILE_REQUIRED.CODE, MATERIALS.FILE_REQUIRED.MESSAGE))
    .refine(x => x.size <= MATERIAL.MAX_SIZE_BYTES, encodeZodMessage(MATERIALS.FILE_TOO_LARGE.CODE, MATERIALS.FILE_TOO_LARGE.MESSAGE))
    .refine(
      x => MATERIAL_MIME_TYPES.includes(x.type as (typeof MATERIAL_MIME_TYPES)[number]) && hasAllowedExtension(x.name),
      encodeZodMessage(MATERIALS.FILE_TYPE_NOT_ALLOWED.CODE, MATERIALS.FILE_TYPE_NOT_ALLOWED.MESSAGE)
    ),
});

export type MaterialUploadInput = z.input<typeof MaterialUploadSchema>;
export type MaterialUploadOutput = z.output<typeof MaterialUploadSchema>;
