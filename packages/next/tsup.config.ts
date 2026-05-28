import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/LiteratureDevtools.tsx"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node18",
  external: ["next"],
});
