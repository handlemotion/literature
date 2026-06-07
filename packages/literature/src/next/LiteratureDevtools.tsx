"use client";

import { LiteratureRoot } from "../client/index.js";

export function LiteratureDevtools() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return <LiteratureRoot />;
}
