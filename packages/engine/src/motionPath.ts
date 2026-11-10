import type { MotionPath } from './schema.js';
import { mapPath, parsePath, samplePath, type Pt } from './paths.js';

const cache = new Map<string, Pt[]>();
/** Distances are measured after converting canvas fractions to pixels. */
export function pathMotion(spec: MotionPath | undefined, progress: number, width: number, height: number) {
  if (!spec) return { x: 0, y: 0, angle: 0 };
  const key = `${width},${height}:${spec.path}`;
  let points = cache.get(key);
  if (!points) {
    const sub = mapPath(parsePath(spec.path), ([x, y]) => [x * width / 100, y * height / 100])[0];
    if (!sub?.segs.length) return { x: 0, y: 0, angle: 0 };
    // Closed paths include their closing edge and return to their initial point.
    if (sub.closed) {
      const p = sub.start;
      const last = sub.segs[sub.segs.length - 1].p;
      sub.segs.push({ c1: last, c2: p, p });
      sub.closed = false;
    }
    points = samplePath(sub, 1025);
    if (cache.size >= 64) cache.delete(cache.keys().next().value!);
    cache.set(key, points);
  }
  const at = Math.max(0, Math.min(1, progress)) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(at)), f = at - i;
  const a = points[i], b = points[i + 1];
  return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f,
    angle: spec.autoRotate ? Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI + (spec.rotationOffset ?? 0) : 0 };
}
