import { useEffect, useRef, useState } from "react";
import type { CvData } from "./types";

const STORAGE_KEY = "giseveral.cv.draft";
const DEBOUNCE_MS = 600;

/**
 * Persist the editor state to localStorage with a debounced write.
 * `loadDraft()` is exported so the parent route can pre-fill state on first
 * mount and offer the user a "Restore draft?" prompt.
 */
export function loadCvDraft(): CvData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CvData;
  } catch {
    return null;
  }
}

export function clearCvDraft() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function useCvAutoSave(data: CvData) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip the very first run — that's the initial hydration, not a user edit.
    if (firstRun.current) { firstRun.current = false; return; }
    if (typeof window === "undefined") return;

    setSaving(true);
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSavedAt(Date.now());
      } catch { /* quota or private mode — silently skip */ }
      setSaving(false);
    }, DEBOUNCE_MS);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [data]);

  return { savedAt, saving };
}
