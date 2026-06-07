import path from "node:path";
import { transformLiteratureSource } from "./babel-transform.js";
import { mergeTargets } from "./manifest-state.js";

type LoaderContext = {
  async(): (err: Error | null, code?: string, map?: unknown) => void;
  getOptions(): { appRoot?: string };
  resourcePath: string;
  rootContext?: string;
};

function isUnderDir(file: string, root: string): boolean {
  const rel = path.relative(root, file);
  return Boolean(rel) && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export default function literatureLoader(this: LoaderContext, source: string): void {
  const callback = this.async();
  const filename = this.resourcePath;
  const { appRoot = process.cwd() } = this.getOptions?.() ?? {};

  const base = path.basename(filename);
  if (
    filename.includes("node_modules") ||
    !isUnderDir(filename, path.resolve(appRoot)) ||
    base === "layout.tsx" ||
    base === "layout.jsx" ||
    base.includes("literature-devtools")
  ) {
    callback(null, source);
    return;
  }

  const isDev = process.env.NODE_ENV === "development";
  const projectRoot = this.rootContext || process.cwd();
  const relFile = path.relative(projectRoot, filename).replace(/\\/g, "/");

  try {
    const result = transformLiteratureSource(source, {
      relFile,
      absFilename: filename,
      strip: !isDev,
      onTargets: isDev ? mergeTargets : undefined,
    });

    callback(null, result?.code ?? source, result?.map);
  } catch (err) {
    callback(err instanceof Error ? err : new Error(String(err)));
  }
}
