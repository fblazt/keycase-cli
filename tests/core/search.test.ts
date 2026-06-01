import { describe, expect, it } from "vitest";

import { searchEntries } from "../../src/core/search.js";
import type { VaultEntry } from "../../src/schema/vault.js";

const timestamp = "2026-01-01T00:00:00.000Z";

const entries: VaultEntry[] = [
  {
    id: "entry-1",
    name: "GitHub",
    username: "human@example.com",
    secret: "secret-1",
    url: "https://github.com",
    tags: ["dev", "important"],
    notes: "source control",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "entry-2",
    name: "Supabase",
    username: "builder@example.com",
    secret: "secret-2",
    url: "https://supabase.com",
    tags: ["database"],
    notes: "project backend",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

describe("search", () => {
  it("matches by name", () => {
    expect(searchEntries(entries, "github")).toHaveLength(1);
  });

  it("matches by username", () => {
    expect(searchEntries(entries, "builder@example.com")).toHaveLength(1);
  });

  it("matches by URL", () => {
    expect(searchEntries(entries, "supabase.com")).toHaveLength(1);
  });

  it("matches by tags", () => {
    expect(searchEntries(entries, "important")).toHaveLength(1);
  });

  it("matches by notes", () => {
    expect(searchEntries(entries, "source control")).toHaveLength(1);
  });

  it("is case-insensitive", () => {
    expect(searchEntries(entries, "SUPABASE")).toHaveLength(1);
  });

  it("does not expose secrets", () => {
    const [entry] = searchEntries(entries, "github");

    expect(entry && "secret" in entry).toBe(false);
  });
});
