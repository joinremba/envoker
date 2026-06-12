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

| Method / Property | Description                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `ensure()`        | Validates all env vars. Throws `ConfigValidationError` on failure. Returns the config instance for chaining. |
| `get<T>(key): T`  | Returns the validated value for the given key. Throws if called before `ensure()`.                           |
| `secret`          | Returns a `Record<string, boolean>` of which keys are marked as secrets.                                     |

### TypeScript Types

```ts
import type {
  BeaconOptions,
  Beacon,
  SchemaEntry,
  FieldDefinition,
  FieldType,
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

**V1**

- Feature gates from local config
- Kill-switch flags
- Encrypted `.env` support
- Secret rotation checklist
- CI validation action
- Docker/Kubernetes env checks
- Config drift detection

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
