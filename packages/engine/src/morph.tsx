// 变形（Transform）：元素 B 带 morph{from:A} 时，B 开头 duration 秒内画面从 A 的最终状态连续变成 B。
//   公式→公式：相同字形配对移动/缩放/变色，多出来的淡出、新出现的淡入（推导式变形）
//   形状→形状：两条轮廓按弧长取样逐点插值（圆变方、三角变星…），颜色/描边渐变
//   坐标系→坐标系：结构相同时坐标范围、函数、点、面积等逐项插值（函数变形、坐标缩放）
//   其他组合：A 的画面移动缩放到 B 的位置并淡出，B 从 A 的位置淡入
import React from "react";
import { AbsoluteFill, Freeze, useCurrentFrame, useVideoConfig } from "remotion";
import type { Overlay, PlotItem, PlotSpec } from "./schema";
import { MATH_COLORS, easingFn } from "./timeline";
import { resolveAnimations } from "./presets";
import { ElementView, elementBoxPx, elementMotion, shapeOutline, solidOf, type Motion } from "./elements";
import { renderPiece, useMath } from "./math";
import { isMathError, mathSize, writeOrder, type MathData, type MathPiece, type MathResult } from "./mathData";
import { samplePath, signedArea, type Pt } from "./paths";
import { PlotSvg, itemReveal, plotParams, stripLhs } from "./plot";
import { overlayFontFamily } from "./fonts";

type Mat = [number, number, number, number, number, number];
const mul = (a: Mat, b: readonly number[]): Mat => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];
const apply = (m: Mat, p: Pt): Pt => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpM = (a: readonly number[], b: readonly number[], t: number) => a.map((v, i) => lerp(v, b[i], t));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (v: number) => Math.round(v * 100) / 100;

function rgba(c: string | undefined): [number, number, number, number] | undefined {
  if (!c) return undefined;
  const s = c.trim();
  let m = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("");
    if (h.length !== 6 && h.length !== 8) return undefined;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (m) {
    const v = m[1].split(/[\s,/]+/).filter(Boolean).map((x) => (x.endsWith("%") ? (parseFloat(x) * 2.55) : parseFloat(x)));
    return [v[0], v[1], v[2], v[3] ?? 1];
  }
  return undefined;
}
export function mixColor(a: string | undefined, b: string | undefined, t: number): string | undefined {
  if (a === b || !a || !b) return t < 0.5 ? a ?? b : b ?? a;
  const A = rgba(a), B = rgba(b);
  if (!A || !B) return t < 0.5 ? a : b;
  const c = A.map((v, i) => lerp(v, B[i], t));
  return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + f2(c[3]) + ")";
}

