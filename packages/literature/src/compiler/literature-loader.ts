import path from "node:path";
import { transformLiteratureSource } from "./babel-transform.js";
import { mergeTargets, setManifestProjectRoot } from "./manifest-state.js";
import { registerManifestTargets } from "./register-manifest.js";
import { isUnderDir, normalizeResourcePath } from "./paths.js";
import { shouldSkipLiteratureTransform } from "./skip.js";

type LoaderContext = {
  async(): (err: Error | null, code?: string, map?: unknown) => void;
  getOptions(): { appRoot?: string; projectRoot?: string };
  resourcePath: string;
  rootContext?: string;
};

export default function literatureLoader(this: LoaderContext, source: string): void {
  const callback = this.async();
  const { appRoot = process.cwd(), projectRoot: optionsProjectRoot } = this.getOptions?.() ?? {};
  const projectRoot = path.resolve(optionsProjectRoot ?? this.rootContext ?? process.cwd());
  const filename = normalizeResourcePath(this.resourcePath, projectRoot);
  const resolvedAppRoot = path.resolve(appRoot);

  if (shouldSkipLiteratureTransform(filename) || !isUnderDir(filename, resolvedAppRoot)) {
    callback(null, source);
    return;
  }

  const isDev = process.env.NODE_ENV === "development";
  const relFile = path.relative(projectRoot, filename).replace(/\\/g, "/");

  if (isDev) {
    setManifestProjectRoot(projectRoot);
  }

  try {
    const result = transformLiteratureSource(source, {
      relFile,
      absFilename: filename,
      strip: !isDev,
      onTargets: isDev
        ? (targets) => {
            mergeTargets(targets);
            void registerManifestTargets(projectRoot, targets);
          }
        : undefined,
    });

    callback(null, result?.code ?? source, result?.map);
  } catch (err) {
    callback(err instanceof Error ? err : new Error(String(err)));
  }
}
