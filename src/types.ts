import type { z } from "zod";

export type FieldType =
  | "string"
  | "url"
  | "number"
  | "integer"
  | "boolean"
  | "enum"
  | "port"
  | "host"
  | "email";

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  default?: unknown;
  secret?: boolean;
  values?: readonly string[];
  description?: string;
}

export interface FieldDefinitionWithSchema {
  schema: z.ZodType;
  required?: boolean;
  secret?: boolean;
  description?: string;
}

export type SchemaEntry = FieldDefinition | FieldDefinitionWithSchema;

export interface FeatureGate {
  enabled: boolean;
  rollout?: number;
  description?: string;
}

export interface BeaconOptions {
  profile?: string;
  profiles?: Record<string, Record<string, SchemaEntry>>;
  features?: Record<string, FeatureGate>;
  killSwitches?: Record<string, boolean>;
}

export interface EnsureOptions {
  /** When true (default), throws ConfigValidationError for missing required vars.
   *  When false, silently skips missing required vars — useful in test environments. */
  strict?: boolean;
}

export interface Beacon {
  ensure(options?: EnsureOptions): Beacon;
  get<T = unknown>(key: string): T;
  readonly secret: Record<string, boolean>;
  isEnabled(feature: string): boolean;
  isKilled(feature: string): boolean;
}
