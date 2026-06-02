import { useKeyboard } from "@opentui/react";
import { useState } from "react";

import { TextField } from "../components/TextField.js";

export type EntryDraft = {
  name: string;
  username: string;
  secret: string;
  url: string;
  tags: string;
  notes: string;
};

export type EntryFormScreenProps = {
  title: string;
  initialDraft?: Partial<EntryDraft>;
  onSave: (draft: EntryDraft) => void;
  onCancel: () => void;
  onGenerate: (draft: EntryDraft) => void;
};

const fields = ["name", "username", "secret", "url", "tags", "notes"] as const;
type FieldName = (typeof fields)[number];

const emptyDraft: EntryDraft = {
  name: "",
  username: "",
  secret: "",
  url: "",
  tags: "",
  notes: "",
};

export function EntryFormScreen({ title, initialDraft, onSave, onCancel, onGenerate }: EntryFormScreenProps) {
  const [draft, setDraft] = useState<EntryDraft>({ ...emptyDraft, ...initialDraft });
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const focused = fields[focusedIndex]!;

  const updateField = (field: FieldName, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const save = () => {
    if (draft.name.trim().length === 0) {
      setError("Name is required.");
      setFocusedIndex(0);
      return;
    }

    if (draft.secret.length === 0) {
      setError("Secret is required.");
      setFocusedIndex(2);
      return;
    }

    setError(undefined);
    onSave(draft);
  };

  const continueOrSave = () => {
    if (focusedIndex < fields.length - 1) {
      setFocusedIndex((current) => current + 1);
      return;
    }

    save();
  };

  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (key.name === "tab") {
      key.preventDefault();
      setFocusedIndex((current) => (current + 1) % fields.length);
    }

    if (key.name === "escape") {
      key.preventDefault();
      onCancel();
    }

    if (key.name === "c" && key.ctrl) {
      key.preventDefault();
      onCancel();
    }

    if (key.name === "s" && key.ctrl) {
      key.preventDefault();
      save();
    }

    if (key.name === "g" && key.ctrl) {
      key.preventDefault();
      onGenerate(draft);
    }
  });

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1 }}>
      <text fg="#93c5fd">{title}</text>
      <TextField label={fieldLabel("name", focused)} value={draft.name} focused={focused === "name"} onChange={(value) => updateField("name", value)} onSubmit={continueOrSave} />
      <TextField label={fieldLabel("username", focused)} value={draft.username} focused={focused === "username"} onChange={(value) => updateField("username", value)} onSubmit={continueOrSave} />
      <TextField label={fieldLabel("secret", focused)} value={draft.secret} focused={focused === "secret"} onChange={(value) => updateField("secret", value)} onSubmit={continueOrSave} hidden />
      <TextField label={fieldLabel("url", focused)} value={draft.url} focused={focused === "url"} onChange={(value) => updateField("url", value)} onSubmit={continueOrSave} />
      <TextField label={fieldLabel("tags", focused)} value={draft.tags} focused={focused === "tags"} onChange={(value) => updateField("tags", value)} onSubmit={continueOrSave} placeholder="dev, important" />
      <TextField label={fieldLabel("notes", focused)} value={draft.notes} focused={focused === "notes"} onChange={(value) => updateField("notes", value)} onSubmit={continueOrSave} />
      {error ? <text fg="#f87171">{error}</text> : null}
      <text fg="#a7f3d0">ctrl+s save now</text>
      <text fg="#9ca3af">tab next · enter next/save on last field · ctrl+g generate password · esc/ctrl+c cancel</text>
    </box>
  );
}

function fieldLabel(field: FieldName, focused: FieldName): string {
  const label = {
    name: "Name (required)",
    username: "Username",
    secret: "Secret (required)",
    url: "URL",
    tags: "Tags",
    notes: "Notes",
  }[field];

  return field === focused ? `› ${label}` : label;
}
