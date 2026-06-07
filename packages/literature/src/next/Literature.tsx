"use client";

import { lazy, Suspense, type ComponentType } from "react";

const LiteratureDev: ComponentType =
  process.env.NODE_ENV === "development"
    ? lazy(() => import("./LiteratureDev.js").then((m) => ({ default: m.LiteratureDev })))
    : () => null;

export function Literature() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LiteratureDev />
    </Suspense>
  );
}