/** 元素放置矩阵：盒子局部像素（左上为原点）→ 画布像素，与 CSS「motion + translate(-50%,-50%)」一致 */
function placement(ov: Overlay, m: Motion, w: number, h: number, W: number, H: number): Mat {
  const r = (m.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  let M: Mat = [1, 0, 0, 1, (ov.x ?? 0.5) * W + m.dx, (ov.y ?? 0.5) * H + m.dy];
  M = mul(M, [c, s, -s, c, 0, 0]);
  M = mul(M, [m.scale * m.sx, 0, 0, m.scale * m.sy, 0, 0]);
  return mul(M, [1, 0, 0, 1, -w / 2, -h / 2]);
}

// ---------- 公式 → 公式 ----------
/**
 * 字形配对：先按从左到右的顺序做序列比对（相同字符才能配对，尽量少断开——
 * “a²+2ab+b²”→“(a+b)²=a²+2ab+b²”会整体对到右边那段，而不是被拆散），
 * 剩下的再按字符配对（交换位置的推导如 a²+b²→b²+a²，字形会交叉移动过去）。
 */
export function matchPieces(a: MathData, b: MathData) {
  const oa = writeOrder(a), ob = writeOrder(b);
  const ka = oa.map((i) => a.pieces[i].k), kb = ob.map((j) => b.pieces[j].k);
  const n = ka.length, m = kb.length;
  const NEG = -1e9, OPEN = 1, MATCH = 10;
  // 三个状态：M 以配对结尾，X 以 A 的落单结尾，Y 以 B 的落单结尾（每段连续落单只扣一次分）
  const M = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(NEG));
  const X = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(NEG));
  const Y = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(NEG));
  M[0][0] = 0;
  for (let i = 1; i <= n; i++) X[i][0] = -OPEN;
  for (let j = 1; j <= m; j++) Y[0][j] = -OPEN;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (ka[i - 1] === kb[j - 1]) M[i][j] = MATCH + Math.max(M[i - 1][j - 1], X[i - 1][j - 1], Y[i - 1][j - 1]);
      X[i][j] = Math.max(M[i - 1][j] - OPEN, X[i - 1][j], Y[i - 1][j] - OPEN);
      Y[i][j] = Math.max(M[i][j - 1] - OPEN, Y[i][j - 1], X[i][j - 1] - OPEN);
    }
  }
  const pairs: [number, number][] = [];
  let i = n, j = m;
  let state = M[n][m] >= X[n][m] && M[n][m] >= Y[n][m] ? 0 : X[n][m] >= Y[n][m] ? 1 : 2;
  while (i > 0 || j > 0) {
    if (state === 0 && i > 0 && j > 0) {
      pairs.push([oa[i - 1], ob[j - 1]]);
      const p = [M[i - 1][j - 1], X[i - 1][j - 1], Y[i - 1][j - 1]];
      state = p[0] >= p[1] && p[0] >= p[2] ? 0 : p[1] >= p[2] ? 1 : 2;
      i--; j--;
    } else if (state === 1 && i > 0) {
      const p = [M[i - 1][j] - OPEN, X[i - 1][j], Y[i - 1][j] - OPEN];
      state = p[1] >= p[0] && p[1] >= p[2] ? 1 : p[0] >= p[2] ? 0 : 2;
      i--;
    } else if (j > 0) {
      const p = [M[i][j - 1] - OPEN, Y[i][j - 1], X[i][j - 1] - OPEN];
      state = p[1] >= p[0] && p[1] >= p[2] ? 2 : p[0] >= p[2] ? 0 : 1;
      j--;
    } else { state = 1; }
  }
  // 比对剩下的：同字符按从左到右配对（允许交叉）
  const usedA = new Set(pairs.map((p) => p[0])), usedB = new Set(pairs.map((p) => p[1]));
  const byKey = new Map<string, number[]>();
  for (const jj of ob) if (!usedB.has(jj)) byKey.set(b.pieces[jj].k, [...(byKey.get(b.pieces[jj].k) ?? []), jj]);
  const outA: number[] = [];
  for (const ii of oa) {
    if (usedA.has(ii)) continue;
    const jj = byKey.get(a.pieces[ii].k)?.shift();
    if (jj === undefined) outA.push(ii); else pairs.push([ii, jj]);
  }
  const inB = [...byKey.values()].flat();
  return { pairs, outA, inB };
}

