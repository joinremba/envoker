# @remba/beacon

[![npm version](https://img.shields.io/npm/v/@remba/beacon.svg)](https://www.npmjs.com/package/@remba/beacon)
[![Licence](https://img.shields.io/npm/l/@remba/beacon.svg)](LICENSE)
[![CI](https://github.com/joinremba/beacon/actions/workflows/ci.yml/badge.svg)](https://github.com/joinremba/beacon/actions/workflows/ci.yml)
![Bun](https://img.shields.io/badge/Bun-%3E%3D1.3.1-black)

Beacon helps TypeScript teams boot applications safely by validating environment variables, config, secrets, and runtime feature gates before production breaks.

## Features

- **Schema-based validation** — Define Zod schemas for your environment and config. Catch missing or malformed values at startup.
- **Secrets redaction** — Keep secrets out of logs and error messages automatically.
- **Feature gates** — Toggle runtime features with typed, validated flags.
- **Zero runtime overhead** — Validations run once at boot. After that, access is plain property reads.

## Installation

```sh
bun add @remba/beacon
```

## Quick Start

```ts
import { createConfig } from "@remba/beacon";

const config = createConfig({
  env: {
    DATABASE_URL: { schema: z.string().url(), secret: true },
    PORT: { schema: z.coerce.number().default(3000) },
  },
  features: {
    NEW_ONBOARDING: { default: false },
  },
});

config.ensure(); // throws if any required env var is missing
config.DATABASE_URL; // string
config.isEnabled("NEW_ONBOARDING"); // false
```

## API Reference

### `createConfig(options)`

The default export. Accepts a `ConfigOptions` object and returns a typed config proxy.

**Parameters**

| Option     | Type             | Description                                   |
| ---------- | ---------------- | --------------------------------------------- |
| `env`      | `EnvSchemaMap`   | Map of environment variable names to schemas. |
| `features` | `FeatureFlagMap` | Map of feature flag names to defaults.        |

**Returns**

A config object with:

- **`ensure()`** — Validates all environment variables against their schemas. Throws an `AggregateError` with all validation errors if any are invalid. Call once at startup.
- **Property access** — Validated config values are accessible directly as properties (e.g. `config.DATABASE_URL`).
- **`isEnabled(feature: string): boolean`** — Checks whether a named feature gate is enabled.

### TypeScript Types

```ts
import type { ConfigOptions, Config, EnvSchemaMap, FeatureFlagMap } from "@remba/beacon";
```

| Type             | Description                                         |
| ---------------- | --------------------------------------------------- |
| `ConfigOptions`  | Input options for `createConfig`.                   |
| `Config`         | Return type of `createConfig`.                      |
| `EnvSchemaMap`   | Record of env variable names to `EnvSchemaEntry`.   |
| `FeatureFlagMap` | Record of feature flag names to `FeatureFlagEntry`. |

## Examples

### Basic env validation

```ts
import { createConfig } from "@remba/beacon";
import { z } from "zod";

const config = createConfig({
  env: {
    NODE_ENV: { schema: z.enum(["development", "production", "test"]) },
    PORT: { schema: z.coerce.number().positive().default(3000) },
  },
});

config.ensure();
console.log(config.PORT); // 3000 (or the value of $PORT)
```

### With secrets redaction

```ts
const config = createConfig({
  env: {
    API_KEY: { schema: z.string(), secret: true },
    DATABASE_URL: { schema: z.string().url(), secret: true },
  },
});

config.ensure();
// config.API_KEY and config.DATABASE_URL are redacted in error messages and logs
```

### Feature gates in practice

```ts
const config = createConfig({
  features: {
    DARK_MODE: { default: false },
    NEW_DASHBOARD: { default: true },
  },
});

if (config.isEnabled("NEW_DASHBOARD")) {
  // render new dashboard
}
```

### Custom error handling

```ts
try {
  config.ensure();
} catch (err) {
  if (err instanceof AggregateError) {
    for (const issue of err.errors) {
      console.error(`Config error: ${issue.message}`);
    }
  }
  process.exit(1);
}
```

### Nested config

```ts
const config = createConfig({
  env: {
    REDIS_HOST: { schema: z.string().default("localhost") },
    REDIS_PORT: { schema: z.coerce.number().default(6379) },
    DB_HOST: { schema: z.string() },
    DB_PORT: { schema: z.coerce.number() },
  },
});

config.ensure();

const redis = { host: config.REDIS_HOST, port: config.REDIS_PORT };
const db = { host: config.DB_HOST, port: config.DB_PORT };
```

## Related Packages

- [@remba/catalog](https://github.com/joinremba/catalog) — Centralised service catalogue for your microservice architecture.
- [@remba/gate](https://github.com/joinremba/gate) — Lightweight API gateway proxy for Bun servers.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development process, and how to submit pull requests.

## License

MIT &mdash; see [LICENSE](LICENSE).
