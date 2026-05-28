import type { CSSProperties } from "react";
import { Editor } from "./Editor.js";

interface PanelProps {
  filePath: string;
  snippet: string;
  draft: string;
  busy: boolean;
  status: string | null;
  onDraftChange: (value: string) => void;
  onApply: () => void;
  onUndo: () => void;
}

export function Panel({
  filePath,
  snippet,
  draft,
  busy,
  status,
  onDraftChange,
  onApply,
  onUndo,
}: PanelProps) {
  return (
    <div
      style={{
        marginTop: "8px",
        padding: "12px",
        borderRadius: "12px",
        background: "rgba(15, 23, 42, 0.96)",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        width: "320px",
        boxSizing: "border-box",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ opacity: 0.7, marginBottom: "4px", fontSize: "11px" }}>{filePath}</div>
      <div
        style={{
          marginBottom: "8px",
          padding: "6px 8px",
          borderRadius: "6px",
          background: "rgba(0,0,0,0.25)",
          fontSize: "12px",
          opacity: 0.9,
        }}
      >
        {snippet}
      </div>
      <Editor value={draft} onChange={onDraftChange} disabled={busy} />
      {status ? (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#fbbf24" }}>{status}</div>
      ) : null}
      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <button type="button" onClick={onApply} disabled={busy} style={actionStyle(true)}>
          Apply
        </button>
        <button type="button" onClick={onUndo} disabled={busy} style={actionStyle(false)}>
          Undo
        </button>
      </div>
    </div>
  );
}

function actionStyle(primary: boolean): CSSProperties {
  return {
    flex: primary ? 1 : undefined,
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px",
    background: primary ? "#6366f1" : "rgba(255,255,255,0.1)",
    color: "#f8fafc",
  };
}
