import path from "node:path";

export function shouldSkipLiteratureTransform(filename: string): boolean {
  const base = path.basename(filename);
  return (
    filename.includes("node_modules") ||
    base === "layout.tsx" ||
    base === "layout.jsx" ||
    base === "LiteratureChrome.tsx" ||
    base === "Literature.tsx" ||
    base === "LiteratureDev.tsx"
  );
}
