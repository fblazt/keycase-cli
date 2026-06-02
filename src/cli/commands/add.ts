import { addEntry, saveVault, unlockVault } from "../../core/vault.js";
import type { CliContext } from "../context.js";

export async function runAddCommand(context: CliContext): Promise<void> {
  const masterPassword = await context.promptPassword("Master password");
  const payload = await unlockVault(context.vaultPath, masterPassword);
  const name = await context.promptText("Name");
  const username = await context.promptText("Username");
  const secret = await context.promptPassword("Secret/password");
  const url = await context.promptText("URL");
  const tagsInput = await context.promptText("Tags (comma-separated)");
  const notes = await context.promptText("Notes");

  const updatedPayload = addEntry(payload, {
    name: name.trim(),
    username: username.trim(),
    secret,
    url: url.trim(),
    tags: parseTags(tagsInput),
    notes: notes.trim(),
  });

  await saveVault(context.vaultPath, updatedPayload, masterPassword);
  context.write("Entry added.");
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
