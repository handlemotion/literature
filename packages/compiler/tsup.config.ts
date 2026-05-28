import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/manifest-state.ts", "src/babel-plugin-literature.ts"],
  format: ["esm"],
  dts: { entry: ["src/index.ts", "src/manifest-state.ts"] },
  clean: true,
  target: "node18",
  splitting: false,
});
