import { useKeyboard, useRenderer } from "@opentui/react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { copySecretToClipboard } from "../../core/clipboard.js";
import { addEntry, deleteEntry, editEntry, getEntrySecret, listEntries } from "../../core/vault.js";
import { searchEntries } from "../../core/search.js";
import type { PublicVaultEntry } from "../../schema/entry.js";
import type { VaultEntry, VaultPayload } from "../../schema/vault.js";
import { DeleteConfirmScreen } from "./DeleteConfirmScreen.js";
import { EntryFormScreen, type EntryDraft } from "./EntryFormScreen.js";
import { GeneratorScreen } from "./GeneratorScreen.js";

export type VaultScreenProps = {
  payload: VaultPayload;
  onChange: (payload: VaultPayload) => void;
};

type Mode = "main" | "add" | "edit" | "generate" | "delete";
type GeneratorReturn = { mode: "add" | "edit"; draft: EntryDraft } | undefined;

export function VaultScreen({ payload, onChange }: VaultScreenProps) {
  const renderer = useRenderer();
  const [mode, setMode] = useState<Mode>("main");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<string | undefined>();
  const [generatorReturn, setGeneratorReturn] = useState<GeneratorReturn>();

  const entries = useMemo(
    () => (query.length > 0 ? searchEntries(payload.entries, query) : listEntries(payload)),
    [payload, query],
  );
  const selectedEntry = entries[Math.min(selectedIndex, Math.max(entries.length - 1, 0))];
  const selectedFullEntry = selectedEntry ? payload.entries.find((entry) => entry.id === selectedEntry.id) : undefined;

  const persist = (updatedPayload: VaultPayload, message: string) => {
    onChange(updatedPayload);
    setMode("main");
    setStatus(message);
    setSelectedIndex(0);
    setGeneratorReturn(undefined);
  };

  useKeyboard((key) => {
    if (mode !== "main" || key.eventType !== "press") {
      return;
    }

    if (key.name === "c" && key.ctrl) {
      key.preventDefault();
      renderer.destroy();
      return;
    }

    if (searching) {
      handleSearchKey(key, setSearching, setQuery, setSelectedIndex);
      return;
    }

    if (key.name === "escape") {
      key.preventDefault();
      setStatus(undefined);
    }

    if (key.name === "/") {
      key.preventDefault();
      setSearching(true);
      setQuery("");
      setSelectedIndex(0);
    }

    if (key.name === "down" || key.name === "j") {
      key.preventDefault();
      setSelectedIndex((current) => Math.min(current + 1, Math.max(entries.length - 1, 0)));
    }

    if (key.name === "up" || key.name === "k") {
      key.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
    }

    if (key.name === "a") {
      key.preventDefault();
      setMode("add");
    }

    if (key.name === "g") {
      key.preventDefault();
      setGeneratorReturn(undefined);
      setMode("generate");
    }

    if (key.name === "c" && selectedEntry) {
      key.preventDefault();
      void copySelectedSecret(payload, selectedEntry, setStatus);
    }

    if (key.name === "e" && selectedFullEntry) {
      key.preventDefault();
      setMode("edit");
    }

    if (key.name === "d" && selectedEntry) {
      key.preventDefault();
      setMode("delete");
    }
  });

  if (mode === "add") {
    return (
      <EntryFormScreen
        title="Add Entry"
        initialDraft={generatorReturn?.mode === "add" ? generatorReturn.draft : undefined}
        onSave={(draft) => persist(addEntry(payload, draftToEntryInput(draft)), "Entry added.")}
        onCancel={() => {
          setGeneratorReturn(undefined);
          setMode("main");
        }}
        onGenerate={(draft) => {
          setGeneratorReturn({ mode: "add", draft });
          setMode("generate");
        }}
      />
    );
  }

  if (mode === "edit" && selectedFullEntry) {
    return (
      <EntryFormScreen
        title={`Edit ${selectedFullEntry.name}`}
        initialDraft={generatorReturn?.mode === "edit" ? generatorReturn.draft : entryToDraft(selectedFullEntry)}
        onSave={(draft) => persist(editEntry(payload, selectedFullEntry.id, draftToEntryInput(draft)), "Entry updated.")}
        onCancel={() => {
          setGeneratorReturn(undefined);
          setMode("main");
        }}
        onGenerate={(draft) => {
          setGeneratorReturn({ mode: "edit", draft });
          setMode("generate");
        }}
      />
    );
  }

  if (mode === "generate") {
    return (
      <GeneratorScreen
        onUse={(password) => {
          if (generatorReturn) {
            setMode(generatorReturn.mode);
            setGeneratorReturn({
              ...generatorReturn,
              draft: { ...generatorReturn.draft, secret: password },
            });
            return;
          }

          setGeneratorReturn({ mode: "add", draft: { ...emptyDraft(), secret: password } });
          setMode("add");
        }}
        onCancel={() => setMode(generatorReturn?.mode ?? "main")}
      />
    );
  }

  if (mode === "delete" && selectedEntry) {
    return (
      <DeleteConfirmScreen
        entryName={selectedEntry.name}
        onConfirm={() => persist(deleteEntry(payload, selectedEntry.id), "Entry deleted.")}
        onCancel={() => setMode("main")}
      />
    );
  }

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1 }}>
      <text fg="#93c5fd">Keycase Vault</text>
      {searching ? <text fg="#fbbf24">Search: {query}</text> : query ? <text fg="#9ca3af">Search: {query}</text> : null}
      {entries.length === 0 ? <EmptyState /> : <VaultLayout entries={entries} selectedEntry={selectedEntry} />}
      {status ? <text fg="#a7f3d0">{status}</text> : null}
      <text fg="#9ca3af">/ search · ↑/↓ select · a add · g generate · c copy · e edit · d delete · ctrl+c quit</text>
    </box>
  );
}

