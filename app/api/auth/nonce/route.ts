import { NextRequest } from 'next/server';
import { issueNonce } from '@backend/lib/nonce';
import { checkLimit, getRequestIp } from '@backend/lib/ratelimit';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const limited = await checkLimit('walletConnect', ip);
  if (limited) return limited;

  let body: { wallet?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const wallet = body.wallet?.toLowerCase().trim();
  if (!wallet || !/^0x[0-9a-f]{1,64}$/.test(wallet)) {
    return new Response('Invalid wallet', { status: 400 });
  }

  try {
    const { nonce, expiresAt, message } = await issueNonce(wallet);
    return Response.json({ nonce, expiresAt, message });
  } catch (err) {
    console.error('[pulse] nonce issue failed', err);
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error';
    return new Response(`Nonce service unavailable — ${detail}`, { status: 503 });
  }
}
