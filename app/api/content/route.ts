import { NextRequest } from 'next/server';
import { fetchAllContent, fetchContent } from '@shared/lib/contracts';
import { checkLimit, getRequestIp } from '@backend/lib/ratelimit';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const limited = await checkLimit('browse', getRequestIp(req));
  if (limited) return limited;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (id !== null) {
    const numeric = parseInt(id, 10);
    if (Number.isNaN(numeric)) return new Response('Invalid id', { status: 400 });
    const content = await fetchContent(numeric);
    if (!content) return new Response('Not found', { status: 404 });
    return Response.json(content);
  }

  const all = await fetchAllContent();
  return Response.json(all);
}
