import { toPublicVaultEntry, type PublicVaultEntry } from "../schema/entry.js";
import type { VaultEntry, VaultPayload } from "../schema/vault.js";
import { VAULT_VERSION } from "../schema/vault.js";
import { KeycaseError } from "../utils/errors.js";
import { createId } from "../utils/id.js";
import { nowIso } from "../utils/time.js";
import { decryptVaultPayload, encryptVaultPayload } from "./crypto.js";
import { readVaultFile, writeVaultFile } from "./storage.js";

export type EntryInput = {
  name: string;
  username?: string;
  secret: string;
  url?: string;
  tags?: string[];
  notes?: string;
};

export type EntryUpdate = Partial<EntryInput>;

export class EntryNotFoundError extends KeycaseError {
  constructor(query: string) {
    super(`Entry not found: ${query}`);
    this.name = "EntryNotFoundError";
  }
}

export class AmbiguousEntryLookupError extends KeycaseError {
  constructor(query: string) {
    super(`Ambiguous entry match: ${query}`);
    this.name = "AmbiguousEntryLookupError";
  }
}

export class InvalidEntryError extends KeycaseError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEntryError";
  }
}

export function createEmptyVaultPayload(timestamp = nowIso()): VaultPayload {
  return {
    version: VAULT_VERSION,
    entries: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function createVault(vaultPath: string, masterPassword: string): Promise<VaultPayload> {
  const payload = createEmptyVaultPayload();
  await saveVault(vaultPath, payload, masterPassword);
  return payload;
}

export async function unlockVault(vaultPath: string, masterPassword: string): Promise<VaultPayload> {
  const vaultFile = await readVaultFile(vaultPath);
  return decryptVaultPayload(vaultFile, masterPassword);
}

export async function saveVault(vaultPath: string, payload: VaultPayload, masterPassword: string): Promise<VaultPayload> {
  const updatedPayload = { ...payload, updatedAt: nowIso() };
  const vaultFile = await encryptVaultPayload(updatedPayload, masterPassword);
  await writeVaultFile(vaultPath, vaultFile);
  return updatedPayload;
}

export function addEntry(payload: VaultPayload, input: EntryInput): VaultPayload {
  assertValidEntryInput(input);

  const timestamp = nowIso();
  const entry: VaultEntry = {
    id: createId(),
    name: input.name,
    username: optionalString(input.username),
    secret: input.secret,
    url: optionalString(input.url),
    tags: input.tags ?? [],
    notes: optionalString(input.notes),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...payload,
    entries: [...payload.entries, entry],
    updatedAt: timestamp,
  };
}

export function editEntry(payload: VaultPayload, query: string, update: EntryUpdate): VaultPayload {
  const target = findEntry(payload, query);
  const timestamp = nowIso();

  if (update.name !== undefined && update.name.length === 0) {
    throw new InvalidEntryError("Entry name is required.");
  }

  if (update.secret !== undefined && update.secret.length === 0) {
    throw new InvalidEntryError("Entry secret is required.");
  }

  return {
    ...payload,
    entries: payload.entries.map((entry) =>
      entry.id === target.id
        ? {
            ...entry,
            ...update,
            username: update.username === undefined ? entry.username : optionalString(update.username),
            url: update.url === undefined ? entry.url : optionalString(update.url),
            tags: update.tags === undefined ? entry.tags : update.tags,
            notes: update.notes === undefined ? entry.notes : optionalString(update.notes),
            updatedAt: timestamp,
          }
        : entry,
    ),
    updatedAt: timestamp,
  };
}

export function deleteEntry(payload: VaultPayload, query: string): VaultPayload {
  const target = findEntry(payload, query);
  const timestamp = nowIso();

  return {
    ...payload,
    entries: payload.entries.filter((entry) => entry.id !== target.id),
    updatedAt: timestamp,
  };
}

export function listEntries(payload: VaultPayload): PublicVaultEntry[] {
  return payload.entries.map(toPublicVaultEntry);
}

export function getPublicEntry(payload: VaultPayload, query: string): PublicVaultEntry {
  return toPublicVaultEntry(findEntry(payload, query));
}

export function getEntrySecret(payload: VaultPayload, query: string): string {
  return findEntry(payload, query).secret;
}

export function findEntry(payload: VaultPayload, query: string): VaultEntry {
  const idMatch = payload.entries.find((entry) => entry.id === query);

  if (idMatch) {
    return idMatch;
  }

  const nameMatches = payload.entries.filter((entry) => entry.name === query);

  if (nameMatches.length === 0) {
    throw new EntryNotFoundError(query);
  }

  if (nameMatches.length > 1) {
    throw new AmbiguousEntryLookupError(query);
  }

  return nameMatches[0]!;
}

function assertValidEntryInput(input: EntryInput): void {
  if (input.name.length === 0) {
    throw new InvalidEntryError("Entry name is required.");
  }

  if (input.secret.length === 0) {
    throw new InvalidEntryError("Entry secret is required.");
  }
}

function optionalString(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}
