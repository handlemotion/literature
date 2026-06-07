"use client";

import dynamic from "next/dynamic";

const LiteratureChrome = dynamic(
  () => import("../client/LiteratureChrome.js").then((m) => m.LiteratureChrome),
  { ssr: false },
);

export function LiteratureDev() {
  return <LiteratureChrome />;
}
