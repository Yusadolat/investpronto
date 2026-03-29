import crypto from "crypto";

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_KEY_LENGTH = 64;

function sha256(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function isLegacyPasswordHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, SCRYPT_KEY_LENGTH)
    .toString("hex");

  return `${SCRYPT_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  if (isLegacyPasswordHash(hash)) {
    return sha256(password) === hash;
  }

  const [algorithm, salt, storedKey] = hash.split("$");
  if (
    algorithm !== SCRYPT_PREFIX ||
    !salt ||
    !storedKey
  ) {
    return false;
  }

  const derivedKey = crypto
    .scryptSync(password, salt, SCRYPT_KEY_LENGTH)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(derivedKey, "hex"),
    Buffer.from(storedKey, "hex")
  );
}
