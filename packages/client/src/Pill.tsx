import type { CSSProperties } from "react";

export type PillMode = "off" | "select" | "editing";

interface PillProps {
  mode: PillMode;
  label: string;
  onToggleSelect: () => void;
  onClose: () => void;
}

export function Pill({ mode, label, onToggleSelect, onClose }: PillProps) {
  const modeColor = mode === "select" ? "#6366f1" : mode === "editing" ? "#22c55e" : "#64748b";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(15, 23, 42, 0.92)",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.08)",
        userSelect: "none",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: modeColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 600 }}>Literature</span>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <button
        type="button"
        onClick={onToggleSelect}
        style={pillButtonStyle(mode === "select" || mode === "editing")}
      >
        {mode === "off" ? "Select" : "Stop"}
      </button>
      <button type="button" onClick={onClose} style={pillButtonStyle(false)}>
        ×
      </button>
    </div>
  );
}

function pillButtonStyle(active: boolean): CSSProperties {
  return {
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    background: active ? "#6366f1" : "rgba(255,255,255,0.1)",
    color: "#f8fafc",
  };
}
