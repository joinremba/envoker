<p align="center"
  <br>
  <strong>Beacon</strong>
</p>

<p align="center">
  Validate environment variables, config, secrets, and runtime feature gates before production breaks.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/envoker"><img src="https://img.shields.io/npm/v/envoker.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/envoker.svg" alt="License"></a>
  <a href="https://github.com/joinremba/envoker/actions/workflows/ci.yml"><img src="https://github.com/joinremba/envoker/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Bun-%3E%3D1.3.1-black?logo=bun" alt="Bun">
  <img src="https://img.shields.io/badge/TypeScript-6-blue" alt="TypeScript">
</p>

---

## Features

- **Schema-based validation** — Define env vars with simple string types (`"url"`, `"port"`, `"enum"`, etc.) or raw Zod schemas.
- **Aggregated errors** — All missing/invalid variables are reported at once, not one at a time.
- **Secrets redaction** — Values marked `secret: true` are automatically replaced with `[REDACTED]` in errors and CLI output.
- **Profile overrides** — Define per-environment schemas (development, staging, production) with inheritance.
- **Feature gates & kill switches** — Runtime toggles with env-var overrides and deterministic rollout hashing.
- **CLI tool** — `beacon init` generates `.env.example`, `beacon check` validates the runtime environment, `beacon drift` detects config drift.
- **Encrypted .env** — AES-256-GCM encrypt/decrypt `.env` files for safe committing.
- **Remote config** — Fetches config from the Remba cloud client with local fallback.
- **TypeScript-first** — Strict types, generic getter, full type exports.

---

## Installation

```sh
bun add envoker
```

---

## Quick Start

```ts
import { createBeacon } from "envoker";

const config = createBeacon({
  DATABASE_URL: { type: "url", required: true },
  REDIS_URL: { type: "url", required: true },
  PORT: { type: "port", default: 3000 },
  NODE_ENV: { type: "enum", values: ["development", "production"], default: "development" },
  API_KEY: { type: "string", required: true, secret: true },
});

await config.ensure();

const dbUrl = config.get<string>("DATABASE_URL");
const port = config.get<number>("PORT");
```

If any required variable is missing or invalid, `ensure()` throws a `ConfigValidationError` with **all** issues collected at once — fix everything in a single pass.

---

## Schema Types

Each field in the schema can be defined with a `type` string. Beacon coerces and validates the raw `process.env` value accordingly.

| Type      | Validation                                              | Coercion                                    | Example                                |
| --------- | ------------------------------------------------------- | ------------------------------------------- | -------------------------------------- |
| `string`  | Any string                                              | —                                           | `{ type: "string" }`                   |
| `host`    | Any string (alias for `string`)                         | —                                           | `{ type: "host" }`                     |
| `url`     | Valid URL                                               | —                                           | `{ type: "url" }`                      |
| `number`  | Finite number                                           | `z.coerce.number()`                         | `{ type: "number" }`                   |
| `integer` | Integer                                                 | `z.coerce.number().int()`                   | `{ type: "integer" }`                  |
| `port`    | Integer in range 1–65535                                | `z.coerce.number().int().min(1).max(65535)` | `{ type: "port", default: 3000 }`      |
| `boolean` | `"true"` / `"false"` / `"1"` / `"0"` / `"yes"` / `"no"` | String transform                            | `{ type: "boolean" }`                  |
| `enum`    | Must be one of `values[]`                               | `z.enum(values)`                            | `{ type: "enum", values: ["a", "b"] }` |
| `email`   | Valid email                                             | `z.string().email()`                        | `{ type: "email" }`                    |

```ts
const config = createBeacon({
  APP_NAME: { type: "string", default: "my-app" },
  DATABASE_URL: { type: "url", required: true },
  WORKERS: { type: "integer", default: 4 },
  PORT: { type: "port", default: 3000 },
  SUPPORT_EMAIL: { type: "email", required: true },
  LOG_LEVEL: { type: "enum", values: ["debug", "info", "warn", "error"], default: "info" },
  ENABLE_METRICS: { type: "boolean", default: false },
});
```

You can also pass raw **Zod schemas** directly for custom validation:

```ts
import { z } from "zod";

const config = createBeacon({
  WHITELIST: { schema: z.string().regex(/^[\d,]+$/) },
  TIMEOUT: { schema: z.coerce.number().positive().max(30000) },
});
```

---

## `.ensure()`

Validates every variable in the schema against the current `process.env`. Must be called before any `get()` call.

```ts
await config.ensure();
```

**Behavior:**

| Condition                         | strict: true (default)         | strict: false                |
| --------------------------------- | ------------------------------ | ---------------------------- |
| Required var present, valid       | Passes                         | Passes                       |
| Required var missing              | `ConfigValidationError` thrown | Silently skipped             |
| Required var present, invalid     | `ConfigValidationError` thrown | Silently skipped             |
| Optional var not set, has default | Default applied                | Default applied              |
| Optional var not set, no default  | Skipped                        | Skipped                      |
| Remote config available           | Merged into validated values   | Merged into validated values |

