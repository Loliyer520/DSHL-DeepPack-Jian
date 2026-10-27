// 幻灯片模板：一页 = 一组普通元素（形状/文字/图标/图表），生成后每个元素都能单独编辑。
// 纯函数：输入内容 + 画布尺寸 → 元素列表（addOverlay 参数 + delay 秒）。横屏/竖屏自动换排布。
import type { Fill } from "./schema.js";

export interface SlideItem { title?: string; text?: string; value?: number; prefix?: string; suffix?: string; icon?: string; image?: string; label?: string }
export interface SlideInput {
  template: string;
  theme?: string;
  title?: string;
  subtitle?: string;
  kicker?: string; // 小标题/眉题，如「OVERVIEW · 三个关键词」
  items?: SlideItem[];
  background?: boolean; // 缺省 true：铺一层主题背景
  accent?: string; // 覆盖主题强调色
  chart?: string; // chart 模板：column/bar/line/area/pie/donut
  image?: string; // imageText 模板的图片素材
  icon?: string; // bullets/quote 等模板的配图图标
}
export type SlideElement = Record<string, unknown> & { delay: number };

export interface SlideTheme { label: string; bg: Fill; surface: string; border: string; text: string; muted: string; accent: string; accent2: string; onAccent: string; dark: boolean }
export const SLIDE_THEMES: Record<string, SlideTheme> = {
  light: { label: "简洁白", bg: "#ffffff", surface: "#ffffff", border: "#e2e8f0", text: "#0f172a", muted: "#64748b", accent: "#0284c7", accent2: "#06b6d4", onAccent: "#ffffff", dark: false },
  dark: { label: "深空", bg: { type: "linear", angle: 135, stops: [{ offset: 0, color: "#0b1220" }, { offset: 1, color: "#1e293b" }] }, surface: "#162236", border: "#2c3e57", text: "#f1f5f9", muted: "#94a3b8", accent: "#38bdf8", accent2: "#818cf8", onAccent: "#0b1220", dark: true },
  tech: { label: "科技紫", bg: { type: "linear", angle: 135, stops: [{ offset: 0, color: "#0f0c29" }, { offset: 0.5, color: "#302b63" }, { offset: 1, color: "#24243e" }] }, surface: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.16)", text: "#ffffff", muted: "#c4b5fd", accent: "#a78bfa", accent2: "#22d3ee", onAccent: "#ffffff", dark: true },
  warm: { label: "暖橙", bg: "#fffaf3", surface: "#ffffff", border: "#fed7aa", text: "#3b1d0a", muted: "#9a6b4b", accent: "#ea580c", accent2: "#f59e0b", onAccent: "#ffffff", dark: false },
  fresh: { label: "清新绿", bg: "#f6fdf9", surface: "#ffffff", border: "#bbf7d0", text: "#052e1b", muted: "#4b7a62", accent: "#16a34a", accent2: "#0d9488", onAccent: "#ffffff", dark: false },
  bold: { label: "黑红", bg: "#0a0a0a", surface: "#171717", border: "#2a2a2a", text: "#fafafa", muted: "#a3a3a3", accent: "#ef4444", accent2: "#f59e0b", onAccent: "#ffffff", dark: true },
};

export const SLIDE_TEMPLATES: Record<string, { label: string; hint: string }> = {
  cover: { label: "封面", hint: "title 主标题、subtitle 副标题、kicker 眉题" },
  section: { label: "章节页", hint: "kicker 章节号（如 01）、title、subtitle" },
  cards: { label: "卡片", hint: "kicker、title、items 2–4 项 {title, text, icon?, label?}" },
  bullets: { label: "要点列表", hint: "kicker、title、items {title, text?}、icon 配图" },
  stats: { label: "数据", hint: "kicker、title、items 1–4 项 {value, prefix?, suffix?, title, text?}（数字滚动）" },
  quote: { label: "引用", hint: "title 引文、subtitle 出处" },
  compare: { label: "对比", hint: "kicker、title、items 2 项 {title, text（每行一点）}" },
  timeline: { label: "时间线", hint: "kicker、title、items 2–6 项 {title 时间, text 事件}" },
  steps: { label: "流程", hint: "kicker、title、items 2–5 项 {title, text?}" },
  chart: { label: "图表", hint: "kicker、title、chart 图表类型、items {title 标签, value}、subtitle 数据来源" },
  imageText: { label: "图文", hint: "image 素材名、kicker、title、subtitle、items 要点" },
  ending: { label: "结尾", hint: "title（如 谢谢观看）、subtitle" },
};

