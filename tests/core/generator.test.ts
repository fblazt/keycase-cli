import { describe, expect, it } from "vitest";

import { generatePassword } from "../../src/core/generator.js";

describe("password generator", () => {
  it("generates a 24-character password by default", () => {
    expect(generatePassword()).toHaveLength(24);
  });

  it("uses only enabled character sets", () => {
    const password = generatePassword({ length: 64, uppercase: false, lowercase: false, numbers: true, symbols: false });

    expect(password).toMatch(/^[0-9]+$/);
  });

  it("rejects disabled character sets", () => {
    expect(() =>
      generatePassword({ uppercase: false, lowercase: false, numbers: false, symbols: false }),
    ).toThrow("At least one character set must be enabled.");
  });

  it("rejects invalid length", () => {
    expect(() => generatePassword({ length: 0 })).toThrow("Password length must be at least 1.");
  });

  it("uses cryptographically random output", () => {
    const passwords = new Set(Array.from({ length: 8 }, () => generatePassword({ length: 32 })));

    expect(passwords.size).toBeGreaterThan(1);
  });
});
