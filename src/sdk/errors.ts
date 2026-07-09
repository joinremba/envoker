export class ConfigError extends Error {
  readonly key: string;
  readonly redacted: boolean;

  constructor(key: string, message: string, redacted = false) {
    super(message);
    this.name = "ConfigError";
    this.key = key;
    this.redacted = redacted;
  }
}

export class ConfigValidationError extends AggregateError {
  constructor(errors: ConfigError[]) {
    super(errors, "Configuration validation failed");
    this.name = "ConfigValidationError";
  }
}
