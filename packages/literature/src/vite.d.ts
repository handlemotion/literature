import type { UnpluginInstance } from "unplugin";

export type LiteratureManifest = {
  version: number;
  targets: Record<string, unknown>;
};

export declare const createLiteraturePlugin: UnpluginInstance<
  { projectRoot?: string; appRoot?: string },
  boolean
>;

export declare function getManifest(): LiteratureManifest;
export declare function resetManifest(): void;
