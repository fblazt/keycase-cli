import { homedir } from "node:os";
import { join } from "node:path";

export function getDefaultVaultDir(): string {
  return join(homedir(), ".keycase");
}

export function getDefaultVaultPath(): string {
  return join(getDefaultVaultDir(), "vault.enc");
}
