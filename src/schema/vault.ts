import { z } from "zod";

import { InvalidVaultFileError, UnsupportedVaultVersionError } from "../utils/errors.js";

export const VAULT_VERSION = 1;

export const vaultEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  username: z.string().optional(),
  secret: z.string().min(1),
  url: z.string().optional(),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const vaultPayloadSchema = z.object({
  version: z.literal(VAULT_VERSION),
  entries: z.array(vaultEntrySchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const vaultFileSchema = z.object({
  version: z.literal(VAULT_VERSION),
  kdf: z.object({
    name: z.union([z.literal("argon2id"), z.literal("scrypt")]),
    salt: z.string().min(1),
    params: z.record(z.string(), z.unknown()),
  }),
  cipher: z.object({
    name: z.literal("aes-256-gcm"),
    iv: z.string().min(1),
    authTag: z.string().min(1),
  }),
  ciphertext: z.string().min(1),
});

export type VaultEntry = z.infer<typeof vaultEntrySchema>;
export type VaultPayload = z.infer<typeof vaultPayloadSchema>;
export type VaultFile = z.infer<typeof vaultFileSchema>;

export function parseVaultFile(value: unknown): VaultFile {
  if (value && typeof value === "object" && "version" in value && value.version !== VAULT_VERSION) {
    throw new UnsupportedVaultVersionError(value.version);
  }

  const result = vaultFileSchema.safeParse(value);

  if (!result.success) {
    throw new InvalidVaultFileError();
  }

  return result.data;
}
