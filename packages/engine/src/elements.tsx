import {cjkSpace,keepNumbers} from './typography.js';
import { CompositionRenderer } from './renderContext';
// 元素渲染（预览与导出共用）：字幕/标题/文本框/形状/图片/图标/图表。
// 坐标约定：x/y 为元素中心在画布上的比例位置，w/h 为盒子占画布宽/高的比例；字号、描边、圆角、内边距为画布像素。
// 动画：x/y 通道为画布比例偏移；clipL/R/T/B 为擦除；progress 驱动打字机/描边/数字滚动/图表生长。
import React from "react";
import { SampleAnchor } from "./TemporalBlur";
import { Img, useCurrentFrame, useVideoConfig } from "remotion";
import type { Animations, Fill, Overlay, ShapeSpec } from "./schema";
import { evalKeyframes, formatNumber, isBoxElement } from "./timeline";
export { formatNumber };
import { spatialState } from "./spatial";
import { maskState } from "./masks";
import { TextPaint } from "./TextPaint";
import { Paint } from "./paint";
import { gradientOverlay } from "./gradient";
import { glassStyle } from "./glass";
import { pathMotion } from "./motionPath";
import { useElementAppearance } from "./appearance";
import { resolveAnimations } from "./presets";
import { overlayFontFamily } from "./fonts";
import { iconByName } from "./icons";
import { AssetResolver, MediaErrorHandler } from "./renderContext";
import { SceneView } from './SceneView';
import { ChartSvg } from "./charts";
import { PlotSvg } from "./plot";
import { MathGlyphs, mathSize, useMath } from "./math";
import { isMathError } from "./mathData";
import { mapPath, parsePath, reversePath, toPathD, trimEnd, verticesPath, type Pt, type SubPath } from "./paths";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const outCubic = (f: number) => 1 - Math.pow(1 - f, 3);

// ---------- 动画通道 ----------
export interface Motion {
  dx: number; dy: number; scale: number; sx: number; sy: number; rot: number;
  spatial?: string; backfaceVisibility?: "visible" | "hidden";
  mask?: Overlay["mask"]; opacity: number; filter?: string; clipPath?: string; progress: number;
}
const FILTER_CH = [["brightness", "brightness", ""], ["contrast", "contrast", ""], ["saturate", "saturate", ""], ["blur", "blur", "px"]] as const;

export function elementMotion(ov: Overlay, anims: Animations | undefined, sec: number, W: number, H: number): Motion {
  const ev = (ch: keyof Animations) => evalKeyframes(anims?.[ch], sec);
  const filters: string[] = [];
  for (const [ch, css, unit] of FILTER_CH) {
    const v = ev(ch) ?? ov.filter?.[ch];
    if (v !== undefined && !(ch === "blur" ? v === 0 : v === 1)) filters.push(css + "(" + v + unit + ")");
  }
  for (const [key, css, unit] of [["grayscale", "grayscale", ""], ["sepia", "sepia", ""], ["hueRotate", "hue-rotate", "deg"]] as const) {
    const v = ov.filter?.[key];
    if (v) filters.push(css + "(" + v + unit + ")");
  }
  const cl = clamp01(ev("clipL") ?? 0), cr = clamp01(ev("clipR") ?? 0), ct = clamp01(ev("clipT") ?? 0), cb = clamp01(ev("clipB") ?? 0);
  const spatial = spatialState(ov.transform3d, anims, sec);
  const path = pathMotion(ov.motionPath, ev("pathProgress") ?? Math.min(1, Math.max(0, sec / Math.max(0.001, ov.endSeconds - ov.startSeconds))), W, H);
  return {
    mask: maskState(ov.mask, anims, sec),
    spatial: spatial.transform, backfaceVisibility: spatial.backfaceVisibility,
    dx: (ev("x") ?? 0) * W + path.x,
    dy: (ev("y") ?? 0) * H + path.y,
    scale: ev("scale") ?? 1,
    sx: ev("scaleX") ?? 1,
    sy: ev("scaleY") ?? 1,
    rot: (ov.rotate ?? 0) + (ev("rotation") ?? 0) + path.angle,
    opacity: clamp01((ov.opacity ?? 1) * (ev("opacity") ?? 1)),
    filter: filters.length ? filters.join(" ") : undefined,
    clipPath: cl || cr || ct || cb ? "inset(" + ct * 100 + "% " + cr * 100 + "% " + cb * 100 + "% " + cl * 100 + "%)" : undefined,
    progress: clamp01(ev("progress") ?? 1),
  };
}

export const motionTransform = (m: Pick<Motion, "dx" | "dy" | "rot" | "scale" | "sx" | "sy" | "spatial">) => {
  const parts: string[] = [];
  if (m.dx || m.dy) parts.push("translate(" + m.dx + "px, " + m.dy + "px)");
  if (m.spatial) parts.push(m.spatial);
  if (m.rot) parts.push("rotate(" + m.rot + "deg)");
  if (m.scale !== 1) parts.push("scale(" + m.scale + ")");
  if (m.sx !== 1 || m.sy !== 1) parts.push("scale(" + m.sx + ", " + m.sy + ")");
  return parts.join(" ");
};

