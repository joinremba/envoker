import { z } from "zod";
import type {
  Beacon as BeaconInterface,
  BeaconOptions,
  EnsureOptions,
  FeatureGate,
  FieldDefinition,
  FieldDefinitionWithSchema,
  SchemaEntry,
  FieldType,
} from "./types";
import { ConfigError, ConfigValidationError } from "./errors";

export type {
  BeaconOptions,
  FeatureGate,
  FieldDefinition,
  FieldDefinitionWithSchema,
  SchemaEntry,
  FieldType,
};
export { ConfigError, ConfigValidationError };
export type { BeaconInterface as Beacon };

const typeToSchema = (entry: FieldDefinition): { schema: z.ZodType<unknown>; secret: boolean } => {
  const secret = entry.secret ?? false;
  const { type } = entry;

  let base: z.ZodType<unknown>;

  switch (type) {
    case "string":
    case "host":
      base = z.string();
      break;
    case "url":
      base = z.string().url();
      break;
    case "number":
      base = z.coerce.number();
      break;
    case "integer":
      base = z.coerce.number().int();
      break;
    case "boolean":
      base = z
        .string()
        .transform((v) => v === "true" || v === "1")
        .pipe(z.boolean());
      break;
    case "enum":
      if (!entry.values || entry.values.length === 0) {
        throw new Error(`Enum field must have values defined`);
      }
      base = z.enum(entry.values as [string, ...string[]]);
      break;
    case "port":
      base = z.coerce.number().int().min(1).max(65535);
      break;
    case "email":
      base = z.string().email();
      break;
    default:
      base = z.string();
  }

  if (entry.default !== undefined) {
    base = base.default(entry.default);
  }

  return { schema: base, secret };
};

const resolveEntry = (
  entry: SchemaEntry
): {
  schema: z.ZodType<unknown>;
  required: boolean;
  secret: boolean;
  hasDefault: boolean;
  description?: string;
} => {
  if ("schema" in entry && entry.schema instanceof z.ZodType) {
    return {
      schema: entry.schema,
      required: entry.required ?? true,
      secret: entry.secret ?? false,
      hasDefault: false,
      description: entry.description,
    };
  }
  const field = entry as FieldDefinition;
  const { schema, secret } = typeToSchema(field);
  return {
    schema,
    required: field.required ?? true,
    secret,
    hasDefault: field.default !== undefined,
    description: field.description,
  };
};

const SECRET_CENSOR = "[REDACTED]";

const featureEnvName = (name: string): string =>
  `FEATURE_${name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase()}`;

const parseEnvBoolean = (val: string): boolean => val === "true" || val === "1" || val === "yes";

const featureRollup = (name: string): number => {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 10000) / 10000;
};

export function createBeacon(
  schema: Record<string, SchemaEntry>,
  options?: BeaconOptions
): BeaconInterface {
  const mergedSchema: Record<string, SchemaEntry> = { ...schema };

  if (options?.profile && options?.profiles?.[options.profile]) {
    Object.assign(mergedSchema, options.profiles[options.profile]);
  }

  const entries = Object.entries(mergedSchema);
  const resolved = entries.map(([key, entry]) => ({
    key,
    ...resolveEntry(entry),
  }));
  const secretKeys = new Set(resolved.filter((e) => e.secret).map((e) => e.key));

  let validated: Record<string, unknown> | null = null;
  const features: Record<string, FeatureGate> = options?.features ?? {};
  const killSwitches: Record<string, boolean> = options?.killSwitches ?? {};

  const beacon: BeaconInterface = {
    ensure(options?: EnsureOptions): BeaconInterface {
      const strict = options?.strict ?? true;
      const errors: ConfigError[] = [];

      for (const { key, schema, required, secret, hasDefault } of resolved) {
        const raw = process.env[key];
        const isMissing = raw === undefined || raw === "";

        if (isMissing && hasDefault) {
          try {
            const parsed = schema.parse(undefined);
            (validated ??= {})[key] = parsed;
          } catch (err) {
            if (err instanceof z.ZodError) {
              errors.push(
                new ConfigError(
                  key,
                  `Environment variable ${key}: ${err.issues[0]?.message ?? "Invalid value"}`,
                  secret
                )
              );
            }
          }
          continue;
        }

        if (isMissing) {
          if (!required) continue;
          if (!strict) continue;
          errors.push(
            new ConfigError(key, `Missing required environment variable: ${key}`, secret)
          );
          continue;
        }

        try {
          const parsed = schema.parse(raw);
          (validated ??= {})[key] = parsed;
        } catch (err) {
          if (err instanceof z.ZodError) {
            const issue = err.issues[0];
            const val = secret ? SECRET_CENSOR : raw;
            if (!strict) continue;
            errors.push(
              new ConfigError(
                key,
                `Environment variable ${key}=${val}: ${issue?.message ?? "Invalid value"}`,
                secret
              )
            );
          }
        }
      }

      if (errors.length > 0) {
        throw new ConfigValidationError(errors);
      }

      validated ??= {};
      return beacon;
    },

    get<T = unknown>(key: string): T {
      if (validated === null) {
        throw new ConfigError(key, "Call beacon.ensure() before accessing config values");
      }
      if (!(key in validated)) {
        throw new ConfigError(key, `Unknown config key: ${key}`);
      }
      return validated[key] as T;
    },

    get secret(): Record<string, boolean> {
      const map: Record<string, boolean> = {};
      for (const key of secretKeys) {
        map[key] = true;
      }
      return map;
    },

    isKilled(feature: string): boolean {
      const envName = `KILL_${feature
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toUpperCase()}`;
      const envVal = process.env[envName];
      if (envVal !== undefined && envVal !== "") {
        return parseEnvBoolean(envVal);
      }
      return killSwitches[feature] ?? false;
    },

    isEnabled(feature: string): boolean {
      if (this.isKilled(feature)) return false;
      const envName = featureEnvName(feature);
      const envVal = process.env[envName];
      if (envVal !== undefined && envVal !== "") {
        return parseEnvBoolean(envVal);
      }
      const gate = features[feature];
      if (!gate) return false;
      if (!gate.enabled) return false;
      if (gate.rollout !== undefined) {
        return featureRollup(feature) < gate.rollout;
      }
      return true;
    },
  };

  return beacon;
}

export default createBeacon;
