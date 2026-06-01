import { describe, expect, it } from "vitest";

import { toPublicVaultEntry } from "../../src/schema/entry.js";
import { parseVaultFile, vaultPayloadSchema, type VaultEntry, type VaultFile } from "../../src/schema/vault.js";
import { getDefaultVaultPath } from "../../src/utils/paths.js";

const timestamp = "2026-01-01T00:00:00.000Z";

function createEntry(overrides: Partial<VaultEntry> = {}): VaultEntry {
  return {
    id: "entry-1",
    name: "GitHub",
    username: "human@example.com",
    secret: "super-secret",
    url: "https://github.com",
    tags: ["dev"],
    notes: "Recovery codes stored separately.",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createVaultFile(overrides: Partial<VaultFile> = {}): VaultFile {
  return {
    version: 1,
    kdf: {
      name: "argon2id",
      salt: "c2FsdA==",
      params: { memoryCost: 65536, timeCost: 3, parallelism: 1 },
    },
    cipher: {
      name: "aes-256-gcm",
      iv: "aXY=",
      authTag: "dGFn",
    },
    ciphertext: "Y2lwaGVydGV4dA==",
    ...overrides,
  };
}

describe("schemas", () => {
  it("accepts a valid vault payload", () => {
    const result = vaultPayloadSchema.safeParse({
      version: 1,
      entries: [createEntry()],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid vault payload", () => {
    const result = vaultPayloadSchema.safeParse({
      version: 1,
      entries: [createEntry({ name: "" })],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid vault file envelope", () => {
    expect(parseVaultFile(createVaultFile())).toEqual(createVaultFile());
  });

  it("rejects an invalid vault file envelope", () => {
    expect(() => parseVaultFile({ ...createVaultFile(), ciphertext: "" })).toThrow("Invalid vault file.");
  });

  it("fails unsupported vault versions with a clear error", () => {
    expect(() => parseVaultFile({ ...createVaultFile(), version: 2 })).toThrow("Unsupported vault version: 2");
  });

  it("projects entries without exposing secrets", () => {
    const publicEntry = toPublicVaultEntry(createEntry());

    expect(publicEntry).toMatchObject({
      id: "entry-1",
      name: "GitHub",
      hasSecret: true,
    });
    expect("secret" in publicEntry).toBe(false);
  });

  it("resolves the default vault path", () => {
    expect(getDefaultVaultPath()).toMatch(/\.keycase[/\\]vault\.enc$/);
  });
});
