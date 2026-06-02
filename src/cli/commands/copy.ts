import { getEntrySecret, unlockVault } from "../../core/vault.js";
import type { CliContext } from "../context.js";

export async function runCopyCommand(context: CliContext, entry: string): Promise<void> {
  const masterPassword = await context.promptPassword("Master password");
  const payload = await unlockVault(context.vaultPath, masterPassword);
  const secret = getEntrySecret(payload, entry);
  const result = await context.copySecret(secret);

  context.write(result.message);
}
