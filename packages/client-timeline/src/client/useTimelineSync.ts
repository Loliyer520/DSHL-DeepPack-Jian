import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { parseTimeline, type Timeline } from '../../../engine/src/schema';
import { getTimeline, putTimeline } from './api';

export function useTimelineSync(sessionId?: string, rootRef?: RefObject<HTMLElement | null>) {
  const draftKey = `djian.unsaved.${sessionId ?? 'default'}`;
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'pending' | 'saving' | 'error'>('saved');
  const [syncError, setSyncError] = useState('');
  const current = useRef<Timeline | null>(null);
  const pending = useRef<Timeline | null>(null);
  const revision = useRef(0);
  const savedJson = useRef('');
  const dirty = useRef(false);
  const alive = useRef(true);
  const saving = useRef<Promise<void> | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Serialize saves. A response for an older edit must never clear a newer edit.
  const flush = useCallback((): Promise<void> => {
    if (saving.current) return saving.current;
    if (!pending.current) return Promise.resolve();
    const task = (async () => {
      while (pending.current) {
        const next = pending.current;
        pending.current = null;
        if (alive.current) setSaveState('saving');
        try {
          await putTimeline(next, sessionId);
          savedJson.current = JSON.stringify(next);
          try {
            if (localStorage.getItem(draftKey) === savedJson.current) localStorage.removeItem(draftKey);
          } catch { /* Saving still works when browser storage is unavailable. */ }
        } catch (error) {
          pending.current ??= next;
          if (alive.current) {
            setSaveState('error');
            setSyncError(error instanceof Error ? `保存失败：${error.message}` : '保存失败，请检查连接后重试');
          }
          return;
        }
      }
      dirty.current = false;
      if (alive.current) {
        setSaveState('saved');
        setSyncError('');
      }
    })();
    saving.current = task;
    void task.finally(() => { saving.current = null; });
    return task;
  }, [sessionId, draftKey]);

  const reload = useCallback(async () => {
    if (dirty.current) return;
    const atRevision = revision.current;
    const el = rootRef?.current;
    const hidden = document.hidden || Boolean(el && el.getClientRects().length === 0);
    try {
      const next = await getTimeline<Timeline>(sessionId, hidden);
      if (!alive.current || dirty.current || revision.current !== atRevision) return;
      const json = JSON.stringify(next);
      if (json !== savedJson.current) {
        savedJson.current = json;
        current.current = next;
        setTimeline(next);
      }
      setSyncError('');
    } catch {
      if (alive.current) setSyncError('无法连接剪辑引擎，正在尝试重新连接');
    }
  }, [sessionId, rootRef]);

  useEffect(() => {
    alive.current = true;
    if (!current.current) {
      try {
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          const restored = parseTimeline(JSON.parse(draft));
          current.current = pending.current = restored;
          dirty.current = true;
          revision.current++;
          setTimeline(restored);
          setSaveState('error');
          setSyncError('已恢复上次未保存的修改，请重试保存。');
        }
      } catch { /* Ignore an invalid draft and load the server copy. */ }
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await reload();
      if (!stopped) timer = setTimeout(tick, 2000);
    };
    void tick();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      stopped = true;
      alive.current = false;
      clearTimeout(timer);
      if (debounce.current) clearTimeout(debounce.current);
      window.removeEventListener('beforeunload', beforeUnload);
      // The closure retains the original session when the panel is switched.
      void flush();
    };
  }, [reload, flush, draftKey]);

  const mutate = useCallback((fn: (value: Timeline) => Timeline) => {
    if (!current.current) return;
    const next = fn(current.current);
    current.current = next;
    revision.current++;
    dirty.current = true;
    pending.current = next;
    try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* Keep the in-memory draft. */ }
    setTimeline(next);
    setSaveState('pending');
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void flush(), 600);
  }, [flush, draftKey]);

  return { timeline, mutate, reload, saveState, syncError, retrySave: flush };
}
