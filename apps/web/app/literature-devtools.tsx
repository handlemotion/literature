"use client";

import dynamic from "next/dynamic";

const LiteratureDevtools = dynamic(
  () => import("@handleui/literature-next/devtools").then((mod) => mod.LiteratureDevtools),
  { ssr: false },
);

export function LiteratureDevtoolsLoader() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return <LiteratureDevtools />;
}
