import { getPublicEntry, unlockVault } from "../../core/vault.js";
import { formatEntryDetails } from "../format.js";
import type { CliContext } from "../context.js";

export async function runGetCommand(context: CliContext, entry: string): Promise<void> {
  const masterPassword = await context.promptPassword("Master password");
  const payload = await unlockVault(context.vaultPath, masterPassword);

  context.write(formatEntryDetails(getPublicEntry(payload, entry)));
}
