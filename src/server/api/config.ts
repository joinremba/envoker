import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { configs } from "../db/schema";
import { newId } from "../lib/id";

type Variables = { apiKeyRef: string };

const app = new Hono<{ Variables: Variables }>();

const submitSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  environment: z.string().optional(),
});

app.get("/", async (c) => {
  const apiKeyRef = c.var.apiKeyRef;
  const db = getDb();
  const environment = c.req.query("environment") ?? "production";

  const entries = await db
    .select()
    .from(configs)
    .where(and(eq(configs.apiKeyId, apiKeyRef), eq(configs.environment, environment)));

  return c.json(entries.map((e) => ({ key: e.key, value: JSON.parse(e.value), secret: e.secret })));
});

app.post("/", async (c) => {
  const apiKeyRef = c.var.apiKeyRef;
  const body = await c.req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);

  const db = getDb();
  const environment = parsed.data.environment ?? "production";
  const now = Date.now();

  const entries = Object.entries(parsed.data.config);
  for (const [key, value] of entries) {
    const [existing] = await db
      .select()
      .from(configs)
      .where(
        and(
          eq(configs.apiKeyId, apiKeyRef),
          eq(configs.key, key),
          eq(configs.environment, environment)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(configs)
        .set({ value: JSON.stringify(value), updatedAt: now })
        .where(eq(configs.id, existing.id));
    } else {
      await db.insert(configs).values({
        id: newId(),
        apiKeyId: apiKeyRef,
        key,
        value: JSON.stringify(value),
        environment,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return c.json({ status: "ok" });
});

export default app;
