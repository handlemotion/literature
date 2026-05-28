import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/lit.tsx"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
});
