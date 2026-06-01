import { mkdtemp, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  addEntry,
  createEmptyVaultPayload,
  createVault,
  deleteEntry,
  editEntry,
  getEntrySecret,
  getPublicEntry,
  listEntries,
  saveVault,
  unlockVault,
} from "../../src/core/vault.js";
import { vaultExists } from "../../src/core/storage.js";

async function tempVaultPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "keycase-test-"));
  return join(dir, ".keycase", "vault.enc");
}

describe("vault service", () => {
  it("detects a missing vault", async () => {
    await expect(vaultExists(await tempVaultPath())).resolves.toBe(false);
  });

  it("creates and unlocks an encrypted vault", async () => {
    const vaultPath = await tempVaultPath();

    const created = await createVault(vaultPath, "master-password");
    const unlocked = await unlockVault(vaultPath, "master-password");
    const rawVaultFile = await readFile(vaultPath, "utf8");

    expect(created.entries).toEqual([]);
    expect(unlocked.entries).toEqual([]);
    expect(rawVaultFile).not.toContain('"entries"');
  });

  it("creates vault files with restrictive permissions where supported", async () => {
    const vaultPath = await tempVaultPath();

    await createVault(vaultPath, "master-password");

    if (process.platform !== "win32") {
      const dirMode = (await stat(join(vaultPath, ".."))).mode & 0o777;
      const fileMode = (await stat(vaultPath)).mode & 0o777;

      expect(dirMode).toBe(0o700);
      expect(fileMode).toBe(0o600);
    }
  });

  it("fails wrong-password unlock without modifying the vault", async () => {
    const vaultPath = await tempVaultPath();
    await createVault(vaultPath, "master-password");
    const before = await readFile(vaultPath, "utf8");

    await expect(unlockVault(vaultPath, "wrong-password")).rejects.toThrow(
      "Could not decrypt vault. Check your master password and try again.",
    );

    await expect(readFile(vaultPath, "utf8")).resolves.toBe(before);
  });

  it("adds, edits, deletes, and persists entries", async () => {
    const vaultPath = await tempVaultPath();
    let payload = createEmptyVaultPayload();

    payload = addEntry(payload, {
      name: "GitHub",
      username: "human@example.com",
      secret: "secret-1",
      url: "https://github.com",
      tags: ["dev"],
      notes: "note",
    });
    payload = await saveVault(vaultPath, payload, "master-password");

    let unlocked = await unlockVault(vaultPath, "master-password");
    expect(listEntries(unlocked)).toHaveLength(1);
    expect(getEntrySecret(unlocked, "GitHub")).toBe("secret-1");

    unlocked = editEntry(unlocked, "GitHub", { name: "GitHub Main", secret: "secret-2" });
    unlocked = await saveVault(vaultPath, unlocked, "master-password");
    unlocked = await unlockVault(vaultPath, "master-password");

    expect(getPublicEntry(unlocked, "GitHub Main")).toMatchObject({ name: "GitHub Main", hasSecret: true });
    expect(getEntrySecret(unlocked, "GitHub Main")).toBe("secret-2");

    unlocked = deleteEntry(unlocked, "GitHub Main");
    await saveVault(vaultPath, unlocked, "master-password");

    await expect(unlockVault(vaultPath, "master-password")).resolves.toMatchObject({ entries: [] });
  });

  it("returns public views without secrets", () => {
    const payload = addEntry(createEmptyVaultPayload(), { name: "GitHub", secret: "secret-1" });
    const [entry] = listEntries(payload);

    expect(entry).toMatchObject({ name: "GitHub", hasSecret: true });
    expect(entry && "secret" in entry).toBe(false);
    expect("secret" in getPublicEntry(payload, "GitHub")).toBe(false);
  });

  it("fails ambiguous exact-name lookup without returning a secret", () => {
    let payload = createEmptyVaultPayload();
    payload = addEntry(payload, { name: "GitHub", secret: "secret-1" });
    payload = addEntry(payload, { name: "GitHub", secret: "secret-2" });

    expect(() => getPublicEntry(payload, "GitHub")).toThrow("Ambiguous entry match: GitHub");
    expect(() => getEntrySecret(payload, "GitHub")).toThrow("Ambiguous entry match: GitHub");
  });
});