function VaultLayout({ entries, selectedEntry }: { entries: PublicVaultEntry[]; selectedEntry: PublicVaultEntry | undefined }) {
  return (
    <box style={{ flexDirection: "row", gap: 2 }}>
      <box title="Entries" style={{ border: true, flexDirection: "column", width: 30, minHeight: 10 }}>
        {entries.map((entry) => (
          <text key={entry.id} fg={entry.id === selectedEntry?.id ? "#fbbf24" : "#e5e7eb"}>
            {entry.id === selectedEntry?.id ? "> " : "  "}{entry.name}
          </text>
        ))}
      </box>
      <box title="Details" style={{ border: true, flexDirection: "column", width: 48, minHeight: 10 }}>
        {selectedEntry ? <EntryDetails entry={selectedEntry} /> : <text>No entry selected.</text>}
      </box>
    </box>
  );
}

function EntryDetails({ entry }: { entry: PublicVaultEntry }) {
  return (
    <box style={{ flexDirection: "column" }}>
      <text>Name: {entry.name}</text>
      {entry.username ? <text>User: {entry.username}</text> : null}
      {entry.url ? <text>URL: {entry.url}</text> : null}
      {entry.tags.length > 0 ? <text>Tags: {entry.tags.join(", ")}</text> : null}
      {entry.notes ? <text>Notes: {entry.notes}</text> : null}
      <text>Secret: hidden</text>
    </box>
  );
}

function EmptyState() {
  return (
    <box style={{ flexDirection: "column", gap: 1 }}>
      <text>No entries yet.</text>
      <text fg="#9ca3af">Press "a" to add your first entry.</text>
      <text fg="#9ca3af">Press "g" to generate a password.</text>
    </box>
  );
}

function handleSearchKey(
  key: { name: string; sequence: string; ctrl: boolean; meta: boolean; preventDefault: () => void },
  setSearching: (value: boolean) => void,
  setQuery: Dispatch<SetStateAction<string>>,
  setSelectedIndex: (value: number) => void,
) {
  if (key.name === "escape" || key.name === "return" || key.name === "enter") {
    key.preventDefault();
    setSearching(false);
    return;
  }

  if (key.name === "backspace") {
    key.preventDefault();
    setQuery((current) => current.slice(0, -1));
    setSelectedIndex(0);
    return;
  }

  if (isPrintableCharacter(key.sequence) && !key.ctrl && !key.meta) {
    key.preventDefault();
    setQuery((current) => `${current}${key.sequence}`);
    setSelectedIndex(0);
  }
}

function isPrintableCharacter(sequence: string): boolean {
  return sequence.length === 1 && sequence >= " " && sequence !== "\u007f";
}

async function copySelectedSecret(
  payload: VaultPayload,
  entry: PublicVaultEntry,
  setStatus: (message: string) => void,
): Promise<void> {
  try {
    const secret = getEntrySecret(payload, entry.id);
    const result = await copySecretToClipboard(secret);
    setStatus(result.message);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not copy secret.");
  }
}

function draftToEntryInput(draft: EntryDraft) {
  return {
    name: draft.name.trim(),
    username: draft.username.trim(),
    secret: draft.secret,
    url: draft.url.trim(),
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0),
    notes: draft.notes.trim(),
  };
}

function entryToDraft(entry: VaultEntry): EntryDraft {
  return {
    name: entry.name,
    username: entry.username ?? "",
    secret: entry.secret,
    url: entry.url ?? "",
    tags: entry.tags.join(", "),
    notes: entry.notes ?? "",
  };
}

function emptyDraft(): EntryDraft {
  return {
    name: "",
    username: "",
    secret: "",
    url: "",
    tags: "",
    notes: "",
  };
}