// ---------- 富文本：**加粗**、==强调色==、[#色值]彩色[/] ----------
export interface Run { text: string; bold?: boolean; accent?: boolean; color?: string }
const MARK = /\*\*|==|\[#[0-9a-fA-F]{3,8}\]|\[\/\]/g;
export const stripMarkup = (text: string) => text.replace(MARK, "");

export function parseRich(text: string, markup = true): Run[][] {
  if (!markup) return text.split("\n").map((l) => (l ? [{ text: l }] : []));
  const lines: Run[][] = [[]];
  let bold = false, accent = false, last = 0;
  const colors: string[] = [];
  const push = (s: string) => {
    s.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, ...(bold ? { bold } : {}), ...(accent ? { accent } : {}), ...(colors.length ? { color: colors[colors.length - 1] } : {}) });
    });
  };
  for (const m of text.matchAll(MARK)) {
    push(text.slice(last, m.index));
    last = (m.index ?? 0) + m[0].length;
    if (m[0] === "**") bold = !bold;
    else if (m[0] === "==") accent = !accent;
    else if (m[0] === "[/]") colors.pop();
    else colors.push(m[0].slice(1, -1));
  }
  push(text.slice(last));
  return lines;
}

type Seg = { segment: string };
const SegmenterCtor = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment: (s: string) => Iterable<Seg> } }).Segmenter;
const graphemeSeg = SegmenterCtor ? new SegmenterCtor("zh", { granularity: "grapheme" }) : undefined;
const wordSeg = SegmenterCtor ? new SegmenterCtor("zh", { granularity: "word" }) : undefined;
export const graphemes = (s: string): string[] => (graphemeSeg ? Array.from(graphemeSeg.segment(s), (x) => x.segment) : Array.from(s));
const words = (s: string): string[] => (wordSeg ? Array.from(wordSeg.segment(s), (x) => x.segment) : s.split(/(\s+)/).filter(Boolean));


/** 元素当前显示的文字（数字滚动按进度插值） */
export function displayText(ov: Overlay, progress = 1): string {
  const c = ov.counter;
  if (!c) return ov.text;
  return (c.prefix ?? "") + formatNumber(c.from + (c.to - c.from) * progress, c.decimals ?? 0, c.separator ?? false) + (c.suffix ?? "");
}

// ---------- 文字体 ----------
const DEFAULT_SHADOW = "0 2px 8px rgba(0,0,0,0.85)";
const textShadowCss = (ov: Overlay): string | undefined => {
  if (ov.shadow !== undefined) return "none"; // explicit shadows are applied once to the complete element
  // 字幕/标题默认带阴影保证可读；文本框、形状里的文字默认不带（幻灯片常用浅色底）
  return ov.kind === "text" || ov.kind === "shape" || ov.kind === "chart" ? undefined : DEFAULT_SHADOW;
};

export const textStyle = (ov: Overlay): React.CSSProperties => ({
  fontSize: ov.fontSize,
  color: ov.color,
  fontFamily: overlayFontFamily(ov.fontFamily),
  ...(ov.fontWeight ? { fontWeight: ov.fontWeight } : {}),
  fontStyle: ov.italic ? "italic" : undefined,
  textDecoration: ov.underline ? "underline" : undefined,
  letterSpacing: ov.letterSpacing !== undefined ? ov.letterSpacing + "em" : undefined,
  lineHeight: ov.lineHeight ?? 1.3,
  textShadow: textShadowCss(ov),
  ...(ov.stroke && ov.stroke.width > 0 ? { WebkitTextStroke: ov.stroke.width + "px " + ov.stroke.color, paintOrder: "stroke fill" } : {}),
});

const unitStyle = (type: string, p: number): React.CSSProperties => {
  const e = outCubic(p);
  switch (type) {
    case "fadeIn": return { opacity: p };
    case "fadeUp": return { opacity: p, transform: "translateY(" + (1 - e) * 0.5 + "em)" };
    case "pop": {
      const s = p >= 1 ? 1 : 0.3 + 0.7 * (1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2));
      return { opacity: clamp01(p * 3), transform: "scale(" + s + ")" };
    }
    case "blur": return { opacity: p, filter: p < 1 ? "blur(" + (1 - e) * 10 + "px)" : undefined };
    case "drop": return { opacity: clamp01(p * 4), transform: "translateY(" + -(1 - e) * 0.7 + "em)" };
    case "typewriter": return { opacity: p > 0 ? 1 : 0 };
    default: return {};
  }
};

