import type { ReactNode } from "react";

export function __lit(id: string, text: string): ReactNode {
  return (
    <span data-literature-target={id} style={{ display: "contents" }}>
      {text}
    </span>
  );
}