Errors are aggregated into a single `ConfigValidationError` (extends `AggregateError`). Access individual issues via `err.errors`:

```ts
import { ConfigValidationError } from "envoker";

try {
  await config.ensure();
} catch (err) {
  if (err instanceof ConfigValidationError) {
    for (const issue of err.errors) {
      console.error(`[${issue.key}] ${issue.message}`);
    }
  }
  process.exit(1);
}
```

The `ensure({ strict: false })` mode is useful during testing or bootstrap when some env vars may not yet be configured.

---

## `.getAll()`

Returns a `Record<string, unknown>` of **all** resolved values after `ensure()` completes.

```ts
await config.ensure();
const all = config.getAll();
// { DATABASE_URL: "postgres://...", PORT: 3000, NODE_ENV: "development", ... }
```

Useful for debugging, logging startup configuration, or passing the full config object to subsystems.

---

## `.get<T>(key)`

Type-safe accessor for individual validated values. Call `.get<T>(key)` with an optional generic type parameter.

```ts
const port = config.get<number>("PORT"); // type: number
const dbUrl = config.get<string>("DATABASE_URL"); // type: string
const debug = config.get<boolean>("DEBUG"); // type: boolean
```

Throws `ConfigError` if:

- Called before `ensure()` — `"Call beacon.ensure() before accessing config values"`
- Key doesn't exist in the schema — `"Unknown config key: <key>"`

---

## Secrets

Mark sensitive fields with `secret: true` to prevent their values from appearing in error messages, CLI output, or logs.

```ts
const config = createBeacon({
  API_KEY: { type: "string", required: true, secret: true },
  DATABASE_URL: { type: "url", secret: true },
});
```

When a secret value fails validation, the error message shows `[REDACTED]` instead of the actual value:

```
Environment variable API_KEY=[REDACTED]: Invalid value
```

The secret metadata is also accessible at runtime:

```ts
config.secret; // { API_KEY: true, DATABASE_URL: true }
```

---

## NODE_ENV Handling

Beacon handles `NODE_ENV` like any other env var — define it in your schema with an `enum` type and a default:

```ts
const config = createBeacon({
  NODE_ENV: {
    type: "enum",
    values: ["development", "test", "staging", "production"],
    default: "development",
  },
});
```

**Defaults behavior:**

- When an env var is not set and has a `default`, the default value is used silently.
- When an env var is not set, has no default, but `required: false`, it is silently skipped.
- When an env var is not set, has no default, and `required: true` (the default), it fails validation.

This means you can safely deploy with minimal env vars during development as long as sensible defaults are provided.

---

## `.beaconrc.json` (CLI Config File)

The CLI reads schema, profiles, and features from a JSON config file. It looks for `.beaconrc.json` or `beacon.config.json` in the project root.

```json
{
  "schema": {
    "DATABASE_URL": {
      "type": "url",
      "required": true,
      "description": "PostgreSQL connection string"
    },
    "PORT": {
      "type": "port",
      "default": 3000,
      "description": "HTTP server port"
    },
    "NODE_ENV": {
      "type": "enum",
      "values": ["development", "staging", "production"],
      "default": "development"
    },
    "API_KEY": {
      "type": "string",
      "required": true,
      "secret": true,
      "description": "API signing key"
    }
  },
  "profiles": {
    "production": {
      "DB_HOST": { "type": "host", "required": true, "description": "Production DB hostname" }
    },
    "staging": {
      "DB_HOST": { "type": "host", "required": true, "description": "Staging DB hostname" }
    }
  },
  "features": {
    "newDashboard": { "enabled": true, "description": "New dashboard UI" },
    "darkMode": { "enabled": false }
  }
}
```

**CLI commands:**

```sh
# Generate .env.example from the config
bunx beacon init
bunx beacon init --profile production
bunx beacon init --all-profiles

# Validate current environment against schema
bunx beacon check
bunx beacon check --profile staging

# Detect config drift (missing vars, type mismatches)
bunx beacon drift
bunx beacon drift --profile production

# Encrypt/decrypt .env files for safe committing
BEACON_ENCRYPTION_KEY=... beacon encrypt
BEACON_ENCRYPTION_KEY=... beacon decrypt

# Validate env in Docker/Kubernetes
bunx beacon docker

# Print secret rotation checklist
bunx beacon rotate
```

---

## Configuration Reference

### `createBeacon(schema, options?)`

| Option         | Type                                          | Default | Description                                               |
| -------------- | --------------------------------------------- | ------- | --------------------------------------------------------- |
| `schema`       | `Record<string, SchemaEntry>`                 | —       | Map of env var names to field definitions (required).     |
| `profile`      | `string`                                      | —       | Active profile name. Merges matching entry from profiles. |
| `profiles`     | `Record<string, Record<string, SchemaEntry>>` | —       | Named profile overrides. Keyed by profile name.           |
| `features`     | `Record<string, FeatureGate>`                 | —       | Feature gate definitions for `isEnabled()`.               |
| `killSwitches` | `Record<string, boolean>`                     | —       | Kill-switch flags. Overrides feature gates.               |
| `client`       | `Client` (Remba cloud client)                 | —       | Remote config client. Fetches config from cloud.          |

