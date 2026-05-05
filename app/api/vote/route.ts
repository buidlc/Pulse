import { NextRequest } from 'next/server';
import { getServerSession } from '@backend/lib/session';
import { checkLimit, getRequestIp } from '@backend/lib/ratelimit';
import { verifyTurnstile } from '@backend/lib/security';
import { sanitize } from '@shared/lib/sanitize';

export const runtime = 'edge';

/**
 * The vote itself is signed and broadcast client-side via the wallet adapter
 * (see lib/contracts.ts buildVoteTx) so that the user pays gas + the 0.1 APT
 * vote fee from their own wallet. This endpoint is the optional "review note"
 * companion that the UI calls AFTER the on-chain tx confirms — it lets us
 * persist the buyer's review text alongside the tx hash. Without this the
 * vote still happens; only the text is missing.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const limited = await checkLimit('vote', session.wallet);
  if (limited) return limited;

  const ipLimited = await checkLimit('vote', getRequestIp(req));
  if (ipLimited) return ipLimited;

  let body: { contentId?: number; txHash?: string; reviewText?: string; turnstile?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const { contentId, txHash, reviewText, turnstile } = body;
  if (typeof contentId !== 'number' || typeof txHash !== 'string') {
    return new Response('Missing fields', { status: 400 });
  }
  if (typeof turnstile === 'string' && turnstile.length > 0) {
    const ok = await verifyTurnstile(turnstile, getRequestIp(req));
    if (!ok) return new Response('Bot check failed', { status: 403 });
  }

  // Persisting reviews would require a database (Postgres / KV / etc.). To
  // keep PULSE wallet-only and dependency-light we surface the review text in
  // the on-chain tx hash payload only — UI reads votes by indexing VoteCast
  // events directly. We acknowledge here so the client knows the review was
  // received; integrate a store of your choice if you want long-form notes.
  return Response.json({ ok: true, contentId, txHash, reviewText: sanitize(reviewText) });
}
