# @remba/beacon

Validate environment variables, config, secrets, and runtime feature gates before production breaks.

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

- TypeScript 6 (strict)
- Bun runtime (>=1.3.1)
- Zod ^4.4.2 for runtime validation
- ESLint 8 + Prettier for code quality
- `bun:test` for testing

## Key patterns

- All source lives in `src/`
- Tests are colocated with source: `src/*.test.ts`
- Zod schemas validate environment variables and feature flags at boot
- No runtime dependencies beyond Zod (pure TypeScript library)
- Config is validated eagerly via `ensure()`, then accessed as plain properties
- Secrets are redacted from error messages automatically
- No `any` types allowed (enforced by ESLint)

## npm publishing

- `package.json` is preconfigured with `"publishConfig": { "access": "public" }`
- CI publishes to npm on `v*` git tags via the `publish.yml` workflow
- Publishing uses `npm publish --provenance`
- `NPM_TOKEN` repository secret must be set in GitHub

## Config reference

| Field        | Value                                       |
| ------------ | ------------------------------------------- |
| Package name | `@remba/beacon`                             |
| Licence      | MIT                                         |
| Engine       | `bun >=1.3.1`                               |
| Scripts      | test, typecheck, lint, format, check, build |