const MathMorph: React.FC<{ A: Overlay; B: Overlay; dA: MathData; dB: MathData; mA: Motion; mB: Motion; e: number; W: number; H: number }> = ({ A, B, dA, dB, mA, mB, e, W, H }) => {
  const match = React.useMemo(() => matchPieces(dA, dB), [dA, dB]);
  const kA = A.fontSize / 1000, kB = B.fontSize / 1000;
  const sA = mathSize(dA, A.fontSize), sB = mathSize(dB, B.fontSize);
  const PA = mul(placement(A, mA, sA.w, sA.h, W, H), [kA, 0, 0, kA, -dA.vb[0] * kA, -dA.vb[1] * kA]);
  const PB = mul(placement(B, mB, sB.w, sB.h, W, H), [kB, 0, 0, kB, -dB.vb[0] * kB, -dB.vb[1] * kB]);
  const unit = lerp(kA, kB, e);
  const font = overlayFontFamily(B.fontFamily);
  const nodes: React.ReactNode[] = [];
  for (const [i, j] of match.pairs) {
    const pa = dA.pieces[i], pb = dB.pieces[j];
    const M = lerpM(mul(PA, pa.m), mul(PB, pb.m), e);
    const color = mixColor(pa.c ?? A.color, pb.c ?? B.color, e) ?? B.color;
    if (pa.tag === "rect" && pb.tag === "rect") {
      const a: MathPiece["a"] = { ...pb.a };
      for (const key of ["x", "y", "width", "height"]) a[key] = lerp(Number(pa.a[key] ?? 0), Number(pb.a[key] ?? 0), e);
      nodes.push(renderPiece({ ...pb, a, c: color }, "p" + j, color, 1, unit, font, M));
    } else if (pa.a.d !== pb.a.d) {
      // 同一字符不同尺寸（伸缩括号等）：在插值位置上交叉淡化
      nodes.push(renderPiece({ ...pa, c: color }, "a" + i, color, 1, unit, font, M, 1 - e));
      nodes.push(renderPiece({ ...pb, c: color }, "p" + j, color, 1, unit, font, M, e));
    } else nodes.push(renderPiece({ ...pb, c: color }, "p" + j, color, 1, unit, font, M));
  }
  for (const i of match.outA) nodes.push(renderPiece(dA.pieces[i], "a" + i, A.color, 1, kA, font, mul(PA, dA.pieces[i].m), clamp01(1 - e * 2)));
  for (const j of match.inB) nodes.push(renderPiece(dB.pieces[j], "b" + j, B.color, 1, kB, font, mul(PB, dB.pieces[j].m), clamp01(e * 2 - 1)));
  return (
    <svg width={W} height={H} viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: lerp(mA.opacity, mB.opacity, e) }}>
      {nodes}
    </svg>
  );
};

// ---------- 形状 → 形状 ----------
const N = 120;
function shapePoints(ov: Overlay, m: Motion, W: number, H: number): { pts: Pt[]; closed: boolean } | undefined {
  if (ov.kind !== "shape" || !ov.shape || ov.text?.trim()) return undefined;
  const { w, h } = elementBoxPx(ov, W, H);
  const subs = shapeOutline(ov.shape, w, h ?? w);
  if (subs.length !== 1) return undefined;
  const P = placement(ov, m, w, h ?? w, W, H);
  return { pts: samplePath(subs[0], N).map((p) => apply(P, p)), closed: subs[0].closed };
}
/** 让 B 的取样点与 A 对齐：同向（闭合）+ 起点错位使总距离最小 */
export function alignPoints(a: Pt[], b: Pt[], closed: boolean): Pt[] {
  const d2 = (p: Pt, q: Pt) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  if (!closed) {
    const rev = [...b].reverse();
    const cost = (x: Pt[]) => x.reduce((s, p, i) => s + d2(a[i], p), 0);
    return cost(rev) < cost(b) ? rev : b;
  }
  const bb = Math.sign(signedArea(a)) !== Math.sign(signedArea(b)) ? [b[0], ...b.slice(1).reverse()] : b;
  let best = 0, bestCost = Infinity;
  for (let k = 0; k < bb.length; k++) {
    let c = 0;
    for (let i = 0; i < a.length && c < bestCost; i++) c += d2(a[i], bb[(i + k) % bb.length]);
    if (c < bestCost) { bestCost = c; best = k; }
  }
  return bb.map((_, i) => bb[(i + best) % bb.length]);
}

