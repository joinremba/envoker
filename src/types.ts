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

export interface Beacon {
  ensure(): Beacon;
  get<T = unknown>(key: string): T;
  readonly secret: Record<string, boolean>;
  isEnabled(feature: string): boolean;
  isKilled(feature: string): boolean;
}
