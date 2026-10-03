export type TimeRange = { at: number; duration: number };

/** Assign overlapping clips to display lanes without changing their actual tracks. */
export function overlappingRows<T>(items: readonly T[], range: (item: T) => TimeRange): T[][] {
  const rows: T[][] = [];
  const ends: number[] = [];
  const ordered = items.map((item) => ({ item, ...range(item) })).sort((a, b) => a.at - b.at);
  for (const { item, at, duration } of ordered) {
    let lane = ends.findIndex((end) => end <= at + 1e-8);
    if (lane === -1) { lane = rows.length; rows.push([]); }
    rows[lane].push(item);
    ends[lane] = at + duration;
  }
  return rows;
}

export function mergeTimeRanges(ranges: readonly TimeRange[]): TimeRange[] {
  const merged: TimeRange[] = [];
  for (const range of [...ranges].sort((a, b) => a.at - b.at)) {
    const last = merged[merged.length - 1];
    if (last && range.at <= last.at + last.duration + 1e-8) {
      last.duration = Math.max(last.at + last.duration, range.at + range.duration) - last.at;
    } else merged.push({ ...range });
  }
  return merged;
}

export function timelineWindow(bucket: number, viewport: number, pixelsPerSecond: number) {
  const bucketWidth = Math.max(256, viewport);
  return {
    start: Math.max(0, (bucket * bucketWidth - viewport * 1.5) / pixelsPerSecond),
    end: ((bucket + 1) * bucketWidth + viewport * 1.5) / pixelsPerSecond,
  };
}

export function visibleTicks(start: number, end: number, total: number, step: number) {
  const first = Math.max(0, Math.floor(start / step));
  const last = Math.floor(Math.min(total, end) / step);
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => (first + i) * step);
}

export function dragPreview(input: {
  kind: 'move' | 'reorder' | 'trimL' | 'trimR';
  start: number; duration: number; delta: number; fps: number;
  inPoint?: number; speed?: number; subtitle?: boolean;
  anchors: readonly number[]; threshold: number;
}): { at: number; duration: number; snapAt: number | null } {
  const { start, duration, fps } = input;
  const frame = 1 / fps;
  const round = (seconds: number) => Math.round(seconds * fps) / fps;
  const snap = (value: number) => {
    let distance = input.threshold;
    let anchor: number | null = null;
    for (const point of input.anchors) {
      if (Math.abs(point - value) < distance) {
        distance = Math.abs(point - value);
        anchor = point;
      }
    }
    return { value: anchor ?? value, anchor, distance };
  };
  if (input.kind === 'reorder') return { at: Math.max(0, round(start + input.delta)), duration, snapAt: null };
  if (input.kind === 'move') {
    const raw = start + input.delta;
    const left = snap(raw), right = snap(raw + duration);
    const useRight = right.anchor !== null && (left.anchor === null || right.distance < left.distance);
    const chosen = useRight ? right : left;
    const at = Math.max(0, round(useRight ? right.value - duration : left.value));
    const edge = useRight ? at + duration : at;
    return { at, duration, snapAt: chosen.anchor !== null && Math.abs(edge - chosen.anchor) <= frame / 2 + 1e-8 ? edge : null };
  }
  if (input.kind === 'trimL') {
    const end = start + duration;
    const earliest = input.subtitle ? 0 : Math.max(0, start - (input.inPoint ?? 0) / (input.speed ?? 1));
    const min = Math.ceil((earliest - 1e-8) * fps) / fps;
    const max = Math.floor((end - frame + 1e-8) * fps) / fps;
    if (max < min) return { at: start, duration, snapAt: null };
    const chosen = snap(start + input.delta);
    const at = Math.min(max, Math.max(min, round(chosen.value)));
    return { at, duration: end - at, snapAt: chosen.anchor !== null && Math.abs(at - chosen.anchor) <= frame / 2 + 1e-8 ? at : null };
  }
  const chosen = snap(start + duration + input.delta);
  const end = Math.max(Math.ceil((start + frame - 1e-8) * fps) / fps, round(chosen.value));
  return { at: start, duration: end - start, snapAt: chosen.anchor !== null && Math.abs(end - chosen.anchor) <= frame / 2 + 1e-8 ? end : null };
}

// Time-based speed keeps edge scrolling consistent across display refresh rates.
export function edgeScrollSpeed(x: number, left: number, right: number, edge = 40) {
  if (x < left + edge) return -360 * Math.min(1, Math.max(0, (left + edge - x) / edge));
  if (x > right - edge) return 360 * Math.min(1, Math.max(0, (x - right + edge) / edge));
  return 0;
}

/** 时间码 mm:ss.ff（帧）或 hh:mm:ss */
export function timecode(sec: number, fps: number, withFrames = true) {
  const frames = Math.max(0, Math.round(sec * fps));
  const s = Math.floor(frames / fps);
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = (s >= 3600 ? pad(Math.floor(s / 3600)) + ':' : '') + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
  return withFrames ? base + '.' + pad(frames % fps) : base;
}

/** 标尺刻度步长：保证相邻刻度至少 minPx 像素 */
export function tickStep(pxPerSec: number, fps: number, minPx = 72) {
  return [1 / fps, 2 / fps, 5 / fps, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600].find((n) => n * pxPerSec >= minPx) ?? 7200;
}

/** 让整条时间线放进可视宽度的缩放（像素/秒），不设人为下限，长片也能完整显示 */
export function fitPxPerSec(viewport: number, totalSec: number) {
  return Math.max(0.5, Math.min(600, (viewport * 0.92) / Math.max(1, totalSec)));
}

export const clampZoom = (pxPerSec: number) => Math.max(0.5, Math.min(600, pxPerSec));
