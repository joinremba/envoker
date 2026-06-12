# @joinremba/beacon

Runtime configuration, environment validation, secrets, and feature gates for TypeScript backends.

## Commands

| Command             | Description                            |
| ------------------- | -------------------------------------- |
| `bun test`          | Run tests                              |
| `bun run typecheck` | `tsc --noEmit`                         |
| `bun run lint`      | ESLint                                 |
| `bun run format`    | Prettier                               |
| `bun run check`     | lint + format:check + typecheck + test |
| `bun run build`     | Build to `dist/`                       |

## Stack

- TypeScript 6 (strict), Bun runtime, Zod ^4.4.2
- ESLint 8 + Prettier for code quality

## Key API

- `createBeacon(schema, options?)` — Main export. First arg is a flat env schema. Second optional arg accepts `{ profile, profiles }`.
- `config.ensure()` — Validates all env vars against their schemas. Throws `ConfigValidationError` with all errors collected.
- `config.get<T>(key)` — Returns the validated value. Throws if called before `ensure()`.
- `config.secret` — Read-only `Record<string, boolean>` of which keys are marked as secrets.

## Patterns

- All source in `src/`
- Tests colocated with source: `src/*.test.ts`
- String-based field types (`"url"`, `"port"`, `"enum"`, etc.) map to Zod schemas internally
- Zod schemas also accepted directly: `{ schema: z.string().min(1) }`
- `required: true` by default; set `required: false` or provide `default` for optional vars
- `secret: true` redacts values in error messages
- CLI scaffold exists in `src/cli.ts` (`beacon init`, `beacon check`)
- No `any` types allowed (enforced by ESLint)

## npm Publishing

- `publishConfig.access: public`
- CI publishes on `v*` tags via `npm publish --provenance`
- `NPM_TOKEN` secret required in GitHub

## Config Reference

| Field        | Value                     |
| ------------ | ------------------------- |
| Package name | `@joinremba/beacon`           |
| Licence      | MIT                       |
| Engine       | `bun >=1.3.1`             |
| Runtime deps | zod                       |
| Bin          | `beacon` → `./src/cli.ts` |
