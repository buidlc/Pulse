import { cookies } from 'next/headers';
import { verifyJWT, type PulseJWT } from './jwt';

const COOKIE_NAME = 'pulse_token';

export async function getServerSession(): Promise<PulseJWT | null> {
  const store = cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function requireSession(): Promise<PulseJWT> {
  const s = await getServerSession();
  if (!s) throw new Error('Unauthorized');
  return s;
}

export async function requireAdmin(): Promise<PulseJWT> {
  const s = await requireSession();
  if (s.role !== 'admin') throw new Error('Forbidden');
  return s;
}
