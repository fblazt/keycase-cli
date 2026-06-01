import { mkdir, readFile, stat, writeFile, chmod } from "node:fs/promises";
import { dirname } from "node:path";

import { parseVaultFile, type VaultFile } from "../schema/vault.js";

export async function vaultExists(vaultPath: string): Promise<boolean> {
  try {
    const result = await stat(vaultPath);
    return result.isFile();
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

export async function ensureVaultDirectory(vaultPath: string): Promise<void> {
  const vaultDir = dirname(vaultPath);
  await mkdir(vaultDir, { recursive: true, mode: 0o700 });
  await chmodIfSupported(vaultDir, 0o700);
}

export async function readVaultFile(vaultPath: string): Promise<VaultFile> {
  const contents = await readFile(vaultPath, "utf8");
  return parseVaultFile(JSON.parse(contents) as unknown);
}

export async function writeVaultFile(vaultPath: string, vaultFile: VaultFile): Promise<void> {
  await ensureVaultDirectory(vaultPath);
  await writeFile(vaultPath, `${JSON.stringify(vaultFile, null, 2)}\n`, { mode: 0o600 });
  await chmodIfSupported(vaultPath, 0o600);
}

async function chmodIfSupported(path: string, mode: number): Promise<void> {
  try {
    await chmod(path, mode);
  } catch (error) {
    if (isNodeError(error) && ["ENOSYS", "ENOTSUP", "EPERM"].includes(error.code ?? "")) {
      return;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
