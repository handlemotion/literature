const STYLE_ID = "literature-edit-styles";

const EDIT_STYLES = `
html[data-literature-edit] [data-literature-target] {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  background-color: rgba(59, 130, 246, 0.18);
  border-radius: 2px;
  cursor: pointer;
}
html[data-literature-edit] [data-literature-target][data-literature-active] {
  outline-color: #1d4ed8;
  background-color: rgba(37, 99, 235, 0.28);
}
`;

export interface EditModeCallbacks {
  onSelect: (targetId: string) => void;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = EDIT_STYLES;
  document.head.appendChild(style);
}

function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}

function clearActiveTargets(): void {
  for (const el of document.querySelectorAll("[data-literature-active]")) {
    el.removeAttribute("data-literature-active");
  }
}

export function setLiteratureActiveTarget(targetId: string | null): void {
  clearActiveTargets();
  if (!targetId) return;
  const el = document.querySelector(
    `[data-literature-target="${CSS.escape(targetId)}"]`,
  );
  el?.setAttribute("data-literature-active", "");
}

function resolveTarget(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest("[data-literature-target]") as HTMLElement | null;
}

export function enableEditMode(callbacks: EditModeCallbacks): () => void {
  ensureStyles();
  document.documentElement.dataset.literatureEdit = "true";

  const onClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("[data-literature-chrome]")) {
      return;
    }
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
    setLiteratureActiveTarget(id);
    callbacks.onSelect(id);
  };

  document.addEventListener("click", onClick, true);

  return () => {
    document.removeEventListener("click", onClick, true);
    delete document.documentElement.dataset.literatureEdit;
    clearActiveTargets();
    removeStyles();
  };
}

/** @deprecated Use `enableEditMode` */
export function startTextSelection(callbacks: {
  onHover: (targetId: string | null) => void;
  onSelect: (targetId: string) => void;
}): () => void {
  return enableEditMode({ onSelect: callbacks.onSelect });
}
