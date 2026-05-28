import path from "node:path";
import { fileURLToPath } from "node:url";
import { withLiterature } from "@literature/next";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = withLiterature(
  {
    turbopack: {
      root: monorepoRoot,
    },
  },
  { projectRoot: monorepoRoot },
);

export default nextConfig;
