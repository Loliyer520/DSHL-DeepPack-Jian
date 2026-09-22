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
.djp-root { display: flex; flex-direction: column; gap: 12px; padding: 12px; height: 100%; overflow-y: auto; box-sizing: border-box; color: var(--dsw-alias-label-primary); font-size: 13px; }
.djp-head { display: flex; align-items: center; gap: 8px; }
.djp-title { font-weight: 600; font-size: 14px; }
.djp-meta { color: var(--dsw-alias-label-tertiary); font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-export { border: none; border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer; background: var(--dsw-alias-button-info-fill); color: #fff; text-decoration: none; display: inline-flex; align-items: center; }
.djp-export:disabled { opacity: 0.5; cursor: default; }
.djp-export.djp-error { background: var(--dsw-alias-state-error-primary); }
.djp-stage { background: #000; border-radius: 10px; overflow: hidden; border: 0.5px solid var(--dsw-alias-border-l3); }
.djp-empty { padding: 32px 12px; text-align: center; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-2); border-radius: 10px; }
.djp-track { position: relative; display: flex; height: 44px; border-radius: 8px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); border: 0.5px solid var(--dsw-alias-border-l3); cursor: pointer; }
.djp-track-block { position: relative; min-width: 24px; border-right: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-3); display: flex; align-items: center; padding: 0 6px; overflow: hidden; }
.djp-track-block.djp-fade { background: var(--dsw-alias-bg-overlay); }
.djp-track-label { font-size: 11px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.djp-playhead { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--dsw-alias-brand-primary); pointer-events: none; }
.djp-playhead::before { content: ''; position: absolute; top: 0; left: -4px; border: 5px solid transparent; border-top-color: var(--dsw-alias-brand-primary); }
.djp-section { display: flex; flex-direction: column; gap: 6px; }
.djp-section-head { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
.djp-add { border: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 14px; line-height: 1; }
.djp-card { background: var(--dsw-alias-bg-layer-2); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
.djp-card-head { display: flex; align-items: center; gap: 6px; }
.djp-drag { cursor: grab; color: var(--dsw-alias-label-tertiary); letter-spacing: -2px; user-select: none; }
.djp-card-title { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-select { border: 0.5px solid var(--dsw-alias-border-l4); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 6px; font-size: 11px; height: 24px; }
.djp-del { border: none; background: none; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 6px; }
.djp-del:hover { color: var(--dsw-alias-state-error-primary); }
.djp-fields { display: flex; gap: 8px; flex-wrap: wrap; }
.djp-field { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.djp-field input { width: 56px; height: 26px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; padding: 0 6px; box-sizing: border-box; }
.djp-field input:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.djp-overlay-row { display: flex; align-items: center; gap: 6px; }
.djp-overlay-row input[type='text'] { flex: 1; min-width: 0; height: 26px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; padding: 0 8px; box-sizing: border-box; }
.djp-range { font-size: 11px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }
.djp-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); }

/* ---- 项目栏 / 通用按钮 ---- */
.djp-projbar { position: relative; display: flex; align-items: center; gap: 6px; }
.djp-proj-label { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.djp-proj-select { flex: 1; min-width: 0; height: 26px; font-size: 12px; }
.djp-btn { border: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-radius: 7px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
.djp-btn:disabled { opacity: 0.5; cursor: default; }
.djp-iconbtn { border: none; background: none; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 15px; padding: 2px 4px; border-radius: 6px; line-height: 1; }
.djp-iconbtn:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.djp-iconbtn:disabled { opacity: 0.35; cursor: default; }

/* ---- 弹层（项目新建 / 导出参数）---- */
.djp-pop { position: absolute; top: 30px; right: 0; z-index: 30; display: flex; flex-direction: column; gap: 8px; background: var(--dsw-alias-bg-layer-1); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 10px; padding: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); min-width: 220px; }
.djp-proj-new input { height: 28px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; padding: 0 8px; }
.djp-proj-new .djp-export { align-self: flex-end; }
.djp-expwrap { position: relative; }
.djp-exppop { top: 30px; }

/* ---- 多轨轨道条 ---- */
.djp-tstrip { display: flex; flex-direction: column; gap: 4px; }
.djp-trow { display: flex; align-items: center; gap: 6px; }
.djp-trow-name { flex: 0 0 56px; font-size: 11px; color: var(--dsw-alias-label-tertiary); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-trow-lane { flex: 1; }
.djp-trow-empty { font-size: 11px; color: var(--dsw-alias-label-tertiary); padding: 0 8px; }
.djp-pip-block { background: var(--dsw-alias-bg-overlay); border: 0.5px dashed var(--dsw-alias-border-l4); }
.djp-audio-block { background: var(--dsw-alias-brand-primary); opacity: 0.75; }
.djp-audio-block .djp-track-label { color: #fff; }

/* ---- 画中画/音频卡 ---- */
.djp-card-head label.djp-field input[type='range'] { accent-color: var(--dsw-alias-brand-primary); }
.djp-btn.djp-error { color: var(--dsw-alias-state-error-primary); }

/* ---- 轨道交互：拖拽/裁剪/版本历史 ---- */
.djp-track-block { position: relative; }
.djp-handle { position: absolute; top: 0; bottom: 0; width: 7px; cursor: ew-resize; z-index: 1; }
.djp-handle.djp-hl { left: 0; border-radius: 4px 0 0 4px; }
.djp-handle.djp-hr { right: 0; border-radius: 0 4px 4px 0; }
.djp-handle:hover { background: rgba(255, 255, 255, 0.35); }
.djp-pip-block, .djp-audio-block { cursor: grab; }
.djp-dragging { opacity: 0.8; outline: 1px solid var(--dsw-alias-brand-primary); cursor: grabbing !important; z-index: 2; }
.djp-hist-list { display: flex; flex-direction: column; gap: 4px; max-height: 260px; overflow: auto; margin-top: 8px; }
.djp-hist-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 8px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 8px; }
.djp-hist-meta { display: flex; gap: 8px; min-width: 0; align-items: center; }
.djp-hist-time { font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; flex: 0 0 auto; }
.djp-hist-label { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; margin-top: 6px; }

/* ---- 画布设置对话框 ---- */
.djp-mask { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; }
.djp-dialog { width: 300px; background: var(--dsw-alias-bg-layer-1); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.djp-dialog-title { font-weight: 600; font-size: 13px; }
.djp-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
.djp-preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.djp-preset { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; border: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-radius: 8px; padding: 7px 9px; font-size: 12px; cursor: pointer; }
.djp-preset span { font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.djp-preset.djp-on { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-overlay); }

/* ---- 素材库 ---- */
.djp-assets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.djp-asset { position: relative; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 8px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); }
.djp-asset-thumb { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; background: #000; }
.djp-asset-audio { display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--dsw-alias-label-tertiary); }
.djp-asset-name { font-size: 10px; color: var(--dsw-alias-label-tertiary); padding: 4px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.djp-asset-acts { position: absolute; top: 4px; right: 4px; display: none; gap: 4px; }
.djp-asset:hover .djp-asset-acts { display: flex; }
.djp-asset-acts button { border: none; border-radius: 6px; padding: 3px 7px; font-size: 11px; cursor: pointer; background: rgba(0,0,0,0.62); color: #fff; }
`;
