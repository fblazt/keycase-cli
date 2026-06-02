import { useEffect, useState } from "react";
import { useRenderer } from "@opentui/react";

import { createVault, saveVault, unlockVault } from "../core/vault.js";
import { vaultExists } from "../core/storage.js";
import type { VaultPayload } from "../schema/vault.js";
import { FirstRunScreen } from "./screens/FirstRunScreen.js";
import { UnlockScreen } from "./screens/UnlockScreen.js";
import { VaultScreen } from "./screens/VaultScreen.js";

type AppMode = "loading" | "first-run" | "unlock" | "vault";

export type AppProps = {
  vaultPath: string;
};

export function App({ vaultPath }: AppProps) {
  const renderer = useRenderer();
  const [mode, setMode] = useState<AppMode>("loading");
  const [payload, setPayload] = useState<VaultPayload | undefined>();
  const [masterPassword, setMasterPassword] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    void vaultExists(vaultPath)
      .then((exists) => {
        if (!cancelled) {
          setMode(exists ? "unlock" : "first-run");
        }
      })
      .catch((caughtError: unknown) => {
        if (!cancelled) {
          setError(errorMessage(caughtError));
          setMode("unlock");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath]);

  const quit = () => {
    renderer.destroy();
  };

  const create = (masterPassword: string) => {
    setError(undefined);
    void createVault(vaultPath, masterPassword)
      .then((createdPayload) => {
        setMasterPassword(masterPassword);
        setPayload(createdPayload);
        setMode("vault");
      })
      .catch((caughtError: unknown) => {
        setError(errorMessage(caughtError));
      });
  };

  const unlock = (masterPassword: string) => {
    setError(undefined);
    void unlockVault(vaultPath, masterPassword)
      .then((unlockedPayload) => {
        setMasterPassword(masterPassword);
        setPayload(unlockedPayload);
        setMode("vault");
      })
      .catch(() => {
        setError("Could not unlock vault. Check your master password and try again.");
      });
  };

  if (mode === "loading") {
    return (
      <box style={{ padding: 1 }}>
        <text>Loading Keycase…</text>
      </box>
    );
  }

  if (mode === "first-run") {
    return <FirstRunScreen error={error} onCreate={create} onQuit={quit} />;
  }

  if (mode === "unlock") {
    return <UnlockScreen error={error} onUnlock={unlock} onQuit={quit} />;
  }

  return (
    <VaultScreen
      payload={payload!}
      onChange={(updatedPayload) => {
        setPayload(updatedPayload);

        if (!masterPassword) {
          setError("Vault is unlocked, but the master password is unavailable for saving changes.");
          return;
        }

        void saveVault(vaultPath, updatedPayload, masterPassword)
          .then(setPayload)
          .catch((caughtError: unknown) => {
            setError(errorMessage(caughtError));
          });
      }}
    />
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
