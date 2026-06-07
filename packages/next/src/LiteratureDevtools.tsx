"use client";

import { LiteratureRoot } from "@handlemotion/literature-client";

export function LiteratureDevtools() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return <LiteratureRoot />;
}
