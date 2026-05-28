const HIGHLIGHT_Z = 2147483645;

export interface TextSelectionCallbacks {
  onHover: (targetId: string | null) => void;
  onSelect: (targetId: string) => void;
}

export function startTextSelection(callbacks: TextSelectionCallbacks): () => void {
  const highlight = document.createElement("div");
  Object.assign(highlight.style, {
    position: "fixed",
    pointerEvents: "none",
    zIndex: String(HIGHLIGHT_Z),
    border: "2px solid #6366f1",
    borderRadius: "4px",
    background: "rgba(99, 102, 241, 0.12)",
    transition: "top 75ms ease-out, left 75ms ease-out, width 75ms ease-out, height 75ms ease-out",
    display: "none",
    boxSizing: "border-box",
  });
  document.body.appendChild(highlight);

  let raf = 0;

  const resolveTarget = (x: number, y: number): HTMLElement | null => {
    const el = document.elementFromPoint(x, y);
    return el?.closest("[data-literature-target]") as HTMLElement | null;
  };

  const positionHighlight = (target: HTMLElement | null) => {
    if (!target) {
      highlight.style.display = "none";
      return;
    }
    const rect = target.getClientRects()[0];
    if (!rect) {
      highlight.style.display = "none";
      return;
    }
    Object.assign(highlight.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      display: "block",
    });
  };

  const onPointerMove = (event: PointerEvent) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const target = resolveTarget(event.clientX, event.clientY);
      positionHighlight(target);
      callbacks.onHover(target?.getAttribute("data-literature-target") ?? null);
    });
  };

  const onClick = (event: MouseEvent) => {
    const target = resolveTarget(event.clientX, event.clientY);
    if (!target) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const id = target.getAttribute("data-literature-target");
    if (!id) return;
    event.preventDefault();
    event.stopPropagation();
    callbacks.onSelect(id);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      callbacks.onHover(null);
      positionHighlight(null);
    }
  };

  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.body.style.cursor = "crosshair";

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "";
    highlight.remove();
  };
}
