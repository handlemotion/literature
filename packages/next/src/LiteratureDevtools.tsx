"use client";

import { LiteratureRoot } from "@handleui/literature-client";

export function LiteratureDevtools() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return <LiteratureRoot />;
}
