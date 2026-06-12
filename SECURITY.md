# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in @joinremba/beacon, please report it by emailing **bensxnisaac@gmail.com**. You may also open a [private security advisory](https://github.com/joinremba/beacon/security/advisories/new) on GitHub.

Please do **not** report security vulnerabilities through public GitHub issues.

## Response Time

We aim to acknowledge receipt of your report within **48 hours** and will work with you to understand and address the issue promptly. We will keep you informed of progress throughout the process.

## Supported Versions

Only the **latest published version** of @joinremba/beacon receives security updates. We do not provide patches for older versions.

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

## Security Best Practices

When using @joinremba/beacon, please follow these guidelines:

- **Validate all external input** — Always use Zod schemas to validate environment variables and configuration values. Never trust raw `process.env` values.
- **Keep Zod up to date** — Zod is the only runtime dependency. Regularly update to the latest version to receive security fixes.
- **No secrets in logs** — Mark sensitive environment variables with `secret: true` in your schema so that Beacon redacts them from error messages and logs.
- **Never commit secrets** — Do not hardcode secrets in source code or configuration files. Use environment variables or a secure secrets manager.
- **Run validations at startup** — Call `config.ensure()` during application bootstrap so that misconfigurations are caught early, before serving traffic.
