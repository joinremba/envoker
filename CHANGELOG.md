# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Feature gates: `config.isEnabled(name)` with `features` config and `FEATURE_<NAME>` env overrides
- Kill-switch flags: `config.isKilled(name)` with `killSwitches` config and `KILL_<NAME>` env overrides
- Encrypted `.env` support: `beacon encrypt` / `beacon decrypt` CLI commands (AES-256-GCM)
- Secret rotation checklist: `beacon rotate` CLI command
- Docker/Kubernetes env checks: `beacon docker` CLI command
- Config drift detection: `beacon drift` CLI command

## [0.1.0] - 2026-06-12

### Added

- Initial release
- Environment variable validation with Zod schemas
- Secrets redaction from logs and error messages
- CLI: `beacon init` and `beacon check` commands
- Profiles for environment-specific config
- Config file support (`.beaconrc.json` / `beacon.config.json`)
- Zero runtime overhead — validations run once at boot
