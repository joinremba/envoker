/**
 * Simple in-memory sliding-window rate limiter.
 * Not for distributed use — sufficient for single-process deployment.
 */

import type { Context, Next } from "hono";

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of store) {
    if (w.resetAt <= now) store.delete(key);
  }
}, 300_000);

type RateLimitOptions = {
  /** Max requests per window (default: 100) */
  max?: number;
  /** Window duration in ms (default: 60_000 = 1 minute) */
  windowMs?: number;
  /** Key extractor (default: IP) */
  keyFn?: (c: Context) => string;
};

export function rateLimit(opts: RateLimitOptions = {}) {
  const max = opts.max ?? 100;
  const windowMs = opts.windowMs ?? 60_000;
  const keyFn =
    opts.keyFn ??
    ((c: Context) => {
      return c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";
    });

  return async (c: Context, next: Next) => {
    const key = keyFn(c);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + windowMs };
      store.set(key, entry);
      c.res.headers.set("X-RateLimit-Limit", String(max));
      c.res.headers.set("X-RateLimit-Remaining", String(max - 1));
      c.res.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
      return next();
    }

    entry.count++;

    c.res.headers.set("X-RateLimit-Limit", String(max));
    c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    c.res.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      c.res.headers.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return c.json(
        { error: "Too many requests", retryAfter: Math.ceil((entry.resetAt - now) / 1000) },
        429
      );
    }

    return next();
  };
}
