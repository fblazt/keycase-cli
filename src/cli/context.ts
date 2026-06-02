import { input, password } from "@inquirer/prompts";

import { copySecretToClipboard, type CopySecretResult } from "../core/clipboard.js";
import { getDefaultVaultPath } from "../utils/paths.js";

export type CliContext = {
  vaultPath: string;
  promptText: (message: string) => Promise<string>;
  promptPassword: (message: string) => Promise<string>;
  write: (message: string) => void;
  writeError: (message: string) => void;
  copySecret: (secret: string) => Promise<CopySecretResult>;
};

export function createCliContext(): CliContext {
  return {
    vaultPath: getDefaultVaultPath(),
    promptText: (message) => input({ message }),
    promptPassword: (message) => password({ message, mask: "*" }),
    write: (message) => console.log(message),
    writeError: (message) => console.error(message),
    copySecret: copySecretToClipboard,
  };
}
