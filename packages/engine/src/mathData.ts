// 公式排版数据（服务端 MathJax 产出，浏览器端渲染/变形使用）。纯类型与纯函数，不依赖 React/Node。
// 坐标：viewBox 单位，1000 = 1em；每个字形片带绝对变换矩阵 m（SVG matrix 顺序 a b c d e f）。

export interface MathPiece {
  /** 匹配键：字形 = Unicode 码位（十六进制），分数线等 = 标签:节点类型，文字 = t:内容 */
  k: string;
  tag: "path" | "rect" | "line" | "polyline" | "polygon" | "ellipse" | "circle" | "text";
  a: Record<string, string | number>;
  m: [number, number, number, number, number, number];
  /** \color 指定的颜色；缺省用元素颜色 */
  c?: string;
}
export interface MathData { vb: [number, number, number, number]; pieces: MathPiece[] }
export type MathResult = MathData | { error: string };

export const isMathError = (r: MathResult | undefined): r is { error: string } => Boolean(r && "error" in r);

/** 去掉模型/用户常带的定界符：$…$、$$…$$、\[…\]、\(…\) */
export function normalizeTex(tex: string): string {
  let s = tex.trim();
  for (const [a, b] of [["$$", "$$"], ["\\[", "\\]"], ["\\(", "\\)"], ["$", "$"]] as const) {
    if (s.length > a.length + b.length && s.startsWith(a) && s.endsWith(b)) { s = s.slice(a.length, -b.length).trim(); break; }
  }
  return s;
}

/** 公式在字号 fontSize 下的像素尺寸 */
export const mathSize = (d: MathData, fontSize: number) => ({ w: (d.vb[2] * fontSize) / 1000, h: (d.vb[3] * fontSize) / 1000 });

/** 书写顺序：按字形左端从左到右（分子分母、上下标交错时更像手写） */
export function writeOrder(d: MathData): number[] {
  return d.pieces.map((p, i) => ({ i, x: p.m[4] + (p.tag === "rect" ? Number(p.a.x ?? 0) * p.m[0] : 0) })).sort((a, b) => a.x - b.x || a.i - b.i).map((o) => o.i);
}
