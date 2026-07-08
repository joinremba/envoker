# Contributing to envoker

Thank you for your interest in contributing to Beacon! We welcome contributions from everyone, whether it is a bug report, feature suggestion, documentation improvement, or code change.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behaviour to the project maintainers.

## Getting Started

### Prerequisites

- **Bun 1.3.1+** — Beacon uses Bun as its runtime and package manager. [Install Bun](https://bun.sh/docs/installation) if you have not already.
- **Git** — For version control and contributing via pull requests.

### Fork and clone

1. Fork the repository on GitHub.
2. Clone your fork:

```sh
git clone https://github.com/your-username/envoker.git
cd envoker
```

3. Add the upstream remote:

```sh
git remote add upstream https://github.com/joinremba/envoker.git
```

### Install dependencies

```sh
bun install
```

### Create a branch

```sh
git checkout -b feature/your-feature-name
```

## Development Commands

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `bun test`          | Run tests                                     |
| `bun run typecheck` | TypeScript type checking (`tsc --noEmit`)     |
| `bun run lint`      | ESLint                                        |
| `bun run format`    | Prettier                                      |
| `bun run check`     | All checks (lint + format + typecheck + test) |
| `bun run build`     | Build to `dist/`                              |

## Code Style

- **Prettier** — Formatting is enforced via Prettier with the project's `.prettierrc`. Run `bun run format` before committing.
- **ESLint** — Linting rules are checked by ESLint. Run `bun run lint` to catch issues.
- **Strict TypeScript** — The project enables `strict: true` in `tsconfig.json`. All code must compile without errors.
- **No `any` types** — The use of `any` is forbidden by the ESLint rule `@typescript-eslint/no-explicit-any: error`. This is relaxed only in test files.
- **Use `bun`** — Always use `bun` as the package manager. Never use `npm`, `npx`, or `yarn`.

## Testing Guidelines

- Write tests for all new functionality and bug fixes.
- Place tests alongside the source files they cover: `src/*.test.ts`.
- Use `bun:test` (the built-in Bun test runner) — see existing tests for conventions.
- Aim for high coverage on validation logic and edge cases.
- Run `bun test` before opening a pull request to confirm everything passes.

## Pull Request Process

1. Ensure `bun run check` passes before submitting — this includes lint, format check, typecheck, and tests.
2. Keep pull requests focused — one feature or bug fix per PR.
3. Write clear PR descriptions explaining the **motivation** for the change and the **approach** taken.
4. Update the README if the public API or behaviour changes.
5. Add or update tests to cover your changes.
6. Request a review from the project maintainers.

## Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

**Format:**

```
type(scope): description
```

**Types:**

| Type       | Usage                              |
| ---------- | ---------------------------------- |
| `feat`     | A new feature                      |
| `fix`      | A bug fix                          |
| `chore`    | Maintenance, tooling, dependencies |
| `docs`     | Documentation changes              |
| `test`     | Adding or updating tests           |
| `refactor` | Code refactoring                   |
| `style`    | Formatting, whitespace             |
| `ci`       | CI configuration changes           |

**Examples:**

```
feat(beacon): add support for nested env schemas
fix(beacon): handle missing env vars gracefully
docs(beacon): document secrets redaction behaviour
test(beacon): add tests for feature gate defaults
```

## Reporting Issues

### Bug reports

When filing a bug report, please include:

- A clear description of the expected behaviour versus the actual behaviour.
- Steps to reproduce the issue, ideally with a minimal code snippet.
- Your environment details (Bun version, OS, package version).

### Feature requests

Feature requests are welcome. Please describe:

- The problem you are trying to solve.
- The proposed solution and how it would work.
- Any alternative approaches you have considered.

## Getting Help

If you need help or have questions, please open a [discussion](https://github.com/joinremba/envoker/discussions) or create an [issue](https://github.com/joinremba/envoker/issues).

## Publishing

This package is published to npm as `envoker`.

### Prerequisites

- You need npm publishing rights for the `envoker` package.
- You need a valid npm OTP (one-time password) for 2FA.

### Release process

1. Update the version in `package.json` and `CHANGELOG.md` following [Semantic Versioning](https://semver.org/).
2. Commit and tag the release:
   ```sh
   git commit -m "chore: release v<version>"
   git tag v<version>
   git push && git push --tags
   ```
3. Build and publish with provenance:
   ```sh
   bun run build
   bun publish --provenance
   ```
   The `--provenance` flag attaches [npm provenance](https://docs.npmjs.com/generating-provenance-statements) to the published package, linking it to the GitHub Actions workflow that published it. This requires:
   - The publish to run in GitHub Actions (not locally)
   - The workflow to have `id-token: write` permission
   - The repository to be public

### Local publish (no provenance)

If you must publish locally (not recommended):

```sh
bun publish
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) for details.
