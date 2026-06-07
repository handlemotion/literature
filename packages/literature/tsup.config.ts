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
      vite: "src/vite.ts",
      lit: "src/lit.ts",
      types: "src/types.ts",
    },
    format: ["esm"],
    dts: {
      resolve: true,
      entry: {
        index: "src/index.ts",
        lit: "src/lit.ts",
        types: "src/types.ts",
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
    entry: {
      devtools: "src/devtools.ts",
      "next/LiteratureDev": "src/next/LiteratureDev.tsx",
      "client/LiteratureChrome": "src/client/LiteratureChrome.tsx",
    },
    format: ["esm"],
    banner: {
      js: '"use client";',
    },
    dts: false,
    target: "es2020",
    platform: "neutral",
    sourcemap: false,
    splitting: true,
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
