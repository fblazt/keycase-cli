export class KeycaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeycaseError";
  }
}

export class UnsupportedVaultVersionError extends KeycaseError {
  constructor(version: unknown) {
    super(`Unsupported vault version: ${String(version)}`);
    this.name = "UnsupportedVaultVersionError";
  }
}

export class InvalidVaultFileError extends KeycaseError {
  constructor() {
    super("Invalid vault file.");
    this.name = "InvalidVaultFileError";
  }
}
