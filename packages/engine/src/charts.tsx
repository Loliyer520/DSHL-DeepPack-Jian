// 图表元素：柱状/条形/折线/面积/饼/环形/进度条/进度环。progress 通道驱动生长动画（逐项错开），数值随之滚动。
import React from "react";
import type { ChartSpec, Overlay } from "./schema";
import { overlayFontFamily } from "./fonts";
import { formatNumber } from "./timeline";

export const CHART_PALETTE = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (v: number) => Math.round(v * 100) / 100;
/** 估算文字宽度（中日韩字符记 1em，其余 0.58em） */
const textWidth = (s: string, fs: number) => [...s].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e80 ? 1 : 0.58), 0) * fs;

const sector = (cx: number, cy: number, r: number, inner: number, a0: number, a1: number) => {
  const rad = (a: number) => ((a - 90) * Math.PI) / 180;
  const p = (rr: number, a: number) => f2(cx + rr * Math.cos(rad(a))) + "," + f2(cy + rr * Math.sin(rad(a)));
  const large = a1 - a0 > 180 ? 1 : 0;
  if (a1 - a0 >= 359.99) {
    const ring = "M" + p(r, 0) + "A" + r + "," + r + " 0 1 1 " + p(r, 180) + "A" + r + "," + r + " 0 1 1 " + p(r, 360) + "Z";
    return inner > 0 ? ring + "M" + p(inner, 0) + "A" + inner + "," + inner + " 0 1 0 " + p(inner, 180) + "A" + inner + "," + inner + " 0 1 0 " + p(inner, 360) + "Z" : ring;
  }
  if (inner <= 0) return "M" + f2(cx) + "," + f2(cy) + "L" + p(r, a0) + "A" + r + "," + r + " 0 " + large + " 1 " + p(r, a1) + "Z";
  return "M" + p(r, a0) + "A" + r + "," + r + " 0 " + large + " 1 " + p(r, a1) + "L" + p(inner, a1) + "A" + inner + "," + inner + " 0 " + large + " 0 " + p(inner, a0) + "Z";
};

