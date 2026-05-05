import { clearCookieHeader } from '@backend/lib/jwt';

export const runtime = 'edge';

export async function POST() {
  return new Response(null, {
    status: 204,
    headers: { 'Set-Cookie': clearCookieHeader() },
  });
}
