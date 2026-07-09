import { z } from "zod";
import type {
  Envoker as EnvokerInterface,
  EnvokerOptions,
  EnsureOptions,
  FeatureGate,
  FieldDefinition,
  FieldDefinitionWithSchema,
  SchemaEntry,
  FieldType,
} from "./types";
import { ConfigError, ConfigValidationError } from "./errors";
import { typeToSchema } from "./schema";

export type {
  EnvokerOptions,
  EnsureOptions,
  FeatureGate,
  FieldDefinition,
  FieldDefinitionWithSchema,
  SchemaEntry,
  FieldType,
};
export { ConfigError, ConfigValidationError };
export type { EnvokerInterface as Envoker };

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
    const hasDefault = entry.schema.safeParse(undefined).success;
    return {
      schema: entry.schema,
      required: entry.required ?? true,
      secret: entry.secret ?? false,
      hasDefault,
      description: entry.description,
    };
  }
  const field = entry as FieldDefinition;
  const schema = typeToSchema(field);
  return {
    schema,
    required: field.required ?? true,
    secret: field.secret ?? false,
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

export function createEnvoker(
  schema: Record<string, SchemaEntry>,
  options?: EnvokerOptions
): EnvokerInterface {
  const client = options?.client;
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

  const envoker: EnvokerInterface = {
    async ensure(options?: EnsureOptions): Promise<EnvokerInterface> {
      const strict = options?.strict ?? true;
      const errors: ConfigError[] = [];

      if (client) {
        try {
          const remote = await client.getConfig();
          for (const entry of remote) {
            if (process.env[entry.key] !== undefined) continue;
            if (mergedSchema[entry.key]) continue;
            (validated ??= {})[entry.key] = entry.value;
          }
        } catch {
          // Network error — fall back to local-only
        }
      }

      for (const { key, schema, required, secret, hasDefault } of resolved) {
        const raw = process.env[key];
        const isMissing = raw === undefined || raw === "";

        if (isMissing) {
          if (hasDefault) {
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
      return envoker;
    },

    get<T = unknown>(key: string): T {
      if (validated === null) {
        throw new ConfigError(key, "Call envoker.ensure() before accessing config values");
      }
      if (!(key in validated)) {
        throw new ConfigError(key, `Unknown config key: ${key}`);
      }
      return validated[key] as T;
    },

    getAll(): Record<string, unknown> {
      if (validated === null) {
        throw new ConfigError("envoker", "Call envoker.ensure() before accessing config values");
      }
      return { ...validated };
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

  return envoker;
}

export default createEnvoker;
