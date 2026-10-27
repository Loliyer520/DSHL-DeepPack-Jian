// 坐标系元素（预览与导出共用）：坐标轴/网格/刻度 + 函数、参数曲线、极坐标曲线、点、切线、面积、黎曼和、向量、线段、标注。
// progress 驱动依次画出（先坐标轴，再按顺序画各对象）；对象给了 start 就按自己的时刻出现。
// params 里的参数可以打关键帧：表达式引用参数，参数一变曲线/点/面积跟着连续变化（数学动画里的“联动”）。
import React from "react";
import type { Overlay, PlotItem, PlotSpec } from "./schema";
import { MATH_COLORS, evalKeyframes } from "./timeline";
import { compileExpr, evalValue, fillTemplate, type Compiled, type ExprEnv } from "./expr";
import { MathLabel, labelTex } from "./math";
import { overlayFontFamily } from "./fonts";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (v: number) => Math.round(v * 100) / 100;

/** 刻度间距：1/2/5×10^k，大约 target 格 */
export function niceStep(range: number, target = 8): number {
  const raw = Math.abs(range) / target;
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}

/** 去掉 "y =" / "f(x) =" / "r =" 这类左边 */
export const stripLhs = (s: string) => s.replace(/^\s*(?:[A-Za-z]\w*\s*\(\s*[A-Za-zθ]\s*\)|y|r)\s*=\s*/, "");

/** 参数在元素内 sec 时刻的值 */
export function plotParams(spec: PlotSpec, sec: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(spec.params ?? {})) out[k] = typeof v === "number" ? v : evalKeyframes(v, sec) ?? 0;
  return out;
}

export interface PlotModel {
  env: ExprEnv;
  fnIds: Set<string>;
  /** 把表达式编译成单变量函数（变量名 v：函数用 x，参数/极坐标曲线用 t） */
  make: (src: string, v?: string) => (x: number) => number;
  /** 函数对象（of 指定的 id，缺省第一条函数） */
  fnOf: (id?: string) => ((x: number) => number) | undefined;
  val: (v: number | string | undefined, fallback?: number) => number;
}
export function plotModel(spec: PlotSpec, sec: number): PlotModel {
  const vars = plotParams(spec, sec);
  const fnIds = new Set(spec.items.filter((it) => it.type === "fn" && it.id).map((it) => it.id!));
  const fns: Record<string, (x: number) => number> = {};
  const env: ExprEnv = { vars, fns };
  const make = (src: string, v = "x") => {
    let c: Compiled;
    try { c = compileExpr(stripLhs(src), fnIds); } catch { return () => NaN; }
    return (x: number) => c({ vars: { ...vars, [v]: x }, fns });
  };
  for (const it of spec.items) if (it.type === "fn" && it.id && it.fn) fns[it.id] = make(it.fn);
  const first = spec.items.find((it) => it.type === "fn" && it.fn);
  const fnOf = (id?: string) => (id && fns[id]) || (first?.fn ? make(first.fn) : undefined);
  const val = (v: number | string | undefined, fallback = NaN) => evalValue(v, env, fnIds, fallback);
  return { env, fnIds, make, fnOf, val };
}

/** 各对象的显示进度 r（0–1 画出）与透明度 o（end 之后淡出） */
export function itemReveal(spec: PlotSpec, progress: number, sec: number) {
  const auto = spec.items.map((it, i) => ({ it, i })).filter(({ it }) => it.start === undefined);
  const axesShare = auto.length ? 0.25 : 1;
  const axes = clamp01(progress / axesShare);
  const slot = auto.length ? (1 - axesShare) / auto.length : 0;
  const rank = new Map(auto.map(({ i }, k) => [i, k]));
  const items = spec.items.map((it, i) => {
    let r: number;
    if (it.start !== undefined) r = (it.draw ?? 1) <= 0 ? (sec >= it.start ? 1 : 0) : clamp01((sec - it.start) / (it.draw ?? 1));
    else r = progress >= 1 ? 1 : clamp01((progress - axesShare - rank.get(i)! * slot) / slot);
    const o = it.end !== undefined ? 1 - clamp01((sec - it.end) / 0.4) : 1;
    return { r, o };
  });
  return { axes, items };
}

