// 公式渲染（预览与导出共用）：从引擎 /api/math 取排版好的字形片并缓存；progress 驱动逐笔书写（先描边后填色）。
import React from "react";
import { continueRender, delayRender } from "remotion";
import { MathBase } from "./renderContext";
import { isMathError, normalizeTex, writeOrder, type MathData, type MathPiece, type MathResult } from "./mathData";
export { mathSize } from "./mathData";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------- 取数与缓存（同一公式全局只请求一次） ----------
const cache = new Map<string, MathResult>();
const pending = new Map<string, Promise<MathResult>>();
const OFFLINE = "公式排版服务暂时不可用";
const cacheKey = (base: string, src: string) => base + "\n" + src;

export function loadMath(base: string, tex: string): Promise<MathResult> {
  const src = normalizeTex(tex);
  const key = cacheKey(base, src);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(key);
  if (!p) {
    p = fetch(base + "?tex=" + encodeURIComponent(src))
      .then((r) => r.json() as Promise<MathResult>)
      .then((j): MathResult => (j && (Array.isArray((j as MathData).pieces) || typeof (j as { error?: unknown }).error === "string") ? j : { error: "公式排版结果无效" }))
      .catch((): MathResult => ({ error: OFFLINE }))
      .then((r) => {
        pending.delete(key);
        if (!(isMathError(r) && r.error === OFFLINE)) cache.set(key, r); // 服务没起来不缓存，下次再试
        return r;
      });
    pending.set(key, p);
  }
  return p;
}
export const peekMath = (base: string | undefined, tex: string | undefined): MathResult | undefined =>
  base && tex ? cache.get(cacheKey(base, normalizeTex(tex))) : undefined;

/** 预取（面板载入时间线后调用，播放到公式时不再等网络） */
export function prefetchMath(base: string, texts: Iterable<string>) {
  for (const t of texts) if (normalizeTex(t)) void loadMath(base, t);
}

/** 取公式排版；导出渲染时用 delayRender 等它就绪 */
export function useMath(tex: string | undefined): MathResult | undefined {
  const base = React.useContext(MathBase);
  const src = tex ? normalizeTex(tex) : "";
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const hit = base && src ? cache.get(cacheKey(base, src)) : undefined;
  // 首帧就挂起渲染（effect 之前），避免导出截到空白公式
  const first = React.useRef<number | null>(null);
  if (first.current === null) first.current = base && src && !hit ? delayRender("djian-math " + src.slice(0, 40)) : -1;
  React.useEffect(() => {
    const initial = first.current ?? -1;
    first.current = -1;
    if (!base || !src || hit) { if (initial >= 0) continueRender(initial); return; }
    const handle = initial >= 0 ? initial : delayRender("djian-math " + src.slice(0, 40));
    let alive = true;
    void loadMath(base, src).then(() => { if (alive) bump(); }).finally(() => continueRender(handle));
    return () => { alive = false; };
  }, [base, src, hit]);
  return hit;
}

// ---------- 字形片 ----------
const matrix = (m: readonly number[]) => "matrix(" + m.join(",") + ")";
const pieceScale = (m: readonly number[]) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;

/**
 * 画一个字形片。q：书写进度（1 = 完成）；unitPx：每个 viewBox 单位对应的像素（描边粗细换算用）。
 * m 可覆盖片自身的矩阵（变形插值时用）。
 */
