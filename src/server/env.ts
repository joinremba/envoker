/**
 * Environment validation — fail fast on missing config at startup.
 */

export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`[env] MISSING: ${name} is required`);
    process.exit(1);
  }
  return val;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export function validateEnv() {
  requireEnv("DATABASE_URL");
  requireEnv("BETTER_AUTH_URL");
  requireEnv("BETTER_AUTH_SECRET");

  const port = parseInt(process.env.PORT ?? "3001", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`[env] INVALID: PORT must be a number between 1-65535, got ${process.env.PORT}`);
    process.exit(1);
  }

  return {
    databaseUrl: process.env.DATABASE_URL!,
    betterAuthUrl: process.env.BETTER_AUTH_URL!,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET!,
    port,
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    nodeEnv: process.env.NODE_ENV ?? "development",
    logLevel: process.env.LOG_LEVEL ?? "info",
  };
}
