import { transformSync, type TransformOptions } from "@babel/core";
import path from "node:path";
import { createUnplugin } from "unplugin";
import literatureBabelPlugin from "./babel-plugin-literature.js";
import { MANIFEST_MODULE, MANIFEST_RESOLVED } from "./constants.js";
import { getManifestSnapshot, mergeTargets, resetManifestState } from "./manifest-state.js";

function isTransformable(id: string): boolean {
  return /\.(tsx|jsx)$/.test(id) && !id.includes("node_modules");
}

export const createLiteraturePlugin = createUnplugin<{
  projectRoot?: string;
}>((options) => {
  const isDev = process.env.NODE_ENV === "development";

  return {
    name: "literature",
    enforce: "pre",
    buildStart() {
      resetManifestState();
    },
    resolveId(id) {
      if (id === MANIFEST_MODULE) return MANIFEST_RESOLVED;
      return null;
    },
    load(id) {
      if (id === MANIFEST_RESOLVED) {
        return `export default ${JSON.stringify(getManifestSnapshot())}`;
      }
      return null;
    },
    transformInclude(id) {
      return isTransformable(id);
    },
    transform(code, id) {
      const relFile = relativize(id, options.projectRoot ?? process.cwd());
      if (!relFile) {
        return null;
      }

      if (!isDev) {
        const result = transformSync(code, babelOptions(relFile, id, true));
        if (!result?.code) return null;
        return { code: result.code, map: result.map ?? undefined };
      }

      const result = transformSync(code, {
        ...babelOptions(relFile, id, false),
        plugins: [
          [
            literatureBabelPlugin,
            {
              filename: relFile,
              onTargets: (targets: Record<string, import("@literature/core").TextTarget>) => {
                mergeTargets(targets);
              },
            },
          ],
        ],
      });

      if (!result?.code) return null;
      return { code: result.code, map: result.map ?? undefined };
    },
  };
});

function relativize(id: string, root: string): string | null {
  const resolvedRoot = path.resolve(root);
  const resolvedId = path.resolve(id);
  if (resolvedId !== resolvedRoot && !resolvedId.startsWith(`${resolvedRoot}${path.sep}`)) {
    return null;
  }
  return path.relative(resolvedRoot, resolvedId).replace(/\\/g, "/");
}

function babelOptions(relFile: string, absId: string, strip: boolean): TransformOptions {
  return {
    filename: absId,
    sourceMaps: true,
    babelrc: false,
    configFile: false,
    plugins: [[literatureBabelPlugin, { filename: relFile, strip }]],
  };
}

export function getManifest() {
  return getManifestSnapshot();
}

export function resetManifest(): void {
  resetManifestState();
}