const ShapeMorph: React.FC<{ A: Overlay; B: Overlay; a: { pts: Pt[]; closed: boolean }; b: { pts: Pt[]; closed: boolean }; mA: Motion; mB: Motion; e: number; W: number; H: number }> = ({ A, B, a, b, mA, mB, e, W, H }) => {
  const bp = alignPoints(a.pts, b.pts, a.closed);
  const pts = a.pts.map((p, i): Pt => [lerp(p[0], bp[i][0], e), lerp(p[1], bp[i][1], e)]);
  const d = "M" + pts.map((p) => f2(p[0]) + "," + f2(p[1])).join("L") + (a.closed ? "Z" : "");
  const sa = A.shape!, sb = B.shape!;
  const fill = a.closed ? mixColor(solidOf(sa.fill), solidOf(sb.fill), e) : undefined;
  const lineA = !a.closed ? sa.stroke ?? { color: solidOf(sa.fill) ?? "#ffffff", width: 6 } : sa.stroke;
  const lineB = !b.closed ? sb.stroke ?? { color: solidOf(sb.fill) ?? "#ffffff", width: 6 } : sb.stroke;
  const sw = lerp(lineA?.width ?? 0, lineB?.width ?? 0, e);
  const stroke = mixColor(lineA?.color ?? solidOf(sa.fill), lineB?.color ?? solidOf(sb.fill), e);
  return (
    <svg width={W} height={H} viewBox={"0 0 " + W + " " + H} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: lerp(mA.opacity, mB.opacity, e) }}>
      <path d={d} fill={fill ?? "none"} fillOpacity={sa.fill === undefined ? e : sb.fill === undefined ? 1 - e : undefined} stroke={sw > 0.2 ? stroke : "none"} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ---------- 坐标系 → 坐标系 ----------
const EXPR_KEYS = ["fn", "fx", "fy", "x", "y", "x0", "y0", "from", "to", "n"] as const;
/** 把参数替换成当时的数值，A、B 两边的同名参数互不干扰 */
const bake = (v: number | string | undefined, params: Record<string, number>): string | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === "number") return String(v);
  let s = stripLhs(v);
  for (const [k, val] of Object.entries(params)) s = s.replace(new RegExp("\\b" + k + "\\b(?!\\s*\\()", "g"), "(" + val + ")");
  return s;
};
function blendPlot(a: PlotSpec, b: PlotSpec, pa: Record<string, number>, pb: Record<string, number>, e: number): PlotSpec | undefined {
  if (a.items.length !== b.items.length || a.items.some((it, i) => it.type !== b.items[i].type)) return undefined;
  const mix = (x: string | undefined, y: string | undefined, fallback: string): string => {
    const xa = x ?? fallback, yb = y ?? fallback;
    return xa === yb ? xa : "(" + (1 - e) + ")*(" + xa + ")+(" + e + ")*(" + yb + ")";
  };
  const items = a.items.map((ia, i): PlotItem => {
    const ib = b.items[i];
    const palette = MATH_COLORS[i % MATH_COLORS.length];
    const out: PlotItem = { ...ib, start: undefined, end: undefined, draw: undefined, color: mixColor(ia.color ?? palette, ib.color ?? palette, e) };
    for (const k of EXPR_KEYS) {
      const va = bake(ia[k], pa), vb = bake(ib[k], pb);
      if (va !== undefined || vb !== undefined) (out as Record<string, unknown>)[k] = mix(va, vb, k === "n" ? "8" : "0");
    }
    for (const k of ["t", "domain"] as const) {
      const ra = ia[k], rb = ib[k];
      if (ra || rb) out[k] = [mix(bake(ra?.[0], pa), bake(rb?.[0], pb), k === "t" ? "0" : String(lerp(a.x[0], b.x[0], e))), mix(bake(ra?.[1], pa), bake(rb?.[1], pb), k === "t" ? "2*pi" : String(lerp(a.x[1], b.x[1], e)))];
    }
    if (ia.length !== undefined || ib.length !== undefined) out.length = lerp(ia.length ?? ib.length!, ib.length ?? ia.length!, e);
    if (ia.width !== undefined || ib.width !== undefined) out.width = lerp(ia.width ?? ib.width!, ib.width ?? ia.width!, e);
    return out;
  });
  return {
    ...b,
    x: [lerp(a.x[0], b.x[0], e), lerp(a.x[1], b.x[1], e)],
    y: [lerp(a.y[0], b.y[0], e), lerp(a.y[1], b.y[1], e)],
    xStep: e < 0.5 ? a.xStep : b.xStep, yStep: e < 0.5 ? a.yStep : b.yStep,
    axisColor: mixColor(a.axisColor, b.axisColor, e), gridColor: mixColor(a.gridColor, b.gridColor, e),
    params: undefined,
    items,
  };
}

