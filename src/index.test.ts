import { expect, test, beforeEach, mock } from "bun:test";
import { createBeacon, ConfigValidationError } from "./index";
import { z } from "zod";

const zodStringMin3 = z.string().min(3);

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("returns typed config values after ensure()", async () => {
  process.env.DATABASE_URL = "https://example.com/db";
  process.env.REDIS_URL = "https://example.com/redis";

  const config = createBeacon({
    DATABASE_URL: { type: "url", required: true },
    REDIS_URL: { type: "url", required: true },
  });

  await config.ensure();
  expect(config.get<string>("DATABASE_URL")).toBe("https://example.com/db");
  expect(config.get<string>("REDIS_URL")).toBe("https://example.com/redis");
});

test("throws ValidationError for missing required vars", async () => {
  delete process.env.MISSING_VAR;

  const config = createBeacon({
    MISSING_VAR: { type: "string", required: true },
  });

  await expect(config.ensure()).rejects.toThrow(ConfigValidationError);
});

test("does not throw for optional vars with defaults", async () => {
  delete process.env.MY_PORT;

  const config = createBeacon({
    MY_PORT: { type: "port", default: 3000 },
  });

  await config.ensure();
  expect(config.get<number>("MY_PORT")).toBe(3000);
});

test("coerces number types", async () => {
  process.env.MY_NUMBER = "42";

  const config = createBeacon({
    MY_NUMBER: { type: "number" },
  });

  await config.ensure();
  expect(config.get<number>("MY_NUMBER")).toBe(42);
});

test("coerces boolean types", async () => {
  process.env.FEATURE_X = "true";
  process.env.FEATURE_Y = "false";
  process.env.FEATURE_Z = "1";

  const config = createBeacon({
    FEATURE_X: { type: "boolean" },
    FEATURE_Y: { type: "boolean" },
    FEATURE_Z: { type: "boolean" },
  });

  await config.ensure();
  expect(config.get<boolean>("FEATURE_X")).toBe(true);
  expect(config.get<boolean>("FEATURE_Y")).toBe(false);
  expect(config.get<boolean>("FEATURE_Z")).toBe(true);
});

test("validates enum values", async () => {
  process.env.NODE_ENV = "production";

  const config = createBeacon({
    NODE_ENV: {
      type: "enum",
      values: ["development", "staging", "production"],
    },
  });

  await config.ensure();
  expect(config.get<string>("NODE_ENV")).toBe("production");
});

test("throws for invalid enum values", async () => {
  process.env.NODE_ENV = "invalid";

  const config = createBeacon({
    NODE_ENV: {
      type: "enum",
      values: ["development", "production"],
    },
  });

  await expect(config.ensure()).rejects.toThrow();
});

test("validates port range", async () => {
  process.env.PORT = "99999";

  const config = createBeacon({
    PORT: { type: "port" },
  });

  await expect(config.ensure()).rejects.toThrow();
});

test("throws when accessing before ensure()", () => {
  const config = createBeacon({
    DB_URL: { type: "url", required: true },
  });

  expect(() => config.get("DB_URL")).toThrow("Call beacon.ensure()");
});

test("uses profile overrides when profile is set", async () => {
  process.env.DB_HOST = "prod.example.com";

  const config = createBeacon(
    {
      DB_HOST: { type: "string" },
    },
    {
      profile: "production",
      profiles: {
        production: {
          DB_HOST: { type: "host" },
        },
      },
    }
  );

  await config.ensure();
  expect(config.get<string>("DB_HOST")).toBe("prod.example.com");
});

test("accepts Zod schemas directly", async () => {
  process.env.ZOD_VAR = "hello";

  const config = createBeacon({
    ZOD_VAR: { schema: zodStringMin3 },
  });

  await config.ensure();
  expect(config.get<string>("ZOD_VAR")).toBe("hello");
});

test("collects all errors before throwing", async () => {
  delete process.env.VAR_A;
  delete process.env.VAR_B;

  const config = createBeacon({
    VAR_A: { type: "string", required: true },
    VAR_B: { type: "number", required: true },
  });

  await expect(config.ensure()).rejects.toBeInstanceOf(ConfigValidationError);
});

test("ensure({ strict: false }) skips missing required vars without throwing", async () => {
  delete process.env.STRICT_VAR;

  const config = createBeacon({
    STRICT_VAR: { type: "string", required: true },
    OPTIONAL_VAR: { type: "number", required: false },
  });

  await expect(config.ensure({ strict: false })).resolves.toBeDefined();
});

test("tracks secret keys", () => {
  const config = createBeacon({
    API_KEY: { type: "string", secret: true },
    DB_URL: { type: "url" },
  });

  expect(config.secret).toEqual({ API_KEY: true });
});

