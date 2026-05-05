import { Redis } from '@upstash/redis/cloudflare';

let cached: Redis | null = null;

export function getRedis(): Redis {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured');
  }
  cached = new Redis({ url, token });
  return cached;
}