const PlotMorph: React.FC<{ A: Overlay; B: Overlay; spec: PlotSpec; mA: Motion; mB: Motion; aSec: number; bSec: number; e: number; W: number; H: number }> = ({ A, B, spec, mA, mB, aSec, bSec, e, W, H }) => {
  const ra = itemReveal(A.plot!, mA.progress, aSec), rb = itemReveal(B.plot!, mB.progress, bSec);
  const reveal = { axes: lerp(ra.axes, rb.axes, e), items: ra.items.map((x, i) => ({ r: lerp(x.r, rb.items[i].r, e), o: lerp(x.o, rb.items[i].o, e) })) };
  const bA = elementBoxPx(A, W, H), bB = elementBoxPx(B, W, H);
  const w = lerp(bA.w, bB.w, e), h = lerp(bA.h ?? bA.w, bB.h ?? bB.w, e);
  const mid: Overlay = { ...B, x: lerp(A.x ?? 0.5, B.x ?? 0.5, e), y: lerp(A.y ?? 0.5, B.y ?? 0.5, e), fontSize: lerp(A.fontSize, B.fontSize, e), color: mixColor(A.color, B.color, e) ?? B.color };
  const m: Motion = { ...mB, dx: lerp(mA.dx, mB.dx, e), dy: lerp(mA.dy, mB.dy, e), scale: lerp(mA.scale, mB.scale, e), sx: lerp(mA.sx, mB.sx, e), sy: lerp(mA.sy, mB.sy, e), rot: lerp(mA.rot, mB.rot, e), opacity: lerp(mA.opacity, mB.opacity, e), filter: undefined, clipPath: undefined };
  const P = placement(mid, m, w, h, W, H);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0", transform: "matrix(" + P.join(",") + ")", opacity: m.opacity }}>
      <PlotSvg ov={mid} spec={spec} w={w} h={h} progress={1} sec={0} unit={Math.min(W, H) / 1080} reveal={reveal} />
    </div>
  );
};

// ---------- 通用：位置/大小过渡 + 交叉淡化 ----------
/** 元素的“尺寸量”：有盒子用宽度，没有（公式/旧字幕）用字号，同类才按比例缩放 */
const sizeOf = (ov: Overlay, W: number, H: number): [string, number] =>
  ov.w !== undefined || ov.kind === "shape" || ov.kind === "image" || ov.kind === "icon" || ov.kind === "chart" || ov.kind === "plot" ? ["box", elementBoxPx(ov, W, H).w] : ["font", ov.fontSize];

const FadeMorph: React.FC<{ A: Overlay; B: Overlay; aFrame: number; bFrame: number; mA: Motion; mB: Motion; e: number; W: number; H: number }> = ({ A, B, aFrame, bFrame, mA, mB, e, W, H }) => {
  const ca: Pt = [(A.x ?? 0.5) * W + mA.dx, (A.y ?? 0.5) * H + mA.dy], cb: Pt = [(B.x ?? 0.5) * W + mB.dx, (B.y ?? 0.5) * H + mB.dy];
  const [ka, sa] = sizeOf(A, W, H), [kb, sb] = sizeOf(B, W, H);
  const ratio = ka === kb && sa > 0 && sb > 0 ? sb / sa : 1;
  const c: Pt = [lerp(ca[0], cb[0], e), lerp(ca[1], cb[1], e)];
  const layer = (from: Pt, s: number, opacity: number, child: React.ReactNode) => (
    <AbsoluteFill style={{ transformOrigin: "0 0", transform: "translate(" + c[0] + "px," + c[1] + "px) scale(" + s + ") translate(" + -from[0] + "px," + -from[1] + "px)", opacity }}>{child}</AbsoluteFill>
  );
  return (
    <>
      {layer(ca, lerp(1, ratio, e), 1 - e, <Freeze frame={aFrame}><ElementView ov={A} /></Freeze>)}
      {layer(cb, lerp(1 / ratio, 1, e), e, <Freeze frame={bFrame}><ElementView ov={B} /></Freeze>)}
    </>
  );
};

