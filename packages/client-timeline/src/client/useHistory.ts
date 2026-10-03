import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { Timeline } from '../../../engine/src/schema';

// Incoming server/AI revisions start a new local history chain. Undo must not
// silently replace an external update with an old local snapshot.
export function useHistory(
  timeline: Timeline | null,
  mutate: (fn: (t: Timeline) => Timeline) => void,
) {
  const undoStack = useRef<Timeline[]>([]);
  const redoStack = useRef<Timeline[]>([]);
  const expected = useRef<Timeline | null>(timeline);
  const activeGroup = useRef<{ id: symbol; initial: Timeline; undo: Timeline[]; redo: Timeline[] } | null>(null);
  const [, force] = useState(0);
  const acceptCurrent = useCallback((current: Timeline) => {
    if (expected.current === current) return;
    undoStack.current = [];
    redoStack.current = [];
    activeGroup.current = null;
    expected.current = current;
  }, []);

  useLayoutEffect(() => {
    if (!timeline || expected.current === timeline) return;
    const hadHistory = undoStack.current.length > 0 || redoStack.current.length > 0;
    acceptCurrent(timeline);
    if (hadHistory) force((n) => n + 1);
  }, [timeline, acceptCurrent]);

  const commit = useCallback(
    (fn: (t: Timeline) => Timeline, group?: symbol) => {
      mutate((current) => {
        acceptCurrent(current);
        const next = fn(current);
        if (next === current || JSON.stringify(next) === JSON.stringify(current)) return current;
        if (group !== undefined) {
          if (activeGroup.current?.id !== group) {
            activeGroup.current = { id: group, initial: current, undo: [...undoStack.current], redo: [...redoStack.current] };
          }
          const gesture = activeGroup.current;
          if (JSON.stringify(next) === JSON.stringify(gesture.initial)) {
            undoStack.current = [...gesture.undo];
            redoStack.current = [...gesture.redo];
          } else {
            undoStack.current = [...gesture.undo, gesture.initial].slice(-50);
            redoStack.current = [];
          }
        } else {
          activeGroup.current = null;
          undoStack.current.push(current);
          if (undoStack.current.length > 50) undoStack.current.shift();
          redoStack.current = [];
        }
        expected.current = next;
        force((x) => x + 1);
        return next;
      });
    },
    [mutate, acceptCurrent],
  );

  const undo = useCallback(() => {
    activeGroup.current = null;
    mutate((current) => {
      acceptCurrent(current);
      const prev = undoStack.current.pop();
      if (!prev) return current;
      redoStack.current.push(current);
      expected.current = prev;
      force((x) => x + 1);
      return prev;
    });
  }, [mutate, acceptCurrent]);

  const redo = useCallback(() => {
    activeGroup.current = null;
    mutate((current) => {
      acceptCurrent(current);
      const next = redoStack.current.pop();
      if (!next) return current;
      undoStack.current.push(current);
      expected.current = next;
      force((x) => x + 1);
      return next;
    });
  }, [mutate, acceptCurrent]);

  const clear = useCallback(() => {
    activeGroup.current = null;
    undoStack.current = [];
    redoStack.current = [];
    force((x) => x + 1);
  }, []);

  return { commit, undo, redo, clear, canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 };
}
