/*
  A file's declared type is whatever the client said it was. This reads the first bytes
  and checks they match, which is the only part of type validation that cannot be
  spoofed by editing a request.

  Deliberately small: enough signatures to cover the accepted list, and a permissive
  answer for the types that genuinely have no reliable magic number. It is a filter
  against a mislabelled file, not a virus scanner.
*/

const SIGNATURES: { mimeTypes: string[]; magic: number[][] }[] = [
  { mimeTypes: ['application/pdf'], magic: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
  { mimeTypes: ['image/png'], magic: [[0x89, 0x50, 0x4e, 0x47]] }, // .PNG
  { mimeTypes: ['image/jpeg'], magic: [[0xff, 0xd8, 0xff]] },
  /*
    Every modern Office format is a zip, so they share PK\003\004 with a plain archive.
    Telling a .docx from a .zip means reading the central directory, which is more than
    a mislabel check needs — the extension already had to agree.
  */
  {
    mimeTypes: [
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    magic: [
      [0x50, 0x4b, 0x03, 0x04],
      [0x50, 0x4b, 0x05, 0x06],
      [0x50, 0x4b, 0x07, 0x08],
    ],
  },
  // The pre-2007 Office container.
  {
    mimeTypes: ['application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel'],
    magic: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
];

/** Longest signature above, so only that many bytes are ever read. */
const HEADER_BYTES = 8;

/**
 * Whether a file's opening bytes match the type it claims to be.
 *
 * Types with no dependable signature — `text/plain` — pass: refusing them would reject
 * legitimate files, and they are already bounded by the size cap and extension list.
 *
 * @param file - The uploaded file.
 *
 * @returns True when the bytes agree with the declared type, or the type has no
 *   signature worth checking.
 */
export async function fileMatchesDeclaredType(file: File): Promise<boolean> {
  const expected = SIGNATURES.find(x => x.mimeTypes.includes(file.type));

  if (!expected) {
    return true;
  }

  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer());

  return expected.magic.some(signature => signature.every((byte, index) => header[index] === byte));
}
