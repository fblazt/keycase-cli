import { useKeyboard } from "@opentui/react";
import { useState } from "react";

import { PasswordField } from "../components/PasswordField.js";

export type UnlockScreenProps = {
  error?: string;
  onUnlock: (masterPassword: string) => void;
  onQuit: () => void;
};

export function UnlockScreen({ error, onUnlock, onQuit }: UnlockScreenProps) {
  const [masterPassword, setMasterPassword] = useState("");
  const [validationError, setValidationError] = useState<string | undefined>();

  const submit = () => {
    if (masterPassword.length === 0) {
      setValidationError("Master password cannot be empty.");
      return;
    }

    setValidationError(undefined);
    onUnlock(masterPassword);
  };

  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (key.name === "escape" || (key.name === "c" && key.ctrl)) {
      key.preventDefault();
      onQuit();
    }
  });

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1 }}>
      <text fg="#93c5fd">Unlock Keycase</text>
      <PasswordField label="Master password *" value={masterPassword} focused onChange={setMasterPassword} onSubmit={submit} />
      {validationError ? <text fg="#f87171">{validationError}</text> : null}
      {error ? <text fg="#f87171">{error}</text> : null}
      <text fg="#9ca3af">enter unlock · esc/ctrl+c quit</text>
    </box>
  );
}
