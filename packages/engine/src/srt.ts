// 字幕文件互转（SRT / WebVTT）：纯函数，面板导入导出与服务端下载共用。
import type { Overlay, Timeline } from "./schema.js";

export interface Cue { start: number; end: number; text: string }

const TIME = /(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})/;

const parseTime = (s: string): number | null => {
  const m = TIME.exec(s.trim());
  if (!m) return null;
  const [, h, mm, ss, ms] = m;
  return Number(h ?? 0) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms.padEnd(3, "0")) / 1000;
};

/** 解析 SRT 或 WebVTT；去掉样式标签，保留换行；忽略无效块 */
export function parseSubtitles(input: string): Cue[] {
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const cues: Cue[] = [];
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i === -1) continue;
    const [a, b] = lines[i].split("-->");
    const start = parseTime(a);
    const end = parseTime((b ?? "").trim().split(/\s+/)[0] ?? "");
    if (start === null || end === null || end <= start) continue;
    const body = lines.slice(i + 1).join("\n").replace(/<[^>]+>/g, "").replace(/\{\\[^}]*\}/g, "").trim();
    if (body) cues.push({ start, end, text: body.slice(0, 2000) });
  }
  return cues.sort((x, y) => x.start - y.start);
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const formatTime = (sec: number, sep: "," | ".") => {
  const ms = Math.max(0, Math.round(sec * 1000));
  return pad(Math.floor(ms / 3600000)) + ":" + pad(Math.floor(ms / 60000) % 60) + ":" + pad(Math.floor(ms / 1000) % 60) + sep + pad(ms % 1000, 3);
};

/** 时间线文字 → SRT（默认只导出字幕类；按开始时间排序） */
export function toSrt(overlays: readonly Pick<Overlay, "startSeconds" | "endSeconds" | "text" | "kind">[], { includeTitles = false } = {}): string {
  return overlays
    .filter((o) => o.text.trim() && (includeTitles || o.kind !== "title"))
    .slice()
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((o, i) => (i + 1) + "\n" + formatTime(o.startSeconds, ",") + " --> " + formatTime(o.endSeconds, ",") + "\n" + o.text.trim() + "\n")
    .join("\n");
}

export const toVtt = (overlays: readonly Pick<Overlay, "startSeconds" | "endSeconds" | "text" | "kind">[]) =>
  "WEBVTT\n\n" + toSrt(overlays).replace(/(\d\d:\d\d:\d\d),(\d{3})/g, "$1.$2");

/**
 * 字幕条目 → addOverlay 操作。与已有字幕时间重叠时放到新的字幕层（不覆盖原字幕）。
 * 面板导入与 AI 工具导入共用，保证两边结果一致。
 */
export function cuesToOps(t: Timeline, cues: readonly Cue[], limit = 2000): { ops: Record<string, unknown>[]; track: number; truncated: boolean } {
  const list = cues.slice(0, limit);
  const overlaps = (track: number) => t.overlays.some((o) => (o.track ?? 0) === track && list.some((c) => c.start < o.endSeconds && c.end > o.startSeconds));
  let track = 0;
  while (track < 31 && overlaps(track)) track++;
  const fontSize = Math.round(t.meta.height * 0.06);
  const ops = list.map((c) => ({
    op: "addOverlay", text: c.text, startSeconds: c.start, endSeconds: c.end, kind: "subtitle",
    fontSize, fontFamily: "sans", fontWeight: 600, stroke: { color: "#000000", width: 3 }, ...(track ? { track } : {}),
  }));
  return { ops, track, truncated: cues.length > list.length };
}
