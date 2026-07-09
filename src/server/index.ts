import app from "./app";
import { env } from "./app";

const server = Bun.serve({
  port: env.port,
  fetch: app.fetch,
});

console.log(`[server] Envoker listening on http://localhost:${env.port} (${env.nodeEnv})`);

// ── Graceful shutdown ─────────────────────────────────────────────

function shutdown(signal: string) {
  console.log(`[server] Received ${signal}, shutting down gracefully...`);
  server.stop();
  console.log(`[server] Goodbye.`);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