export function renderPiece(p: MathPiece, key: React.Key, color: string, q: number, unitPx: number, fontFamily: string | undefined, m: readonly number[] = p.m, opacity = 1): React.ReactNode {
  if (opacity <= 0.001) return null;
  const fill = p.c ?? color;
  const tf = matrix(m);
  const op = opacity < 1 ? opacity : undefined;
  const writing = q < 1;
  const sw = 1.6 / (unitPx * pieceScale(m)); // 书写描边约 1.6px
  switch (p.tag) {
    case "path": {
      if (!writing) return <path key={key} d={String(p.a.d)} transform={tf} fill={fill} opacity={op} />;
      if (q <= 0) return null;
      return (
        <g key={key} transform={tf} opacity={op}>
          <path d={String(p.a.d)} fill={fill} fillOpacity={clamp01((q - 0.45) / 0.55)} />
          <path d={String(p.a.d)} fill="none" stroke={fill} strokeWidth={sw} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(q / 0.6)} strokeLinejoin="round" />
        </g>
      );
    }
    case "rect": {
      const grow = writing ? clamp01(q / 0.7) : 1;
      if (grow <= 0) return null;
      return <rect key={key} transform={tf} x={Number(p.a.x ?? 0)} y={Number(p.a.y ?? 0)} width={Number(p.a.width ?? 0) * grow} height={Number(p.a.height ?? 0)} fill={p.a.fill === "none" ? "none" : fill} stroke={p.a.stroke ? fill : undefined} strokeWidth={p.a["stroke-width"]} opacity={op} />;
    }
    case "text": {
      const o = (writing ? clamp01(q) : 1) * opacity;
      if (o <= 0) return null;
      return <text key={key} transform={tf} fontSize={p.a["font-size"]} fontFamily={fontFamily ?? String(p.a["font-family"] ?? "serif")} fontWeight={p.a["font-weight"]} fontStyle={p.a["font-style"]} fill={fill} opacity={o < 1 ? o : undefined}>{String(p.a.text ?? "")}</text>;
    }
    default: {
      // 线、多边形（\cancel、\boxed 等）：属性原样带上，颜色统一换成片的颜色
      const attrs: Record<string, unknown> = { stroke: fill, fill: p.a.fill === "none" ? "none" : fill };
      for (const [k, v] of Object.entries(p.a)) if (k !== "fill" && k !== "stroke" && !k.startsWith("data-")) attrs[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
      if (writing) Object.assign(attrs, { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(q) });
      return React.createElement(p.tag, { key, transform: tf, opacity: op, ...attrs });
    }
  }
}

/** 整条公式的字形（viewBox 坐标系里），progress < 1 时按从左到右顺序逐个书写 */
export const MathGlyphs: React.FC<{ data: MathData; color: string; progress: number; unitPx: number; fontFamily?: string }> = ({ data, color, progress, unitPx, fontFamily }) => {
  const order = React.useMemo(() => writeOrder(data), [data]);
  const n = data.pieces.length;
  const rank = React.useMemo(() => { const r = new Array<number>(n); order.forEach((pi, k) => { r[pi] = k; }); return r; }, [order, n]);
  // 每个字形占总时长的 40%，开始时刻在前 60% 里依次错开
  const lag = n > 1 ? 0.6 / (n - 1) : 0, run = n > 1 ? 0.4 : 1;
  return <>{data.pieces.map((p, i) => renderPiece(p, i, color, progress >= 1 ? 1 : clamp01((progress - rank[i] * lag) / run), unitPx, fontFamily))}</>;
};

/** 嵌进别的 SVG 的公式（坐标系标注用）：(x, y) 为锚点像素位置，size 为字号像素 */
export const MathLabel: React.FC<{ tex: string; x: number; y: number; size: number; color: string; anchor?: "start" | "middle" | "end"; baseline?: "top" | "middle" | "bottom"; opacity?: number; progress?: number }> = ({ tex, x, y, size, color, anchor = "start", baseline = "middle", opacity = 1, progress = 1 }) => {
  const res = useMath(tex);
  if (!res || isMathError(res) || opacity <= 0) return null;
  const k = size / 1000;
  const [vx, vy, vw, vh] = res.vb;
  const ax = anchor === "start" ? 0 : anchor === "middle" ? vw / 2 : vw;
  const ay = baseline === "top" ? 0 : baseline === "middle" ? vh / 2 : vh;
  return (
    <g transform={"translate(" + x + "," + y + ") scale(" + k + ") translate(" + (-vx - ax) + "," + (-vy - ay) + ")"} opacity={opacity < 1 ? opacity : undefined}>
      <MathGlyphs data={res} color={color} progress={progress} unitPx={k} />
    </g>
  );
};

/** 标注文字是不是整段公式（$…$） */
export const labelTex = (label: string): string | undefined => {
  const s = label.trim();
  return s.length > 2 && s.startsWith("$") && s.endsWith("$") && !s.slice(1, -1).includes("$") ? s.slice(1, -1) : undefined;
};
