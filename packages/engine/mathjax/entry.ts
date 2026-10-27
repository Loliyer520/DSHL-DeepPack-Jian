// MathJax 入口（构建时由 tsdown 连同 mathjax-full 打成 dist/mathjax.js，运行时不需要 mathjax-full 依赖）。
// LaTeX → SVG → 拍平成「字形片」：每片带绝对变换矩阵、颜色与匹配键，供逐笔书写与公式变形使用。
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import "mathjax-full/js/input/tex/base/BaseConfiguration.js";
import "mathjax-full/js/input/tex/ams/AmsConfiguration.js";
import "mathjax-full/js/input/tex/color/ColorConfiguration.js";
import "mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js";
import "mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js";
import "mathjax-full/js/input/tex/cancel/CancelConfiguration.js";
import "mathjax-full/js/input/tex/braket/BraketConfiguration.js";
import type { MathData, MathPiece } from "../src/mathData";

type M = [number, number, number, number, number, number];
const mul = (a: M, b: M): M => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];
const ID: M = [1, 0, 0, 1, 0, 0];
function parseTransform(s: string | null | undefined): M {
  let m = ID;
  if (!s) return m;
  for (const [, fn, args] of s.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    let t: M = ID;
    if (fn === "translate") t = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0];
    else if (fn === "scale") t = [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0];
    else if (fn === "matrix" && v.length === 6) t = v as M;
    else if (fn === "rotate") {
      const r = ((v[0] ?? 0) * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
      t = [c, sn, -sn, c, 0, 0];
      if (v.length === 3) t = mul(mul([1, 0, 0, 1, v[1], v[2]], t), [1, 0, 0, 1, -v[1], -v[2]]);
    }
    m = mul(m, t);
  }
  return m;
}
const r3 = (v: number) => Math.round(v * 1000) / 1000;

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({
  packages: ["base", "ams", "color", "newcommand", "boldsymbol", "cancel", "braket"],
  formatError: (_jax: unknown, err: Error) => { throw err; },
});
const svg = new SVG({ fontCache: "none" });
const doc = mathjax.document("", { InputJax: tex, OutputJax: svg });

type LiteNode = Parameters<typeof adaptor.kind>[0];
const SHAPES = new Set(["path", "rect", "line", "polyline", "polygon", "ellipse", "circle", "text"]);
const KEEP_ATTRS = ["d", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points", "cx", "cy", "r", "rx", "ry", "stroke-width", "font-size", "font-family", "font-weight", "font-style", "data-variant"];

export function texToMath(source: string, display = true): MathData {
  const node = doc.convert(source, { display, em: 16, ex: 8, containerWidth: 1280 }) as LiteNode;
  const root = adaptor.firstChild(node) as LiteNode; // <svg>
  const vb = String(adaptor.getAttribute(root, "viewBox") ?? "0 0 0 0").split(/\s+/).map(Number) as [number, number, number, number];
  const pieces: MathPiece[] = [];
  const walk = (n: LiteNode, m: M, color: string | undefined, key: string | undefined, mml: string | undefined) => {
    const kind = adaptor.kind(n);
    if (kind === "#text" || kind === "#comment") return;
    const attr = (name: string) => adaptor.getAttribute(n, name) as string | null | undefined;
    let local = parseTransform(attr("transform"));
    // 嵌套 <svg>：只取其 x/y 偏移
    if (kind === "svg" && n !== root) local = mul([1, 0, 0, 1, Number(attr("x") ?? 0), Number(attr("y") ?? 0)], local);
    const mm = n === root ? ID : mul(m, local);
    const fill = attr("fill");
    const c = fill && fill !== "currentColor" && fill !== "none" ? fill : color;
    const k = attr("data-c") ?? key;
    const node = attr("data-mml-node") ?? mml;
    if (SHAPES.has(kind)) {
      const a: Record<string, string | number> = {};
      for (const name of KEEP_ATTRS) {
        const v = attr(name);
        if (v !== null && v !== undefined && v !== "") a[name] = /^-?[\d.]+$/.test(String(v)) ? Number(v) : String(v);
      }
      const stroke = attr("stroke");
      if (stroke && stroke !== "currentColor" && stroke !== "none") a.stroke = stroke;
      if (kind === "line" || kind === "polyline" || attr("fill") === "none") a.fill = "none";
      const text = kind === "text" ? String(adaptor.textContent(n) ?? "") : undefined;
      if (text !== undefined) a.text = text;
      pieces.push({
        k: kind === "text" ? "t:" + text : kind === "path" ? (k ?? "path") : kind + ":" + (node ?? ""),
        tag: kind as MathPiece["tag"],
        a,
        m: mm.map(r3) as M,
        ...(c ? { c } : {}),
      });
      return;
    }
    for (const child of adaptor.childNodes(n) as LiteNode[]) walk(child, mm, c, k, node);
  };
  walk(root, ID, undefined, undefined, undefined);
  return { vb, pieces };
}
