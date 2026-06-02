import { listEntries, unlockVault } from "../../core/vault.js";
import { formatEntryList } from "../format.js";
import type { CliContext } from "../context.js";

export async function runListCommand(context: CliContext): Promise<void> {
  const masterPassword = await context.promptPassword("Master password");
  const payload = await unlockVault(context.vaultPath, masterPassword);

  context.write(formatEntryList(listEntries(payload)));
}
