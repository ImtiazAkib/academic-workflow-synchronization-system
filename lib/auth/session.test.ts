import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';

import { SESSION } from '@/constants/auth.const';

import { createSessionToken, verifySessionToken } from '@/lib/auth/session';

import type { SessionUser } from '@/types';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

const user: SessionUser = {
  userId: 'u1',
  email: 'teacher@dept.test',
  name: 'A Teacher',
  role: 'teacher',
  isApproved: true,
};

function signWith(payload: Record<string, unknown>, key: Uint8Array = secret, issuer: string = SESSION.ISSUER): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: SESSION.ALGORITHM })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(SESSION.AUDIENCE)
    .setExpirationTime('1h')
    .sign(key);
}

describe('verifySessionToken', () => {
  it('round-trips a token it minted', async () => {
    const token = await createSessionToken(user);

    expect(await verifySessionToken(token)).toEqual(user);
  });

  it('rejects a tampered token', async () => {
    const token = await createSessionToken(user);

    expect(await verifySessionToken(`${token}x`)).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signWith({ ...user }, new TextEncoder().encode('a-different-secret-of-at-least-32-chars'));

    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejects a validly signed token whose payload is missing a required field', async () => {
    const token = await signWith({ userId: 'u1', email: 'x@y.test' });

    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejects a validly signed token carrying an unknown role', async () => {
    const token = await signWith({ ...user, role: 'root' });

    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejects a token minted for a different issuer', async () => {
    const token = await signWith({ ...user }, secret, 'someone-else');

    expect(await verifySessionToken(token)).toBeNull();
  });
});
