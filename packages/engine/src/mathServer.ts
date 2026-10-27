// 服务端公式排版：加载构建期打好的 MathJax 包（dist/mathjax.cjs），LaTeX → 字形片 JSON，带缓存。
// 引擎服务的 /api/math 与命令行导出的临时静态服务都用它；ops 净化时用 texError 给模型报 LaTeX 错误。
import { createRequire } from "node:module";
import { normalizeTex, type MathData, type MathResult } from "./mathData.js";

const require = createRequire(import.meta.url);
let api: { texToMath(tex: string, display?: boolean): MathData } | null | undefined;
function load() {
  if (api === undefined) {
    try { api = require("./mathjax.cjs"); } catch (e) {
      console.warn("[djian] 公式排版模块加载失败：" + String((e as Error)?.message ?? e).split("\n")[0]);
      api = null;
    }
  }
  return api;
}

const cache = new Map<string, MathResult>();
export function layoutTex(tex: string, display = true): MathResult {
  const src = normalizeTex(tex);
  if (!src) return { error: "公式为空" };
  const key = (display ? "D" : "I") + src;
  const hit = cache.get(key);
  if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
  const mj = load();
  if (!mj) return { error: "公式排版模块不可用，请重新安装整合包" };
  let out: MathResult;
  try { out = mj.texToMath(src, display); }
  catch (e) { out = { error: "LaTeX 错误：" + String((e as Error)?.message ?? e) }; }
  cache.set(key, out);
  if (cache.size > 800) cache.delete(cache.keys().next().value!);
  return out;
}

/** LaTeX 有错时返回错误描述（模块不可用时不报错，交给渲染层显示） */
export function texError(tex: string): string | undefined {
  if (!load()) return undefined;
  const r = layoutTex(tex);
  return "error" in r ? r.error : undefined;
}
