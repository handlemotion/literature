import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync, type TransformOptions, type TransformResult } from "@babel/core";
import type { TextTarget } from "@handleui/literature-core";
import literatureBabelPlugin from "./babel-plugin-literature.js";

const require = createRequire(
  typeof __dirname !== "undefined"
    ? path.join(__dirname, "literature-loader.cjs")
    : fileURLToPath(import.meta.url),
);
const typescriptPreset = require.resolve("@babel/preset-typescript");

export type LiteratureTransformOptions = {
  relFile: string;
  absFilename: string;
  strip: boolean;
  onTargets?: (targets: Record<string, TextTarget>) => void;
};

/** Shared Babel options for the literature plugin (Next loader, Vite unplugin, webpack). */
export function literatureBabelTransformOptions({
  relFile,
  absFilename,
  strip,
  onTargets,
}: LiteratureTransformOptions): TransformOptions {
  const isTsx = absFilename.endsWith(".tsx");
  const isTs = /\.tsx?$/i.test(absFilename);

  const pluginOptions = {
    filename: relFile,
    strip,
    ...(onTargets ? { onTargets } : {}),
  };

  return {
    filename: absFilename,
    sourceMaps: true,
    babelrc: false,
    configFile: false,
    plugins: [[literatureBabelPlugin, pluginOptions]],
    ...(isTs
      ? {
          // Plugins run before presets: literature rewrites JSX text, then TS is lowered to JS
          // (required when Turbopack/webpack loaders emit `as: "*.js"`).
          presets: [
            [
              typescriptPreset,
              {
                isTSX: isTsx,
                allExtensions: isTsx,
                onlyRemoveTypeImports: false,
              },
            ],
          ],
        }
      : {
          parserOpts: { plugins: ["jsx"] },
        }),
  };
}

export function transformLiteratureSource(
  code: string,
  options: LiteratureTransformOptions,
): TransformResult | null {
  return transformSync(code, literatureBabelTransformOptions(options));
}
