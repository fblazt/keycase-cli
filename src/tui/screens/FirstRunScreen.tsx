import { useKeyboard } from "@opentui/react";
import { useState } from "react";

import { PasswordField } from "../components/PasswordField.js";

export type FirstRunScreenProps = {
  error?: string;
  onCreate: (masterPassword: string) => void;
  onQuit: () => void;
};

type FocusedField = "password" | "confirm";

export function FirstRunScreen({ error, onCreate, onQuit }: FirstRunScreenProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focused, setFocused] = useState<FocusedField>("password");
  const [validationError, setValidationError] = useState<string | undefined>();

  const submit = () => {
    if (focused === "password") {
      setFocused("confirm");
      return;
    }

    if (masterPassword.length === 0) {
      setValidationError("Master password cannot be empty.");
      setFocused("password");
      return;
    }

    if (masterPassword !== confirmPassword) {
      setValidationError("Master passwords do not match.");
      setFocused("confirm");
      return;
    }

    setValidationError(undefined);
    onCreate(masterPassword);
  };

  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (key.name === "tab") {
      key.preventDefault();
      setFocused((current) => (current === "password" ? "confirm" : "password"));
    }

    if (key.name === "escape" || key.name === "q") {
      key.preventDefault();
      onQuit();
    }
  });

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1 }}>
      <text fg="#93c5fd">Keycase first-run setup</text>
      <text fg="#fbbf24">Keycase cannot recover your vault if you forget your master password.</text>
      <PasswordField
        label={focused === "password" ? "Master password *" : "Master password"}
        value={masterPassword}
        focused={focused === "password"}
        onChange={setMasterPassword}
        onSubmit={submit}
      />
      <PasswordField
        label={focused === "confirm" ? "Confirm password *" : "Confirm password"}
        value={confirmPassword}
        focused={focused === "confirm"}
        onChange={setConfirmPassword}
        onSubmit={submit}
        placeholder="Confirm password"
      />
      {validationError ? <text fg="#f87171">{validationError}</text> : null}
      {error ? <text fg="#f87171">{error}</text> : null}
      <text fg="#9ca3af">tab switch field · enter continue/create · esc/q quit</text>
    </box>
  );
}
