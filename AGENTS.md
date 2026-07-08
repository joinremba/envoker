## Commands

```bash
bun test                  # Run all tests
bun run typecheck         # TypeScript check (tsc --noEmit)
bun run format            # Prettier
bun run lint              # ESLint
bun run check             # All checks: lint + format:check + typecheck + test
```

## Architecture

- **`envoker`** — env var validation, feature gates, kill switches, CLI tool.
- **`src/index.ts`** — `createBeacon(schema, options?)` → returns `Beacon` with `ensure()`, `get()`, `isEnabled()`, `isKilled()`.
- **`src/types.ts`** — `FieldDefinition`, `SchemaEntry`, `BeaconOptions`, `FeatureGate`, `EnsureOptions`.
- **`src/schema.ts`** — shared `typeToSchema()` used by both `index.ts` and `cli-config.ts`. Handles all field types + defaults.
- **`src/errors.ts`** — `ConfigError` (key + message + redacted flag), `ConfigValidationError` (aggregate).
- **`src/cli.ts`** — CLI entry point (`beacon`); parses args, dispatches to handlers.
- **`src/cli-config.ts`** — config file loading (`loadConfig`), `.env.example` generation (`generateEnvExample`), env validation (`runCheck`).
- **`src/cli-format.ts`** — terminal formatting: colors, icons, check results, levenshtein suggestion.
- **`src/encryption.ts`** — AES-256-GCM encrypt/decrypt with HKDF key derivation from a password.

## Patterns

- **Named exports only** (no `export default` except `index.ts` which defaults to `createBeacon`).
- **`ensure({ strict: false })`** skips missing required vars without throwing — use in test/bootstrap envs.
- **Schema module** (`src/schema.ts`) is the single source of truth for type coercion — CLI and library use the same logic.
- **Secrets** are always redacted to `[REDACTED]` in validation error messages and CLI output.
- **Encryption** uses HKDF-SHA256 for key derivation (not raw slice).
- **Env cleanup**: tests restore `process.env` in `beforeEach` to prevent cross-test pollution.