/** 面板“插入幻灯片”用的示例内容：插入后每段文字都能直接在画布上双击改 */
export const SLIDE_SAMPLES: Record<string, Omit<SlideInput, "template" | "theme">> = {
  cover: { kicker: "PRESENTATION", title: "演示标题", subtitle: "一句话副标题" },
  section: { kicker: "01", title: "章节标题", subtitle: "章节说明" },
  cards: { kicker: "OVERVIEW", title: "三个关键点", items: [{ title: "要点一", text: "简短说明", icon: "sparkles" }, { title: "要点二", text: "简短说明", icon: "zap" }, { title: "要点三", text: "简短说明", icon: "target" }] },
  bullets: { kicker: "FEATURES", title: "核心能力", items: [{ title: "第一点", text: "补充说明" }, { title: "第二点", text: "补充说明" }, { title: "第三点", text: "补充说明" }], icon: "lightbulb" },
  stats: { kicker: "DATA", title: "关键数据", items: [{ value: 1280, suffix: "+", title: "用户" }, { value: 98.5, suffix: "%", title: "满意度" }, { value: 3, suffix: " 秒", title: "响应" }] },
  quote: { title: "在这里写一句引用。", subtitle: "出处" },
  compare: { kicker: "VS", title: "方案对比", items: [{ title: "方案 A", text: "优点一\n优点二\n优点三" }, { title: "方案 B", text: "优点一\n优点二\n优点三" }] },
  timeline: { kicker: "ROADMAP", title: "路线图", items: [{ title: "Q1", text: "里程碑" }, { title: "Q2", text: "里程碑" }, { title: "Q3", text: "里程碑" }, { title: "Q4", text: "里程碑" }] },
  steps: { kicker: "HOW IT WORKS", title: "三步完成", items: [{ title: "第一步", text: "说明" }, { title: "第二步", text: "说明" }, { title: "第三步", text: "说明" }] },
  chart: { kicker: "GROWTH", title: "增长趋势", chart: "column", items: [{ title: "1月", value: 120 }, { title: "2月", value: 260 }, { title: "3月", value: 410 }, { title: "4月", value: 680 }], subtitle: "数据来源：示例" },
  imageText: { kicker: "SHOWCASE", title: "图文页标题", subtitle: "一段说明文字", items: [{ title: "要点一" }, { title: "要点二" }] },
  ending: { title: "谢谢观看", subtitle: "联系方式" },
};

