import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Device passwords are encrypted with AES-256-GCM. The key comes from
 * DEVICE_PASSWORD_KEY (32 bytes, base64) or, when unset, is derived from
 * JWT_SECRET so development works without extra setup. Format:
 * v1.<iv>.<tag>.<ciphertext> (base64url).
 */
function key(): Buffer {
  const explicit = process.env.DEVICE_PASSWORD_KEY;
  if (explicit) {
    const bytes = Buffer.from(explicit, "base64");
    if (bytes.length !== 32) throw new Error("DEVICE_PASSWORD_KEY must be 32 bytes, base64-encoded.");
    return bytes;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Set DEVICE_PASSWORD_KEY (or JWT_SECRET) to store device passwords.");
  return Buffer.from(hkdfSync("sha256", secret, "simadrepair", "device-password", 32));
}

export function encryptDevicePassword(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((part) => (typeof part === "string" ? part : part.toString("base64url"))).join(".");
}

export function decryptDevicePassword(sealed: string): string {
  const [version, iv, tag, data] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown password format.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
