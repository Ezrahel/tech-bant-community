import { useCallback, useRef, useEffect } from 'react';

interface AutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number;
  enabled?: boolean;
  key: string;
}

export function useAutoSave<T extends Record<string, unknown>>({
  data,
  onSave,
  interval = 30000,
  enabled = true,
  key,
}: AutoSaveOptions<T>) {
  const dataRef = useRef(data);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  dataRef.current = data;

  // Recover unsaved work
  useEffect(() => {
    if (!enabled) return;
    try {
      const saved = sessionStorage.getItem(`article_draft_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const timestamp = parsed._timestamp;
        if (timestamp && Date.now() - timestamp < 3600000) {
          // Valid draft found — component handles restoration
        }
      }
    } catch {
      // ignore
    }
  }, [key, enabled]);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const snapshot = { ...dataRef.current, _timestamp: Date.now() };
      sessionStorage.setItem(`article_draft_${key}`, JSON.stringify(snapshot));
      await onSave(dataRef.current as T);
    } catch {
      // silent — auto-save failures shouldn't disrupt the user
    } finally {
      savingRef.current = false;
    }
  }, [onSave, key]);

  useEffect(() => {
    if (!enabled) return;
    timerRef.current = setInterval(save, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [save, interval, enabled]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(`article_draft_${key}`);
  }, [key]);

  const getDraft = useCallback((): T | null => {
    try {
      const saved = sessionStorage.getItem(`article_draft_${key}`);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const data = parsed as T;
      return data;
    } catch {
      return null;
    }
  }, [key]);

  return { clearDraft, getDraft, save };
}
