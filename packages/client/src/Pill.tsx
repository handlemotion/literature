import type { CSSProperties } from "react";
import { PencilLine } from "lucide-react";

export type PillMode = "off" | "edit" | "editing";

interface PillProps {
  active: boolean;
  onToggle: () => void;
}

export function Pill({ active, onToggle }: PillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? "Exit edit mode" : "Edit copy"}
      title={active ? "Exit edit mode" : "Edit copy"}
      style={pillStyle(active)}
    >
      <PencilLine size={22} strokeWidth={2} color="#fff" aria-hidden />
    </button>
  );
}

function pillStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    padding: 0,
    borderRadius: "9999px",
    border: active ? "2px solid rgba(255,255,255,0.85)" : "2px solid transparent",
    background: "#0a0a0a",
    cursor: "pointer",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    userSelect: "none",
  };
}
