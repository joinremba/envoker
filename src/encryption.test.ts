import { test, expect } from "bun:test";
import { encryptEnv, decryptEnv } from "./encryption";

test("encrypts and decrypts env content", async () => {
  const key = "test-encryption-key-32bytes!";
  const envContent = `DATABASE_URL=postgres://localhost/mydb
API_KEY=supersecret123
PORT=3000`;

  const encrypted = await encryptEnv(envContent, key);
  expect(typeof encrypted).toBe("string");
  expect(encrypted.length).toBeGreaterThan(0);

  const decrypted = await decryptEnv(encrypted, key);
  expect(decrypted).toBe(envContent);
});

test("rejects wrong key", async () => {
  const key = "correct-key-32bytes!!!!!";
  const envContent = "SECRET=value";
  const encrypted = await encryptEnv(envContent, key);
  const result = await decryptEnv(encrypted, "wrong-key-32bytes!!!!!!").catch(() => "error");
  expect(result).toBe("error");
});
