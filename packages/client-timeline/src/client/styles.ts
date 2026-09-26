// 面板样式：全走 dsh 壳的 dsw 令牌，自动跟明暗主题
let injected = false;
export function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.dataset.djianTimeline = '1';
  el.textContent = CSS;
  document.head.appendChild(el);
}

const CSS = `
/* ---- 骨架 ---- */
.djp-root { display: flex; flex-direction: column; gap: 0; padding: 0; height: 100%; overflow: hidden; box-sizing: border-box; color: var(--dsw-alias-label-primary); font-size: 13px; }

/* ---- 项目条（会话=项目，只展示）---- */
.djp-projbar { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; padding: 8px 12px 0; min-height: 30px; }
.djp-proj-icon { color: var(--dsw-alias-brand-primary); font-size: 12px; line-height: 1; }
.djp-proj-name { font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-proj-badge { flex: 0 0 auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-2); border-radius: 999px; padding: 2px 8px; font-variant-numeric: tabular-nums; }
.djp-proj-tag { margin-left: auto; flex: 0 0 auto; font-size: 10px; color: var(--dsw-alias-label-quaternary); }

/* ---- 工具栏 ---- */
.djp-head { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; padding: 6px 12px; }
.djp-title { font-weight: 600; font-size: 14px; margin-right: 2px; }
.djp-meta { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.djp-iconbtn { border: none; background: none; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 15px; padding: 3px 5px; border-radius: 7px; line-height: 1; transition: background .12s, color .12s; }
.djp-iconbtn:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.djp-iconbtn:disabled { opacity: 0.35; cursor: default; }
.djp-btn { border: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-radius: 8px; padding: 4px 10px; font-size: 12px; cursor: pointer; transition: background .12s, border-color .12s; height: 26px; box-sizing: border-box; }
.djp-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.djp-btn:disabled { opacity: 0.5; cursor: default; }
.djp-btn.djp-error { color: var(--dsw-alias-state-error-primary); }
.djp-export { border: none; border-radius: 8px; padding: 5px 14px; font-size: 12px; cursor: pointer; background: var(--dsw-alias-button-info-fill); color: #fff; text-decoration: none; display: inline-flex; align-items: center; height: 26px; box-sizing: border-box; }
.djp-export:disabled { opacity: 0.5; cursor: default; }
.djp-export.djp-error { background: var(--dsw-alias-state-error-primary); }
.djp-add { border: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-radius: 8px; width: 26px; height: 26px; cursor: pointer; font-size: 14px; line-height: 1; }
.djp-add:hover { background: var(--dsw-alias-interactive-bg-hover); }

/* ---- 舞台与空态 ---- */
.djp-stage { background: #000; overflow: hidden; flex: 0 0 auto; border-bottom: 0.5px solid var(--dsw-alias-border-l3); }
.djp-empty { padding: 36px 12px; text-align: center; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-2); flex: 0 0 auto; }

/* ---- 分段式 tab ---- */
.djp-tabs { display: flex; gap: 2px; flex: 0 0 auto; padding: 4px 10px; border-bottom: 0.5px solid var(--dsw-alias-border-l3); }
.djp-tab { border: none; background: none; color: var(--dsw-alias-label-tertiary); font-size: 12px; padding: 5px 11px; cursor: pointer; border-radius: 999px; transition: background .12s, color .12s; }
.djp-tab:hover { color: var(--dsw-alias-label-primary); }
.djp-tab.djp-on { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); font-weight: 600; }
.djp-tabwrap { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; }

/* ---- 内容卡 ---- */
.djp-section { display: flex; flex-direction: column; gap: 8px; }
.djp-section-head { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.djp-card { background: var(--dsw-alias-bg-layer-2); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; gap: 7px; transition: border-color .12s; }
.djp-card:hover { border-color: var(--dsw-alias-border-l4); }
.djp-card-head { display: flex; align-items: center; gap: 7px; min-width: 0; }
.djp-idx { flex: 0 0 auto; font-size: 10px; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-3); border-radius: 999px; padding: 2px 7px; font-variant-numeric: tabular-nums; }
.djp-drag { cursor: grab; color: var(--dsw-alias-label-quaternary); letter-spacing: -2px; user-select: none; }
.djp-card-title { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-del { border: none; background: none; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 6px; }
.djp-del:hover { color: var(--dsw-alias-state-error-primary); }

/* ---- 表单件 ---- */
.djp-fields { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; }
.djp-field { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.djp-field input { width: 56px; height: 26px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; padding: 0 7px; box-sizing: border-box; }
.djp-field input:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.djp-select { border: 0.5px solid var(--dsw-alias-border-l4); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 8px; font-size: 11.5px; height: 26px; padding: 0 6px; cursor: pointer; }
.djp-select:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.djp-color { display: inline-flex; }
.djp-color input { width: 26px; height: 26px; padding: 0; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); cursor: pointer; }
.djp-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); }

/* ---- 字幕卡（堆叠式：文本行 + 参数行）---- */
.djp-sub-card { gap: 6px; }
.djp-sub-text { flex: 1; min-width: 0; height: 28px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; padding: 0 9px; box-sizing: border-box; }
.djp-sub-text:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.djp-overlay-row { display: flex; align-items: center; gap: 6px; }
.djp-overlay-row input[type='text'] { flex: 1; min-width: 0; height: 26px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; padding: 0 8px; box-sizing: border-box; }

/* ---- 多轨轨道条（底部坞）---- */
.djp-tdock { flex: 0 0 auto; border-top: 0.5px solid var(--dsw-alias-border-l3); padding: 8px 10px 5px; display: flex; flex-direction: column; gap: 4px; max-height: 38%; overflow-y: auto; background: var(--dsw-alias-bg-layer-1); }
.djp-tstrip { display: flex; flex-direction: column; gap: 3px; }
.djp-trow { display: flex; align-items: center; gap: 5px; }
.djp-trow-name { flex: 0 0 44px; font-size: 10px; color: var(--dsw-alias-label-tertiary); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-trow-lane { flex: 1; }
.djp-trow-empty { font-size: 11px; color: var(--dsw-alias-label-tertiary); padding: 0 8px; }
.djp-track { position: relative; display: flex; height: 30px; border-radius: 6px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); border: 0.5px solid var(--dsw-alias-border-l3); cursor: pointer; }
.djp-track-block { position: relative; min-width: 24px; border-right: 1px solid var(--dsw-alias-bg-layer-1); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, var(--dsw-alias-bg-layer-3)); box-shadow: inset 2px 0 0 var(--dsw-alias-brand-primary); display: flex; align-items: center; padding: 0 4px 0 7px; overflow: hidden; }
.djp-track-block.djp-fade { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-3)); }
.djp-track-label { font-size: 10.5px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.djp-pip-block { background: color-mix(in srgb, var(--dsw-static-neutral-bluish-400, #7c8cf8) 22%, var(--dsw-alias-bg-layer-3)); border: 0.5px dashed var(--dsw-alias-border-l4); box-shadow: inset 2px 0 0 var(--dsw-static-neutral-bluish-400, #7c8cf8); }
.djp-audio-block { background: color-mix(in srgb, #34c77b 26%, var(--dsw-alias-bg-layer-3)); opacity: 1; box-shadow: inset 2px 0 0 #34c77b; }
.djp-ruler { position: relative; flex: 1; height: 16px; cursor: pointer; background: var(--dsw-alias-bg-layer-2); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 4px; overflow: hidden; }
.djp-tick { position: absolute; top: 0; bottom: 0; border-left: 0.5px solid var(--dsw-alias-border-l3); padding-left: 3px; font-size: 9px; color: var(--dsw-alias-label-tertiary); line-height: 16px; pointer-events: none; white-space: nowrap; }
.djp-playhead { position: absolute; top: 0; bottom: 0; width: 1.5px; background: var(--dsw-alias-state-error-primary); pointer-events: none; z-index: 3; }
.djp-playhead::before { content: ''; position: absolute; top: 0; left: -3.5px; border: 4.5px solid transparent; border-top-color: var(--dsw-alias-state-error-primary); }

/* ---- 轨道交互 ---- */
.djp-handle, .djp-pip-block, .djp-audio-block { touch-action: none; }
.djp-handle { position: absolute; top: 0; bottom: 0; width: 7px; cursor: ew-resize; z-index: 2; }
.djp-handle.djp-hl { left: 0; border-radius: 4px 0 0 4px; }
.djp-handle.djp-hr { right: 0; border-radius: 0 4px 4px 0; }
.djp-handle:hover { background: rgba(255, 255, 255, 0.35); }
.djp-pip-block, .djp-audio-block { cursor: grab; }
.djp-dragging { opacity: 0.85; outline: 1.5px solid var(--dsw-alias-brand-primary); cursor: grabbing !important; z-index: 2; }

/* ---- 弹层（导出参数等）---- */
.djp-pop { position: absolute; top: 32px; right: 0; z-index: 30; display: flex; flex-direction: column; gap: 8px; background: var(--dsw-alias-bg-layer-1); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 12px; padding: 11px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); min-width: 220px; }
.djp-expwrap { position: relative; }
.djp-exppop { top: 32px; }
.djp-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; margin-top: 6px; }

/* ---- 版本历史 ---- */
.djp-hist-list { display: flex; flex-direction: column; gap: 4px; max-height: 260px; overflow: auto; margin-top: 8px; }
.djp-hist-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 9px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 9px; }
.djp-hist-meta { display: flex; gap: 8px; min-width: 0; align-items: center; }
.djp-hist-time { font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; flex: 0 0 auto; }
.djp-hist-label { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---- 对话框 ---- */
.djp-mask { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; }
.djp-dialog { width: 300px; background: var(--dsw-alias-bg-layer-1); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.djp-dialog-title { font-weight: 600; font-size: 13px; }
.djp-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
.djp-preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.djp-preset { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; border: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-radius: 9px; padding: 7px 9px; font-size: 12px; cursor: pointer; }
.djp-preset span { font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.djp-preset.djp-on { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-overlay); }

/* ---- 素材库 ---- */
.djp-assets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.djp-asset { position: relative; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 9px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); }
.djp-asset-thumb { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; background: #000; }
.djp-asset-audio { display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--dsw-alias-label-tertiary); }
.djp-asset-name { font-size: 10px; color: var(--dsw-alias-label-tertiary); padding: 4px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.djp-asset-acts { position: absolute; top: 4px; right: 4px; display: none; gap: 4px; }
.djp-asset:hover .djp-asset-acts { display: flex; }
.djp-asset-acts button { border: none; border-radius: 6px; padding: 3px 7px; font-size: 11px; cursor: pointer; background: rgba(0,0,0,0.62); color: #fff; }

/* ---- 音量滑杆 ---- */
.djp-card-head label.djp-field input[type='range'] { accent-color: var(--dsw-alias-brand-primary); width: 70; }
`;
