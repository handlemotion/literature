import path from "node:path";
import { fileURLToPath } from "node:url";
import { withLiterature } from "@handlemotion/literature";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = withLiterature(
  {
    allowedDevOrigins: ["literature.localhost", "*.literature.localhost"],
    turbopack: {
      root: monorepoRoot,
    },
  },
  {
    projectRoot: monorepoRoot,
    appRoot: path.join(path.dirname(fileURLToPath(import.meta.url))),
  },
);

export default nextConfig;
