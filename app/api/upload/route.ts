import { NextRequest } from 'next/server';
import { getServerSession } from '@backend/lib/session';
import { validateFile, verifyTurnstile } from '@backend/lib/security';
import { sanitize } from '@shared/lib/sanitize';
import { uploadBlob, uploadVideo } from '@shared/lib/shelby';
import { checkLimit, getRequestIp } from '@backend/lib/ratelimit';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return new Response('Unauthorized', { status: 401 });

    const limited = await checkLimit('upload', session.wallet);
    if (limited) return limited;

    const ipLimited = await checkLimit('upload', getRequestIp(req));
    if (ipLimited) return ipLimited;

    const form = await req.formData();
    const file = form.get('file');
    const turnstile = form.get('turnstile');
    const kind = (form.get('kind') ?? 'blob') as 'blob' | 'video';
    const title = sanitize(form.get('title')?.toString());

    if (!(file instanceof File)) return new Response('No file provided', { status: 400 });

    const turnstileConfigured = Boolean(process.env.TURNSTILE_SECRET);
    if (turnstileConfigured) {
      if (typeof turnstile !== 'string' || !turnstile) {
        return new Response('Bot check missing', { status: 400 });
      }
      const turnstileOk = await verifyTurnstile(turnstile, getRequestIp(req));
      if (!turnstileOk) return new Response('Bot check failed', { status: 403 });
    }

    try {
      await validateFile(file);
    } catch (err) {
      return new Response(err instanceof Error ? err.message : 'Invalid file', { status: 400 });
    }

    try {
      const blobId = kind === 'video' ? await uploadVideo(file) : await uploadBlob(file);
      return Response.json({ blobId, title });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      return new Response(msg, { status: 502 });
    }
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : 'Unknown error';
    return new Response(`Upload route crashed — ${msg}`, { status: 500 });
  }
}
