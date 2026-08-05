import { NextResponse } from 'next/server';

/**
 * Shortcut method for returning not found response.
 *
 * @returns Next response with 404 status code.
 */
export function withNotFound() {
  return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
}