/** 采样一段曲线成路径（遇到断点/发散处断开）；返回 d 与最后一个落在坐标区域内的点（放标注） */
function curvePath(pt: (t: number) => [number, number], a: number, b: number, n: number, X: (x: number) => number, Y: (y: number) => number, w: number, h: number) {
  let d = "";
  let pen = false;
  let last: [number, number] | undefined;
  let prevPy: number | undefined;
  for (let k = 0; k <= n; k++) {
    const t = a + ((b - a) * k) / n;
    const [x, y] = pt(t);
    if (!Number.isFinite(x) || !Number.isFinite(y)) { pen = false; prevPy = undefined; continue; }
    const px = X(x), py = Y(y);
    // 发散（如 tan 的渐近线）：相邻两点跨越很大的竖直距离时断开
    if (pen && prevPy !== undefined && Math.abs(py - prevPy) > h * 4) pen = false;
    const cy = Math.max(-h * 10, Math.min(h * 11, py));
    d += (pen ? "L" : "M") + f2(px) + "," + f2(cy);
    pen = true;
    prevPy = py;
    if (px >= 0 && px <= w && py >= 0 && py <= h) last = [px, py];
  }
  return { d, last };
}

const arrowHead = (x: number, y: number, ang: number, len: number, wid: number) => {
  const c = Math.cos(ang), s = Math.sin(ang);
  const bx = x - c * len, by = y - s * len;
  return "M" + f2(x) + "," + f2(y) + "L" + f2(bx - s * wid) + "," + f2(by + c * wid) + "L" + f2(bx + s * wid) + "," + f2(by - c * wid) + "Z";
};

export type PlotReveal = ReturnType<typeof itemReveal>;

