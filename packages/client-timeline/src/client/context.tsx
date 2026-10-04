// 编辑器上下文：store / 选中 / 播放时钟 / 宿主能力，组件经 useEditor 取用
import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { PlayerRef } from '@remotion/player';
import type { TimelineStore, StoreSnapshot } from './store';
import type { SelectionStore } from './selection';

/** 播放时钟：一个 rAF 循环读取 Player 当前帧，分发给订阅者（播放头/时间码直接改 DOM，不触发 React 重渲染） */
export class PlayerClock {
  ref: PlayerRef | null = null;
  fps = 30;
  private subs = new Set<(sec: number, playing: boolean) => void>();
  private raf = 0;
  private last = -1;
  private lastPlaying = false;
  private running = false;
  frame = 0;
  attach(ref: PlayerRef | null) { this.ref = ref; this.last = -1; }
  start() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      const f = this.ref?.getCurrentFrame() ?? this.frame;
      const playing = this.ref?.isPlaying() ?? false;
      if (f !== this.last || playing !== this.lastPlaying) {
        this.last = f; this.lastPlaying = playing; this.frame = f;
        for (const fn of this.subs) fn(f / this.fps, playing);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  subscribe(fn: (sec: number, playing: boolean) => void) { this.subs.add(fn); fn(this.frame / this.fps, this.lastPlaying); return () => { this.subs.delete(fn); }; }
  time() { return (this.ref?.getCurrentFrame() ?? this.frame) / this.fps; }
  seek(sec: number) {
    const f = Math.max(0, Math.round(sec * this.fps));
    this.frame = f;
    this.ref?.seekTo(f);
    for (const fn of this.subs) fn(f / this.fps, this.ref?.isPlaying() ?? false);
  }
  toggle() { if (!this.ref) return; if (this.ref.isPlaying()) this.ref.pause(); else this.ref.play(); }
  pause() { this.ref?.pause(); }
  play() { this.ref?.play(); }
  playing() { return this.ref?.isPlaying() ?? false; }
}

export interface HostCapabilities {
  insertIntoChat?: (text: string) => boolean;
  toggleExpand?: () => void;
  expanded?: boolean;
  visible: boolean;
}

export interface Editor {
  store: TimelineStore;
  sel: SelectionStore;
  clock: PlayerClock;
  sessionId?: string;
  host: HostCapabilities;
}

const EditorContext = createContext<Editor | null>(null);
export const EditorProvider = EditorContext.Provider;
export function useEditor(): Editor {
  const e = useContext(EditorContext);
  if (!e) throw new Error('editor context missing');
  return e;
}
export function useStore<T>(selector: (s: StoreSnapshot) => T): T {
  const { store } = useEditor();
  return useSyncExternalStore(store.subscribe, () => selector(store.getSnapshot()));
}
/** 订阅播放头（节流到每帧一次 React 更新，供需要时间的组件使用） */
export function usePlayhead(): number {
  const { clock } = useEditor();
  const [t, setT] = useState(() => clock.time());
  useEffect(() => clock.subscribe((sec) => setT(sec)), [clock]);
  return t;
}
export function usePlaying(): boolean {
  const { clock } = useEditor();
  const [p, setP] = useState(false);
  useEffect(() => clock.subscribe((_s, playing) => setP(playing)), [clock]);
  return p;
}
