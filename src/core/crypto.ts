import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import argon2 from "argon2";

import type { VaultFile, VaultPayload } from "../schema/vault.js";
import { VAULT_VERSION, vaultPayloadSchema } from "../schema/vault.js";
import { KeycaseError } from "../utils/errors.js";

const KDF_NAME = "argon2id";
const CIPHER_NAME = "aes-256-gcm";
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

export const ARGON2ID_PARAMS = {
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  hashLength: KEY_LENGTH_BYTES,
} as const;

export class VaultCryptoError extends KeycaseError {
  constructor(message = "Could not decrypt vault. Check your master password and try again.") {
    super(message);
    this.name = "VaultCryptoError";
  }
}

async function deriveKey(masterPassword: string, salt: Buffer, params: Record<string, unknown>): Promise<Buffer> {
  const memoryCost = numberParam(params.memoryCost, ARGON2ID_PARAMS.memoryCost);
  const timeCost = numberParam(params.timeCost, ARGON2ID_PARAMS.timeCost);
  const parallelism = numberParam(params.parallelism, ARGON2ID_PARAMS.parallelism);
  const hashLength = numberParam(params.hashLength, ARGON2ID_PARAMS.hashLength);

  return argon2.hash(masterPassword, {
    type: argon2.argon2id,
    salt,
    memoryCost,
    timeCost,
    parallelism,
    hashLength,
    raw: true,
  }) as Promise<Buffer>;
}

function numberParam(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function encryptVaultPayload(payload: VaultPayload, masterPassword: string): Promise<VaultFile> {
  const salt = randomBytes(SALT_LENGTH_BYTES);
  const iv = randomBytes(IV_LENGTH_BYTES);
  const params = { ...ARGON2ID_PARAMS };
  const key = await deriveKey(masterPassword, salt, params);
  const cipher = createCipheriv(CIPHER_NAME, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: VAULT_VERSION,
    kdf: {
      name: KDF_NAME,
      salt: salt.toString("base64"),
      params,
    },
    cipher: {
      name: CIPHER_NAME,
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    },
    ciphertext: ciphertext.toString("base64"),
  };
}

export async function decryptVaultPayload(vaultFile: VaultFile, masterPassword: string): Promise<VaultPayload> {
  if (vaultFile.kdf.name !== KDF_NAME || vaultFile.cipher.name !== CIPHER_NAME) {
    throw new VaultCryptoError("Unsupported vault encryption settings.");
  }

  try {
    const salt = Buffer.from(vaultFile.kdf.salt, "base64");
    const iv = Buffer.from(vaultFile.cipher.iv, "base64");
    const authTag = Buffer.from(vaultFile.cipher.authTag, "base64");
    const ciphertext = Buffer.from(vaultFile.ciphertext, "base64");
    const key = await deriveKey(masterPassword, salt, vaultFile.kdf.params);
    const decipher = createDecipheriv(CIPHER_NAME, key, iv);

    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext) as unknown;

    return vaultPayloadSchema.parse(parsed);
  } catch (error) {
    if (error instanceof VaultCryptoError) {
      throw error;
    }

    throw new VaultCryptoError();
  }
}
