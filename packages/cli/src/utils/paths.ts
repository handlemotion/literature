import path from "node:path";

export function resolveWithinRoot(root: string, relativePath: string): string {
  const rootResolved = path.resolve(root);
  const target = path.resolve(rootResolved, relativePath);
  if (target !== rootResolved && !target.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error(`Path "${relativePath}" must stay within ${rootResolved}`);
  }
  return target;
}
