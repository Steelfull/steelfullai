/**
 * Tiny in-memory rate limiter (fixed window) keyed by client IP.
 *
 * This is a COST / ABUSE guard, not a security boundary. It keeps a casual
 * visitor — or a bot hammering the endpoint — from burning the Anthropic
 * budget. State lives in this Node process and resets on restart, which is fine
 * for the current single-container VPS deploy (one app instance behind Caddy).
 * If the app is ever scaled to multiple instances, swap the Map for Redis.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Opportunistic cleanup so the Map can't grow unbounded over time.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of store) {
    if (b.resetAt <= now) store.delete(key);
  }
}

export type RateResult = { ok: boolean; remaining: number; retryAfter: number };

/**
 * Fixed-window limit: allow `limit` hits per `windowMs` for a given key.
 * Returns ok=false once the window budget is spent; `retryAfter` is in seconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);

  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  const retryAfter = Math.ceil((b.resetAt - now) / 1000);
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter };
  }

  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfter };
}

/**
 * Best-effort client IP from proxy headers. Caddy (the reverse proxy in front
 * of this app) sets X-Forwarded-For. Falls back to a constant so a missing
 * header degrades to a shared bucket rather than no limit at all.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim() || 'unknown';
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
