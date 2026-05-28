"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LiteratureManifest, TextTarget } from "@literature/core";
import { patchText, undoPatch } from "./api.js";
import { Panel } from "./Panel.js";
import { Pill, type PillMode } from "./Pill.js";
import { startTextSelection } from "./selection.js";

const STORAGE_KEY = "literature-pill-position";

function loadPosition(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 24, y: 24 };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { x: number; y: number };
  } catch {
    /* ignore */
  }
  return { x: 24, y: 24 };
}

export function LiteratureRoot() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<PillMode>("off");
  const [selected, setSelected] = useState<TextTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [manifest, setManifest] = useState<LiteratureManifest | null>(null);
  const [pos, setPos] = useState(loadPosition);
  const stopSelectionRef = useRef<(() => void) | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    void import("virtual:literature-manifest")
      .then((m) => setManifest(m.default as LiteratureManifest))
      .catch(() => setManifest({ version: 1, targets: {} }));
  }, []);

  const stopSelection = useCallback(() => {
    stopSelectionRef.current?.();
    stopSelectionRef.current = null;
    setMode((m) => (m === "select" ? "off" : m));
  }, []);

  const startSelection = useCallback(() => {
    stopSelectionRef.current?.();
    setMode("select");
    setSelected(null);
    setStatus(null);
    stopSelectionRef.current = startTextSelection({
      onHover: () => {},
      onSelect: (targetId) => {
        const target = manifest?.targets[targetId] ?? null;
        if (!target) {
          setStatus("Target not in manifest");
          return;
        }
        setSelected(target);
        setDraft(target.literal);
        setMode("editing");
        stopSelectionRef.current?.();
        stopSelectionRef.current = null;
      },
    });
  }, [manifest]);

  const toggleSelect = useCallback(() => {
    if (mode === "select" || mode === "editing") {
      stopSelection();
      setMode("off");
      setSelected(null);
    } else {
      startSelection();
    }
  }, [mode, startSelection, stopSelection]);

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
      setMode("off");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Patch failed");
    } finally {
      setBusy(false);
    }
  }, [selected, draft]);

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
      setSelected(null);
      setMode("off");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Undo failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleSelect();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSelect]);

  useEffect(() => {
    return () => stopSelectionRef.current?.();
  }, []);

  if (!mounted || !visible) return null;

  const label = mode === "off" ? "Off" : mode === "select" ? "Select mode" : "Editing";

  const root = (
    <div
      style={{
        position: "fixed",
        right: `${pos.x}px`,
        bottom: `${pos.y}px`,
        zIndex: 2147483647,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button, textarea")) return;
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: pos.x,
            originY: pos.y,
          };
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          const dx = dragRef.current.startX - e.clientX;
          const dy = dragRef.current.startY - e.clientY;
          const next = {
            x: Math.max(8, dragRef.current.originX + dx),
            y: Math.max(8, dragRef.current.originY + dy),
          };
          setPos(next);
        }}
        onPointerUp={() => {
          if (dragRef.current) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
          }
          dragRef.current = null;
        }}
        style={{ cursor: "grab" }}
      >
        <Pill
          mode={mode}
          label={label}
          onToggleSelect={toggleSelect}
          onClose={() => {
            stopSelection();
            setVisible(false);
          }}
        />
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
      </div>
    </div>
  );

  return createPortal(root, document.body);
}
