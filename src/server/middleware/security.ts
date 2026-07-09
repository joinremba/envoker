import type { Context, Next } from "hono";

/**
 * Security hardening middleware.
 * Sets standard HTTP security headers.
 */
export async function securityHeaders(c: Context, next: Next) {
  await next();

  // Prevent MIME-type sniffing
  c.res.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking — deny by default (admin pages override as needed)
  c.res.headers.set("X-Frame-Options", "DENY");

  // Enable browser XSS filter (legacy, but harmless)
  c.res.headers.set("X-XSS-Protection", "1; mode=block");

  // Strict Transport Security (only on HTTPS)
  if (c.req.url.startsWith("https")) {
    c.res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Referrer policy
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Prevent accidental content-type mismatch
  if (!c.res.headers.has("Content-Type")) {
    const accept = c.req.header("Accept") ?? "";
    if (accept.includes("application/json")) {
      c.res.headers.set("Content-Type", "application/json");
    }
  }
}
