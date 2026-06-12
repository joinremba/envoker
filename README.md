<p align="center">
  <picture>
    <img alt="@joinremba/beacon" src="./assets/logo.svg" width="80">
  </picture>
  <br>
  <strong>@joinremba/beacon</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@joinremba/beacon"><img src="https://img.shields.io/npm/v/@joinremba/beacon.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/@joinremba/beacon.svg" alt="Licence"></a>
  <a href="https://github.com/joinremba/beacon/actions/workflows/ci.yml"><img src="https://github.com/joinremba/beacon/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Bun-%3E%3D1.3.1-black?logo=bun" alt="Bun">
  <img src="https://img.shields.io/badge/TypeScript-6-blue" alt="TypeScript">
</p>

Beacon helps TypeScript teams boot applications safely by validating environment variables, config, secrets, and runtime feature gates before production breaks.

```sh
bun add @joinremba/beacon
bunx beacon init
bunx beacon check
```

---

## Quick Start

```ts
import { createBeacon } from "@joinremba/beacon";

const config = createBeacon({
  DATABASE_URL: { type: "url", required: true },
  REDIS_URL: { type: "url", required: true },
  NODE_ENV: {
    type: "enum",
    values: ["development", "test", "staging", "production"],
    default: "development",
  },
  PORT: { type: "port", default: 3000 },
  API_KEY: { type: "string", required: true, secret: true },
});

config.ensure();

const dbUrl = config.get<string>("DATABASE_URL");
```

If any variable is missing or invalid, `ensure()` throws a `ConfigValidationError` with **all issues collected at once** — so you fix everything in a single pass, not iteratively.

---

## Why Beacon?

Most backend projects start with a scattered collection of helper functions for reading env vars, checking types, and remembering which vars are required. This works until:

- A new developer joins and doesn't know which env vars exist
- A staging environment crashes because a required var was renamed but not documented
- A secret leaks into an error log because nobody added redaction
- Your CI pipeline passes locally but fails in production due to config drift

Beacon solves these by giving you a **single source of truth** for your env schema, with built-in validation, secrets redaction, profile support, and CLI tools for generating `.env.example` and checking environments.

---

## Features

- **Schema-based validation** — Define your env schema with simple string types (`"url"`, `"port"`, `"enum"`, etc.) or raw Zod schemas.
- **Missing variable detection** — All errors are collected and reported together, not one at a time.
- **Secrets redaction** — Keep secrets out of logs and error messages automatically. Values are replaced with `[REDACTED]`.
- **Local/staging/production profiles** — Define different schemas per environment.
- **`.env.example` generation** — Generate a documented `.env.example` from your schema via the CLI.
- **CLI** — `beacon init` scaffolds config, `beacon check` validates before deploying.
- **Zero runtime overhead** — Validations run once at boot. After that, access is plain property reads.
- **Framework-agnostic** — Works with Bun, Node.js, Express, Hono, Fastify, Next.js, Elysia.

---

## CLI

Beacon ships with a CLI for development and CI workflows.

### `beacon init`

Generate a documented `.env.example` from your beacon config:

```sh
bunx beacon init

# With a production profile:
bunx beacon init --profile production

# Custom config path:
bunx beacon init -c ./config/beacon.json -o .env.example.prod
```

Output includes types, defaults, descriptions, and secret markers for every variable:

```sh
# PostgreSQL connection string
# Type: url
# Required: yes
# DATABASE_URL=

# HTTP server port
# Type: port
# Default: 3000
PORT=3000
```

### `beacon check`

Validate your current environment against your schema:

```sh
bunx beacon check

# With a specific profile:
bunx beacon check --profile staging

# Custom config:
bunx beacon check -c ./config/production.json
```

Output is a colour-coded table:

```sh
  KEY           STATUS    VALUE
  ────────────  ────────  ────────────────────
  DATABASE_URL  pass      postgres://localhost...
  PORT          pass      Using default value
  NODE_ENV      pass      Using default value
  API_KEY       MISSING   Not set
  LOG_LEVEL     pass      Optional, not set
  DB_HOST       MISSING   Not set
                     Did you mean DB_HOSTNAME?

  2 issue(s), 3 pass
```

Exit codes: `0` if all pass, `1` if any issues found.

### Per-command help

```sh
beacon help init
beacon check --help
```

---

## API Reference

### `createBeacon(schema, options?)`

The default export. Accepts an env schema and optional configuration.

**Parameters**

| Option     | Type                                          | Description                                                 |
| ---------- | --------------------------------------------- | ----------------------------------------------------------- |
| `schema`   | `Record<string, SchemaEntry>`                 | Map of environment variable names to field definitions.     |
| `profile`  | `string`                                      | Active profile name. Merges matching entry from `profiles`. |
| `profiles` | `Record<string, Record<string, SchemaEntry>>` | Named profile overrides.                                    |
| `features` | `Record<string, FeatureGate>`                 | Feature gates for runtime toggles.                          |