/** 文字内容：富文本 + 列表 + 打字机（progress）+ 逐字/逐词/逐行入场 */
export const TextBody: React.FC<{ ov: Overlay; progress: number; sec: number }> = ({ ov, progress, sec }) => {
  const lines = parseRich(displayText(ov, progress), ov.kind !== "subtitle").map(line=>line.map(r=>({...r,text:ov.textEffect||ov.counter||progress<1?r.text:ov.typography?.keepNumbers?keepNumbers(ov.typography.cjkSpacing?cjkSpace(r.text):r.text):ov.typography?.cjkSpacing?cjkSpace(r.text):r.text})));
  const reveal = ov.counter ? 1 : progress;
  const total = reveal >= 1 ? 0 : lines.reduce((n, l) => n + l.reduce((m, r) => m + graphemes(r.text).length, 0), 0);
  const visible = reveal >= 1 ? Infinity : Math.floor(total * reveal + 1e-6);
  const fx = ov.textEffect;
  const by = fx?.by ?? "char";
  const interval = fx?.interval ?? (by === "char" ? 0.04 : by === "word" ? 0.08 : 0.25);
  const duration = fx?.duration ?? (fx?.type === "typewriter" ? 0.001 : 0.45);
  const unitP = (i: number) => clamp01((sec - i * interval) / duration);
  const accent = ov.accent ?? "#f59e0b";
  const runStyle = (r: Run): React.CSSProperties | undefined =>
    r.bold || r.accent || r.color ? { ...(r.bold ? { fontWeight: 800 } : {}), ...(r.accent ? { color: accent } : {}), ...(r.color ? { color: r.color } : {}) } : undefined;
  let gi = 0;
  let unit = 0;

  const renderRun = (r: Run, key: string): React.ReactNode[] => {
    const style = runStyle(r);
    const out: React.ReactNode[] = [];
    if (fx && by !== "line") {
      const units = by === "char" ? graphemes(r.text) : words(r.text);
      units.forEach((u, k) => {
        const n = graphemes(u).length;
        const hidden = gi >= visible;
        gi += n;
        if (!u.trim()) { out.push(<span key={key + k} style={style}>{u}</span>); return; }
        const us = unitStyle(fx.type, unitP(unit++));
        out.push(<span key={key + k} style={{ ...style, display: "inline-block", whiteSpace: "pre", ...us, ...(hidden ? { opacity: 0 } : {}) }}>{u}</span>);
      });
      return out;
    }
    if (visible === Infinity) return [<span key={key} style={style}>{r.text}</span>];
    const g = graphemes(r.text);
    const shown = Math.max(0, Math.min(g.length, visible - gi));
    gi += g.length;
    if (shown > 0) out.push(<span key={key + "v"} style={style}>{g.slice(0, shown).join("")}</span>);
    if (shown < g.length) out.push(<span key={key + "h"} style={{ ...style, opacity: 0 }}>{g.slice(shown).join("")}</span>);
    return out;
  };

  const list = ov.list;
  const rows = lines.map((runs, i) => {
    const lineStart = gi;
    const content = runs.length ? runs.flatMap((r, j) => renderRun(r, i + "-" + j)) : ["​"];
    const lineStyle: React.CSSProperties = fx && by === "line" ? unitStyle(fx.type, unitP(unit++)) : {};
    const markerHidden = lineStart >= visible && runs.length > 0;
    if (!list) return <div lang={ov.typography?"zh-CN":undefined} key={i} style={{ ...lineStyle, whiteSpace: "pre-wrap", wordBreak: ov.typography ? "normal" : "break-word", lineBreak: ov.typography ? "strict" : undefined, textWrap: ov.typography?.balance ? "balance" : undefined }}>{content}</div>;
    const marker = list === "number" ? i + 1 + "." : list === "check" ? "✓" : null;
    return (
      <div key={i} style={{ ...lineStyle, display: "flex", alignItems: "flex-start", gap: "0.5em", textAlign: "left" }}>
        <span style={{ flex: "none", minWidth: list === "number" ? "1.4em" : "0.9em", color: accent, fontWeight: 800, opacity: markerHidden ? 0 : 1, display: "flex", justifyContent: "center" }}>
          {marker ?? <span style={{ display: "inline-block", width: "0.38em", height: "0.38em", marginTop: "calc((" + (ov.lineHeight ?? 1.3) + "em - 0.38em) / 2)", borderRadius: "50%", background: accent }} />}
        </span>
        <span style={{ flex: 1, minWidth: 0, whiteSpace: "pre-wrap", wordBreak: ov.typography ? "normal" : "break-word", lineBreak: ov.typography ? "strict" : undefined, textWrap: ov.typography?.balance ? "balance" : undefined }}>{content}</span>
      </div>
    );
  });
  return <>{rows}</>;
};

// ---------- 形状 ----------
const f2 = (v: number) => Math.round(v * 100) / 100;
const poly = (pts: [number, number][]) => "M" + pts.map((p) => f2(p[0]) + "," + f2(p[1])).join("L") + "Z";
const regular = (n: number, cx: number, cy: number, rx: number, ry: number, startDeg: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = ((startDeg + (360 / n) * i) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  "M" + f2(cx - rx) + "," + f2(cy) + "A" + f2(rx) + "," + f2(ry) + " 0 1 0 " + f2(cx + rx) + "," + f2(cy) + "A" + f2(rx) + "," + f2(ry) + " 0 1 0 " + f2(cx - rx) + "," + f2(cy) + "Z";
const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!r) return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
  return "M" + f2(x + r) + "," + f2(y) + "H" + f2(x + w - r) + "A" + f2(r) + "," + f2(r) + " 0 0 1 " + f2(x + w) + "," + f2(y + r)
    + "V" + f2(y + h - r) + "A" + f2(r) + "," + f2(r) + " 0 0 1 " + f2(x + w - r) + "," + f2(y + h)
    + "H" + f2(x + r) + "A" + f2(r) + "," + f2(r) + " 0 0 1 " + f2(x) + "," + f2(y + h - r)
    + "V" + f2(y + r) + "A" + f2(r) + "," + f2(r) + " 0 0 1 " + f2(x + r) + "," + f2(y) + "Z";
};

