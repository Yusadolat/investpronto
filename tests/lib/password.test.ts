import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { hashPassword, isLegacyPasswordHash, verifyPassword } from "../../src/lib/password";

test("hashPassword produces a non-legacy salted hash", () => {
  const hash = hashPassword("investor-portal-123");

  assert.equal(isLegacyPasswordHash(hash), false);
  assert.notEqual(
    hash,
    crypto.createHash("sha256").update("investor-portal-123").digest("hex")
  );
  assert.equal(verifyPassword("investor-portal-123", hash), true);
});

test("verifyPassword still accepts legacy sha256 hashes for migration", () => {
  const legacyHash = crypto
    .createHash("sha256")
    .update("legacy-password")
    .digest("hex");

  assert.equal(isLegacyPasswordHash(legacyHash), true);
  assert.equal(verifyPassword("legacy-password", legacyHash), true);
  assert.equal(verifyPassword("wrong-password", legacyHash), false);
});
