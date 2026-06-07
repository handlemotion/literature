import type { UnpluginInstance } from "unplugin";
import type { LiteratureManifest } from "./types.js";

export type { LiteratureManifest } from "./types.js";

export declare const createLiteraturePlugin: UnpluginInstance<
  { projectRoot?: string; appRoot?: string },
  boolean
>;

export declare function getManifest(): LiteratureManifest;
export declare function resetManifest(): void;
