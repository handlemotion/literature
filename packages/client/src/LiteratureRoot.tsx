"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LiteratureManifest, TextTarget } from "@handleui/literature-core";
import { patchText, undoPatch } from "./api.js";
import { enableEditMode, setLiteratureActiveTarget } from "./editMode.js";
import { Panel } from "./Panel.js";
import { Pill, type PillMode } from "./Pill.js";

export function LiteratureRoot() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<PillMode>("off");
  const [selected, setSelected] = useState<TextTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [manifest, setManifest] = useState<LiteratureManifest | null>(null);
  const stopEditModeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
    void import("virtual:literature-manifest")
      .then((m) => setManifest(m.default as LiteratureManifest))
      .catch(() => setManifest({ version: 1, targets: {} }));
  }, []);

  const stopEditMode = useCallback(() => {
    stopEditModeRef.current?.();
    stopEditModeRef.current = null;
    setLiteratureActiveTarget(null);
  }, []);

  const startEditMode = useCallback(() => {
    stopEditModeRef.current?.();
    setMode("edit");
    setSelected(null);
    setStatus(null);
    stopEditModeRef.current = enableEditMode({
      onSelect: (targetId) => {
        const target = manifest?.targets[targetId] ?? null;
        if (!target) {
          setStatus("Target not in manifest");
          return;
        }
        setSelected(target);
        setDraft(target.literal);
        setMode("editing");
        setLiteratureActiveTarget(targetId);
      },
    });
  }, [manifest]);

  const exitEditMode = useCallback(() => {
    stopEditMode();
    setMode("off");
    setSelected(null);
    setStatus(null);
  }, [stopEditMode]);

  const toggleEdit = useCallback(() => {
    if (mode === "off") {
      startEditMode();
    } else {
      exitEditMode();
    }
  }, [mode, startEditMode, exitEditMode]);

  const onApply = useCallback(async () => {
    if (!selected) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await patchText(selected.id, draft);
      if (!result.ok) {
        setStatus(result.message);
        return;
      }
      setSelected({ ...selected, literal: draft });
      setStatus("Saved — HMR should refresh");
      exitEditMode();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Patch failed");
    } finally {
      setBusy(false);
    }
  }, [selected, draft, exitEditMode]);

  const onUndo = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await undoPatch();
      if (!result.ok) {
        setStatus(result.message);
        return;
      }
      setStatus("Undone");
      exitEditMode();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Undo failed");
    } finally {
      setBusy(false);
    }
  }, [exitEditMode]);

  const dismissEditing = useCallback(() => {
    setSelected(null);
    setStatus(null);
    setLiteratureActiveTarget(null);
    setMode("edit");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleEdit();
        return;
      }
      if (e.key === "Escape" && mode === "editing") {
        e.preventDefault();
        dismissEditing();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleEdit, mode, dismissEditing]);

  useEffect(() => {
    return () => stopEditModeRef.current?.();
  }, []);

  if (!mounted || !visible) return null;

  const editActive = mode === "edit" || mode === "editing";

  const root = (
    <div
      data-literature-chrome
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 2147483647,
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px",
      }}
    >
      {mode === "editing" && selected ? (
        <Panel
          filePath={selected.filePath}
          snippet={selected.literal}
          draft={draft}
          busy={busy}
          status={status}
          onDraftChange={setDraft}
          onApply={() => void onApply()}
          onUndo={() => void onUndo()}
        />
      ) : null}
      <Pill active={editActive} onToggle={toggleEdit} />
    </div>
  );

  return createPortal(root, document.body);
}
