import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { features } from "../db/schema";

type Variables = { apiKeyRef: string };

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  const apiKeyRef = c.var.apiKeyRef;
  const db = getDb();
  const environment = c.req.query("environment") ?? "production";

  const flags = await db
    .select()
    .from(features)
    .where(and(eq(features.apiKeyId, apiKeyRef), eq(features.environment, environment)));

  return c.json(flags.map((f) => ({ flag: f.flag, enabled: f.enabled })));
});

export default app;
