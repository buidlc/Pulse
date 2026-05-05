import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { paths?: string[] };
    const paths = body.paths && body.paths.length > 0 ? body.paths : ['/', '/ledger'];
    for (const p of paths) {
      revalidatePath(p);
    }
    return Response.json({ ok: true, revalidated: paths });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'revalidate failed';
    return new Response(msg, { status: 500 });
  }
}
