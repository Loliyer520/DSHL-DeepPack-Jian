// SVG 路径几何（纯函数）：解析成绝对坐标三次贝塞尔、按弧长取样、裁短（给箭头让位）、顶点连平滑曲线。
// 自由路径形状、形状变形（取样后逐点插值）都用它。
export type Pt = [number, number];
/** 三次贝塞尔段：起点在上一段终点 */
export interface Cubic { c1: Pt; c2: Pt; p: Pt }
export interface SubPath { start: Pt; segs: Cubic[]; closed: boolean }

const line = (a: Pt, b: Pt): Cubic => ({ c1: [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], c2: [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3], p: b });

/** 椭圆弧（SVG A 命令）→ 若干三次贝塞尔 */
function arcToCubics(p0: Pt, rx: number, ry: number, phiDeg: number, large: boolean, sweep: boolean, p1: Pt): Cubic[] {
  if (!rx || !ry || (p0[0] === p1[0] && p0[1] === p1[1])) return [line(p0, p1)];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2, dy = (p0[1] - p1[1]) / 2;
  const x1 = cos * dx + sin * dy, y1 = -sin * dx + cos * dy;
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx1 = (k * rx * y1) / ry, cy1 = (-k * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (p0[0] + p1[0]) / 2, cy = sin * cx1 + cos * cy1 + (p0[1] + p1[1]) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  else if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const step = dt / n, alpha = (4 / 3) * Math.tan(step / 4);
  const pt = (t: number): Pt => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
  const der = (t: number): Pt => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
  const out: Cubic[] = [];
  for (let i = 0; i < n; i++) {
    const a = t1 + step * i, b = a + step;
    const pa = pt(a), pb = i === n - 1 ? p1 : pt(b), da = der(a), db = der(b);
    out.push({ c1: [pa[0] + alpha * da[0], pa[1] + alpha * da[1]], c2: [pb[0] - alpha * db[0], pb[1] - alpha * db[1]], p: pb });
  }
  return out;
}

const ARGC: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

/** 解析 SVG 路径（支持全部命令、相对坐标、隐式重复）；非法片段止于出错处 */
export function parsePath(d: string): SubPath[] {
  const toks = d.match(/[MLHVCSQTAZmlhvcsqtaz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const subs: SubPath[] = [];
  let cur: SubPath | null = null;
  let pos: Pt = [0, 0];
  let lastCtrl: Pt | null = null, lastQ: Pt | null = null;
  let i = 0, cmd = "";
  const take = (n: number) => {
    const out: number[] = [];
    for (let k = 0; k < n; k++) {
      const v = Number(toks[i]);
      if (toks[i] === undefined || /[A-Za-z]/.test(toks[i])) return null;
      out.push(v); i++;
    }
    return out;
  };
  const ensure = () => { if (!cur) { cur = { start: [...pos] as Pt, segs: [], closed: false }; subs.push(cur); } return cur; };
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) { cmd = toks[i]; i++; if (cmd === "Z" || cmd === "z") { const c = ensure(); c.closed = true; if (c.segs.length) pos = [...c.start] as Pt; cur = null; lastCtrl = lastQ = null; continue; } }
    else if (!cmd) break;
    const up = cmd.toUpperCase(), rel = cmd !== up;
    const a = take(ARGC[up] ?? 0);
    if (!a) break;
    const ox = rel ? pos[0] : 0, oy = rel ? pos[1] : 0;
    switch (up) {
      case "M": {
        pos = [a[0] + ox, a[1] + oy];
        cur = { start: [...pos] as Pt, segs: [], closed: false };
        subs.push(cur);
        cmd = rel ? "l" : "L"; // 之后的坐标对按直线
        lastCtrl = lastQ = null;
        continue;
      }
      case "L": case "H": case "V": {
        const to: Pt = up === "L" ? [a[0] + ox, a[1] + oy] : up === "H" ? [a[0] + ox, pos[1]] : [pos[0], a[0] + oy];
        ensure().segs.push(line(pos, to)); pos = to; lastCtrl = lastQ = null; break;
      }
      case "C": case "S": {
        const c1: Pt = up === "C" ? [a[0] + ox, a[1] + oy] : lastCtrl ? [2 * pos[0] - lastCtrl[0], 2 * pos[1] - lastCtrl[1]] : [...pos] as Pt;
        const r = up === "C" ? a.slice(2) : a;
        const c2: Pt = [r[0] + ox, r[1] + oy], to: Pt = [r[2] + ox, r[3] + oy];
        ensure().segs.push({ c1, c2, p: to }); pos = to; lastCtrl = c2; lastQ = null; break;
      }
      case "Q": case "T": {
        const q: Pt = up === "Q" ? [a[0] + ox, a[1] + oy] : lastQ ? [2 * pos[0] - lastQ[0], 2 * pos[1] - lastQ[1]] : [...pos] as Pt;
        const r = up === "Q" ? a.slice(2) : a;
        const to: Pt = [r[0] + ox, r[1] + oy];
        ensure().segs.push({ c1: [pos[0] + (2 / 3) * (q[0] - pos[0]), pos[1] + (2 / 3) * (q[1] - pos[1])], c2: [to[0] + (2 / 3) * (q[0] - to[0]), to[1] + (2 / 3) * (q[1] - to[1])], p: to });
        pos = to; lastQ = q; lastCtrl = null; break;
      }
      case "A": {
        const to: Pt = [a[5] + ox, a[6] + oy];
        ensure().segs.push(...arcToCubics(pos, a[0], a[1], a[2], Boolean(a[3]), Boolean(a[4]), to)); pos = to; lastCtrl = lastQ = null; break;
      }
    }
  }
  return subs.filter((s) => s.segs.length > 0);
}

const f2 = (v: number) => Math.round(v * 100) / 100;
export function toPathD(subs: SubPath[]): string {
  return subs.map((s) => "M" + f2(s.start[0]) + "," + f2(s.start[1]) + s.segs.map((c) => "C" + f2(c.c1[0]) + "," + f2(c.c1[1]) + " " + f2(c.c2[0]) + "," + f2(c.c2[1]) + " " + f2(c.p[0]) + "," + f2(c.p[1])).join("") + (s.closed ? "Z" : "")).join("");
}
export function mapPath(subs: SubPath[], f: (p: Pt) => Pt): SubPath[] {
  return subs.map((s) => ({ start: f(s.start), closed: s.closed, segs: s.segs.map((c) => ({ c1: f(c.c1), c2: f(c.c2), p: f(c.p) })) }));
}

const bez = (a: Pt, c: Cubic, t: number): Pt => {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * c.c1[0] + 3 * u * t * t * c.c2[0] + t * t * t * c.p[0], u * u * u * a[1] + 3 * u * u * t * c.c1[1] + 3 * u * t * t * c.c2[1] + t * t * t * c.p[1]];
};
/** 子路径折线化（每段 n 个点），闭合路径不重复起点 */
function flatten(s: SubPath, per = 16): Pt[] {
  const pts: Pt[] = [s.start];
  let a = s.start;
  for (const c of s.segs) {
    for (let k = 1; k <= per; k++) pts.push(bez(a, c, k / per));
    a = c.p;
  }
  if (s.closed && (a[0] !== s.start[0] || a[1] !== s.start[1])) pts.push(s.start);
  return pts;
}
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** 按弧长等距取 n 个点（闭合路径首尾不重复） */
export function samplePath(s: SubPath, n: number): Pt[] {
  const pts = flatten(s);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1] || 1;
  const out: Pt[] = [];
  const count = s.closed ? n : n - 1;
  let j = 1;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / count;
    while (j < cum.length - 1 && cum[j] < target) j++;
    const seg = cum[j] - cum[j - 1] || 1;
    const f = Math.max(0, Math.min(1, (target - cum[j - 1]) / seg));
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
  }
  return out;
}
export const pathLength = (s: SubPath) => {
  const pts = flatten(s);
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
};

