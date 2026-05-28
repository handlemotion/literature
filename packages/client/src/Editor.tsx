interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function Editor({ value, onChange, disabled }: EditorProps) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      style={{
        width: "100%",
        resize: "vertical",
        font: "inherit",
        padding: "8px",
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(0,0,0,0.35)",
        color: "inherit",
        boxSizing: "border-box",
      }}
    />
  );
}
