import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { requireApiKey } from "./middleware/api-key";
import { securityHeaders } from "./middleware/security";
import { rateLimit } from "./middleware/rate-limit";
import { validateEnv } from "./env";
import configRoutes from "./api/config";
import featuresRoutes from "./api/features";
import adminRoutes from "./admin/routes";
import { LandingPage } from "./pages/landing";
import { DocsPage } from "./pages/docs";

// Validate critical env vars at startup
const env = validateEnv();

const app = new Hono<{
  Variables: {
    apiKeyRef: string;
    user: { id: string; name: string; email: string } | null;
    session: { id: string } | null;
  };
}>();

// ── Global middleware ──────────────────────────────────────────────

// Security headers on every response
app.use("*", securityHeaders);

// CORS — scoped from env
app.use(
  "*",
  cors({
    origin: env.corsOrigin === "*" ? "*" : env.corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
  })
);

// ── Global error handler ───────────────────────────────────────────

app.onError((err, c) => {
  console.error(`[error] ${err.name}: ${err.message}`, err.stack);

  const status =
    "status" in err && typeof (err as any).status === "number" ? (err as any).status : 500;

  return c.json(
    {
      error: status === 500 ? "Internal server error" : err.message,
      ...(env.nodeEnv === "development" && status === 500 ? { detail: err.message } : {}),
    },
    status
  );
});

// ── Not-found handler ──────────────────────────────────────────────

app.notFound((c) => c.json({ error: "Not found" }, 404));

// ── Static pages ───────────────────────────────────────────────────

app.get("/", (c) => c.html(<LandingPage />));
app.get("/docs", (c) => c.html(<DocsPage />));

// ── Better Auth handler ───────────────────────────────────────────

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ── Admin dashboard ───────────────────────────────────────────────

app.route("/admin", adminRoutes);

// ── Public API (requires API key) ────────────────────────────────

app.use("/v1/*", rateLimit({ max: 100, windowMs: 60_000 }));
app.use("/v1/*", requireApiKey);
app.route("/v1/config", configRoutes);
app.route("/v1/features", featuresRoutes);

// ── Health check ──────────────────────────────────────────────────

app.get("/health", (c) => c.json({ status: "ok" }));

export { env };
export default app;