/** 在 t 处切分一段贝塞尔（de Casteljau） */
function split(a: Pt, c: Cubic, t: number): [Cubic, Cubic] {
  const lerp = (p: Pt, q: Pt): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const ab = lerp(a, c.c1), bc = lerp(c.c1, c.c2), cd = lerp(c.c2, c.p);
  const abc = lerp(ab, bc), bcd = lerp(bc, cd), m = lerp(abc, bcd);
  return [{ c1: ab, c2: abc, p: m }, { c1: bcd, c2: cd, p: c.p }];
}

/** 末端裁掉 len 长度（给箭头让位）；返回裁后的路径、末端点与末端方向（弧度） */
export function trimEnd(s: SubPath, len: number): { path: SubPath; tip: Pt; angle: number } {
  const segs = [...s.segs];
  const startOf = (i: number) => (i === 0 ? s.start : segs[i - 1].p);
  const last = segs[segs.length - 1];
  const a = startOf(segs.length - 1);
  const tip = last.p;
  // 末端切线：c2→p，退化时 c1→p、a→p
  const from = dist(last.c2, tip) > 1e-6 ? last.c2 : dist(last.c1, tip) > 1e-6 ? last.c1 : a;
  const angle = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  if (len <= 0) return { path: s, tip, angle };
  // 只在最后一段里裁（足够箭头用）
  let lo = 0, hi = 1;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (dist(bez(a, last, mid), tip) > len) lo = mid; else hi = mid;
  }
  segs[segs.length - 1] = split(a, last, lo)[0];
  return { path: { ...s, segs }, tip, angle };
}
export function reversePath(s: SubPath): SubPath {
  const pts = [s.start, ...s.segs.map((c) => c.p)];
  const segs: Cubic[] = [];
  for (let i = s.segs.length - 1; i >= 0; i--) segs.push({ c1: s.segs[i].c2, c2: s.segs[i].c1, p: pts[i] });
  return { start: pts[pts.length - 1], segs, closed: s.closed };
}

/** 顶点 → 路径：折线，或 Catmull-Rom 平滑曲线 */
export function verticesPath(v: Pt[], closed: boolean, smooth: boolean): SubPath[] {
  if (v.length < 2) return [];
  if (!smooth) return [{ start: v[0], closed, segs: [...v.slice(1).map((p, i) => line(v[i], p)), ...(closed ? [line(v[v.length - 1], v[0])] : [])] }];
  const n = v.length;
  const at = (i: number): Pt => (closed ? v[((i % n) + n) % n] : v[Math.max(0, Math.min(n - 1, i))]);
  const segs: Cubic[] = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    segs.push({ c1: [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2: [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p: p2 });
  }
  return [{ start: v[0], closed, segs }];
}

/** 折线面积的符号（屏幕坐标系下 >0 为顺时针） */
export const signedArea = (pts: Pt[]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};
