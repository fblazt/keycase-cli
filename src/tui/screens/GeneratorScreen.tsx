import { useKeyboard } from "@opentui/react";
import { useState } from "react";

import { copySecretToClipboard } from "../../core/clipboard.js";
import { generatePassword } from "../../core/generator.js";
import { TextField } from "../components/TextField.js";

export type GeneratorScreenProps = {
  onUse: (password: string) => void;
  onCancel: () => void;
};

type FocusedField = "length";

export function GeneratorScreen({ onUse, onCancel }: GeneratorScreenProps) {
  const [length, setLength] = useState("24");
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState(() => generatePassword());
  const [status, setStatus] = useState<string | undefined>();
  const focused: FocusedField = "length";

  const generate = () => {
    try {
      const generated = generatePassword({
        length: Number(length),
        uppercase,
        lowercase,
        numbers,
        symbols,
      });
      setPassword(generated);
      setStatus("Password generated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate password.");
    }
  };

  const copy = () => {
    void copySecretToClipboard(password)
      .then((result) => setStatus(result.message))
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Could not copy password."));
  };

  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (key.name === "escape" || (key.name === "c" && key.ctrl)) {
      key.preventDefault();
      onCancel();
    }

    if ((key.name === "g" || key.name === "r") && key.ctrl) {
      key.preventDefault();
      generate();
    }

    if (key.name === "y" && key.ctrl) {
      key.preventDefault();
      copy();
    }

    if ((key.name === "u" && key.ctrl) || key.name === "return" || key.name === "enter") {
      key.preventDefault();
      onUse(password);
    }

    if (key.name === "1" && key.ctrl) {
      key.preventDefault();
      setUppercase((value) => !value);
    }

    if (key.name === "2" && key.ctrl) {
      key.preventDefault();
      setLowercase((value) => !value);
    }

    if (key.name === "3" && key.ctrl) {
      key.preventDefault();
      setNumbers((value) => !value);
    }

    if (key.name === "4" && key.ctrl) {
      key.preventDefault();
      setSymbols((value) => !value);
    }
  });

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1 }}>
      <text fg="#93c5fd">Password Generator</text>
      <TextField label="Length *" value={length} focused={focused === "length"} onChange={setLength} onSubmit={generate} />
      <text>Generated: {password}</text>
      <text fg="#e5e7eb">1 uppercase: {uppercase ? "on" : "off"}</text>
      <text fg="#e5e7eb">2 lowercase: {lowercase ? "on" : "off"}</text>
      <text fg="#e5e7eb">3 numbers: {numbers ? "on" : "off"}</text>
      <text fg="#e5e7eb">4 symbols: {symbols ? "on" : "off"}</text>
      {status ? <text fg="#a7f3d0">{status}</text> : null}
      <text fg="#9ca3af">ctrl+g/r regenerate · ctrl+y copy · ctrl+u/enter use · ctrl+1-4 toggle · esc/ctrl+c back</text>
    </box>
  );
}
