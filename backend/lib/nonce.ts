import { getRedis } from './redis';

const NONCE_TTL_SECONDS = 60;
const NONCE_PREFIX = 'pulse:nonce:';

export interface NonceRecord {
  wallet: string;
  expiresAt: number;
}

export function buildNonceMessage(wallet: string, nonce: string, expiresAt: number): string {
  return `Sign in to PULSE\nWallet: ${wallet}\nNonce: ${nonce}\nExpires: ${expiresAt}`;
}

export async function issueNonce(wallet: string): Promise<{ nonce: string; expiresAt: number; message: string }> {
  const redis = getRedis();
  const nonce = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + NONCE_TTL_SECONDS;
  await redis.set(NONCE_PREFIX + nonce, { wallet, expiresAt }, { ex: NONCE_TTL_SECONDS });
  return { nonce, expiresAt, message: buildNonceMessage(wallet, nonce, expiresAt) };
}

export async function consumeNonce(nonce: string, claimedWallet: string): Promise<NonceRecord | null> {
  const redis = getRedis();
  const key = NONCE_PREFIX + nonce;
  const record = (await redis.get<NonceRecord>(key)) ?? null;
  if (!record) return null;
  await redis.del(key);
  if (record.wallet.toLowerCase() !== claimedWallet.toLowerCase()) return null;
  if (record.expiresAt < Math.floor(Date.now() / 1000)) return null;
  return record;
}
