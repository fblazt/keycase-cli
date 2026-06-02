import { useKeyboard, useRenderer } from "@opentui/react";

import { listEntries } from "../../core/vault.js";
import type { VaultPayload } from "../../schema/vault.js";

export type VaultScreenProps = {
  payload: VaultPayload;
};

export function VaultScreen({ payload }: VaultScreenProps) {
  const renderer = useRenderer();
  const entries = listEntries(payload);

  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (key.name === "q" || key.name === "escape") {
      key.preventDefault();
      renderer.destroy();
    }
  });

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1 }}>
      <text fg="#93c5fd">Keycase Vault</text>
      {entries.length === 0 ? (
        <box style={{ flexDirection: "column", gap: 1 }}>
          <text>No entries yet.</text>
          <text fg="#9ca3af">Press "a" to add your first entry.</text>
          <text fg="#9ca3af">Press "g" to generate a password.</text>
        </box>
      ) : (
        <box title="Entries" style={{ border: true, flexDirection: "column", width: 60, minHeight: 5 }}>
          {entries.map((entry) => (
            <text key={entry.id}>{entry.name}</text>
          ))}
        </box>
      )}
      <text fg="#9ca3af">/ search · a add · g generate · c copy · e edit · d delete · q quit</text>
    </box>
  );
}