/** 闭合形状的路径（盒子内缩半个描边宽，保证描边不出界） */
export function shapePath(spec: ShapeSpec, w: number, h: number, sw: number): { d: string; evenOdd?: boolean } {
  const x0 = sw / 2, y0 = sw / 2, ww = Math.max(1, w - sw), hh = Math.max(1, h - sw);
  const cx = x0 + ww / 2, cy = y0 + hh / 2, x1 = x0 + ww, y1 = y0 + hh;
  switch (spec.type) {
    case "ellipse": return { d: ellipsePath(cx, cy, ww / 2, hh / 2) };
    case "triangle": return { d: poly([[cx, y0], [x1, y1], [x0, y1]]) };
    case "rightTriangle": return { d: poly([[x0, y0], [x1, y1], [x0, y1]]) };
    case "diamond": return { d: poly([[cx, y0], [x1, cy], [cx, y1], [x0, cy]]) };
    case "pentagon": return { d: poly(regular(5, cx, cy + hh * 0.05, ww / 2, hh / 1.9, -90)) };
    case "hexagon": return { d: poly(regular(6, cx, cy, ww / 2, hh / 2, 0)) };
    case "octagon": return { d: poly(regular(8, cx, cy, ww / 2, hh / 2, 22.5)) };
    case "star": {
      const n = spec.points ?? 5, inner = spec.inner ?? 0.45;
      const outer = regular(n, cx, cy + hh * 0.04, ww / 2, hh / 2, -90);
      const inn = regular(n, cx, cy + hh * 0.04, (ww / 2) * inner, (hh / 2) * inner, -90 + 180 / n);
      return { d: poly(outer.flatMap((p, i) => [p, inn[i]])) };
    }
    case "parallelogram": { const s = ww * 0.2; return { d: poly([[x0 + s, y0], [x1, y0], [x1 - s, y1], [x0, y1]]) }; }
    case "trapezoid": { const s = ww * 0.2; return { d: poly([[x0 + s, y0], [x1 - s, y0], [x1, y1], [x0, y1]]) }; }
    case "chevron": {
      const n = Math.min(hh / 2, ww * 0.3);
      return { d: poly([[x0, y0], [x1 - n, y0], [x1, cy], [x1 - n, y1], [x0, y1], [x0 + n, cy]]) };
    }
    case "blockArrow": {
      const sh = hh * 0.5, hl = Math.min(ww * 0.45, hh);
      return { d: poly([[x0, cy - sh / 2], [x1 - hl, cy - sh / 2], [x1 - hl, y0], [x1, cy], [x1 - hl, y1], [x1 - hl, cy + sh / 2], [x0, cy + sh / 2]]) };
    }
    case "plus": {
      const t = Math.min(ww, hh) * 0.34;
      const l = cx - t / 2, r = cx + t / 2, tp = cy - t / 2, b = cy + t / 2;
      return { d: poly([[l, y0], [r, y0], [r, tp], [x1, tp], [x1, b], [r, b], [r, y1], [l, y1], [l, b], [x0, b], [x0, tp], [l, tp]]) };
    }
    case "heart": {
      const P = (px: number, py: number) => f2(x0 + px * ww) + "," + f2(y0 + py * hh);
      return { d: "M" + P(0.5, 0.97) + "C" + P(0.16, 0.72) + " " + P(0, 0.48) + " " + P(0, 0.29) + "C" + P(0, 0.12) + " " + P(0.13, 0) + " " + P(0.28, 0)
        + "C" + P(0.38, 0) + " " + P(0.46, 0.05) + " " + P(0.5, 0.14) + "C" + P(0.54, 0.05) + " " + P(0.62, 0) + " " + P(0.72, 0)
        + "C" + P(0.87, 0) + " " + P(1, 0.12) + " " + P(1, 0.29) + "C" + P(1, 0.48) + " " + P(0.84, 0.72) + " " + P(0.5, 0.97) + "Z" };
    }
    case "callout": {
      const r = Math.min(spec.radius ?? 16, ww / 2, hh * 0.4);
      const yb = y0 + hh * 0.8;
      const A = (ax: number, ay: number) => "A" + f2(r) + "," + f2(r) + " 0 0 1 " + f2(ax) + "," + f2(ay);
      return { d: "M" + f2(x0 + r) + "," + f2(y0) + "H" + f2(x1 - r) + A(x1, y0 + r) + "V" + f2(yb - r) + A(x1 - r, yb)
        + "H" + f2(x0 + ww * 0.36) + "L" + f2(x0 + ww * 0.2) + "," + f2(y1) + "L" + f2(x0 + ww * 0.24) + "," + f2(yb)
        + "H" + f2(x0 + r) + A(x0, yb - r) + "V" + f2(y0 + r) + A(x0 + r, y0) + "Z" };
    }
    case "ring": {
      const k = spec.inner ?? 0.62;
      return { d: ellipsePath(cx, cy, ww / 2, hh / 2) + ellipsePath(cx, cy, (ww / 2) * k, (hh / 2) * k), evenOdd: true };
    }
    case "rect":
    default:
      return { d: roundRect(x0, y0, ww, hh, spec.radius ?? 0) };
  }
}

