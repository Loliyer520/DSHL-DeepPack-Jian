// 时间线预览素材：胶片缩略图（按固定间隔的一组小图）与波形峰值都由服务端生成并缓存，裁剪/缩放只挑格子不解码
import { useEffect, useState } from 'react';
import { absolute, api, peaksUrl } from './engine';

export interface Sprite { url: string; interval: number; count: number; height: number; width: number; tile: (i: number) => string }
const sprites = new Map<string, Promise<Sprite | null>>();
const peaksCache = new Map<string, Promise<{ rate: number; values: Uint8Array } | null>>();
let active = 0;
const waiting: (() => void)[] = [];
const slot = async <T,>(fn: () => Promise<T>): Promise<T> => {
  if (active >= 2) await new Promise<void>((r) => waiting.push(r));
  active++;
  try { return await fn(); } finally { active--; waiting.shift()?.(); }
};

export function loadSprite(pid: string, name: string): Promise<Sprite | null> {
  const k = pid + '|' + name;
  if (!sprites.has(k)) {
    sprites.set(k, slot(async () => {
      const s = await api.sprite(pid, name);
      const url = absolute(s.url);
      // 用第一格的宽高比决定格子宽度
      const img = new Image();
      img.src = url + '0';
      await img.decode().catch(() => undefined);
      return { ...s, url, width: img.naturalWidth || Math.round(s.height * 16 / 9), tile: (i: number) => url + i };
    }).catch(() => { sprites.delete(k); return null; }));
  }
  return sprites.get(k)!;
}

export function loadPeaks(pid: string, name: string) {
  const k = pid + '|' + name;
  if (!peaksCache.has(k)) {
    peaksCache.set(k, slot(async () => {
      const r = await fetch(peaksUrl(pid, name), { signal: AbortSignal.timeout(300_000) });
      if (!r.ok) return null;
      return { rate: Number(r.headers.get('X-Peaks-Rate')) || 100, values: new Uint8Array(await r.arrayBuffer()) };
    }).catch(() => { peaksCache.delete(k); return null; }));
  }
  return peaksCache.get(k)!;
}

export function forgetAsset(pid: string, name: string) {
  sprites.delete(pid + '|' + name);
  peaksCache.delete(pid + '|' + name);
}

export function useAsync<T>(fn: (() => Promise<T>) | null, deps: unknown[]): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    setValue(null);
    if (fn) void fn().then((v) => { if (alive) setValue(v); }, () => undefined);
    return () => { alive = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}
