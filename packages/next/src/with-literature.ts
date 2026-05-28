import path from "node:path";
import { createRequire } from "node:module";
import { createLiteraturePlugin } from "@literature/compiler";
import { startLiteratureServer, waitForLiteratureServer } from "./server/start.js";

const require = createRequire(import.meta.url);

type RewriteRule = { source: string; destination: string };
type RewriteConfig =
  | RewriteRule[]
  | {
      beforeFiles?: RewriteRule[];
      afterFiles?: RewriteRule[];
      fallback?: RewriteRule[];
    };

type NextConfig = Record<string, unknown> & {
  webpack?: (config: unknown, context: unknown) => unknown;
  turbopack?: Record<string, unknown>;
  rewrites?: (() => Promise<RewriteConfig>) | RewriteConfig;
};

async function mergeRewrites(
  userRewrites: NextConfig["rewrites"],
  literatureRules: RewriteRule[],
): Promise<RewriteConfig> {
  if (literatureRules.length === 0) {
    if (!userRewrites) {
      return [];
    }
    return typeof userRewrites === "function" ? userRewrites() : userRewrites;
  }

  if (!userRewrites) {
    return literatureRules;
  }

  const resolved = typeof userRewrites === "function" ? await userRewrites() : userRewrites;
  if (Array.isArray(resolved)) {
    return [...literatureRules, ...resolved];
  }

  return {
    ...resolved,
    beforeFiles: [...literatureRules, ...(resolved.beforeFiles ?? [])],
  };
}

export function withLiterature(
  nextConfig: NextConfig = {},
  options: { projectRoot?: string } = {},
): NextConfig {
  const isDev = process.env.NODE_ENV === "development";
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());

  if (isDev) {
    startLiteratureServer(projectRoot);
  }

  const loaderPath = require.resolve("@literature/compiler/literature-loader.cjs");
  const userWebpack = nextConfig.webpack;
  const userRewrites = nextConfig.rewrites;

  return {
    ...nextConfig,
    async rewrites() {
      const literatureRules: RewriteRule[] = [];
      if (isDev) {
        const base = await waitForLiteratureServer(projectRoot);
        if (base) {
          literatureRules.push({
            source: "/__literature/:path*",
            destination: `${base}/:path*`,
          });
        }
      }
      return mergeRewrites(userRewrites, literatureRules);
    },
    webpack(config: unknown, context: unknown) {
      const ctx = context as { dev: boolean; isServer: boolean };
      const cfg = (userWebpack?.(config, context) ?? config) as { plugins?: unknown[] };
      if (isDev && ctx.dev) {
        cfg.plugins = cfg.plugins ?? [];
        const webpackPlugins = createLiteraturePlugin.webpack({ projectRoot });
        cfg.plugins.push(...(Array.isArray(webpackPlugins) ? webpackPlugins : [webpackPlugins]));
      }
      return cfg;
    },
    turbopack: {
      ...(nextConfig.turbopack as object),
      ...(isDev
        ? {
            rules: {
              ...(nextConfig.turbopack as { rules?: Record<string, unknown> })?.rules,
              "*.{jsx,tsx}": {
                loaders: [loaderPath],
                as: "*.js",
              },
            },
          }
        : {}),
    },
  };
}
