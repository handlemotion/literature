import type { PluginObj } from "@babel/core";
import { types as t } from "@babel/core";
import { buildTextTarget, type TextTarget } from "../core/index.js";
import { LIT_IMPORT_SOURCE, STRING_PROP_ALLOWLIST } from "./constants.js";

export interface LiteratureBabelState {
  targets: Record<string, TextTarget>;
  needsLitImport: boolean;
}

export interface LiteratureBabelOptions {
  filename?: string;
  strip?: boolean;
  onTargets?: (targets: Record<string, TextTarget>) => void;
}

function locToRange(loc: t.SourceLocation | null | undefined) {
  if (!loc) return null;
  return {
    start: { line: loc.start.line, column: loc.start.column },
    end: { line: loc.end.line, column: loc.end.column },
  };
}

function relativePath(filename: string): string {
  return filename.replace(/\\/g, "/").replace(/^\//, "");
}

function isEditableJsxText(value: string): boolean {
  return normalizeJsxText(value).length > 0;
}

function normalizeJsxText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function createLitCall(
  id: string,
  text: string,
  types: typeof import("@babel/core").types,
): import("@babel/core").types.CallExpression {
  return types.callExpression(types.identifier("__lit"), [
    types.stringLiteral(id),
    types.stringLiteral(text),
  ]);
}

export default function literatureBabelPlugin(
  _api: unknown,
  options: LiteratureBabelOptions = {},
): PluginObj<{ opts: LiteratureBabelOptions } & LiteratureBabelState> {
  const state: LiteratureBabelState = {
    targets: {},
    needsLitImport: false,
  };

  return {
    name: "literature",
    pre() {
      state.targets = {};
      state.needsLitImport = false;
    },
    post() {
      options.onTargets?.(state.targets);
    },
    visitor: {
      Program: {
        exit(programPath) {
          if (!state.needsLitImport || options.strip) return;
          const hasImport = programPath.node.body.some(
            (n) => t.isImportDeclaration(n) && n.source.value === LIT_IMPORT_SOURCE,
          );
          if (hasImport) return;
          const importDecl = t.importDeclaration(
            [t.importSpecifier(t.identifier("__lit"), t.identifier("__lit"))],
            t.stringLiteral(LIT_IMPORT_SOURCE),
          );
          programPath.unshiftContainer("body", importDecl);
        },
      },
      JSXText(path) {
        if (options.strip) {
          const raw = path.node.value;
          const text = normalizeJsxText(raw);
          if (text) path.replaceWith(t.jsxText(text));
          return;
        }
        const raw = path.node.value;
        if (!isEditableJsxText(raw)) return;
        const text = normalizeJsxText(raw);
        const range = locToRange(path.node.loc);
        const filePath = relativePath(options.filename ?? "unknown.tsx");
        if (!range) return;
        const target = buildTextTarget({
          kind: "jsxText",
          filePath,
          range,
          literal: text,
        });
        state.targets[target.id] = target;
        state.needsLitImport = true;
        path.replaceWith(t.jsxExpressionContainer(createLitCall(target.id, text, t)));
      },
      JSXAttribute(path) {
        if (options.strip) return;
        const name = t.isJSXIdentifier(path.node.name) ? path.node.name.name : null;
        if (!name || !STRING_PROP_ALLOWLIST.has(name)) return;
        const value = path.node.value;
        if (!value || !t.isStringLiteral(value)) return;
        const text = value.value;
        const range = locToRange(value.loc);
        const filePath = relativePath(options.filename ?? "unknown.tsx");
        if (!range) return;
        const target = buildTextTarget({
          kind: "stringProp",
          filePath,
          range,
          literal: text,
          propName: name,
        });
        state.targets[target.id] = target;
        state.needsLitImport = true;
        path.get("value").replaceWith(t.jsxExpressionContainer(createLitCall(target.id, text, t)));
      },
      CallExpression(path) {
        if (!options.strip) return;
        const callee = path.node.callee;
        if (!t.isIdentifier(callee, { name: "__lit" })) return;
        const args = path.node.arguments;
        if (args.length >= 2 && t.isStringLiteral(args[1])) {
          const parent = path.parent;
          if (t.isJSXExpressionContainer(parent)) {
            path.replaceWith(t.jsxText(args[1].value));
          } else {
            path.replaceWith(t.stringLiteral(args[1].value));
          }
        }
      },
    },
  };
}
