import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  platform: "node",
  noExternal: ["@opentui/react", "react-reconciler", "scheduler"],
  async onSuccess() {
    const { chmod } = await import("node:fs/promises");
    await chmod("dist/index.js", 0o755);
  },
});