const isLine = (t: string) => t === "line" || t === "arrow" || t === "doubleArrow";

/** 自由路径（盒子 0–100 坐标）→ 画布像素路径 */
export function freePath(spec: ShapeSpec, w: number, h: number): SubPath[] {
  const sx = w / 100, sy = h / 100;
  const subs = spec.vertices?.length
    ? verticesPath(spec.vertices as Pt[], Boolean(spec.closed), Boolean(spec.smooth))
    : parsePath(spec.path ?? "");
  return mapPath(subs, (p) => [p[0] * sx, p[1] * sy]);
}
/** 形状轮廓（画布像素，变形取样用） */
export function shapeOutline(spec: ShapeSpec, w: number, h: number): SubPath[] {
  if (spec.type === "path") return freePath(spec, w, h);
  if (isLine(spec.type)) return [{ start: [0, h / 2], segs: [{ c1: [w / 3, h / 2], c2: [(w * 2) / 3, h / 2], p: [w, h / 2] }], closed: false }];
  return parsePath(shapePath(spec, w, h, spec.stroke?.width ?? 0).d);
}

const PathShape: React.FC<{ spec: ShapeSpec; w: number; h: number; progress: number; gid: string }> = ({ spec, w, h, progress, gid }) => {
  const subs = freePath(spec, w, h);
  if (!subs.length) return null;
  const drawing = progress < 1;
  const sw = spec.stroke?.width ?? 0;
  const strokePaint = spec.stroke?.color ?? solidOf(spec.fill) ?? "#ffffff";
  const color = typeof strokePaint === "string" ? strokePaint : "url(#" + gid + "-stroke)";
  const fillRef = spec.fill === undefined ? "none" : typeof spec.fill === "string" ? spec.fill : "url(#" + gid + ")";
  // 箭头：只给单条开放路径加，路径末端让出箭头长度
  const lw = Math.max(1, sw || 6);
  const hl = Math.max(lw * 3, 12), hw = Math.max(lw * 2.2, 9);
  const heads: string[] = [];
  let body = subs;
  if (spec.arrow && subs.length === 1 && !subs[0].closed) {
    let s = subs[0];
    if (spec.arrow === "end" || spec.arrow === "both") { const t = trimEnd(s, hl * 0.8); s = t.path; heads.push(headAt(t.tip, t.angle, hl, hw)); }
    if (spec.arrow === "start" || spec.arrow === "both") { const t = trimEnd(reversePath(s), hl * 0.8); s = reversePath(t.path); heads.push(headAt(t.tip, t.angle, hl, hw)); }
    body = [s];
  }
  const d = toPathD(body);
  const headOpacity = drawing ? clamp01((progress - 0.85) / 0.15) : 1;
  return (
    <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {spec.fill !== undefined && typeof spec.fill !== "string" && <defs><Paint fill={spec.fill} id={gid} /></defs>}
      {spec.stroke?.color && typeof spec.stroke.color !== "string" && <defs><Paint fill={spec.stroke.color} id={gid + "-stroke"} /></defs>}
      {spec.fill !== undefined && <path d={d} fill={fillRef} stroke="none" fillOpacity={drawing ? clamp01((progress - 0.55) / 0.45) : undefined} />}
      {(sw > 0 || drawing) && (
        <path d={d} fill="none" stroke={color} strokeWidth={sw > 0 ? sw : 2} strokeLinecap="round" strokeLinejoin="round"
          {...(drawing ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - progress } : { strokeDasharray: dashArray(spec.stroke?.dash, sw) })} />
      )}
      {heads.length > 0 && <path d={heads.join("")} fill={color} opacity={headOpacity} />}
    </svg>
  );
};
const headAt = (tip: Pt, ang: number, len: number, wid: number) => {
  const c = Math.cos(ang), s = Math.sin(ang), bx = tip[0] - c * len, by = tip[1] - s * len;
  return poly([[tip[0], tip[1]], [bx - s * wid, by + c * wid], [bx + s * wid, by - c * wid]]);
};

export const solidOf = (fill: Fill | undefined): string | undefined => (typeof fill === "string" ? fill : fill?.stops[fill.stops.length - 1]?.color);
const dashArray = (dash: string | undefined, sw: number) => (dash === "dashed" ? sw * 3 + " " + sw * 2 : dash === "dotted" ? "0 " + sw * 2 : undefined);

