// 项目级风格卡：存储在 project.json，随每个新对话轮次注入，避免审美约束被长聊天稀释。
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').slice(0, max) : undefined);
const color = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim()) ? v.trim() : undefined);
const number = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined);
const integer = (v, lo, hi) => (Number.isInteger(v) ? Math.max(lo, Math.min(hi, v)) : undefined);

export function sanitizeStylePatch(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for(const key of ['audience','platform','mood','focalPoint','typeHierarchy','motionRules']){const value=text(raw[key],240);if(value!==undefined||raw[key]===null)out[key]=value??null;}
  if(['sparse','balanced','dense'].includes(raw.density)||raw.density===null)out.density=raw.density;
  const brief = text(raw.brief, 240);
  const designStyle = text(raw.designStyle, 60);
  const fontFamily = text(raw.fontFamily, 40);
  if (brief !== undefined || raw.brief === null) out.brief = brief ?? null;
  if (designStyle !== undefined || raw.designStyle === null) out.designStyle = designStyle ?? null;
  if (fontFamily !== undefined || raw.fontFamily === null) out.fontFamily = fontFamily ?? null;
  for (const key of ['background', 'text', 'accent', 'secondary']) {
    const value = color(raw[key]);
    if (value !== undefined || raw[key] === null) out[key] = value ?? null;
  }
  for (const [key, lo, hi] of [['titleSize', 8, 400], ['bodySize', 6, 300], ['margin', 0, 0.3]]) {
    const value = number(raw[key], lo, hi);
    if (value !== undefined || raw[key] === null) out[key] = value ?? null;
  }
  for (const [key, lo, hi] of [['maxColors', 1, 6], ['maxAnimations', 0, 4]]) {
    const value = integer(raw[key], lo, hi);
    if (value !== undefined || raw[key] === null) out[key] = value ?? null;
  }
  if (Array.isArray(raw.rules)) out.rules = raw.rules.map((v) => text(v, 120)).filter(Boolean).slice(0, 8);
  if (raw.rules === null) out.rules = null;
  return out;
}

export function mergeStyle(current, patch) {
  const out = { ...(current && typeof current === 'object' ? current : {}) };
  for (const [key, value] of Object.entries(sanitizeStylePatch(patch))) {
    if (value === null) delete out[key];
    else out[key] = value;
  }
  return out;
}

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function styleText(style) {
  if (!style || typeof style !== 'object' || !Object.keys(style).length) return null;
  const lines = ['<djian-style>', '项目风格卡：这是长期约束，优先于历史聊天里相互冲突的临时风格尝试。'];
  if (style.designStyle || style.brief) lines.push('- 风格：' + [style.designStyle ? esc(style.designStyle) : '', style.brief ? esc(style.brief) : ''].filter(Boolean).join(' — '));
  for(const [key,label] of [['audience','受众'],['platform','发布平台'],['mood','情绪'],['focalPoint','视觉重点'],['typeHierarchy','字体层级'],['motionRules','动效规则'],['density','信息密度']])if(style[key])lines.push('- '+label+'：'+esc(style[key]));
  const palette = [['背景', style.background], ['文字', style.text], ['强调', style.accent], ['辅助', style.secondary]].filter((x) => x[1]).map((x) => x[0] + ' ' + x[1]);
  if (palette.length) lines.push('- 色彩：' + palette.join('；') + (style.maxColors ? '；全页不超过 ' + style.maxColors + ' 种颜色' : ''));
  const type = [style.fontFamily ? '字体 ' + esc(style.fontFamily) : '', style.titleSize ? '标题 ' + style.titleSize + 'px' : '', style.bodySize ? '正文 ' + style.bodySize + 'px' : ''].filter(Boolean);
  if (type.length) lines.push('- 字体：' + type.join('；'));
  if (style.margin !== undefined) lines.push('- 布局：安全边距 ' + Math.round(style.margin * 1000) / 10 + '%；一页一个重点，对齐优先，不擅自新增装饰');
  if (style.maxAnimations !== undefined) lines.push('- 动效：全页不超过 ' + style.maxAnimations + ' 种预设，不为“丰富”而加特效');
  for (const rule of style.rules ?? []) lines.push('- 规则：' + esc(rule));
  lines.push('只修改用户当前要求的范围，已确认的部分不擅自重做；完成后取帧检查溢出、对齐、留白、对比度与视觉层级。', '</djian-style>');
  return lines.join('\n');
}
