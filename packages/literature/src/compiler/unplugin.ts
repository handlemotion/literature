import path from "node:path";
import { createUnplugin } from "unplugin";
import { transformLiteratureSource } from "./babel-transform.js";
import { MANIFEST_MODULE, MANIFEST_RESOLVED } from "./constants.js";
import { getManifestSnapshot, mergeTargets, resetManifestState, setManifestProjectRoot } from "./manifest-state.js";
import { isUnderDir, resolveAppRoot } from "./paths.js";
import { registerManifestTargets } from "./register-manifest.js";
import { shouldSkipLiteratureTransform } from "./skip.js";

function isTransformable(id: string): boolean {
  return /\.(tsx|jsx)$/.test(id) && !id.includes("node_modules");
}

export const createLiteraturePlugin = createUnplugin<{ projectRoot?: string }>((options) => {
  const isDev = process.env.NODE_ENV === "development";
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const appRoot = resolveAppRoot(projectRoot);

  return {
    name: "literature",
    enforce: "pre",
    buildStart() {
      resetManifestState();
      if (isDev) {
        setManifestProjectRoot(projectRoot);
      }
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
      const relFile = relativize(id, projectRoot);
      if (!relFile) {
        return null;
      }

      const result = transformLiteratureSource(code, {
        relFile,
        absFilename: id,
        strip: !isDev,
        onTargets: isDev
          ? (targets) => {
              mergeTargets(targets);
              void registerManifestTargets(projectRoot, targets);
            }
          : undefined,
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
