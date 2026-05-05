import { getServerSession } from '@backend/lib/session';

export const runtime = 'edge';

export async function GET() {
  const session = await getServerSession();
  if (!session) return new Response('No session', { status: 401 });
  return Response.json({
    wallet: session.wallet,
    role: session.role,
    exp: session.exp,
  });
}