export const PlotSvg: React.FC<{ ov: Overlay; spec: PlotSpec; w: number; h: number; progress: number; sec: number; unit: number; reveal?: PlotReveal }> = ({ ov, spec, w, h, progress, sec, unit, reveal }) => {
  const [x0, x1] = spec.x;
  const [y0, y1] = spec.y;
  const X = (x: number) => ((x - x0) / (x1 - x0 || 1)) * w;
  const Y = (y: number) => h - ((y - y0) / (y1 - y0 || 1)) * h;
  const model = plotModel(spec, sec);
  const { axes: axP, items: rv } = reveal ?? itemReveal(spec, progress, sec);
  const font = overlayFontFamily(ov.fontFamily);
  const fs = ov.fontSize;
  const axisColor = spec.axisColor ?? ov.color;
  const gridColor = spec.gridColor ?? "#58C4DD";
  const xs = spec.xStep ?? niceStep(x1 - x0), ys = spec.yStep ?? niceStep(y1 - y0);
  const ax = y0 <= 0 && y1 >= 0 ? Y(0) : y0 > 0 ? h : 0; // x 轴所在的像素 y
  const ay = x0 <= 0 && x1 >= 0 ? X(0) : x0 > 0 ? 0 : w; // y 轴所在的像素 x
  const clipId = "dj-plot-" + ov.id;
  const aw = Math.max(1, 2.5 * unit);
  const ticks = (lo: number, hi: number, step: number) => {
    const out: number[] = [];
    if (!(step > 0) || (hi - lo) / step > 200) return out;
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
    return out;
  };
  const fmt = (v: number) => String(Math.round(v * 1e6) / 1e6);
  const colorOf = (it: PlotItem, i: number) => it.color ?? MATH_COLORS[i % MATH_COLORS.length];
  const textEl = (key: React.Key, x: number, y: number, text: string, color: string, anchor: "start" | "middle" | "end", baseline: "top" | "middle" | "bottom", opacity: number, size = fs) => {
    if (opacity <= 0 || !text) return null;
    const tex = labelTex(text);
    if (tex) return <MathLabel key={key} tex={tex} x={x} y={y} size={size} color={color} anchor={anchor} baseline={baseline} opacity={opacity} />;
    return (
      <text key={key} x={f2(x)} y={f2(y)} fill={color} fontSize={size} fontFamily={font} textAnchor={anchor} opacity={opacity < 1 ? opacity : undefined}
        dominantBaseline={baseline === "top" ? "hanging" : baseline === "bottom" ? "alphabetic" : "central"}>
        {fillTemplate(text, model.env, model.fnIds)}
      </text>
    );
  };

  // ---- 网格、坐标轴、刻度 ----
  const back: React.ReactNode[] = [];
  if (spec.grid && axP > 0) {
    const lines = [
      ...ticks(x0, x1, xs).map((v) => "M" + f2(X(v)) + ",0V" + f2(h)),
      ...ticks(y0, y1, ys).map((v) => "M0," + f2(Y(v)) + "H" + f2(w)),
    ].join("");
    back.push(<path key="grid" d={lines} stroke={gridColor} strokeWidth={Math.max(1, 1.5 * unit)} opacity={0.4 * axP} fill="none" />);
  }
  if (spec.axes !== false && axP > 0) {
    const tip = 9 * aw;
    back.push(
      <path key="xaxis" d={"M0," + f2(ax) + "H" + f2(w)} stroke={axisColor} strokeWidth={aw} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - axP} />,
      <path key="yaxis" d={"M" + f2(ay) + "," + f2(h) + "V0"} stroke={axisColor} strokeWidth={aw} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - axP} />,
    );
    if (axP >= 1) back.push(<path key="tips" d={arrowHead(w + tip * 0.6, ax, 0, tip, tip * 0.42) + arrowHead(ay, -tip * 0.6, -Math.PI / 2, tip, tip * 0.42)} fill={axisColor} />);
    if (spec.ticks !== false) {
      const tl = 6 * unit;
      const xt = ticks(x0, x1, xs).filter((v) => v !== 0 || ay === 0 || ay === w);
      const yt = ticks(y0, y1, ys).filter((v) => v !== 0 || ax === 0 || ax === h);
      back.push(<path key="ticks" opacity={axP} stroke={axisColor} strokeWidth={aw * 0.8} d={xt.map((v) => "M" + f2(X(v)) + "," + f2(ax - tl) + "V" + f2(ax + tl)).join("") + yt.map((v) => "M" + f2(ay - tl) + "," + f2(Y(v)) + "H" + f2(ay + tl)).join("")} />);
      if (spec.numbers !== false) {
        const ns = fs * 0.8;
        xt.forEach((v) => back.push(textEl("xn" + v, X(v), ax + tl + ns * 0.3, fmt(v), axisColor, "middle", "top", axP, ns)));
        yt.forEach((v) => back.push(textEl("yn" + v, ay - tl - ns * 0.35, Y(v), fmt(v), axisColor, "end", "middle", axP, ns)));
      }
    }
    if (spec.xLabel) back.push(textEl("xl", w + tip + fs * 0.3, ax, spec.xLabel, axisColor, "start", "middle", axP));
    if (spec.yLabel) back.push(textEl("yl", ay, -tip - fs * 0.35, spec.yLabel, axisColor, "middle", "bottom", axP));
  }

  // ---- 对象 ----
  const clipped: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  const N = 360;
  spec.items.forEach((it, i) => {
    const { r, o } = rv[i];
    if (r <= 0 || o <= 0) return;
    const color = colorOf(it, i);
    const sw = it.width ?? 5 * unit;
    const dash = it.dash ? f2(sw * 2.5) + " " + f2(sw * 2) : undefined;
    const op = o < 1 ? o : undefined;
    const key = "i" + i;
    switch (it.type) {
      case "fn":
      case "param":
      case "polar": {
        let pt: (t: number) => [number, number];
        let a: number, b: number;
        if (it.type === "fn") {
          const f = it.fn ? model.make(it.fn) : undefined;
          if (!f) return;
          a = Math.max(x0, model.val(it.domain?.[0], x0)); b = Math.min(x1, model.val(it.domain?.[1], x1));
          pt = (x) => [x, f(x)];
        } else if (it.type === "param") {
          const fx = it.fx ? model.make(it.fx, "t") : undefined, fy = it.fy ? model.make(it.fy, "t") : undefined;
          if (!fx || !fy) return;
          a = model.val(it.t?.[0], 0); b = model.val(it.t?.[1], Math.PI * 2);
          pt = (t) => [fx(t), fy(t)];
        } else {
          const fr = it.fn ? model.make(it.fn, "t") : undefined;
          if (!fr) return;
          a = model.val(it.t?.[0], 0); b = model.val(it.t?.[1], Math.PI * 2);
          pt = (t) => { const rr = fr(t); return [rr * Math.cos(t), rr * Math.sin(t)]; };
        }
        if (!(b > a)) return;
        const { d, last } = curvePath(pt, a, a + (b - a) * r, Math.max(8, Math.round(N * r)), X, Y, w, h);
        if (d) clipped.push(<path key={key} d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={op} />);
        // 标注放在曲线离开坐标区域前的最后一点旁边（靠右时往左放）
        if (it.label && last && r >= 1) {
          const right = last[0] > w * 0.8;
          front.push(textEl(key + "l", last[0] + (right ? -fs * 0.5 : fs * 0.4), Math.max(fs * 0.8, last[1] - fs * 0.5), it.label, color, right ? "end" : "start", "middle", o));
        }
        return;
      }
      case "area":
      case "riemann": {
        const f = model.fnOf(it.of);
        if (!f) return;
        const a = model.val(it.from, x0), b = model.val(it.to, x1);
        if (!(b > a)) return;
        if (it.type === "area") {
          const bb = a + (b - a) * r;
          const pts: string[] = [];
          for (let k = 0; k <= 120; k++) {
            const x = a + ((bb - a) * k) / 120;
            const y = f(x);
            pts.push(f2(X(x)) + "," + f2(Y(Number.isFinite(y) ? y : 0)));
          }
          const base = f2(Math.max(0, Math.min(h, Y(0))));
          clipped.push(<path key={key} d={"M" + f2(X(a)) + "," + base + "L" + pts.join("L") + "L" + f2(X(bb)) + "," + base + "Z"} fill={color} opacity={(it.opacity ?? 0.35) * o} />);
        } else {
          const n = Math.max(1, Math.min(400, Math.round(model.val(it.n, 8))));
          const dx = (b - a) / n;
          const rects: React.ReactNode[] = [];
          for (let k = 0; k < n; k++) {
            // 矩形从左到右依次长出来
            const g = n > 1 ? clamp01((r - (k / n) * 0.6) / 0.4) : r;
            const y = f(a + k * dx);
            if (!Number.isFinite(y) || g <= 0) continue;
            const top = Y(0) + (Y(y) - Y(0)) * g;
            rects.push(<rect key={k} x={f2(X(a + k * dx))} y={f2(Math.min(top, Y(0)))} width={f2(X(a + (k + 1) * dx) - X(a + k * dx))} height={f2(Math.abs(top - Y(0)))} />);
          }
          clipped.push(<g key={key} fill={color} fillOpacity={it.opacity ?? 0.6} stroke={color} strokeWidth={Math.max(1, unit * 1.5)} opacity={op}>{rects}</g>);
        }
        if (it.label && r >= 1) front.push(textEl(key + "l", X((a + b) / 2), Y(0) - fs * 0.9, it.label, color, "middle", "bottom", o));
        return;
      }
      case "tangent": {
        const f = model.fnOf(it.of);
        if (!f) return;
        const xa = model.val(it.x, (x0 + x1) / 2), ya = f(xa);
        const hh = (x1 - x0) * 1e-4;
        const m = (f(xa + hh) - f(xa - hh)) / (2 * hh);
        if (!Number.isFinite(ya) || !Number.isFinite(m)) return;
        // 长度按像素方向计算，横纵比例不同也保持给定的视觉长度
        const len = it.length ?? (x1 - x0) / 3;
        const dxp = X(xa + 1) - X(xa), dyp = Y(ya + m) - Y(ya);
        const k = ((len / 2) * (X(x0 + 1) - X(x0))) / Math.hypot(dxp, dyp) * r;
        clipped.push(<path key={key} d={"M" + f2(X(xa) - dxp * k) + "," + f2(Y(ya) - dyp * k) + "L" + f2(X(xa) + dxp * k) + "," + f2(Y(ya) + dyp * k)} stroke={color} strokeWidth={sw * 0.8} strokeLinecap="round" strokeDasharray={dash} opacity={op} />);
        if (it.label && r >= 1) front.push(textEl(key + "l", X(xa) + dxp * k + fs * 0.2, Y(ya) + dyp * k, it.label, color, "start", "middle", o));
        return;
      }
      case "point": {
        const xv = model.val(it.x, 0);
        let yv = it.y !== undefined ? model.val(it.y, NaN) : NaN;
        if (Number.isNaN(yv)) { const f = model.fnOf(it.of); yv = f ? f(xv) : 0; }
        if (!Number.isFinite(xv) || !Number.isFinite(yv)) return;
        const px = X(xv), py = Y(yv), rad = (it.size ?? 8 * unit) * (r < 1 ? 1 + 0.6 * Math.sin(r * Math.PI) * (1 - r) : 1) * Math.min(1, r * 3);
        if (it.guides) front.push(<path key={key + "g"} d={"M" + f2(px) + "," + f2(py) + "V" + f2(ax) + "M" + f2(px) + "," + f2(py) + "H" + f2(ay)} stroke={color} strokeWidth={Math.max(1, 2 * unit)} strokeDasharray={f2(6 * unit) + " " + f2(5 * unit)} opacity={0.75 * o * r} />);
        front.push(<circle key={key} cx={f2(px)} cy={f2(py)} r={f2(rad)} fill={color} opacity={op} />);
        // 点的标注里 {x}/{y} 是点自己的坐标
        if (it.label) front.push(textEl(key + "l", px + rad + fs * 0.25, py - rad - fs * 0.35, fillTemplate(it.label, { vars: { ...model.env.vars, x: xv, y: yv }, fns: model.env.fns }, model.fnIds), color, "start", "bottom", o * clamp01(r * 2 - 1)));
        return;
      }
      case "vector":
      case "segment": {
        const xa = model.val(it.x0, 0), ya = model.val(it.y0, 0);
        const xb = model.val(it.x, 1), yb = model.val(it.y, 1);
        if (![xa, ya, xb, yb].every(Number.isFinite)) return;
        const pa: [number, number] = [X(xa), Y(ya)];
        const pb: [number, number] = [pa[0] + (X(xb) - pa[0]) * r, pa[1] + (Y(yb) - pa[1]) * r];
        const ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
        const len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
        const head = it.type === "vector" ? Math.min(len * 0.6, sw * 4.2) : 0;
        const end: [number, number] = [pb[0] - Math.cos(ang) * head * 0.85, pb[1] - Math.sin(ang) * head * 0.85];
        front.push(
          <g key={key} opacity={op}>
            <path d={"M" + f2(pa[0]) + "," + f2(pa[1]) + "L" + f2(end[0]) + "," + f2(end[1])} stroke={color} strokeWidth={sw} strokeLinecap={it.type === "vector" ? "butt" : "round"} strokeDasharray={dash} />
            {head > 0 && <path d={arrowHead(pb[0], pb[1], ang, head, head * 0.5)} fill={color} />}
          </g>,
        );
        if (it.label && r >= 1) front.push(textEl(key + "l", pb[0] + Math.cos(ang) * fs * 0.5, pb[1] + Math.sin(ang) * fs * 0.5 - fs * 0.2, it.label, color, Math.cos(ang) < -0.3 ? "end" : "start", "middle", o));
        return;
      }
      case "label": {
        if (!it.label) return;
        const xv = model.val(it.x, 0), yv = model.val(it.y, 0);
        front.push(textEl(key, X(xv), Y(yv), it.label, it.color ?? ov.color, "middle", "middle", o * r));
        return;
      }
    }
  });

  return (
    <svg width={w} height={h} viewBox={"0 0 " + f2(w) + " " + f2(h)} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs><clipPath id={clipId}><rect x={0} y={0} width={w} height={h} /></clipPath></defs>
      {back}
      <g clipPath={"url(#" + clipId + ")"}>{clipped}</g>
      {front}
    </svg>
  );
};
