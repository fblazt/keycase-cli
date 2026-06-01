import { describe, expect, it } from "vitest";

import { decryptVaultPayload, encryptVaultPayload } from "../../src/core/crypto.js";
import type { VaultPayload } from "../../src/schema/vault.js";

const payload: VaultPayload = {
  version: 1,
  entries: [
    {
      id: "entry-1",
      name: "GitHub",
      username: "human@example.com",
      secret: "super-secret-password",
      url: "https://github.com",
      tags: ["dev", "important"],
      notes: "private note",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("crypto", () => {
  it("encrypts and decrypts a vault payload", async () => {
    const vaultFile = await encryptVaultPayload(payload, "correct horse battery staple");

    await expect(decryptVaultPayload(vaultFile, "correct horse battery staple")).resolves.toEqual(payload);
  });

  it("uses a unique IV and ciphertext for each encryption", async () => {
    const first = await encryptVaultPayload(payload, "correct horse battery staple");
    const second = await encryptVaultPayload(payload, "correct horse battery staple");

    expect(first.cipher.iv).not.toBe(second.cipher.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("fails with the wrong password", async () => {
    const vaultFile = await encryptVaultPayload(payload, "correct horse battery staple");

    await expect(decryptVaultPayload(vaultFile, "wrong password")).rejects.toThrow(
      "Could not decrypt vault. Check your master password and try again.",
    );
  });

  it("fails when ciphertext is tampered", async () => {
    const vaultFile = await encryptVaultPayload(payload, "correct horse battery staple");

    await expect(
      decryptVaultPayload({ ...vaultFile, ciphertext: Buffer.from("tampered").toString("base64") }, "correct horse battery staple"),
    ).rejects.toThrow("Could not decrypt vault. Check your master password and try again.");
  });

  it("fails when auth tag is tampered", async () => {
    const vaultFile = await encryptVaultPayload(payload, "correct horse battery staple");

    await expect(
      decryptVaultPayload(
        {
          ...vaultFile,
          cipher: { ...vaultFile.cipher, authTag: Buffer.from("tampered-tag-1234").toString("base64") },
        },
        "correct horse battery staple",
      ),
    ).rejects.toThrow("Could not decrypt vault. Check your master password and try again.");
  });

  it("does not expose plaintext entry fields in the vault file", async () => {
    const vaultFile = await encryptVaultPayload(payload, "correct horse battery staple");
    const serialized = JSON.stringify(vaultFile);

    expect(serialized).not.toContain("GitHub");
    expect(serialized).not.toContain("human@example.com");
    expect(serialized).not.toContain("https://github.com");
    expect(serialized).not.toContain("dev");
    expect(serialized).not.toContain("private note");
    expect(serialized).not.toContain("super-secret-password");
  });
});
