import { randomInt } from "node:crypto";

import { KeycaseError } from "../utils/errors.js";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";
const MIN_LENGTH = 1;

export type PasswordGeneratorOptions = {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
};

export const DEFAULT_PASSWORD_GENERATOR_OPTIONS = {
  length: 24,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
} as const;

export class InvalidPasswordGeneratorOptionsError extends KeycaseError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPasswordGeneratorOptionsError";
  }
}

export function generatePassword(options: PasswordGeneratorOptions = {}): string {
  const resolved = { ...DEFAULT_PASSWORD_GENERATOR_OPTIONS, ...options };

  if (!Number.isInteger(resolved.length) || resolved.length < MIN_LENGTH) {
    throw new InvalidPasswordGeneratorOptionsError("Password length must be at least 1.");
  }

  const alphabet = buildAlphabet(resolved);

  if (alphabet.length === 0) {
    throw new InvalidPasswordGeneratorOptionsError("At least one character set must be enabled.");
  }

  let password = "";

  for (let index = 0; index < resolved.length; index += 1) {
    password += alphabet[randomInt(alphabet.length)];
  }

  return password;
}

function buildAlphabet(options: Required<PasswordGeneratorOptions>): string {
  return [
    options.uppercase ? UPPERCASE : "",
    options.lowercase ? LOWERCASE : "",
    options.numbers ? NUMBERS : "",
    options.symbols ? SYMBOLS : "",
  ].join("");
}
