import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node18",
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
