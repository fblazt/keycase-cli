import { useKeyboard } from "@opentui/react";

export type DeleteConfirmScreenProps = {
  entryName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmScreen({ entryName, onConfirm, onCancel }: DeleteConfirmScreenProps) {
  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (key.name === "y" || key.name === "return" || key.name === "enter") {
      key.preventDefault();
      onConfirm();
    }

    if (key.name === "n" || key.name === "escape") {
      key.preventDefault();
      onCancel();
    }
  });

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1 }}>
      <text fg="#f87171">Delete entry?</text>
      <text>{entryName}</text>
      <text fg="#9ca3af">y/enter confirm · n/esc cancel</text>
    </box>
  );
}
