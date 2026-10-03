import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { parseTimeline, type Timeline } from '../../../engine/src/schema';
import { getTimeline, putTimeline, TimelineConflictError } from './api';

// Normalize default fields and key order before comparing client/server revisions.
// A server serialization change after our own save is not an external edit.
const serializeTimeline = (timeline: Timeline) => JSON.stringify(parseTimeline(timeline));

export function useTimelineSync(sessionId?: string, rootRef?: RefObject<HTMLElement | null>) {
  const draftKey = `djian.unsaved.${sessionId ?? 'default'}`;
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'pending' | 'saving' | 'error'>('saved');
  const [syncError, setSyncError] = useState('');
  const [hasConflict, setHasConflict] = useState(false);
  const conflict = useRef(false);
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
    if (conflict.current) return Promise.resolve();
    if (saving.current) return saving.current;
    if (!pending.current) return Promise.resolve();
    const task = (async () => {
      while (pending.current) {
        const next = pending.current;
        pending.current = null;
        if (alive.current) setSaveState('saving');
        try {
          await putTimeline(next, sessionId, savedJson.current || null);
          savedJson.current = serializeTimeline(next);
          try {
            if (current.current && serializeTimeline(current.current) !== savedJson.current) {
              localStorage.setItem(draftKey, JSON.stringify({ format: 'djian-draft-v1', timeline: current.current, baseTimeline: savedJson.current }));
            } else localStorage.removeItem(draftKey);
          } catch { /* Saving still works when browser storage is unavailable. */ }
        } catch (error) {
          pending.current ??= next;
          if (error instanceof TimelineConflictError) { conflict.current = true; if (alive.current) setHasConflict(true); }
          if (alive.current) {
            setSaveState('error');
            setSyncError(error instanceof Error && error.name === 'TimeoutError'
              ? '保存请求超时，本地修改仍保留，请检查连接后重试。'
              : error instanceof Error ? `保存失败：${error.message}` : '保存失败，请检查连接后重试');
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
      const json = serializeTimeline(next);
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
          const data = JSON.parse(draft);
          const restored = parseTimeline(data.format === 'djian-draft-v1' ? data.timeline : data);
          savedJson.current = data.format === 'djian-draft-v1' && typeof data.baseTimeline === 'string' ? data.baseTimeline : '';
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
    if (next === current.current) return;
    current.current = next;
    revision.current++;
    dirty.current = true;
    pending.current = next;
    try { localStorage.setItem(draftKey, JSON.stringify({ format: 'djian-draft-v1', timeline: next, baseTimeline: savedJson.current })); } catch { /* Keep the in-memory draft. */ }
    setTimeline(next);
    setSaveState(conflict.current ? 'error' : 'pending');
    if (debounce.current) clearTimeout(debounce.current);
    if (!conflict.current) debounce.current = setTimeout(() => void flush(), 600);
  }, [flush, draftKey]);

  const resolveConflict = useCallback(async (choice: 'local' | 'remote') => {
    if (!conflict.current || saving.current) return;
    const atRevision = revision.current;
    try {
      const latest = await getTimeline<Timeline>(sessionId, true);
      if (!alive.current || !conflict.current) return;
      if (revision.current !== atRevision) {
        setSyncError('读取期间又有本地修改，请重新选择要保留的版本。');
        return;
      }
      savedJson.current = serializeTimeline(latest);
      if (choice === 'remote') {
        current.current = latest;
        pending.current = null;
        dirty.current = false;
        revision.current++;
        setTimeline(latest);
        setSaveState('saved');
        setSyncError('');
        try { localStorage.removeItem(draftKey); } catch { /* Storage may be unavailable. */ }
      } else if (current.current) {
        try { localStorage.setItem(draftKey, JSON.stringify({ format: 'djian-draft-v1', timeline: current.current, baseTimeline: savedJson.current })); } catch { /* Keep the in-memory draft. */ }
      }
      conflict.current = false;
      setHasConflict(false);
      if (choice === 'local') await flush();
    } catch {
      if (alive.current) setSyncError('读取最新版本失败，本地修改仍保留，请重试。');
    }
  }, [sessionId, draftKey, flush]);

  const saveBeforeRestore = useCallback(async () => {
    if (debounce.current) clearTimeout(debounce.current);
    await flush();
    if (!alive.current) throw new Error('编辑面板已关闭，请重新打开后恢复。');
    if (conflict.current) throw new Error('请先处理版本冲突，再恢复历史版本。本地修改仍然保留。');
    if (dirty.current || pending.current) throw new Error('当前修改尚未保存，暂未恢复历史版本。请检查连接后重试。');
  }, [flush]);

  return { timeline, mutate, reload, saveState, syncError, hasConflict, resolveConflict, retrySave: flush, saveBeforeRestore };
}
