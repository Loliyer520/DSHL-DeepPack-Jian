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

export const fontsBaseUrl = (): string => {
  const envBase = typeof process !== "undefined" ? (process.env as { DJIAN_FONTS_BASE?: string }).DJIAN_FONTS_BASE : undefined;
  return envBase || "http://127.0.0.1:5180/fonts";
};

export function fontFaceCss(): string {
  const base = fontsBaseUrl();
  return FONTS.map(
    (f) =>
      `@font-face{font-family:"${f.family}";src:url("${base}/${f.file}") format("woff2");font-weight:${f.weights};font-display:block;}`,
  ).join("\n");
}

// overlay.fontFamily → CSS font-family 值
export const overlayFontFamily = (id: string | undefined): string => {
  const f = fontById(id);
  return f ? `"${f.family}", ${FALLBACK_STACK}` : FALLBACK_STACK;
};

// 浏览器环境把 @font-face 注入 document（渲染 bundle 与面板预览共用；幂等）
let styleInjected = false;
export const injectFontFaceStyle = (): void => {
  if (styleInjected || typeof document === "undefined") return;
  styleInjected = true;
  const style = document.createElement("style");
  style.textContent = fontFaceCss();
  document.head.appendChild(style);
};
