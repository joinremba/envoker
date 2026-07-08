# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2026-06-21

### Fixed

- `beacon check` now validates Zod-schema entries (was always reporting them as ok)
- `beacon check` now redacts secrets for Zod-schema entries (was leaking plaintext)
- Boolean validation rejects invalid values with a clear error message instead of silently coercing to `false`
- `--all-profiles -o <file>` no longer overwrites all profiles to the same file — default profile only
- `EnsureOptions` type now exported from package entry point

### Changed

- Remba cloud client moved to devDependencies (type-only usage at runtime)

## [0.4.0] - 2026-06-13

### Added

- `client?: Client` option to `createBeacon()` — accepts a Remba cloud client for remote config
- Remote config merging: `ensure()` fetches `client.getConfig()` and fills keys not in schema/env
- Shared `typeToSchema()` module (`src/schema.ts`) — single source of truth for field type coercion
- CLI tests for `runCheck`, secret redaction, and env validation

### Fixed

- Zod schema entries with `.default()` now auto-detect the default in `resolveEntry()` (B1)
- CLI no longer leaks secret values in validation error messages (B2)
- Boolean fields now accept `"yes"` alongside `"true"` and `"1"` (B3)
- Encryption uses HKDF-SHA256 key derivation instead of raw `slice(0, 32)` (B5)
- Enum fields with missing/empty `values` now throw a descriptive error instead of a cryptic Zod crash (B6)
- `ensure({ strict: false })` now applies defaults to missing vars before skipping (B9)
- Tests restore `process.env` in `beforeEach` instead of `beforeAll` to prevent cross-test pollution (B8)

## [0.3.0] - 2026-06-12

### Added

- Feature gates: `config.isEnabled(name)` with `features` config and `FEATURE_<NAME>` env overrides
- Kill-switch flags: `config.isKilled(name)` with `killSwitches` config and `KILL_<NAME>` env overrides
- Encrypted `.env` support: `beacon encrypt` / `beacon decrypt` CLI commands (AES-256-GCM)
- Secret rotation checklist: `beacon rotate` CLI command
- Docker/Kubernetes env checks: `beacon docker` CLI command
- Config drift detection: `beacon drift` CLI command

### Fixed

- `beacon init` now creates `.beaconrc.json` template when no config file exists
- `beacon init -c <missing>` now shows an error instead of generating empty output
- `beacon init --profile <name>` generates `.env.example.<profile>` — no more overwrites
- `beacon init --all-profiles` generates one file per profile
- Flags passed without a command (`beacon -c ./foo`) now show a "Missing command" error

## [0.1.0] - 2026-06-12

### Added

- Initial release
- Environment variable validation with Zod schemas
- Secrets redaction from logs and error messages
- CLI: `beacon init` and `beacon check` commands
- Profiles for environment-specific config
- Config file support (`.beaconrc.json` / `beacon.config.json`)
- Zero runtime overhead — validations run once at boot
