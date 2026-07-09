import { expect, test, describe } from "bun:test";
import { generateEnvExample, runCheck } from "./cli-config";
import type { EnvokerConfigFile } from "./cli-config";

describe("generateEnvExample", () => {
  test("generates basic env example", () => {
    const config: EnvokerConfigFile = {
      schema: {
        DATABASE_URL: { type: "url", required: true, description: "PostgreSQL connection string" },
        PORT: { type: "port", default: 3000, description: "HTTP server port" },
        NODE_ENV: {
          type: "enum",
          values: ["development", "production"],
          default: "development",
        },
      },
    };

    const result = generateEnvExample(config);
    expect(result).toContain("DATABASE_URL");
    expect(result).toContain("PostgreSQL connection string");
    expect(result).toContain("PORT=3000");
    expect(result).toContain("development | production");
  });

  test("includes profile override when activeProfile is set", () => {
    const config: EnvokerConfigFile = {
      schema: {
        DB_HOST: { type: "string", default: "localhost" },
      },
      profiles: {
        production: {
          DB_HOST: { type: "host", required: true, description: "Production DB host" },
        },
      },
    };

    const result = generateEnvExample(config, "production");
    expect(result).toContain("Profile: production");
    expect(result).toContain("Production DB host");
  });

  test("marks secret vars", () => {
    const config: EnvokerConfigFile = {
      schema: {
        API_KEY: { type: "string", secret: true, description: "API secret key" },
      },
    };

    const result = generateEnvExample(config);
    expect(result).toContain("Secret: yes");
  });
});

describe("runCheck", () => {
  test("returns ok for present and valid env vars", async () => {
    const prev = process.env.TEST_DB_URL;
    process.env.TEST_DB_URL = "https://example.com/db";
    try {
      const config: EnvokerConfigFile = {
        schema: {
          TEST_DB_URL: { type: "url", required: true },
        },
      };
      const result = await runCheck(config);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe("ok");
    } finally {
      if (prev === undefined) delete process.env.TEST_DB_URL;
      else process.env.TEST_DB_URL = prev;
    }
  });

  test("returns missing for absent required var", async () => {
    delete process.env.TEST_MISSING;
    const config: EnvokerConfigFile = {
      schema: {
        TEST_MISSING: { type: "string", required: true },
      },
    };
    const result = await runCheck(config);
    expect(result.results[0]?.status).toBe("missing");
  });

  test("redacts secret values on invalid", async () => {
    const prev = process.env.TEST_SECRET;
    process.env.TEST_SECRET = "my-secret-value-that-should-not-leak";
    try {
      const config: EnvokerConfigFile = {
        schema: {
          TEST_SECRET: { type: "integer", secret: true },
        },
      };
      const result = await runCheck(config);
      expect(result.results[0]?.status).toBe("invalid");
      expect(result.results[0]?.message).not.toContain("my-secret-value");
      expect(result.errors[0]?.message).not.toContain("my-secret-value");
    } finally {
      if (prev === undefined) delete process.env.TEST_SECRET;
      else process.env.TEST_SECRET = prev;
    }
  });
});