export function buildSlide(input: SlideInput, meta: { width: number; height: number }): SlideElement[] {
  const W = meta.width, H = meta.height;
  const th0 = SLIDE_THEMES[input.theme ?? "light"] ?? SLIDE_THEMES.light;
  const th: SlideTheme = input.accent ? { ...th0, accent: input.accent } : th0;
  const k = Math.min(W, H) / 1080; // 按短边缩放：横竖屏同等清晰度下字号一致
  const px = (v: number) => Math.max(1, Math.round(v * k));
  const portrait = W < H;
  const sq = (w: number) => (w * W) / H; // 宽度比例 w 对应的等像素高度比例
  const items = (input.items ?? []).filter((it) => it && typeof it === "object");
  const out: SlideElement[] = [];
  const add = (delay: number, el: Record<string, unknown>) => { out.push({ ...el, delay }); };
  const box = (x: number, y: number, w: number, h: number) => ({ x: x + w / 2, y: y + h / 2, w, h });
  const text = (delay: number, t: string, b: ReturnType<typeof box>, style: Record<string, unknown>) => {
    if (t) add(delay, { kind: "text", text: t, fontFamily: "sans", color: th.text, align: "left", valign: "top", lineHeight: 1.35, ...b, ...style });
  };
  const L = portrait ? 0.08 : 0.1, R = 1 - L, CW = R - L;

  if (input.background !== false) add(0, { kind: "shape", name: "背景", ...box(0, 0, 1, 1), shape: { type: "rect", fill: th.bg }, effects: [{ preset: "fadeIn" }] });
  const header = (titleSize = 64) => {
    text(0.1, input.kicker ?? "", box(L, portrait ? 0.08 : 0.1, CW, 0.05), { name: "眉题", fontSize: px(26), fontWeight: 700, color: th.accent, letterSpacing: 0.12, effects: [{ preset: "fadeIn" }] });
    text(0.2, input.title ?? "", box(L, portrait ? 0.12 : 0.155, CW, portrait ? 0.12 : 0.12), { name: "标题", fontSize: px(titleSize), fontWeight: 800, effects: [{ preset: "riseUp" }] });
  };
  /** 等分区域：横屏一行排开，竖屏一列排下 */
  const cells = (n: number, top: number, bottom: number, gap = 0.024) => {
    const res: { x: number; y: number; w: number; h: number }[] = [];
    for (let i = 0; i < n; i++) {
      if (portrait) {
        const ch = (bottom - top - gap * (n - 1)) / n;
        res.push({ x: L, y: top + i * (ch + gap), w: CW, h: ch });
      } else {
        const cw = (CW - gap * (n - 1)) / n;
        res.push({ x: L + i * (cw + gap), y: top, w: cw, h: bottom - top });
      }
    }
    return res;
  };
  const t = input.template;

  if (t === "cover" || t === "ending") {
    const center = t === "ending";
    add(0.1, { kind: "shape", name: "装饰圆", ...box(portrait ? 0.45 : 0.66, portrait ? -0.06 : -0.18, portrait ? 0.7 : 0.48, sq(portrait ? 0.7 : 0.48)), opacity: 0.16, shape: { type: "ellipse", fill: { type: "linear", angle: 135, stops: [{ offset: 0, color: th.accent }, { offset: 1, color: th.accent2 }] } }, effects: [{ preset: "zoomIn" }, { preset: "float" }] });
    add(0.2, { kind: "shape", name: "装饰环", ...box(portrait ? -0.12 : -0.05, portrait ? 0.8 : 0.72, portrait ? 0.4 : 0.2, sq(portrait ? 0.4 : 0.2)), opacity: 0.22, shape: { type: "ring", fill: th.accent2, inner: 0.72 }, effects: [{ preset: "fadeIn" }, { preset: "spin" }] });
    if (center) {
      text(0.3, input.title ?? "谢谢观看", box(0.08, 0.36, 0.84, 0.16), { name: "标题", align: "center", valign: "middle", fontSize: px(120), fontWeight: 900, textEffect: { type: "pop", by: "char", interval: 0.06 } });
      add(0.7, { kind: "shape", name: "强调线", ...box(0.44, 0.55, 0.12, 0.004), shape: { type: "line", stroke: { color: th.accent, width: px(6) } }, effects: [{ preset: "drawIn" }] });
      text(0.8, input.subtitle ?? "", box(0.1, 0.6, 0.8, 0.08), { name: "副标题", align: "center", fontSize: px(36), color: th.muted, effects: [{ preset: "riseUp" }] });
    } else {
      add(0.2, { kind: "shape", name: "强调条", ...box(L, 0.34, 0.06, px(8) / H), shape: { type: "rect", fill: th.accent, radius: px(4) }, effects: [{ preset: "stretchIn" }] });
      text(0.3, input.kicker ?? "", box(L, 0.37, CW, 0.05), { name: "眉题", fontSize: px(28), fontWeight: 700, color: th.accent, letterSpacing: 0.1, effects: [{ preset: "fadeIn" }] });
      text(0.4, input.title ?? "", box(L, 0.43, CW * 0.85, 0.2), { name: "标题", fontSize: px(96), fontWeight: 900, lineHeight: 1.15, textEffect: { type: "fadeUp", by: "char", interval: 0.035 } });
      text(0.9, input.subtitle ?? "", box(L, 0.64, CW * 0.75, 0.12), { name: "副标题", fontSize: px(38), color: th.muted, effects: [{ preset: "riseUp" }] });
    }
    return out;
  }

  if (t === "section") {
    text(0.1, input.kicker ?? "01", box(L, 0.24, CW, 0.2), { name: "章节号", fontSize: px(180), fontWeight: 900, color: th.accent, opacity: 0.9, lineHeight: 1, effects: [{ preset: "popIn" }] });
    text(0.35, input.title ?? "", box(L, 0.47, CW, 0.13), { name: "标题", fontSize: px(84), fontWeight: 800, effects: [{ preset: "riseUp" }] });
    text(0.6, input.subtitle ?? "", box(L, 0.61, CW * 0.8, 0.1), { name: "副标题", fontSize: px(36), color: th.muted, effects: [{ preset: "riseUp" }] });
    add(0.8, { kind: "shape", name: "分隔线", ...box(L, 0.75, 0.2, 0.004), shape: { type: "line", stroke: { color: th.accent, width: px(6) } }, effects: [{ preset: "drawIn" }] });
    return out;
  }

  header();
  const top = portrait ? 0.26 : 0.32, bottom = portrait ? 0.94 : 0.88;

  if (t === "cards") {
    const list = items.slice(0, 4);
    cells(Math.max(1, list.length), top, bottom).forEach((c, i) => {
      const it = list[i] ?? {};
      const d = 0.4 + i * 0.15;
      add(d, { kind: "shape", name: "卡片" + (i + 1), ...box(c.x, c.y, c.w, c.h), shape: { type: "rect", fill: th.surface, stroke: { color: th.border, width: px(2) }, radius: px(18) }, ...(th.dark ? {} : { shadow: { color: "rgba(15,23,42,0.08)", blur: px(24), y: px(8) } }), effects: [{ preset: "riseUp" }] });
      add(d + 0.1, { kind: "shape", name: "卡片" + (i + 1) + "顶条", ...box(c.x, c.y, c.w, px(6) / H), shape: { type: "rect", fill: { type: "linear", angle: 0, stops: [{ offset: 0, color: th.accent }, { offset: 1, color: th.accent2 }] } }, effects: [{ preset: "wipeInLeft" }] });
      const pad = 0.022, ix = c.x + pad, iw = c.w - pad * 2;
      const iy = c.y + (portrait ? 0.02 : 0.05);
      if (it.icon) add(d + 0.15, { kind: "icon", name: "卡片" + (i + 1) + "图标", ...box(ix, iy, 0.035, sq(0.035)), icon: { name: it.icon, strokeWidth: 2 }, color: th.accent, effects: [{ preset: "popIn" }] });
      else text(d + 0.15, String(i + 1).padStart(2, "0"), box(ix, iy, iw, 0.05), { name: "卡片" + (i + 1) + "序号", fontSize: px(28), fontWeight: 800, color: th.accent, effects: [{ preset: "fadeIn" }] });
      const ty = iy + (portrait ? 0.045 : 0.075);
      text(d + 0.2, it.title ?? "", box(ix, ty, iw, 0.08), { name: "卡片" + (i + 1) + "标题", fontSize: px(46), fontWeight: 800, effects: [{ preset: "riseUp" }] });
      text(d + 0.3, it.text ?? "", box(ix, ty + (portrait ? 0.04 : 0.09), iw, c.h * 0.4), { name: "卡片" + (i + 1) + "说明", fontSize: px(28), color: th.muted, lineHeight: 1.6, effects: [{ preset: "fadeIn" }] });
      if (it.label) text(d + 0.4, it.label, box(ix, c.y + c.h - (portrait ? 0.04 : 0.07), iw, 0.04), { name: "卡片" + (i + 1) + "标签", fontSize: px(20), color: th.muted, opacity: 0.85, effects: [{ preset: "fadeIn" }] });
    });
    return out;
  }

  if (t === "bullets" || t === "imageText") {
    const lines = items.map((it) => (it.title ? "**" + it.title + "**" + (it.text ? "  " + it.text : "") : it.text ?? "")).filter(Boolean);
    const image = input.image ?? items.find((it) => it.image)?.image;
    if (t === "imageText") {
      const ib = portrait ? box(L, top, CW, 0.3) : box(L, top - 0.02, 0.38, bottom - top + 0.02);
      if (image) add(0.3, { kind: "image", name: "配图", ...ib, image: { src: image, fit: "cover", radius: px(20) }, effects: [{ preset: "wipeInLeft" }] });
      else {
        add(0.3, { kind: "shape", name: "配图占位", ...ib, shape: { type: "rect", fill: th.surface, stroke: { color: th.border, width: px(2), dash: "dashed" }, radius: px(20) }, effects: [{ preset: "fadeIn" }] });
        add(0.4, { kind: "icon", name: "占位图标", x: ib.x, y: ib.y, w: 0.06, h: sq(0.06), icon: { name: "image" }, color: th.muted, effects: [{ preset: "fadeIn" }] });
      }
      const tx = portrait ? L : L + 0.42, tw = portrait ? CW : CW - 0.42, ty = portrait ? top + 0.33 : top;
      text(0.5, input.subtitle ?? "", box(tx, ty, tw, 0.14), { name: "正文", fontSize: px(32), color: th.muted, lineHeight: 1.6, effects: [{ preset: "riseUp" }] });
      if (lines.length) text(0.7, lines.join("\n"), box(tx, ty + 0.16, tw, bottom - ty - 0.16), { name: "要点", fontSize: px(32), list: "check", accent: th.accent, lineHeight: 1.9, textEffect: { type: "fadeUp", by: "line", interval: 0.3 } });
      return out;
    }
    const lw = portrait ? CW : CW * 0.62;
    text(0.4, lines.join("\n"), box(L, top, lw, bottom - top), { name: "要点", fontSize: px(40), list: "bullet", accent: th.accent, lineHeight: 1.9, textEffect: { type: "fadeUp", by: "line", interval: 0.35 } });
    if (!portrait) {
      const cx = L + CW * 0.83, cy = (top + bottom) / 2, d = 0.24;
      add(0.3, { kind: "shape", name: "配图底", x: cx, y: cy, w: d, h: sq(d), opacity: 0.14, shape: { type: "ellipse", fill: th.accent }, effects: [{ preset: "zoomIn" }] });
      add(0.5, { kind: "icon", name: "配图图标", x: cx, y: cy, w: d * 0.45, h: sq(d * 0.45), icon: { name: input.icon ?? "lightbulb", strokeWidth: 1.6 }, color: th.accent, effects: [{ preset: "popIn" }, { preset: "float" }] });
    }
    return out;
  }

  if (t === "stats") {
    const list = items.slice(0, 4);
    cells(Math.max(1, list.length), top + 0.04, bottom, 0.02).forEach((c, i) => {
      const it = list[i] ?? {};
      const d = 0.4 + i * 0.2;
      const v = typeof it.value === "number" ? it.value : 0;
      const decimals = Number.isInteger(v) ? 0 : Math.min(2, String(v).split(".")[1]?.length ?? 1);
      const shown = (it.prefix ?? "") + v + (it.suffix ?? "");
      text(d, shown, box(c.x, c.y + (portrait ? 0 : c.h * 0.12), c.w, portrait ? c.h * 0.5 : c.h * 0.36), { name: "数字" + (i + 1), align: portrait ? "left" : "center", valign: "bottom", fontSize: px(list.length > 3 ? 96 : 120), fontWeight: 900, color: th.accent, lineHeight: 1, counter: { from: 0, to: v, decimals, prefix: it.prefix, suffix: it.suffix, separator: Math.abs(v) >= 10000 }, effects: [{ preset: "countUp" }, { preset: "riseUp" }] });
      text(d + 0.2, it.title ?? "", box(c.x, c.y + (portrait ? c.h * 0.52 : c.h * 0.52), c.w, 0.07), { name: "数字" + (i + 1) + "说明", align: portrait ? "left" : "center", fontSize: px(36), fontWeight: 700, effects: [{ preset: "fadeIn" }] });
      text(d + 0.3, it.text ?? "", box(c.x, c.y + (portrait ? c.h * 0.7 : c.h * 0.66), c.w, 0.14), { name: "数字" + (i + 1) + "注释", align: portrait ? "left" : "center", fontSize: px(24), color: th.muted, lineHeight: 1.6, effects: [{ preset: "fadeIn" }] });
    });
    return out;
  }

  if (t === "quote") {
    out.splice(out.findIndex((e) => e.name === "标题"), 1);
    add(0.2, { kind: "icon", name: "引号", ...box(L, top - 0.04, 0.07, sq(0.07)), icon: { name: input.icon ?? "quote", strokeWidth: 1.5, fill: th.accent }, color: th.accent, effects: [{ preset: "popIn" }] });
    text(0.4, input.title ?? "", box(L, top + 0.1, CW, 0.38), { name: "引文", fontFamily: "serif", fontSize: px(60), fontWeight: 600, lineHeight: 1.5, valign: "middle", textEffect: { type: "fadeIn", by: "char", interval: 0.025, duration: 0.3 } });
    text(1.2, input.subtitle ? "—— " + input.subtitle : "", box(L, top + 0.52, CW, 0.06), { name: "出处", align: "right", fontSize: px(32), color: th.muted, effects: [{ preset: "riseUp" }] });
    return out;
  }

  if (t === "compare") {
    const pair = [items[0] ?? {}, items[1] ?? {}];
    cells(2, top, bottom, 0.06).forEach((c, i) => {
      const it = pair[i], col = i ? th.accent2 : th.accent, d = 0.4 + i * 0.25;
      add(d, { kind: "shape", name: (i ? "右" : "左") + "栏", ...box(c.x, c.y, c.w, c.h), shape: { type: "rect", fill: th.surface, stroke: { color: col, width: px(3) }, radius: px(20) }, effects: [{ preset: i ? "slideInRight" : "slideInLeft" }] });
      text(d + 0.15, it.title ?? "", box(c.x + 0.025, c.y + 0.04, c.w - 0.05, 0.08), { name: (i ? "右" : "左") + "栏标题", fontSize: px(46), fontWeight: 800, color: col, effects: [{ preset: "fadeIn" }] });
      text(d + 0.3, it.text ?? "", box(c.x + 0.025, c.y + 0.14, c.w - 0.05, c.h - 0.18), { name: (i ? "右" : "左") + "栏要点", fontSize: px(30), list: "bullet", accent: col, lineHeight: 1.8, textEffect: { type: "fadeUp", by: "line", interval: 0.25 } });
    });
    const vs = 0.07;
    add(1, { kind: "shape", name: "VS", x: portrait ? 0.5 : 0.5, y: (top + bottom) / 2, w: vs, h: sq(vs), shape: { type: "ellipse", fill: th.accent }, text: "VS", fontSize: px(32), fontWeight: 900, color: th.onAccent, fontFamily: "sans", effects: [{ preset: "popIn" }] });
    return out;
  }

  if (t === "timeline") {
    const list = items.slice(0, 6), n = Math.max(1, list.length);
    if (portrait) {
      const lx = L + 0.06;
      add(0.3, { kind: "shape", name: "时间轴", x: lx, y: (top + bottom) / 2, w: ((bottom - top) * H) / W, h: 0.004, rotate: 90, shape: { type: "line", stroke: { color: th.border, width: px(4) } }, effects: [{ preset: "drawIn" }] });
      list.forEach((it, i) => {
        const y = top + ((bottom - top) * (i + 0.5)) / n, d = 0.5 + i * 0.25;
        add(d, { kind: "shape", name: "节点" + (i + 1), x: lx, y, w: 0.05, h: sq(0.05), shape: { type: "ellipse", fill: th.accent, stroke: { color: th.surface, width: px(6) } }, effects: [{ preset: "popIn" }] });
        text(d + 0.1, it.title ?? "", box(lx + 0.06, y - 0.045, CW - 0.12, 0.04), { name: "节点" + (i + 1) + "时间", fontSize: px(34), fontWeight: 800, color: th.accent, effects: [{ preset: "fadeIn" }] });
        text(d + 0.2, it.text ?? "", box(lx + 0.06, y, CW - 0.12, 0.06), { name: "节点" + (i + 1) + "说明", fontSize: px(26), effects: [{ preset: "fadeIn" }] });
      });
      return out;
    }
    const ly = 0.6;
    add(0.3, { kind: "shape", name: "时间轴", x: 0.5, y: ly, w: CW, h: 0.004, shape: { type: "arrow", stroke: { color: th.border, width: px(4) } }, effects: [{ preset: "drawIn" }] });
    list.forEach((it, i) => {
      const x = L + (CW * (i + 0.5)) / n, cw = (CW / n) * 0.9, d = 0.5 + i * 0.25;
      add(d, { kind: "shape", name: "节点" + (i + 1), x, y: ly, w: 0.022, h: sq(0.022), shape: { type: "ellipse", fill: th.accent, stroke: { color: th.dark ? "#0b1220" : "#ffffff", width: px(5) } }, effects: [{ preset: "popIn" }] });
      text(d + 0.1, it.title ?? "", box(x - cw / 2, ly - 0.13, cw, 0.08), { name: "节点" + (i + 1) + "时间", align: "center", valign: "bottom", fontSize: px(36), fontWeight: 800, color: th.accent, effects: [{ preset: "riseUp" }] });
      text(d + 0.2, it.text ?? "", box(x - cw / 2, ly + 0.05, cw, 0.2), { name: "节点" + (i + 1) + "说明", align: "center", fontSize: px(26), lineHeight: 1.55, effects: [{ preset: "fadeIn" }] });
    });
    return out;
  }

  if (t === "steps") {
    const list = items.slice(0, 5), n = Math.max(1, list.length);
    if (portrait) {
      cells(n, top, bottom, 0.02).forEach((c, i) => {
        const it = list[i] ?? {}, d = 0.4 + i * 0.2;
        add(d, { kind: "shape", name: "步骤" + (i + 1), ...box(c.x, c.y, c.w, c.h), shape: { type: "rect", fill: i % 2 ? th.accent2 : th.accent, radius: px(16) }, text: (i + 1) + "  " + (it.title ?? ""), align: "left", padding: px(28), fontSize: px(36), fontWeight: 800, color: th.onAccent, fontFamily: "sans", effects: [{ preset: "slideInLeft" }] });
      });
      return out;
    }
    const sw = CW / n, sy = 0.5, shH = 0.14;
    list.forEach((it, i) => {
      const d = 0.4 + i * 0.22;
      add(d, { kind: "shape", name: "步骤" + (i + 1), ...box(L + i * sw, sy - shH / 2, sw + 0.012, shH), shape: { type: "chevron", fill: { type: "linear", angle: 0, stops: [{ offset: 0, color: th.accent }, { offset: 1, color: th.accent2 }] } }, opacity: 1 - i * (0.35 / n), text: it.title ?? "", fontSize: px(34), fontWeight: 800, color: th.onAccent, fontFamily: "sans", padding: px(8), effects: [{ preset: "wipeInLeft" }] });
      text(d + 0.15, String(i + 1).padStart(2, "0"), box(L + i * sw, sy - shH / 2 - 0.08, sw, 0.06), { name: "步骤" + (i + 1) + "序号", align: "center", fontSize: px(28), fontWeight: 800, color: th.accent, effects: [{ preset: "fadeIn" }] });
      text(d + 0.25, it.text ?? "", box(L + i * sw + 0.01, sy + shH / 2 + 0.04, sw - 0.02, 0.2), { name: "步骤" + (i + 1) + "说明", align: "center", fontSize: px(26), color: th.muted, lineHeight: 1.55, effects: [{ preset: "fadeIn" }] });
    });
    return out;
  }

  if (t === "chart") {
    const type = ["column", "bar", "line", "area", "pie", "donut"].includes(input.chart ?? "") ? input.chart : "column";
    const data = items.filter((it) => typeof it.value === "number").map((it) => ({ label: it.title ?? it.label ?? "", value: it.value as number }));
    add(0.4, { kind: "chart", name: "图表", ...box(L, top + 0.02, CW, bottom - top - 0.06), text: "", fontSize: px(28), color: th.text, accent: th.accent, chart: { type, data: data.length ? data : [{ label: "A", value: 1 }], colors: [th.accent, th.accent2, ...(th.dark ? ["#f472b6", "#facc15", "#34d399"] : ["#f59e0b", "#ef4444", "#8b5cf6"])] }, effects: [{ preset: "growIn" }] });
    text(0.8, input.subtitle ?? "", box(L, bottom - 0.03, CW, 0.04), { name: "数据来源", fontSize: px(20), color: th.muted, effects: [{ preset: "fadeIn" }] });
    return out;
  }

  return out;
}
