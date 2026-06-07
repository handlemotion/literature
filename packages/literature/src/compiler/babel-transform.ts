import { transformSync, type BabelFileResult, type TransformOptions } from "@babel/core";
import type { TextTarget } from "../core/index.js";
import literatureBabelPlugin from "./babel-plugin-literature.js";

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
          presets: [
            [
              "@babel/preset-typescript",
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
): BabelFileResult | null {
  return transformSync(code, literatureBabelTransformOptions(options));
}
