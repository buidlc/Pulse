import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import type { UserRole } from '@shared/types';

const SECRET_STRING = process.env.JWT_SECRET;
if (!SECRET_STRING) {
  console.warn('[pulse] JWT_SECRET not set — auth APIs will fail until configured');
}
const SECRET = new TextEncoder().encode(SECRET_STRING ?? 'unset-secret-do-not-use');

export interface PulseJWT extends JoseJWTPayload {
  wallet: string;
  role: UserRole;
}

export async function issueJWT(walletAddress: string): Promise<string> {
  const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLET ?? '')
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  const role: UserRole = adminWallets.includes(walletAddress.toLowerCase()) ? 'admin' : 'user';
  return await new SignJWT({ wallet: walletAddress, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .setNotBefore('0s')
    .setJti(crypto.randomUUID())
    .sign(SECRET);
}

export async function verifyJWT(token: string): Promise<PulseJWT | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] });
    if (typeof payload.wallet !== 'string' || typeof payload.role !== 'string') return null;
    return payload as PulseJWT;
  } catch {
    return null;
  }
}

export function cookieHeader(token: string): string {
  return `pulse_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=7200`;
}

export function clearCookieHeader(): string {
  return 'pulse_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}
