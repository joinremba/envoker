import type { Context, Next } from "hono";
import { auth } from "../auth";

export async function requireApiKey(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header) return c.json({ error: "Missing Authorization header" }, 401);

  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return c.json({ error: "Missing API key" }, 401);

  const result = await auth.api.verifyApiKey({
    body: { key: token },
  });

  if (!result.valid) {
    return c.json({ error: result.error?.message ?? "Invalid API key" }, 401);
  }

  // Store reference ID (user ID or key ID) for scoping queries
  c.set("apiKeyRef", result.key?.referenceId ?? result.key?.id);
  await next();
}
