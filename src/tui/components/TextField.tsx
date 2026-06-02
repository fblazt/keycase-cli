import { useKeyboard } from "@opentui/react";

export type TextFieldProps = {
  label: string;
  value: string;
  focused: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  hidden?: boolean;
};

export function TextField({ label, value, focused, onChange, onSubmit, placeholder = "", hidden = false }: TextFieldProps) {
  useKeyboard((key) => {
    if (!focused || key.eventType !== "press") {
      return;
    }

    if (key.name === "return" || key.name === "enter") {
      key.preventDefault();
      onSubmit();
      return;
    }

    if (key.name === "backspace") {
      key.preventDefault();
      onChange(value.slice(0, -1));
      return;
    }

    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      key.preventDefault();
      onChange(`${value}${key.sequence}`);
    }
  });

  const displayValue = value.length > 0 ? (hidden ? "*".repeat(value.length) : value) : placeholder;

  return (
    <box title={label} style={{ border: true, width: 64, height: 3 }}>
      <text fg={value.length > 0 ? "#e5e7eb" : "#6b7280"}>{displayValue}</text>
    </box>
  );
}
