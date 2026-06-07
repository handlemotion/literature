import { defineConfig } from "tsup";

const runtimeExternals = [
  "next",
  "react",
  "react-dom",
  "react/jsx-runtime",
  "vite",
  "@babel/core",
  "@babel/preset-typescript",
  "recast",
  "unplugin",
  "lucide-react",
];

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      devtools: "src/devtools.ts",
      vite: "src/vite.ts",
      lit: "src/lit.ts",
    },
    format: ["esm"],
    dts: {
      resolve: true,
      entry: {
        index: "src/index.ts",
        devtools: "src/devtools.ts",
        lit: "src/lit.ts",
      },
    },
    clean: true,
    target: "node18",
    platform: "node",
    sourcemap: false,
    splitting: false,
    external: runtimeExternals,
  },
  {
    entry: { "literature-loader": "src/compiler/literature-loader.ts" },
    format: ["cjs"],
    outDir: "dist",
    outExtension: () => ({ js: ".cjs" }),
    dts: false,
    target: "node18",
    platform: "node",
    sourcemap: false,
    splitting: false,
    external: ["@babel/core", "@babel/preset-typescript"],
  },
]);
