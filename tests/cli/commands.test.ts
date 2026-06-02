import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it, vi } from "vitest";

import { runAddCommand } from "../../src/cli/commands/add.js";
import { runCopyCommand } from "../../src/cli/commands/copy.js";
import { runGenCommand } from "../../src/cli/commands/gen.js";
import { runGetCommand } from "../../src/cli/commands/get.js";
import { runListCommand } from "../../src/cli/commands/list.js";
import type { CliContext } from "../../src/cli/context.js";
import { addEntry, createVault, saveVault, unlockVault } from "../../src/core/vault.js";

async function tempVaultPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "keycase-cli-test-"));
  return join(dir, ".keycase", "vault.enc");
}

function createContext(vaultPath: string, prompts: string[] = []): CliContext & { output: string[]; errors: string[] } {
  return {
    vaultPath,
    output: [],
    errors: [],
    async promptText() {
      return prompts.shift() ?? "";
    },
    async promptPassword() {
      return prompts.shift() ?? "";
    },
    write(message: string) {
      this.output.push(message);
    },
    writeError(message: string) {
      this.errors.push(message);
    },
    async copySecret() {
      return { message: "Secret copied to clipboard.", clearScheduled: true };
    },
  };
}

async function createVaultWithEntry(vaultPath: string): Promise<void> {
  let payload = await createVault(vaultPath, "master-password");
  payload = addEntry(payload, {
    name: "GitHub",
    username: "human@example.com",
    secret: "super-secret",
    url: "https://github.com",
    tags: ["dev"],
    notes: "private note",
  });
  await saveVault(vaultPath, payload, "master-password");
}

describe("CLI commands", () => {
  it("generates a password", () => {
    const context = createContext("unused");

    runGenCommand(context, { length: 12, uppercase: false, lowercase: false, numbers: true, symbols: false });

    expect(context.output[0]).toMatch(/^[0-9]{12}$/);
  });

  it("adds an entry after unlocking", async () => {
    const vaultPath = await tempVaultPath();
    await createVault(vaultPath, "master-password");
    const context = createContext(vaultPath, [
      "master-password",
      "GitHub",
      "human@example.com",
      "super-secret",
      "https://github.com",
      "dev, important",
      "private note",
    ]);

    await runAddCommand(context);
    const payload = await unlockVault(vaultPath, "master-password");

    expect(context.output).toContain("Entry added.");
    expect(payload.entries[0]).toMatchObject({ name: "GitHub", secret: "super-secret" });
  });

  it("rejects missing names when adding", async () => {
    const vaultPath = await tempVaultPath();
    await createVault(vaultPath, "master-password");
    const context = createContext(vaultPath, ["master-password", "", "", "super-secret", "", "", ""]);

    await expect(runAddCommand(context)).rejects.toThrow("Entry name is required.");
  });

  it("rejects missing secrets when adding", async () => {
    const vaultPath = await tempVaultPath();
    await createVault(vaultPath, "master-password");
    const context = createContext(vaultPath, ["master-password", "GitHub", "", "", "", "", ""]);

    await expect(runAddCommand(context)).rejects.toThrow("Entry secret is required.");
  });

  it("lists entries without secrets", async () => {
    const vaultPath = await tempVaultPath();
    await createVaultWithEntry(vaultPath);
    const context = createContext(vaultPath, ["master-password"]);

    await runListCommand(context);

    expect(context.output.join("\n")).toContain("GitHub");
    expect(context.output.join("\n")).not.toContain("super-secret");
  });

  it("gets entry metadata without secrets", async () => {
    const vaultPath = await tempVaultPath();
    await createVaultWithEntry(vaultPath);
    const context = createContext(vaultPath, ["master-password"]);

    await runGetCommand(context, "GitHub");

    expect(context.output.join("\n")).toContain("Name: GitHub");
    expect(context.output.join("\n")).toContain("Has secret: yes");
    expect(context.output.join("\n")).not.toContain("super-secret");
  });

  it("copies an entry secret without printing it", async () => {
    const vaultPath = await tempVaultPath();
    await createVaultWithEntry(vaultPath);
    const context = createContext(vaultPath, ["master-password"]);
    const copySecret = vi.spyOn(context, "copySecret");

    await runCopyCommand(context, "GitHub");

    expect(copySecret).toHaveBeenCalledWith("super-secret");
    expect(context.output).toEqual(["Secret copied to clipboard."]);
  });

  it("fails ambiguous get without revealing secrets", async () => {
    const vaultPath = await tempVaultPath();
    let payload = await createVault(vaultPath, "master-password");
    payload = addEntry(payload, { name: "GitHub", secret: "secret-1" });
    payload = addEntry(payload, { name: "GitHub", secret: "secret-2" });
    await saveVault(vaultPath, payload, "master-password");
    const context = createContext(vaultPath, ["master-password"]);

    await expect(runGetCommand(context, "GitHub")).rejects.toThrow("Ambiguous entry match: GitHub");
    expect(context.output.join("\n")).not.toContain("secret-1");
    expect(context.output.join("\n")).not.toContain("secret-2");
  });

  it("fails ambiguous copy without copying secrets", async () => {
    const vaultPath = await tempVaultPath();
    let payload = await createVault(vaultPath, "master-password");
    payload = addEntry(payload, { name: "GitHub", secret: "secret-1" });
    payload = addEntry(payload, { name: "GitHub", secret: "secret-2" });
    await saveVault(vaultPath, payload, "master-password");
    const context = createContext(vaultPath, ["master-password"]);
    const copySecret = vi.spyOn(context, "copySecret");

    await expect(runCopyCommand(context, "GitHub")).rejects.toThrow("Ambiguous entry match: GitHub");
    expect(copySecret).not.toHaveBeenCalled();
  });

  it("wrong password prevents command execution and vault modification", async () => {
    const vaultPath = await tempVaultPath();
    await createVaultWithEntry(vaultPath);
    const before = await readFile(vaultPath, "utf8");
    const context = createContext(vaultPath, ["wrong-password"]);

    await expect(runListCommand(context)).rejects.toThrow("Could not decrypt vault. Check your master password and try again.");
    await expect(readFile(vaultPath, "utf8")).resolves.toBe(before);
  });
});