**SchemaEntry** can be either:

**1. String-based** — Simple type names for everyday use:

| Field         | Type        | Default | Description                          |
| ------------- | ----------- | ------- | ------------------------------------ |
| `type`        | `FieldType` | —       | The type to validate against.        |
| `required`    | `boolean`   | `true`  | Whether the variable must be set.    |
| `default`     | `unknown`   | —       | Default value if not set.            |
| `secret`      | `boolean`   | `false` | Redact value from errors and logs.   |
| `values`      | `string[]`  | —       | Allowed values (only for `"enum"`).  |
| `description` | `string`    | —       | Used when generating `.env.example`. |

| Type      | Zod equivalent                               |
| --------- | -------------------------------------------- |
| `string`  | `z.string()`                                 |
| `url`     | `z.string().url()`                           |
| `number`  | `z.coerce.number()`                          |
| `integer` | `z.coerce.number().int()`                    |
| `boolean` | `"true"` / `"false"` / `"1"` / `"0"` coerced |
| `port`    | integer 1–65535                              |
| `enum`    | requires `values[]`                          |
| `email`   | `z.string().email()`                         |
| `host`    | `z.string()`                                 |

**2. Zod schema** — Advanced users can pass Zod schemas directly:

```ts
{
  PORT: { schema: z.coerce.number().positive().max(9999) },
  WHITELIST: { schema: z.string().regex(/^[\d,]+$/) },
}
```

**Returns**

A config instance with:

| Method / Property             | Description                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ensure()`                    | Validates all env vars. Throws `ConfigValidationError` on failure. Returns the config instance for chaining. |
| `get<T>(key): T`              | Returns the validated value for the given key. Throws if called before `ensure()`.                           |
| `secret`                      | Returns a `Record<string, boolean>` of which keys are marked as secrets.                                     |
| `isEnabled(feature): boolean` | Checks if a feature gate is enabled. Respects env overrides (`FEATURE_<NAME>`).                              |

### TypeScript Types

```ts
import type {
  BeaconOptions,
  Beacon,
  SchemaEntry,
  FieldDefinition,
  FieldType,
  FeatureGate,
  ConfigError,
  ConfigValidationError,
} from "@joinremba/beacon";
```

### Config file (`.beaconrc.json`)

Used by the CLI for `init` and `check` commands:

```json
{
  "schema": {
    "DATABASE_URL": {
      "type": "url",
      "required": true,
      "description": "PostgreSQL connection string"
    },
    "PORT": { "type": "port", "default": 3000, "description": "HTTP server port" },
    "NODE_ENV": {
      "type": "enum",
      "values": ["development", "production"],
      "default": "development"
    },
    "API_KEY": { "type": "string", "required": true, "secret": true }
  },
  "profiles": {
    "production": {
      "DB_HOST": { "type": "host", "required": true, "description": "Production DB hostname" }
    }
  },
  "features": {
    "newDashboard": { "enabled": true, "description": "New dashboard UI" },
    "darkMode": { "enabled": false }
  }
}
```

---

## Examples

### Basic env validation

```ts
import { createBeacon } from "@joinremba/beacon";

const config = createBeacon({
  NODE_ENV: {
    type: "enum",
    values: ["development", "production", "test"],
    default: "development",
  },
  PORT: { type: "port", default: 3000 },
});

config.ensure();
console.log(config.get("PORT"));
```

### With secrets redaction

```ts
const config = createBeacon({
  API_KEY: { type: "string", secret: true },
  DATABASE_URL: { type: "url", secret: true },
});

config.ensure();
// Error messages never show API_KEY or DATABASE_URL values
```

### Custom error handling

```ts
import { ConfigValidationError } from "@joinremba/beacon";

try {
  config.ensure();
} catch (err) {
  if (err instanceof ConfigValidationError) {
    for (const issue of err.errors) {
      console.error(`[${issue.key}] ${issue.message}`);
    }
  }
  process.exit(1);
}
```

### Production profile

```ts
const config = createBeacon(
  {
    DB_HOST: { type: "string", default: "localhost" },
    DB_PORT: { type: "port", default: 5432 },
  },
  {
    profile: "production",
    profiles: {
      production: {
        DB_HOST: { type: "host", required: true },
        DB_PORT: { type: "port", required: true },
      },
    },
  }
);
```

### Feature Gates

Toggle features on/off without redeploying. Define gates in the `features` option and check them with `isEnabled()`:

```ts
const config = createBeacon(
  { DATABASE_URL: { type: "url" } },
  {
    features: {
      newDashboard: { enabled: true },
      darkMode: { enabled: false },
      gradualRollout: { enabled: true, rollout: 0.5 },
    },
  }
);

