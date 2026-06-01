import type { PublicVaultEntry } from "../schema/entry.js";
import type { VaultEntry } from "../schema/vault.js";
import { toPublicVaultEntry } from "../schema/entry.js";

export function searchEntries(entries: VaultEntry[], query: string): PublicVaultEntry[] {
  const normalizedQuery = normalize(query);

  if (normalizedQuery.length === 0) {
    return entries.map(toPublicVaultEntry);
  }

  return entries.filter((entry) => matchesEntry(entry, normalizedQuery)).map(toPublicVaultEntry);
}

function matchesEntry(entry: VaultEntry, normalizedQuery: string): boolean {
  return [
    entry.name,
    entry.username,
    entry.url,
    entry.notes,
    ...entry.tags,
  ].some((value) => normalize(value).includes(normalizedQuery));
}

function normalize(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase();
}
