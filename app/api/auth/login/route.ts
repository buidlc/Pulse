import { NextRequest } from 'next/server';
import { consumeNonce, buildNonceMessage } from '@backend/lib/nonce';
import { issueJWT, cookieHeader } from '@backend/lib/jwt';
import { verifyWalletSignature } from '@backend/lib/security';
import { checkBanned } from '@shared/lib/contracts';
import { checkLimit, getRequestIp } from '@backend/lib/ratelimit';

export const runtime = 'edge';

interface LoginBody {
  wallet?: string;
  nonce?: string;
  signature?: string;
  publicKey?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const limited = await checkLimit('walletConnect', ip);
  if (limited) return limited;

  let body: LoginBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const { wallet, nonce, signature, publicKey, message } = body;
  if (!wallet || !nonce || !signature || !publicKey) {
    return new Response('Missing fields', { status: 400 });
  }

  // 1. Consume nonce (single-use, scoped to this wallet).
  const record = await consumeNonce(nonce, wallet);
  if (!record) return new Response('Invalid or expired nonce', { status: 401 });

  // 2. Reconstruct expected message and verify the signature.
  const expectedMessage = message ?? buildNonceMessage(wallet, nonce, record.expiresAt);
  const ok = await verifyWalletSignature({
    wallet,
    message: expectedMessage,
    signature,
    publicKey,
  });
  if (!ok) return new Response('Signature invalid', { status: 401 });

  // 3. Banned-wallet check (on-chain).
  if (await checkBanned(wallet)) {
    return new Response('Wallet is banned', { status: 403 });
  }

  // 4. Issue JWT and set as HttpOnly cookie.
  // (Wallet-age check intentionally removed for Shelbynet onboarding — abuse
  // is mitigated by rate limits + Petra signing + on-chain gas costs.)
  const token = await issueJWT(wallet);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader(token),
    },
  });
}
