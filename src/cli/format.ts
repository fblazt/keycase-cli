import type { PublicVaultEntry } from "../schema/entry.js";

export function formatEntryList(entries: PublicVaultEntry[]): string {
  if (entries.length === 0) {
    return "No entries found.";
  }

  return entries.map(formatEntrySummary).join("\n");
}

export function formatEntryDetails(entry: PublicVaultEntry): string {
  return [
    `Name: ${entry.name}`,
    entry.username ? `User: ${entry.username}` : undefined,
    entry.url ? `URL: ${entry.url}` : undefined,
    entry.tags.length > 0 ? `Tags: ${entry.tags.join(", ")}` : undefined,
    entry.notes ? `Notes: ${entry.notes}` : undefined,
    `Has secret: ${entry.hasSecret ? "yes" : "no"}`,
    `Created: ${entry.createdAt}`,
    `Updated: ${entry.updatedAt}`,
  ].filter((line) => line !== undefined).join("\n");
}

function formatEntrySummary(entry: PublicVaultEntry): string {
  const parts = [entry.name];

  if (entry.username) {
    parts.push(`user=${entry.username}`);
  }

  if (entry.url) {
    parts.push(`url=${entry.url}`);
  }

  if (entry.tags.length > 0) {
    parts.push(`tags=${entry.tags.join(",")}`);
  }

  return parts.join("  ");
}