export const ChartSvg: React.FC<{ ov: Overlay; spec: ChartSpec; w: number; h: number; progress: number }> = ({ ov, spec, w, h, progress }) => {
  const fs = ov.fontSize;
  const color = ov.color;
  const font = overlayFontFamily(ov.fontFamily);
  const palette = spec.colors?.length ? spec.colors : [ov.accent ?? CHART_PALETTE[0], ...CHART_PALETTE.slice(1)];
  const data = spec.data;
  const n = data.length;
  const colorOf = (i: number) => data[i].color ?? palette[i % palette.length];
  const showValues = spec.showValues ?? true;
  const showLabels = spec.showLabels ?? true;
  const dec = spec.decimals ?? (data.every((d) => Number.isInteger(d.value)) ? 0 : 1);
  const fmt = (v: number) => (spec.prefix ?? "") + formatNumber(v, dec, Math.abs(v) >= 10000) + (spec.unit ?? "");
  const stagger = n > 1 ? 0.35 / n : 0;
  const pi = (i: number) => clamp01((progress - i * stagger) / (1 - (n - 1) * stagger));
  const maxOf = () => spec.max ?? (Math.max(0, ...data.map((d) => d.value)) || 1);
  const T = { fontFamily: font, fill: color, fontSize: fs } as const;
  const svg = (children: React.ReactNode) => (
    <svg width={w} height={h} viewBox={"0 0 " + f2(w) + " " + f2(h)} style={{ position: "absolute", inset: 0, overflow: "visible" }}>{children}</svg>
  );

  switch (spec.type) {
    case "bar": {
      const max = maxOf();
      const lw = showLabels ? Math.min(w * 0.35, Math.max(0, ...data.map((d) => textWidth(d.label ?? "", fs))) + fs * 0.6) : 0;
      const vw = showValues ? textWidth(fmt(max), fs) + fs * 0.6 : 0;
      const pw = Math.max(1, w - lw - vw);
      const slot = h / n, bh = slot * (spec.thickness ?? 0.6);
      return svg(data.map((d, i) => {
        const y = i * slot + (slot - bh) / 2;
        const bw = pw * clamp01(Math.max(0, d.value) / max) * pi(i);
        const r = Math.min(bh / 2, 10);
        return (
          <g key={i}>
            {showLabels && <text {...T} x={lw - fs * 0.5} y={y + bh / 2} textAnchor="end" dominantBaseline="central">{d.label}</text>}
            <path fill={colorOf(i)} d={bw <= 0 ? "" : "M" + f2(lw) + "," + f2(y) + "H" + f2(lw + Math.max(0, bw - r)) + "A" + r + "," + r + " 0 0 1 " + f2(lw + Math.max(bw, r)) + "," + f2(y + r)
              + "V" + f2(y + bh - r) + "A" + r + "," + r + " 0 0 1 " + f2(lw + Math.max(0, bw - r)) + "," + f2(y + bh) + "H" + f2(lw) + "Z"} />
            {showValues && pi(i) > 0 && <text {...T} x={lw + bw + fs * 0.35} y={y + bh / 2} dominantBaseline="central" fontWeight={700}>{fmt(d.value * pi(i))}</text>}
          </g>
        );
      }));
    }
    case "line":
    case "area": {
      const max = maxOf();
      const vh = showValues ? fs * 1.5 : fs * 0.6, lh = showLabels ? fs * 1.6 : 0, padX = fs * 0.9;
      const ph = Math.max(1, h - vh - lh);
      const xs = data.map((_, i) => (n === 1 ? w / 2 : padX + ((w - 2 * padX) * i) / (n - 1)));
      const ys = data.map((d) => vh + ph * (1 - clamp01(d.value / max)));
      const line = xs.map((x, i) => (i ? "L" : "M") + f2(x) + "," + f2(ys[i])).join("");
      const sw = Math.max(3, fs * 0.14) * (spec.thickness ? spec.thickness * 10 : 1);
      const clipId = "dj-chart-clip-" + ov.id;
      const reveal = clamp01(progress) * w;
      const c0 = colorOf(0);
      return svg(<>
        <defs><clipPath id={clipId}><rect x={-sw} y={-sw - fs * 2} width={reveal + sw} height={h + sw * 2 + fs * 2} /></clipPath></defs>
        <line x1={0} x2={w} y1={vh + ph} y2={vh + ph} stroke={color} strokeOpacity={0.25} strokeWidth={2} />
        <g clipPath={"url(#" + clipId + ")"}>
          {spec.type === "area" && <path d={line + "L" + f2(xs[n - 1]) + "," + f2(vh + ph) + "L" + f2(xs[0]) + "," + f2(vh + ph) + "Z"} fill={c0} fillOpacity={0.2} />}
          <path d={line} fill="none" stroke={c0} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
          {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={sw * 1.3} fill={data[i].color ?? c0} stroke={color} strokeOpacity={0.9} strokeWidth={sw * 0.5} />)}
          {showValues && xs.map((x, i) => <text key={"v" + i} {...T} x={x} y={ys[i] - sw * 2.2} textAnchor="middle" fontWeight={700}>{fmt(data[i].value)}</text>)}
        </g>
        {showLabels && xs.map((x, i) => <text key={"l" + i} {...T} x={x} y={h - lh * 0.25} textAnchor="middle" fillOpacity={0.85}>{data[i].label}</text>)}
      </>);
    }
    case "pie":
    case "donut": {
      const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
      const legend = showLabels && w > h * 1.15;
      const r = (Math.min(h, legend ? w * 0.5 : w) / 2) * 0.94;
      const cx = legend ? r / 0.94 : w / 2, cy = h / 2;
      const inner = spec.type === "donut" ? r * (1 - (spec.thickness ?? 0.38)) : 0;
      const sweep = 360 * clamp01(progress);
      let acc = 0;
      const slices = data.map((d, i) => {
        const a0 = (acc / total) * 360;
        acc += Math.max(0, d.value);
        const a1 = (acc / total) * 360;
        return { i, a0, a1, end: Math.min(a1, sweep), frac: Math.max(0, d.value) / total };
      });
      const rowH = fs * 1.6;
      const ly0 = cy - (rowH * n) / 2 + rowH / 2;
      return svg(<>
        {slices.map((s) => s.end > s.a0 && <path key={s.i} d={sector(cx, cy, r, inner, s.a0, s.end)} fill={colorOf(s.i)} fillRule="evenodd" />)}
        {showValues && slices.map((s) => {
          if (s.frac < 0.06 || sweep < s.a1) return null;
          const mid = ((s.a0 + s.a1) / 2 - 90) * (Math.PI / 180), rr = inner ? (r + inner) / 2 : r * 0.62;
          return <text key={"v" + s.i} fontFamily={font} fontSize={fs * 0.8} fontWeight={700} fill="#ffffff" x={cx + rr * Math.cos(mid)} y={cy + rr * Math.sin(mid)} textAnchor="middle" dominantBaseline="central">{Math.round(s.frac * 100)}%</text>;
        })}
        {legend && data.map((d, i) => (
          <g key={"l" + i} opacity={clamp01(progress * 2 - i * 0.15)}>
            <rect x={cx + r + fs * 1.2} y={ly0 + i * rowH - fs * 0.35} width={fs * 0.7} height={fs * 0.7} rx={fs * 0.15} fill={colorOf(i)} />
            <text {...T} x={cx + r + fs * 2.2} y={ly0 + i * rowH} dominantBaseline="central">{d.label}{showValues ? "  " + fmt(d.value) : ""}</text>
          </g>
        ))}
      </>);
    }
    case "progress": {
      const v = data[0].value, max = spec.max ?? 100, ratio = clamp01(v / max) * clamp01(progress);
      const head = (showLabels && data[0].label) || showValues ? fs * 1.6 : 0;
      const th = spec.thickness ? Math.max(2, (h - head) * spec.thickness) : Math.max(6, Math.min(h - head, fs * 0.7));
      const y = head + (h - head - th) / 2;
      return svg(<>
        {showLabels && data[0].label && <text {...T} x={0} y={head * 0.55} dominantBaseline="central">{data[0].label}</text>}
        {showValues && <text {...T} x={w} y={head * 0.55} textAnchor="end" dominantBaseline="central" fontWeight={700}>{fmt(v * clamp01(progress))}</text>}
        <rect x={0} y={y} width={w} height={th} rx={th / 2} fill={spec.trackColor ?? color} fillOpacity={spec.trackColor ? 1 : 0.15} />
        {ratio > 0 && <rect x={0} y={y} width={Math.max(th, w * ratio)} height={th} rx={th / 2} fill={colorOf(0)} />}
      </>);
    }
    case "ring": {
      const v = data[0].value, max = spec.max ?? 100, ratio = clamp01(v / max) * clamp01(progress);
      const s = Math.min(w, h), sw = s * (spec.thickness ?? 0.12), r = s / 2 - sw / 2, cx = w / 2, cy = h / 2;
      return svg(<>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={spec.trackColor ?? color} strokeOpacity={spec.trackColor ? 1 : 0.15} strokeWidth={sw} />
        {ratio > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke={colorOf(0)} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray={ratio + " 1"} transform={"rotate(-90 " + f2(cx) + " " + f2(cy) + ")"} />}
        {showValues && <text {...T} x={cx} y={cy - (showLabels && data[0].label ? fs * 0.35 : 0)} fontSize={fs * 1.25} fontWeight={800} textAnchor="middle" dominantBaseline="central">{fmt(v * clamp01(progress))}</text>}
        {showLabels && data[0].label && <text {...T} x={cx} y={cy + fs * 0.85} fontSize={fs * 0.6} fillOpacity={0.75} textAnchor="middle" dominantBaseline="central">{data[0].label}</text>}
      </>);
    }
    case "column":
    default: {
      const max = maxOf();
      const vh = showValues ? fs * 1.5 : 0, lh = showLabels ? fs * 1.6 : 0;
      const ph = Math.max(1, h - vh - lh);
      const slot = w / n, bw = slot * (spec.thickness ?? 0.6);
      return svg(<>
        <line x1={0} x2={w} y1={vh + ph} y2={vh + ph} stroke={color} strokeOpacity={0.25} strokeWidth={2} />
        {data.map((d, i) => {
          const x = i * slot + (slot - bw) / 2;
          const bh = ph * clamp01(Math.max(0, d.value) / max) * pi(i);
          const y = vh + ph - bh;
          const r = Math.min(bw * 0.14, 12, bh);
          return (
            <g key={i}>
              {bh > 0 && <path fill={colorOf(i)} d={"M" + f2(x) + "," + f2(vh + ph) + "V" + f2(y + r) + "A" + r + "," + r + " 0 0 1 " + f2(x + r) + "," + f2(y) + "H" + f2(x + bw - r) + "A" + r + "," + r + " 0 0 1 " + f2(x + bw) + "," + f2(y + r) + "V" + f2(vh + ph) + "Z"} />}
              {showValues && pi(i) > 0 && <text {...T} x={x + bw / 2} y={y - fs * 0.45} textAnchor="middle" fontWeight={700}>{fmt(d.value * pi(i))}</text>}
              {showLabels && <text {...T} x={x + bw / 2} y={vh + ph + lh * 0.62} textAnchor="middle" dominantBaseline="central" fillOpacity={0.85}>{d.label}</text>}
            </g>
          );
        })}
      </>);
    }
  }
};
