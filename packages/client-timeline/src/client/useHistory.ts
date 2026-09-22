import { useCallback, useRef, useState } from 'react';
import type { Timeline } from '../../../engine/src/schema';

// 撤销/重做快照栈：只管面板本地编辑；AI 侧的轮询更新不进栈（ undo 语义 = 回到我上一个手动状态）
export function useHistory(
  timeline: Timeline | null,
  mutate: (fn: (t: Timeline) => Timeline) => void,
) {
  const undoStack = useRef<Timeline[]>([]);
  const redoStack = useRef<Timeline[]>([]);
  const [, force] = useState(0);

  const commit = useCallback(
    (fn: (t: Timeline) => Timeline) => {
      if (!timeline) return;
      undoStack.current.push(timeline);
      if (undoStack.current.length > 50) undoStack.current.shift();
      redoStack.current = [];
      mutate(fn);
      force((x) => x + 1);
    },
    [timeline, mutate],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev || !timeline) return;
    redoStack.current.push(timeline);
    mutate(() => prev);
    force((x) => x + 1);
  }, [timeline, mutate]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next || !timeline) return;
    undoStack.current.push(timeline);
    mutate(() => next);
    force((x) => x + 1);
  }, [timeline, mutate]);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    force((x) => x + 1);
  }, []);

  return { commit, undo, redo, clear, canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 };
}
