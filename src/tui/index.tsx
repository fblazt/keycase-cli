import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

import { getDefaultVaultPath } from "../utils/paths.js";
import { App } from "./App.js";

export type StartTuiOptions = {
  vaultPath?: string;
};

export async function startTui(options: StartTuiOptions = {}): Promise<void> {
  const renderer = await createCliRenderer({ exitOnCtrlC: true, clearOnShutdown: true });
  createRoot(renderer).render(<App vaultPath={options.vaultPath ?? getDefaultVaultPath()} />);
}