export const ShapeSvg: React.FC<{ spec: ShapeSpec; w: number; h: number; progress: number; uid: string }> = ({ spec, w, h, progress, uid }) => {
  const sw = spec.stroke?.width ?? 0;
  const instance = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gid = "dj-fill-" + uid + instance;
  const fillRef = spec.fill === undefined ? "none" : typeof spec.fill === "string" ? spec.fill : "url(#" + gid + ")";
  const drawing = progress < 1;
  if (spec.type === "path") return <PathShape spec={spec} w={w} h={h} progress={progress} gid={gid} />;
  if (isLine(spec.type)) {
    const lw = Math.max(1, sw || 6);
    const strokePaint = spec.stroke?.color ?? solidOf(spec.fill) ?? "#ffffff";
  const color = typeof strokePaint === "string" ? strokePaint : "url(#" + gid + "-stroke)";
    const cy = h / 2;
    const hl = spec.type === "line" ? 0 : Math.max(lw * 3, 12), hw = Math.max(lw * 2.2, 9);
    const start = spec.type === "doubleArrow" ? hl : 0, end = w - hl;
    const headOpacity = drawing ? clamp01((progress - 0.85) / 0.15) : 1;
    return (
      <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {typeof strokePaint !== "string" && <defs><Paint fill={strokePaint} id={gid + "-stroke"} /></defs>}
        <path d={"M" + f2(start) + "," + f2(cy) + "L" + f2(end) + "," + f2(cy)} stroke={color} strokeWidth={lw} strokeLinecap={spec.type === "line" ? "round" : "butt"} fill="none"
          {...(drawing ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - progress } : { strokeDasharray: dashArray(spec.stroke?.dash, lw) })} />
        {spec.type !== "line" && <path opacity={headOpacity} fill={color} d={poly([[w, cy], [w - hl, cy - hw], [w - hl, cy + hw]])} />}
        {spec.type === "doubleArrow" && <path opacity={headOpacity} fill={color} d={poly([[0, cy], [hl, cy - hw], [hl, cy + hw]])} />}
      </svg>
    );
  }
  const { d, evenOdd } = shapePath(spec, w, h, sw);
  const strokePaint = spec.stroke?.color ?? solidOf(spec.fill) ?? "#ffffff";
  const outlineColor = typeof strokePaint === "string" ? strokePaint : "url(#" + gid + "-stroke)";
  return (
    <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {spec.fill !== undefined && typeof spec.fill !== "string" && <defs><Paint fill={spec.fill} id={gid} /></defs>}
      {spec.stroke?.color && typeof spec.stroke.color !== "string" && <defs><Paint fill={spec.stroke.color} id={gid + "-stroke"} /></defs>}
      <path d={d} fill={fillRef} fillRule={evenOdd ? "evenodd" : undefined} fillOpacity={drawing ? clamp01((progress - 0.55) / 0.45) : undefined}
        stroke={sw > 0 && !drawing ? outlineColor : "none"} strokeWidth={sw || undefined} strokeLinejoin="round" strokeDasharray={!drawing ? dashArray(spec.stroke?.dash, sw) : undefined} />
      {drawing && <path d={d} fill="none" stroke={outlineColor} strokeWidth={Math.max(2, sw)} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />}
    </svg>
  );
};

// ---------- 图片 / 图标 ----------
const ImageBox: React.FC<{ ov: Overlay }> = ({ ov }) => {
  const resolve = React.useContext(AssetResolver);
  const reportError = React.useContext(MediaErrorHandler);
  const spec = ov.image!;
  const radius = spec.radius ?? 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: radius }}>
      <Img src={resolve(spec.src)} onError={reportError ? () => reportError(spec.src) : undefined} style={{ width: "100%", height: "100%", objectFit: spec.fit ?? "cover", objectPosition:spec.focus?`${spec.focus.x*100}% ${spec.focus.y*100}%`:undefined, display: "block" }} />
      {spec.border && spec.border.width > 0 && (
        <div style={{ position: "absolute", inset: 0, borderRadius: radius, border: spec.border.width + "px " + (spec.border.dash ?? "solid") + " " + spec.border.color, boxSizing: "border-box" }} />
      )}
    </div>
  );
};

export const IconSvg: React.FC<{ name: string | undefined; color: string; strokeWidth?: number; fill?: Fill; strokeFill?: Fill; progress: number }> = ({ name, color, strokeWidth, fill, strokeFill, progress }) => {
  const uid="dj-icon-"+React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const def = iconByName(name);
  if (!def) {
    return <div style={{ position: "absolute", inset: 0, border: "2px dashed " + color, borderRadius: 8, opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: 24 }}>?</div>;
  }
  const drawing = progress < 1;
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, overflow: "visible" }}
      fill={typeof fill==="object"?`url(#${uid}-fill)`:fill ?? "none"} stroke={typeof strokeFill==="object"?`url(#${uid}-stroke)`:strokeFill ?? color} strokeWidth={strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
      <defs>{fill&&<Paint fill={fill} id={uid+"-fill"}/ >}{strokeFill&&<Paint fill={strokeFill} id={uid+"-stroke"}/>}</defs>
      {def.node.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs, ...(drawing ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - progress } : {}) }))}
    </svg>
  );
};

