// 选中状态 + 播放头 + 在场上报（选中/播放头同步给引擎，宿主插件据此告诉 AI“用户现在指的是哪段”）
import { useSyncExternalStore } from 'react';
import type { Timeline } from '../../../engine/src/schema';
import { locateClip, srcLabel } from '../../../engine/src/timeline';
import { api } from './engine';

export type EntityKind = 'clip' | 'overlay' | 'track' | 'marker';
export interface Selected { kind: EntityKind; id: string }
export interface SelectionSnapshot { items: Selected[]; primary: Selected | null }

export class SelectionStore {
  private listeners = new Set<() => void>();
  private snap: SelectionSnapshot = { items: [], primary: null };
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getSnapshot = () => this.snap;
  private set(items: Selected[], primary: Selected | null) {
    this.snap = { items, primary };
    for (const fn of this.listeners) fn();
  }
  select(item: Selected | null, mode: 'replace' | 'toggle' | 'add' = 'replace') {
    if (!item) { this.set([], null); return; }
    const has = this.snap.items.some((x) => x.id === item.id);
    if (mode === 'replace') this.set([item], item);
    else if (mode === 'toggle') {
      const items = has ? this.snap.items.filter((x) => x.id !== item.id) : [...this.snap.items, item];
      this.set(items, has ? items.at(-1) ?? null : item);
    } else if (!has) this.set([...this.snap.items, item], item);
  }
  selectMany(items: Selected[]) { this.set(items, items.at(-1) ?? null); }
  clear() { this.set([], null); }
  isSelected(id: string) { return this.snap.items.some((x) => x.id === id); }
  /** 时间线变化后丢掉已不存在的实体 */
  prune(t: Timeline) {
    const exists = (s: Selected) => s.kind === 'clip' ? Boolean(locateClip(t, s.id))
      : s.kind === 'overlay' ? t.overlays.some((o) => o.id === s.id)
        : s.kind === 'track' ? [...t.videoTracks, ...t.audioTracks].some((tr) => tr.id === s.id)
          : (t.markers ?? []).some((m) => m.id === s.id);
    const items = this.snap.items.filter(exists);
    if (items.length !== this.snap.items.length) this.set(items, this.snap.primary && exists(this.snap.primary) ? this.snap.primary : items.at(-1) ?? null);
  }
}

export const useSelection = (store: SelectionStore) => useSyncExternalStore(store.subscribe, store.getSnapshot);

/** 给 AI 看的选中描述：id + 名称 + 所在轨道 + 时间区间 */
export function describeSelection(t: Timeline, items: Selected[]) {
  return items.slice(0, 20).map((s) => {
    if (s.kind === 'clip') {
      const loc = locateClip(t, s.id);
      if (!loc) return { kind: s.kind, id: s.id };
      const track = loc.kind === 'audio' ? 'audio' : loc.trackIndex === 0 ? 'main' : 'pip';
      return { kind: s.kind, id: s.id, label: srcLabel(loc.clip.src), track, start: loc.start, end: loc.start + loc.duration };
    }
    if (s.kind === 'overlay') {
      const o = t.overlays.find((x) => x.id === s.id);
      return o ? { kind: s.kind, id: s.id, label: o.text.slice(0, 40), track: 'subs', start: o.startSeconds, end: o.endSeconds } : { kind: s.kind, id: s.id };
    }
    if (s.kind === 'marker') {
      const m = (t.markers ?? []).find((x) => x.id === s.id);
      return { kind: s.kind, id: s.id, label: m?.label, start: m?.t, end: m?.t };
    }
    const tr = [...t.videoTracks, ...t.audioTracks].find((x) => x.id === s.id);
    return { kind: s.kind, id: s.id, label: tr?.name };
  });
}

/** 在场上报：选中或模式变化立即发（防抖 300ms），播放头随暂停/拖动定位发；面板隐藏时停发 */
export class PresenceReporter {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private last = '';
  constructor(private projectId: () => string | null, private clientId: string) {}
  report(state: { timeline: Timeline | null; items: Selected[]; playhead: number; mode: string; visible: boolean }) {
    if (!state.visible || !state.timeline) return;
    const body = { clientId: this.clientId, actor: 'user', selection: describeSelection(state.timeline, state.items), playhead: Math.round(state.playhead * 100) / 100, mode: state.mode };
    const key = JSON.stringify(body);
    if (key === this.last) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const pid = this.projectId();
      if (!pid) return;
      this.last = key;
      api.presence(pid, body).catch(() => { this.last = ''; });
    }, 300);
  }
}
