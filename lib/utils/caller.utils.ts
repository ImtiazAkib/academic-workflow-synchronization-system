/**
 * The header a reverse proxy uses to report who it is forwarding for.
 */
const FORWARDED_FOR = 'x-forwarded-for';

/**
 * A stand-in for a caller with no session, so an unauthenticated endpoint has something
 * to count against.
 *
 * **How far this can be trusted depends on the deployment, and it is worth being plain
 * about.** On Vercel the platform sets `x-forwarded-for` itself and a client cannot
 * override it. Behind the PM2 box it is whatever nginx was configured to send — and if
 * nothing is configured, it is whatever the client typed, which makes the limit a
 * formality that rotating a header defeats.
 *
 * That is not a reason to skip it. The endpoints this guards are also bounded by other
 * means — registration by email uniqueness, the resend by a per-account cooldown — so a
 * bypassed limit falls back to the protection that was already there, rather than to
 * none. It is a reason to say so out loud rather than to imply a guarantee the header
 * cannot give; deploying behind a proxy that sets it is a real setup step, and the README
 * records it as one.
 *
 * The first entry is taken because a forwarding chain appends: the leftmost is the
 * original client and everything after it is a hop.
 *
 * @param headers - The request's headers.
 *
 * @returns Something stable to count against, or a shared fallback when there is nothing.
 */
export function resolveCallerKey(headers: Headers): string {
  const forwarded = headers.get(FORWARDED_FOR);

  if (!forwarded) {
    /*
      One shared bucket rather than one per caller, which is the strict reading: with no
      way to tell two callers apart, treating them as one is the answer that still limits
      something. It means a local run without a proxy throttles everybody together —
      visible and annoying rather than silently absent, which is the failure worth having.
    */
    return 'unknown-caller';
  }

  const [client] = forwarded.split(',');

  return client.trim() || 'unknown-caller';
}