import { Ambient } from './AmbientEffects';
// ---------- 元素 ----------
/** 盒子尺寸（画布像素）：形状/图片/图表缺省 h=w（按像素等宽），图标缺省正方形 */
export function elementBoxPx(ov: Overlay, W: number, H: number): { w: number; h: number | undefined } {
  const w = (ov.w ?? (isBoxElement(ov) ? 0.2 : ov.maxWidth ?? 0.9)) * W;
  const h = ov.h !== undefined ? ov.h * H : isBoxElement(ov) ? w : undefined;
  return { w, h };
}

const BoxElement: React.FC<{ ov: Overlay; m: Motion; sec: number; W: number; H: number }> = ({ ov, m, sec, W, H }) => {
  const sampleAnchor=React.useContext(SampleAnchor);
  const { w, h } = elementBoxPx(ov, W, H);
  const boxKind = isBoxElement(ov);
  const appearance = useElementAppearance(ov, w, h ?? ov.fontSize, h === undefined, m.mask, sec);
  const filters = [m.filter, appearance.filter].filter(Boolean).join(" ");
  const hasText = (ov.kind === "shape" || !boxKind) && (ov.text?.trim() || ov.counter);
  const valign = ov.valign ?? "middle";
  const bg = !boxKind ? ov.background : undefined;
  const pad = ov.padding ?? (ov.kind === "shape" ? Math.round(Math.min(w, h ?? w) * 0.08) : bg ? bg.padding ?? 12 : 0);
  const textBlock = hasText ? (
    <div data-djian-text="true" style={{
      position: h !== undefined ? "absolute" : "relative", inset: h !== undefined ? 0 : undefined,
      display: "flex", flexDirection: "column", justifyContent: valign === "top" ? "flex-start" : valign === "bottom" ? "flex-end" : "center",
      padding: pad, boxSizing: "border-box", textAlign: ov.align ?? (boxKind ? "center" : "left"), ...textStyle(ov),
    }}>
      <TextPaint ov={ov}><TextBody ov={ov} progress={m.progress} sec={sec} /></TextPaint>
    </div>
  ) : null;
  return (
    <div ref={appearance.ref} data-el={sampleAnchor ? ov.id : undefined} style={{
      position: "absolute", left: (ov.x ?? 0.5) * W, top: (ov.y ?? 0.5) * H, width: w, height: h ?? "auto",
      transformOrigin: "0 0", transform: (motionTransform(m) + " translate(-50%, -50%)").trim(),
      ...glassStyle(ov.glass), opacity: m.opacity, filter: filters || undefined, clipPath: m.clipPath, mixBlendMode: appearance.mixBlendMode, maskImage: appearance.maskImage, maskSize: "100% 100%", maskRepeat: "no-repeat", backfaceVisibility: m.backfaceVisibility,
    }}>
      {appearance.defs}
      {bg && <div style={{ position: "absolute", inset: 0, background: bg.color, opacity: bg.opacity ?? 0.75, borderRadius: bg.radius ?? 8 }} />}
      {ov.kind === "shape" && !ov.composition && !ov.scene3d && !ov.particles && !ov.audioReactive?.waveform && ov.shape && <ShapeSvg spec={ov.shape!} w={w} h={h ?? w} progress={m.progress} uid={ov.id} />}
      {ov.kind === "image" && ov.image && <ImageBox ov={ov} />}
      {ov.kind === "icon" && <IconSvg name={ov.icon?.name} color={ov.color} strokeWidth={ov.icon?.strokeWidth} fill={ov.icon?.fill} strokeFill={ov.icon?.strokeFill} progress={m.progress} />}
      {ov.kind === "chart" && ov.chart && <ChartSvg ov={ov} spec={ov.chart} w={w} h={h ?? w} progress={m.progress} />}
      {ov.kind === "plot" && ov.plot && <PlotSvg ov={ov} spec={ov.plot} w={w} h={h ?? w} progress={m.progress} sec={sec} unit={Math.min(W, H) / 1080} />}
      {(ov.particles||ov.audioReactive?.waveform)&&<Ambient ov={ov} w={w} h={h??w} seconds={sec}/> }
      {ov.composition&&<CompositionBox document={ov.composition.timeline} seconds={ov.composition.inPoint+sec*ov.composition.speed} width={w} height={h??w}/>}
      {ov.scene3d&&<SceneView scene={ov.scene3d} seconds={sec} width={w} height={h??w}/>}
      {textBlock}
    </div>
  );
};

