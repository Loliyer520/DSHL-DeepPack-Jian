// 内置字幕字体库（GB2312 子集 woff2，随包分发，OFL 许可见 fonts/OFL.txt）
// 文件由 webui :5180 /fonts/* 统一伺服——渲染浏览器（Remotion bundle）与面板预览
// （@remotion/player）都从这里拉，不进任何 bundle，浏览器缓存跨渲染复用。

export interface DjianFont {
  id: string; // 时间线 overlay.fontFamily 存这个
  label: string; // 面板/模型可读名
  family: string; // @font-face family（带 Djian 前缀避免与系统字体撞名）
  file: string;
  weights: string; // 变量化字体 "100 900"，单字重 "400"
}

export const FONTS: DjianFont[] = [
  { id: "sans", label: "思源黑体", family: "Djian Noto Sans SC", file: "notosanssc.woff2", weights: "100 900" },
  { id: "serif", label: "思源宋体", family: "Djian Noto Serif SC", file: "notoserifsc.woff2", weights: "100 900" },
  { id: "kuaile", label: "快乐体", family: "Djian ZCOOL KuaiLe", file: "zcoolkuaile.woff2", weights: "400" },
  { id: "qingke", label: "黄油体", family: "Djian ZCOOL QingKe", file: "zcoolqingke.woff2", weights: "400" },
  { id: "mashan", label: "毛笔楷", family: "Djian Ma Shan Zheng", file: "mashanzheng.woff2", weights: "400" },
];

export const fontById = (id: string | undefined): DjianFont | undefined => FONTS.find((f) => f.id === id);

// 系统兜底栈：字体缺字/未设 fontFamily 时回落
export const FALLBACK_STACK = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';

// 字体伺服 base：显式 base 参数（面板按 API_BASE 传）> DJIAN_FONTS_BASE env >
// 浏览器同源相对路径 "/fonts"（渲染 bundle 由 webui 本身伺服，同源即天然连对端口；
// 面板 origin 是 dsh 宿主，不能用它）> Node 兜底 5180。
export const fontsBaseUrl = (base?: string): string => {
  if (base) return base.replace(/\/+$/, "");
  const envBase = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.DJIAN_FONTS_BASE;
  if (envBase) return envBase.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location) return "/fonts"; // 同源相对：渲染 bundle 由 webui 伺服，天然连对端口
  return "http://127.0.0.1:5180/fonts";
};

export function fontFaceCss(base?: string): string {
  const b = fontsBaseUrl(base);
  return FONTS.map(
    (f) =>
      `@font-face{font-family:"${f.family}";src:url("${b}/${f.file}") format("woff2");font-weight:${f.weights};font-display:block;}`,
  ).join("\n");
}

// overlay.fontFamily → CSS font-family 值
export const overlayFontFamily = (id: string | undefined): string => {
  const f = fontById(id);
  return f ? `"${f.family}", ${FALLBACK_STACK}` : FALLBACK_STACK;
};

// 浏览器环境把 @font-face 注入 document（渲染 bundle 与面板预览共用；幂等）
// base 缺省时：渲染 bundle（origin=webui）走同源 "/fonts"；面板应显式传 `${API_BASE}/fonts`
let injectedBase: string | undefined;
let fontStyle: HTMLStyleElement | undefined;
export const injectFontFaceStyle = (base?: string): void => {
  if (typeof document === "undefined") return;
  const resolved = fontsBaseUrl(base);
  if (injectedBase === resolved) return;
  injectedBase = resolved;
  fontStyle ??= document.createElement("style");
  fontStyle.textContent = fontFaceCss(resolved);
  if (!fontStyle.isConnected) document.head.appendChild(fontStyle);
};
