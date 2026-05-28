"use strict";

const { transformSync } = require("@babel/core");
const path = require("path");
const { createRequire } = require("module");

const requireFromCompiler = createRequire(require.resolve("@literature/compiler/package.json"));

function getManifestApi() {
  return requireFromCompiler("./dist/manifest-state.js");
}

function getBabelPlugin() {
  return requireFromCompiler("./dist/babel-plugin-literature.js").default;
}

module.exports = function literatureLoader(source) {
  const callback = this.async();
  const filename = this.resourcePath;
  if (filename.includes("node_modules")) {
    callback(null, source);
    return;
  }
  const isDev = process.env.NODE_ENV === "development";
  const strip = !isDev;
  const projectRoot = this.rootContext || process.cwd();
  const relFile = path.relative(projectRoot, filename).replace(/\\/g, "/");

  try {
    const plugin = getBabelPlugin();
    const { mergeTargets } = getManifestApi();

    const result = transformSync(source, {
      filename,
      sourceMaps: true,
      babelrc: false,
      configFile: false,
      plugins: [
        [
          plugin,
          {
            filename: relFile,
            strip,
            onTargets: mergeTargets,
          },
        ],
      ],
    });

    callback(null, result?.code ?? source, result?.map);
  } catch (err) {
    callback(err);
  }
};
