import { describe, expect, it } from 'vitest';

import { fileMatchesDeclaredType } from '@/lib/utils';

function fileWith(bytes: number[], type: string, name = 'sample'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff, 0xe0];
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d];
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

describe('fileMatchesDeclaredType', () => {
  it('accepts bytes that match the declared type', async () => {
    expect(await fileMatchesDeclaredType(fileWith(PNG_MAGIC, 'image/png'))).toBe(true);
    expect(await fileMatchesDeclaredType(fileWith(PDF_MAGIC, 'application/pdf'))).toBe(true);
  });

  it('rejects a declared type whose opening bytes are another format', async () => {
    // JPEG bytes announced as a PNG.
    expect(await fileMatchesDeclaredType(fileWith(JPEG_MAGIC, 'image/png'))).toBe(false);
    // A zip archive announced as a PDF.
    expect(await fileMatchesDeclaredType(fileWith(ZIP_MAGIC, 'application/pdf'))).toBe(false);
  });

  it('accepts a type with no reliable signature, such as plain text', async () => {
    expect(await fileMatchesDeclaredType(fileWith([0x68, 0x69], 'text/plain'))).toBe(true);
  });

  it('accepts an Office Open XML file by its zip signature', async () => {
    const wordProcessingType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    expect(await fileMatchesDeclaredType(fileWith(ZIP_MAGIC, wordProcessingType))).toBe(true);
  });

  it('rejects a file too short to carry the declared signature', async () => {
    // Only the first two of the eight PNG signature bytes.
    expect(await fileMatchesDeclaredType(fileWith([0x89, 0x50], 'image/png'))).toBe(false);
  });
});