test("isEnabled returns false for undefined feature", () => {
  const config = createBeacon({ PORT: { type: "port", default: 3000 } });
  expect(config.isEnabled("nonexistent")).toBe(false);
});

test("isEnabled returns true for enabled feature", () => {
  const config = createBeacon(
    { PORT: { type: "port", default: 3000 } },
    { features: { newDashboard: { enabled: true } } }
  );
  expect(config.isEnabled("newDashboard")).toBe(true);
});

test("isEnabled returns false for disabled feature", () => {
  const config = createBeacon(
    { PORT: { type: "port", default: 3000 } },
    { features: { darkMode: { enabled: false } } }
  );
  expect(config.isEnabled("darkMode")).toBe(false);
});

test("isEnabled respects env override", () => {
  const prev = process.env.FEATURE_NEW_DASHBOARD;
  try {
    process.env.FEATURE_NEW_DASHBOARD = "false";
    const config = createBeacon(
      { PORT: { type: "port", default: 3000 } },
      { features: { newDashboard: { enabled: true } } }
    );
    expect(config.isEnabled("newDashboard")).toBe(false);
  } finally {
    if (prev === undefined) {
      delete process.env.FEATURE_NEW_DASHBOARD;
    } else {
      process.env.FEATURE_NEW_DASHBOARD = prev;
    }
  }
});

test("isEnabled uses rollout when enabled is true", () => {
  const config = createBeacon(
    { PORT: { type: "port", default: 3000 } },
    { features: { gradual: { enabled: true, rollout: 1 } } }
  );
  expect(config.isEnabled("gradual")).toBe(true);
});

test("isKilled returns false by default", () => {
  const config = createBeacon({ PORT: { type: "port", default: 3000 } });
  expect(config.isKilled("newDashboard")).toBe(false);
});

test("isKilled returns true when set in options", () => {
  const config = createBeacon(
    { PORT: { type: "port", default: 3000 } },
    { killSwitches: { newDashboard: true } }
  );
  expect(config.isKilled("newDashboard")).toBe(true);
});

test("isKilled respects KILL_ env override", () => {
  const prev = process.env.KILL_NEW_DASHBOARD;
  try {
    process.env.KILL_NEW_DASHBOARD = "true";
    const config = createBeacon(
      { PORT: { type: "port", default: 3000 } },
      { killSwitches: { newDashboard: false } }
    );
    expect(config.isKilled("newDashboard")).toBe(true);
  } finally {
    if (prev === undefined) delete process.env.KILL_NEW_DASHBOARD;
    else process.env.KILL_NEW_DASHBOARD = prev;
  }
});

test("isEnabled returns false when feature is killed", () => {
  const config = createBeacon(
    { PORT: { type: "port", default: 3000 } },
    {
      features: { newDashboard: { enabled: true } },
      killSwitches: { newDashboard: true },
    }
  );
  expect(config.isEnabled("newDashboard")).toBe(false);
});

test("fetches remote config when client is provided", async () => {
  const config = createBeacon(
    { LOCAL_VAR: { type: "string", default: "local" } },
    {
      client: {
        getConfig: mock(async () => [
          { key: "REMOTE_VAR", value: "from-cloud", secret: false, updatedAt: "" },
        ]),
      } as any,
    }
  );

  await config.ensure();
  expect(config.get<string>("REMOTE_VAR")).toBe("from-cloud");
  expect(config.get<string>("LOCAL_VAR")).toBe("local");
});

test("schema entries take priority over remote config", async () => {
  const config = createBeacon(
    { SHARED_KEY: { type: "string", default: "from-schema" } },
    {
      client: {
        getConfig: mock(async () => [
          { key: "SHARED_KEY", value: "from-cloud", secret: false, updatedAt: "" },
        ]),
      } as any,
    }
  );

  await config.ensure();
  expect(config.get<string>("SHARED_KEY")).toBe("from-schema");
});

test("remote config fills gaps not in schema", async () => {
  const config = createBeacon(
    { DEFINED_KEY: { type: "string", default: "schema-val" } },
    {
      client: {
        getConfig: mock(async () => [
          { key: "DEFINED_KEY", value: "remote-val", secret: false, updatedAt: "" },
          { key: "REMOTE_ONLY", value: "remote-only", secret: false, updatedAt: "" },
        ]),
      } as any,
    }
  );

  await config.ensure();
  expect(config.get<string>("DEFINED_KEY")).toBe("schema-val");
  expect(config.get<string>("REMOTE_ONLY")).toBe("remote-only");
});

test("network error on remote config silently falls back to local", async () => {
  const config = createBeacon(
    { LOCAL_VAR: { type: "string", default: "fallback" } },
    {
      client: {
        getConfig: mock(async () => {
          throw new Error("connection lost");
        }),
      } as any,
    }
  );

  await config.ensure();
  expect(config.get<string>("LOCAL_VAR")).toBe("fallback");
});
