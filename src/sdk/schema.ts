import { z } from "zod";

export interface SchemaField {
  type?: string;
  default?: unknown;
  values?: readonly string[];
}

export function typeToSchema(field: SchemaField): z.ZodType<unknown> {
  const type = field.type ?? "string";
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
        .refine((v) => ["true", "false", "1", "0", "yes", "no"].includes(v), {
          message: "Expected one of: true, false, 1, 0, yes, no",
        })
        .transform((v) => v === "true" || v === "1" || v === "yes")
        .pipe(z.boolean());
      break;
    case "enum": {
      const values = field.values;
      if (!values || values.length === 0) {
        throw new Error("Enum field must have values defined");
      }
      base = z.enum(values as [string, ...string[]]);
      break;
    }
    case "port":
      base = z.coerce.number().int().min(1).max(65535);
      break;
    case "email":
      base = z.string().email();
      break;
    default:
      base = z.string();
  }

  if (field.default !== undefined) {
    base = base.default(field.default as string | number | boolean);
  }

  return base;
}
