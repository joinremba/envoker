import type { z } from "zod";
import type { Client } from "./internal/client";

export type FieldType =
  "string" | "url" | "number" | "integer" | "boolean" | "enum" | "port" | "host" | "email";

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

export interface EnvokerOptions {
  profile?: string;
  profiles?: Record<string, Record<string, SchemaEntry>>;
  features?: Record<string, FeatureGate>;
  killSwitches?: Record<string, boolean>;
  client?: Client;
}

export interface EnsureOptions {
  /** When true (default), throws ConfigValidationError for missing required vars.
   *  When false, silently skips missing required vars — useful in test environments. */
  strict?: boolean;
}

export interface Envoker {
  ensure(options?: EnsureOptions): Promise<Envoker>;
  get<T = unknown>(key: string): T;
  getAll(): Record<string, unknown>;
  readonly secret: Record<string, boolean>;
  isKilled(feature: string): boolean;
  isEnabled(feature: string): boolean;
}
