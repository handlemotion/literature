"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LiteratureManifest, TextTarget } from "../core/index.js";
import { fetchManifest, patchText, undoPatch } from "./api.js";
import { enableEditMode, setLiteratureActiveTarget } from "./editMode.js";
import { Panel } from "./Panel.js";
import { Pill, type PillMode } from "./Pill.js";
import { isLiteratureEditShortcut } from "./shortcut.js";

export function LiteratureChrome() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<PillMode>("off");
  const [selected, setSelected] = useState<TextTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const manifestRef = useRef<LiteratureManifest>({ version: 1, targets: {} });
  const stopEditModeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
    void fetchManifest().then((nextManifest) => {
      manifestRef.current = nextManifest;
    });
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
    void fetchManifest().then((nextManifest) => {
      manifestRef.current = nextManifest;
    });
    stopEditModeRef.current = enableEditMode({
      onSelect: (targetId) => {
        const target = manifestRef.current.targets[targetId] ?? null;
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
  }, []);

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
      if (isLiteratureEditShortcut(e)) {
        e.preventDefault();
        toggleEdit();
        return;
      }
      if (e.key === "Escape" && mode === "editing") {
        e.preventDefault();
        dismissEditing();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [toggleEdit, mode, dismissEditing]);

  useEffect(() => {
    return () => stopEditModeRef.current?.();
  }, []);

  if (!mounted) return null;

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
