import { describe, expect, it, vi } from "vitest";

import {
  COPY_SUCCESS_MESSAGE,
  clearClipboardIfUnchanged,
  copySecretToClipboard,
  type ClipboardAdapter,
} from "../../src/core/clipboard.js";

function createClipboard(initialValue = ""): ClipboardAdapter & { value: string } {
  return {
    value: initialValue,
    async write(value: string) {
      this.value = value;
    },
    async read() {
      return this.value;
    },
  };
}

describe("clipboard", () => {
  it("copies a secret and returns a non-secret success message", async () => {
    const clipboard = createClipboard();

    const result = await copySecretToClipboard("super-secret", {
      clipboard,
      clearTimeoutMs: -1,
    });

    expect(clipboard.value).toBe("super-secret");
    expect(result).toEqual({ message: COPY_SUCCESS_MESSAGE, clearScheduled: false });
    expect(result.message).not.toContain("super-secret");
  });

  it("schedules clipboard clearing after the timeout", async () => {
    const clipboard = createClipboard();
    const setTimeoutFn = vi.fn<(callback: () => void, timeoutMs: number) => unknown>();

    await copySecretToClipboard("super-secret", {
      clipboard,
      clearTimeoutMs: 30_000,
      setTimeoutFn,
    });

    expect(setTimeoutFn).toHaveBeenCalledOnce();
    expect(setTimeoutFn.mock.calls[0]?.[1]).toBe(30_000);
  });

  it("clears the clipboard when it still contains the copied secret", async () => {
    const clipboard = createClipboard("super-secret");

    await expect(clearClipboardIfUnchanged("super-secret", clipboard)).resolves.toBe(true);
    expect(clipboard.value).toBe("");
  });

  it("does not clear the clipboard when it contains newer content", async () => {
    const clipboard = createClipboard("newer clipboard content");

    await expect(clearClipboardIfUnchanged("super-secret", clipboard)).resolves.toBe(false);
    expect(clipboard.value).toBe("newer clipboard content");
  });

  it("fails copy with a clear non-secret error", async () => {
    const clipboard: ClipboardAdapter = {
      async write() {
        throw new Error("platform clipboard unavailable for super-secret");
      },
      async read() {
        return "";
      },
    };

    await expect(copySecretToClipboard("super-secret", { clipboard })).rejects.toThrow("Could not access clipboard.");
  });

  it("treats clear failures as best-effort", async () => {
    const clipboard: ClipboardAdapter = {
      async write() {
        throw new Error("clear failed");
      },
      async read() {
        return "super-secret";
      },
    };

    await expect(clearClipboardIfUnchanged("super-secret", clipboard)).resolves.toBe(false);
  });
});