/** 变形期间 B 的“锚点”：不可见、与 B 最终外框一致，面板据此点选与显示选框 */
const Anchor: React.FC<{ B: Overlay; w: number; h: number; W: number; H: number }> = ({ B, w, h, W, H }) => (
  <div data-el={B.id} style={{ position: "absolute", left: (B.x ?? 0.5) * W, top: (B.y ?? 0.5) * H, width: w, height: h, transform: "translate(-50%, -50%)" + (B.rotate ? " rotate(" + B.rotate + "deg)" : ""), opacity: 0 }} />
);

/** 变形期间代替 B 的画面；过了变形时长渲染 B 本身 */
export const MorphView: React.FC<{ A: Overlay; B: Overlay }> = ({ A, B }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const spec = B.morph!;
  const durFrames = Math.max(1, Math.round((spec.duration ?? 1) * fps));
  const dA = useMath(A.kind === "math" ? A.text : undefined), dB = useMath(B.kind === "math" ? B.text : undefined);
  if (frame >= durFrames) return <ElementView ov={B} />;
  const e = clamp01(easingFn(spec.ease ?? "inOut")(frame / durFrames));
  const aFrame = Math.max(0, Math.round((A.endSeconds - A.startSeconds) * fps) - 1);
  const aSec = aFrame / fps, bSec = durFrames / fps;
  const mA = elementMotion(A, resolveAnimations(A, A.endSeconds - A.startSeconds), aSec, W, H);
  const mB = elementMotion(B, resolveAnimations(B, B.endSeconds - B.startSeconds), bSec, W, H);
  const box = elementBoxPx(B, W, H);
  const anchor = (w: number, h: number) => <Anchor B={B} w={w} h={h} W={W} H={H} />;
  if (A.kind === "math" && B.kind === "math" && ok(dA) && ok(dB)) {
    const s = mathSize(dB, B.fontSize);
    return <><MathMorph A={A} B={B} dA={dA} dB={dB} mA={mA} mB={mB} e={e} W={W} H={H} />{anchor(s.w, s.h)}</>;
  }
  if (A.kind === "shape" && B.kind === "shape") {
    const a = shapePoints(A, mA, W, H), b = shapePoints(B, mB, W, H);
    if (a && b && a.closed === b.closed) return <><ShapeMorph A={A} B={B} a={a} b={b} mA={mA} mB={mB} e={e} W={W} H={H} />{anchor(box.w, box.h ?? box.w)}</>;
  }
  if (A.kind === "plot" && B.kind === "plot" && A.plot && B.plot) {
    const spec2 = blendPlot(A.plot, B.plot, plotParams(A.plot, aSec), plotParams(B.plot, bSec), e);
    if (spec2) return <><PlotMorph A={A} B={B} spec={spec2} mA={mA} mB={mB} aSec={aSec} bSec={bSec} e={e} W={W} H={H} />{anchor(box.w, box.h ?? box.w)}</>;
  }
  return <FadeMorph A={A} B={B} aFrame={aFrame} bFrame={durFrames} mA={mA} mB={mB} e={e} W={W} H={H} />;
};
const ok = (r: MathResult | undefined): r is MathData => Boolean(r && !isMathError(r));
