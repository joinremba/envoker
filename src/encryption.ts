const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

function keyToBuf(key: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(key.byteLength);
  new Uint8Array(buf).set(key);
  return buf;
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(password);
  const raw =
    encoded.length >= 32
      ? encoded.slice(0, 32)
      : (() => {
          const p = new Uint8Array(32);
          p.set(encoded);
          return p;
        })();
  return crypto.subtle.importKey("raw", keyToBuf(raw), { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptEnv(envContent: string, key: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const cryptoKey = await deriveKey(key);
  const data = new TextEncoder().encode(envContent);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    cryptoKey,
    data
  );

  const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), IV_LENGTH);

  return Buffer.from(combined).toString("base64");
}

export async function decryptEnv(encryptedBase64: string, key: string): Promise<string> {
  const combined = Buffer.from(encryptedBase64, "base64");
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);

  const cryptoKey = await deriveKey(key);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    cryptoKey,
    data
  );

  return new TextDecoder().decode(decrypted);
}