config.isEnabled("newDashboard"); // true
config.isEnabled("darkMode"); // false
config.isEnabled("gradualRollout"); // true for ~50% of deployments (deterministic hash)
```

**Env overrides** — Any feature can be toggled at runtime via `FEATURE_<NAME>`:

```sh
FEATURE_DARK_MODE=true bun start
```

CamelCase feature names map to `FEATURE_` prefixed uppercase with underscores (`newDashboard` → `FEATURE_NEW_DASHBOARD`). Accepted truthy values: `true`, `1`, `yes`. Everything else is `false`.

| Option        | Type      | Default | Description                                               |
| ------------- | --------- | ------- | --------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | Whether the gate is on by default.                        |
| `rollout`     | `number`  | —       | Percentage of deployments (0–1). Uses deterministic hash. |
| `description` | `string`  | —       | Human-readable description.                               |

### Kill-Switch Flags

Force-disable a feature at runtime — overrides any feature gate. Define kill switches in the `killSwitches` option or set `KILL_<NAME>` env vars:

```ts
const config = createBeacon(
  { DATABASE_URL: { type: "url" } },
  {
    features: { newDashboard: { enabled: true } },
    killSwitches: { newDashboard: true },
  }
);

config.isEnabled("newDashboard"); // false — killed
config.isKilled("newDashboard"); // true
```

**Env override** — `KILL_NEW_DASHBOARD=true` overrides the config. Accepted truthy values: `true`, `1`, `yes`.

When a feature is killed, `isEnabled()` returns `false` regardless of the feature gate configuration.

### Encrypted .env (`beacon encrypt` / `beacon decrypt`)

Commit `.env` files safely using AES-256-GCM encryption. Requires an encryption key passed via `--key` or `BEACON_ENCRYPTION_KEY`.

```sh
# Encrypt .env → .env.encrypted
BEACON_ENCRYPTION_KEY=your-256-bit-key beacon encrypt

# Decrypt back to plaintext
BEACON_ENCRYPTION_KEY=your-256-bit-key beacon decrypt

# Custom paths
beacon encrypt -i .env.prod -o .env.prod.encrypted --key "your-key"
beacon decrypt -i .env.prod.encrypted -o .env.prod --key "your-key"
```

### Secret Rotation Checklist (`beacon rotate`)

Prints a step-by-step checklist for rotating secrets (DB credentials, API keys, etc.):

```sh
beacon rotate
```

Follows the generate → deploy alongside → update consumers → verify → revoke → audit workflow.

### Config Drift Detection (`beacon drift`)

Detects when your actual environment differs from the schema defined in your config:

```sh
beacon drift
beacon drift --profile production
```

Reports missing required variables, type mismatches, and unexpected enum values.

### Docker/Kubernetes Checks (`beacon docker`)

Validates your environment in container contexts — detects Docker and Kubernetes runtimes, checks common container env vars, and runs a full schema validation:

```sh
beacon docker
beacon docker --profile staging
```

---

## Roadmap

**MVP** (current)

- Typed env validation with string-based types and Zod
- Missing variable detection (aggregated errors)
- Secrets redaction in errors and logs
- Local/staging/production profiles
- `.env.example` generation via CLI
- `beacon check` CLI command
- Coloured CLI output with suggestions

**V1** ✅

- Feature gates from local config
- Kill-switch flags (`KILL_<NAME>` env vars, `config.isKilled()`)
- Encrypted `.env` support (`beacon encrypt` / `beacon decrypt`)
- Secret rotation checklist (`beacon rotate`)
- CI validation action (`beacon check` in CI workflows)
- Docker/Kubernetes env checks (`beacon docker`)
- Config drift detection (`beacon drift`)

**V2**

- Hosted team secret sync
- Audit trail for config changes
- Deployment provider integrations
- GitHub Actions integration
- Remba Cloud dashboard

---

## Related Packages

- [@joinremba/catalog](https://github.com/joinremba/catalog) — Production-ready logging and error event layer built on Pino.
- [@joinremba/gate](https://github.com/joinremba/gate) — API safety layer: validation, responses, idempotency, rate limiting, and API keys.

## Social Preview

For sharing on X (Twitter) and other social platforms, use `assets/og-image.svg` as the repository's social preview image in GitHub repo settings:

1. Go to your repo **Settings** → **Social preview** → **Upload image**
2. Select `assets/og-image.svg`
3. Save

This will be used whenever your repo link is shared on social media, Slack, or Discord.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development process, and how to submit pull requests.

## License

MIT &mdash; see [LICENSE](LICENSE).
