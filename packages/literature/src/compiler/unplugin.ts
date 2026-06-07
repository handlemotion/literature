import path from "node:path";
import { createUnplugin } from "unplugin";
import { transformLiteratureSource } from "./babel-transform.js";
import { MANIFEST_MODULE, MANIFEST_RESOLVED } from "./constants.js";
import { getManifestSnapshot, mergeTargets, resetManifestState } from "./manifest-state.js";
import { shouldSkipLiteratureTransform } from "./skip.js";

function isTransformable(id: string): boolean {
  return /\.(tsx|jsx)$/.test(id) && !id.includes("node_modules");
}

function isUnderDir(file: string, root: string): boolean {
  const rel = path.relative(root, file);
  return Boolean(rel) && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export const createLiteraturePlugin = createUnplugin<{
  projectRoot?: string;
  /** Only transform sources under this directory (defaults to projectRoot). */
  appRoot?: string;
}>((options) => {
  const isDev = process.env.NODE_ENV === "development";
  const appRoot = path.resolve(options.appRoot ?? options.projectRoot ?? process.cwd());

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
      return isTransformable(id) && isUnderDir(id, appRoot) && !shouldSkipLiteratureTransform(id);
    },
    transform(code, id) {
      const relFile = relativize(id, options.projectRoot ?? process.cwd());
      if (!relFile) {
        return null;
      }

      const result = transformLiteratureSource(code, {
        relFile,
        absFilename: id,
        strip: !isDev,
        onTargets: isDev ? mergeTargets : undefined,
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

export function getManifest() {
  return getManifestSnapshot();
}

export function resetManifest(): void {
  resetManifestState();
}
