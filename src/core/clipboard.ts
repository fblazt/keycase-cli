import clipboard from "clipboardy";

import { KeycaseError } from "../utils/errors.js";

export const DEFAULT_CLIPBOARD_CLEAR_TIMEOUT_MS = 30_000;
export const COPY_SUCCESS_MESSAGE = "Secret copied to clipboard.";

export type ClipboardAdapter = {
  write(value: string): Promise<void>;
  read(): Promise<string>;
};

export type ScheduleTimeout = (callback: () => void, timeoutMs: number) => unknown;

export type CopySecretOptions = {
  clipboard?: ClipboardAdapter;
  clearTimeoutMs?: number;
  setTimeoutFn?: ScheduleTimeout;
};

export type CopySecretResult = {
  message: string;
  clearScheduled: boolean;
};

export class ClipboardError extends KeycaseError {
  constructor(message = "Could not access clipboard.") {
    super(message);
    this.name = "ClipboardError";
  }
}

const defaultClipboard: ClipboardAdapter = {
  write: clipboard.write,
  read: clipboard.read,
};

export async function copySecretToClipboard(secret: string, options: CopySecretOptions = {}): Promise<CopySecretResult> {
  const clipboardAdapter = options.clipboard ?? defaultClipboard;
  const clearTimeoutMs = options.clearTimeoutMs ?? DEFAULT_CLIPBOARD_CLEAR_TIMEOUT_MS;
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout;

  try {
    await clipboardAdapter.write(secret);
  } catch {
    throw new ClipboardError();
  }

  if (clearTimeoutMs >= 0) {
    setTimeoutFn(() => {
      void clearClipboardIfUnchanged(secret, clipboardAdapter);
    }, clearTimeoutMs);
  }

  return {
    message: COPY_SUCCESS_MESSAGE,
    clearScheduled: clearTimeoutMs >= 0,
  };
}

export async function clearClipboardIfUnchanged(secret: string, clipboardAdapter: ClipboardAdapter = defaultClipboard): Promise<boolean> {
  try {
    const currentValue = await clipboardAdapter.read();

    if (currentValue !== secret) {
      return false;
    }

    await clipboardAdapter.write("");
    return true;
  } catch {
    return false;
  }
}
