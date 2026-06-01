import type { VaultEntry } from "./vault.js";

export type PublicVaultEntry = Omit<VaultEntry, "secret"> & {
  hasSecret: boolean;
};

export function toPublicVaultEntry(entry: VaultEntry): PublicVaultEntry {
  const { secret: _secret, ...publicEntry } = entry;

  return {
    ...publicEntry,
    hasSecret: true,
  };
}
