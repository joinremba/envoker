import { expect, test, beforeAll } from "bun:test";
import { createBeacon, ConfigValidationError } from "./index";
import { z } from "zod";

const zodStringMin3 = z.string().min(3);

const ORIGINAL_ENV = { ...process.env };

beforeAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("returns typed config values after ensure()", () => {
  process.env.DATABASE_URL = "https://example.com/db";
  process.env.REDIS_URL = "https://example.com/redis";

  const config = createBeacon({
    DATABASE_URL: { type: "url", required: true },
    REDIS_URL: { type: "url", required: true },
  });

  config.ensure();
  expect(config.get<string>("DATABASE_URL")).toBe("https://example.com/db");
  expect(config.get<string>("REDIS_URL")).toBe("https://example.com/redis");
});

test("throws ValidationError for missing required vars", () => {
  delete process.env.MISSING_VAR;

  const config = createBeacon({
    MISSING_VAR: { type: "string", required: true },
  });

  expect(() => config.ensure()).toThrow(ConfigValidationError);
});

test("does not throw for optional vars with defaults", () => {
  delete process.env.MY_PORT;

  const config = createBeacon({
    MY_PORT: { type: "port", default: 3000 },
  });

  config.ensure();
  expect(config.get<number>("MY_PORT")).toBe(3000);
});

test("coerces number types", () => {
  process.env.MY_NUMBER = "42";

  const config = createBeacon({
    MY_NUMBER: { type: "number" },
  });

  config.ensure();
  expect(config.get<number>("MY_NUMBER")).toBe(42);
});

test("coerces boolean types", () => {
  process.env.FEATURE_X = "true";
  process.env.FEATURE_Y = "false";
  process.env.FEATURE_Z = "1";

  const config = createBeacon({
    FEATURE_X: { type: "boolean" },
    FEATURE_Y: { type: "boolean" },
    FEATURE_Z: { type: "boolean" },
  });

  config.ensure();
  expect(config.get<boolean>("FEATURE_X")).toBe(true);
  expect(config.get<boolean>("FEATURE_Y")).toBe(false);
  expect(config.get<boolean>("FEATURE_Z")).toBe(true);
});

test("validates enum values", () => {
  process.env.NODE_ENV = "production";

  const config = createBeacon({
    NODE_ENV: {
      type: "enum",
      values: ["development", "staging", "production"],
    },
  });

  config.ensure();
  expect(config.get<string>("NODE_ENV")).toBe("production");
});

test("throws for invalid enum values", () => {
  process.env.NODE_ENV = "invalid";

  const config = createBeacon({
    NODE_ENV: {
      type: "enum",
      values: ["development", "production"],
    },
  });

  expect(() => config.ensure()).toThrow();
});

test("validates port range", () => {
  process.env.PORT = "99999";

  const config = createBeacon({
    PORT: { type: "port" },
  });

  expect(() => config.ensure()).toThrow();
});

test("throws when accessing before ensure()", () => {
  const config = createBeacon({
    DB_URL: { type: "url", required: true },
  });

  expect(() => config.get("DB_URL")).toThrow("Call beacon.ensure()");
});

test("uses profile overrides when profile is set", () => {
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

  config.ensure();
  expect(config.get<string>("DB_HOST")).toBe("prod.example.com");
});

test("accepts Zod schemas directly", () => {
  process.env.ZOD_VAR = "hello";

  const config = createBeacon({
    ZOD_VAR: { schema: zodStringMin3 },
  });

  config.ensure();
  expect(config.get<string>("ZOD_VAR")).toBe("hello");
});

test("collects all errors before throwing", () => {
  delete process.env.VAR_A;
  delete process.env.VAR_B;

  const config = createBeacon({
    VAR_A: { type: "string", required: true },
    VAR_B: { type: "number", required: true },
  });

  try {
    config.ensure();
    expect.unreachable();
  } catch (err) {
    expect(err).toBeInstanceOf(ConfigValidationError);
    expect((err as ConfigValidationError).errors).toHaveLength(2);
  }
});

test("ensure({ strict: false }) skips missing required vars without throwing", () => {
  delete process.env.STRICT_VAR;

  const config = createBeacon({
    STRICT_VAR: { type: "string", required: true },
    OPTIONAL_VAR: { type: "number", required: false },
  });

  expect(() => config.ensure({ strict: false })).not.toThrow();
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