### `SchemaEntry`

**String-based field definition:**

| Field         | Type        | Default | Description                                                                               |
| ------------- | ----------- | ------- | ----------------------------------------------------------------------------------------- |
| `type`        | `FieldType` | —       | One of: `string`, `url`, `number`, `integer`, `boolean`, `port`, `enum`, `host`, `email`. |
| `required`    | `boolean`   | `true`  | Whether the variable must be present in env.                                              |
| `default`     | `unknown`   | —       | Default value when not set.                                                               |
| `secret`      | `boolean`   | `false` | Redact value from errors, logs, and CLI output.                                           |
| `values`      | `string[]`  | —       | Allowed values (required for `"enum"` type).                                              |
| `description` | `string`    | —       | Human-readable description. Used in `.env.example`.                                       |

**Zod-based field definition:**

| Field         | Type        | Default | Description                                     |
| ------------- | ----------- | ------- | ----------------------------------------------- |
| `schema`      | `z.ZodType` | —       | A Zod schema for custom validation logic.       |
| `required`    | `boolean`   | `true`  | Whether the variable must be present in env.    |
| `secret`      | `boolean`   | `false` | Redact value from errors, logs, and CLI output. |
| `description` | `string`    | —       | Human-readable description.                     |

### Returned Beacon instance

| Method / Property    | Returns                   | Description                                |
| -------------------- | ------------------------- | ------------------------------------------ |
| `ensure(options?)`   | `Promise<Beacon>`         | Validates all env vars. Throws on failure. |
| `getAll()`           | `Record<string, unknown>` | Returns all resolved values.               |
| `get<T>(key)`        | `T`                       | Returns a single typed value.              |
| `secret`             | `Record<string, boolean>` | Which keys are marked as secrets.          |
| `isEnabled(feature)` | `boolean`                 | Checks if a feature gate is enabled.       |
| `isKilled(feature)`  | `boolean`                 | Checks if a kill switch is active.         |

### `EnsureOptions`

| Option   | Type      | Default | Description                                      |
| -------- | --------- | ------- | ------------------------------------------------ |
| `strict` | `boolean` | `true`  | When `false`, missing required vars are skipped. |

### `FeatureGate`

| Option        | Type      | Default | Description                                        |
| ------------- | --------- | ------- | -------------------------------------------------- |
| `enabled`     | `boolean` | `false` | Whether the feature is on by default.              |
| `rollout`     | `number`  | —       | Rollout percentage (0–1). Uses deterministic hash. |
| `description` | `string`  | —       | Human-readable description.                        |

---

## TypeScript

Beacon ships with strict TypeScript types. All public APIs are fully typed.

```ts
import { createBeacon } from "envoker";
import type {
  Beacon,
  BeaconOptions,
  SchemaEntry,
  FieldDefinition,
  FieldType,
  FeatureGate,
  EnsureOptions,
  ConfigError,
  ConfigValidationError,
} from "envoker";
```

**Generic inference with `.get<T>()`:**

```ts
const config = createBeacon({
  PORT: { type: "port", default: 3000 },
  DEBUG: { type: "boolean", default: false },
});

await config.ensure();

const port = config.get<number>("PORT"); // inferred as number
const debug = config.get<boolean>("DEBUG"); // inferred as boolean
```

---

## Integration with Remba Cloud

Beacon can fetch remote configuration from the Remba cloud by passing a `Client` instance from the Remba cloud client.

```ts
import { createBeacon } from "envoker";
// Remba cloud client SDK

const client = createClient({
  apiKey: "api_core_live_abc123",
});

const config = createBeacon(
  {
    LOCAL_VAR: { type: "string", default: "local-fallback" },
    PORT: { type: "port", default: 3000 },
  },
  { client }
);

await config.ensure();
```

**How remote config merging works:**

1. On `ensure()`, beacon calls `client.getConfig()`.
2. Remote entries whose keys are **not** in the local schema and **not** already set in `process.env` are added to the validated values.
3. Remote entries whose keys **are** in the local schema are **ignored** — the schema definition always wins.
4. If the network request fails (timeout, DNS error, etc.), beacon silently falls back to local-only mode.

This gives you a layered config priority:

```
process.env > schema defaults > remote config
```

Use this to share non-sensitive config (feature flags, service URLs) across deployments without storing everything in every CI/CD pipeline.

---

## Related Packages

- [evtlog](https://github.com/joinremba/evtlog) — Production-ready logging and error event layer on Pino.
- [permcheck](https://github.com/joinremba/permcheck) — API safety layer: validation, responses, idempotency, rate limiting, and API keys.

---

## License

MIT — see [LICENSE](LICENSE).