// ---------- 公式：text 为 LaTeX，按字号自然大小排版，x/y 为中心 ----------
const MathElement: React.FC<{ ov: Overlay; m: Motion; W: number; H: number; sec: number }> = ({ ov, m, W, H, sec }) => {
  const sampleAnchor=React.useContext(SampleAnchor);
  const res = useMath(ov.text);
  const size = res && !isMathError(res) ? mathSize(res, ov.fontSize) : { w: ov.fontSize * 2, h: ov.fontSize };
  const appearance = useElementAppearance(ov, size.w, size.h, false, m.mask, sec);
  const frame: React.CSSProperties = {
    position: "absolute", left: (ov.x ?? 0.5) * W, top: (ov.y ?? 0.5) * H,
    transformOrigin: "0 0", transform: (motionTransform(m) + " translate(-50%, -50%)").trim(),
    ...glassStyle(ov.glass), opacity: m.opacity, filter: [m.filter, appearance.filter].filter(Boolean).join(" ") || undefined, clipPath: m.clipPath, mixBlendMode: appearance.mixBlendMode, maskImage: appearance.maskImage, maskSize: "100% 100%", maskRepeat: "no-repeat", backfaceVisibility: m.backfaceVisibility,
  };
  if (!res) return <div data-el={sampleAnchor ? ov.id : undefined} style={{ ...frame, width: ov.fontSize * 2, height: ov.fontSize }} />;
  if (isMathError(res)) {
    return (
      <div data-el={sampleAnchor ? ov.id : undefined} style={{ ...frame, color: "#f87171", font: Math.max(14, ov.fontSize * 0.4) + "px monospace", border: "2px dashed #f87171", padding: "0.3em 0.6em", borderRadius: 8, background: "rgba(0,0,0,0.6)", whiteSpace: "pre" }}>
        {ov.text + "\n" + res.error}
      </div>
    );
  }
  const { w, h } = mathSize(res, ov.fontSize);
  return (
    <div data-el={sampleAnchor ? ov.id : undefined} style={{ ...frame, width: w, height: h }}>
      {appearance.defs}
      <svg width={w} height={h} viewBox={res.vb.join(" ")} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <MathGlyphs data={res} color={ov.color} progress={m.progress} unitPx={ov.fontSize / 1000} fontFamily={overlayFontFamily(ov.fontFamily)} />
      </svg>
    </div>
  );
};

// 旧版字幕排版：未给 w 的文字按 position（顶部/居中/底部）或 x/y 中心摆放，宽度上限 maxWidth
const LEGACY_POS: Record<string, React.CSSProperties> = {
  top: { top: 60, left: 0, right: 0 },
  center: { top: "50%", left: 0, right: 0, transform: "translateY(-50%)" },
  bottom: { bottom: 80, left: 0, right: 0 },
};
const justify = (align: string) => (align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center");

const LegacyText: React.FC<{ ov: Overlay; m: Motion; sec: number; W: number; H: number }> = ({ ov, m, sec, W, H }) => {
  const sampleAnchor=React.useContext(SampleAnchor);
  const free = ov.x !== undefined || ov.y !== undefined;
  const align = ov.align ?? "center";
  const width = (ov.maxWidth ?? 0.9) * 100;
  const outer: React.CSSProperties = free
    ? { position: "absolute", left: (ov.x ?? 0.5) * W, top: (ov.y ?? 0.85) * H, transform: "translate(-50%, -50%)", width: width + "%", textAlign: align, display: "flex", justifyContent: justify(align) }
    : { position: "absolute", ...LEGACY_POS[ov.position], display: "flex", justifyContent: justify(align), paddingInline: (100 - width) / 2 + "%", textAlign: align };
  const bg = ov.background;
  const pad = bg ? bg.padding ?? 12 : 0;
  const appearance = useElementAppearance(ov, W * (ov.maxWidth ?? 0.9), ov.fontSize, true, m.mask, sec);
  return (
    <div style={outer}>
      <div ref={appearance.ref} data-el={sampleAnchor ? ov.id : undefined} style={{
        position: "relative", display: "inline-block", maxWidth: "100%",
        ...textStyle(ov),
        padding: bg ? pad + "px " + Math.round(pad * 1.4) + "px" : undefined,
        ...glassStyle(ov.glass), opacity: m.opacity, filter: [m.filter, appearance.filter].filter(Boolean).join(" ") || undefined, clipPath: m.clipPath, mixBlendMode: appearance.mixBlendMode, maskImage: appearance.maskImage, maskSize: "100% 100%", maskRepeat: "no-repeat", backfaceVisibility: m.backfaceVisibility,
        transform: motionTransform(m) || undefined,
      }}>
        {appearance.defs}
        {bg && <span aria-hidden style={{ position: "absolute", inset: 0, background: bg.color, opacity: bg.opacity ?? 0.75, borderRadius: bg.radius ?? 8, zIndex: -1 }} />}
        <div data-djian-text="true" style={{ position: "relative" }}><TextPaint ov={ov}><TextBody ov={ov} progress={m.progress} sec={sec} /></TextPaint></div>
      </div>
    </div>
  );
};

export const ElementView: React.FC<{ ov: Overlay }> = ({ ov }) => {
  const { fps, width: W, height: H } = useVideoConfig();
  const sec = useCurrentFrame() / fps;
  if (ov.kind === "camera") return null;
  const anims = resolveAnimations(ov, ov.endSeconds - ov.startSeconds);
  const m = elementMotion(ov, anims, sec, W, H);
  ov = gradientOverlay(ov,sec,anims);
  if (ov.kind === "math") return <MathElement ov={ov} m={m} W={W} H={H} sec={sec} />;
  if (isBoxElement(ov) || ov.w !== undefined) return <BoxElement ov={ov} m={m} sec={sec} W={W} H={H} />;
  return <LegacyText ov={ov} m={m} sec={sec} W={W} H={H} />;
};

function CompositionBox(props:{document:string;seconds:number;width:number;height:number}){const Renderer=React.useContext(CompositionRenderer);return Renderer?<Renderer {...props}/>:null;}
