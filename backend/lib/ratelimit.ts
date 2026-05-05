import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

let cachedLimits: ReturnType<typeof buildLimits> | null = null;

function buildLimits() {
  const redis = getRedis();
  return {
    walletConnect: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m') }),
    upload: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h') }),
    vote: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 h') }),
    review: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1 h') }),
    browse: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m') }),
    adminAction: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 h') }),
  };
}

export type LimitName = keyof ReturnType<typeof buildLimits>;

export function getLimits() {
  if (!cachedLimits) cachedLimits = buildLimits();
  return cachedLimits;
}

export async function checkLimit(name: LimitName, identifier: string): Promise<Response | null> {
  try {
    const limits = getLimits();
    const limiter = limits[name];
    const { success, remaining, reset } = await limiter.limit(identifier);
    if (success) return null;
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
        'Retry-After': String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
      },
    });
  } catch (err) {
    console.error('[pulse] rate limit check failed; allowing request', err);
    return null;
  }
}

export function getRequestIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
