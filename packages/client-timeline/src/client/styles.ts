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
.djp-root *, .djp-root *::before, .djp-root *::after { box-sizing: border-box; }
.djp-root button, .djp-root input, .djp-root select { font-family: inherit; }
.djp-root :focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.djp-root:focus { outline: none; }
/* ---- 骨架 ---- */
.djp-root { display: flex; flex-direction: column; gap: 0; padding: 0; height: 100%; overflow: hidden; box-sizing: border-box; color: var(--dsw-alias-label-primary); font-size: 13px; }

/* ---- 项目条（会话=项目，只展示）---- */
.djp-projbar { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; padding: 8px 12px 0; min-height: 30px; }
.djp-proj-icon { color: var(--dsw-alias-brand-primary); font-size: 12px; line-height: 1; }
.djp-proj-name { font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djp-proj-badge { flex: 0 0 auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-2); border-radius: 999px; padding: 2px 8px; font-variant-numeric: tabular-nums; }
.djp-proj-tag { margin-left: auto; flex: 0 0 auto; font-size: 10px; color: var(--dsw-alias-label-quaternary); }

/* ---- 工具栏 ---- */
.djp-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex: 0 0 auto; padding: 6px 12px; }
.djp-title { font-weight: 600; font-size: 14px; margin-right: 2px; }
.djp-meta { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.djp-iconbtn { display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:28px;height:28px;padding:0;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .16s,color .16s; }
.djp-iconbtn:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.djp-iconbtn:disabled { opacity: 0.35; cursor: default; }
.djp-btn { display:inline-flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0;border:1px solid var(--djp-line);background:var(--djp-surface);color:var(--dsw-alias-label-secondary);border-radius:9px;padding:0 11px;font-size:12px;font-weight:500;cursor:pointer;height:32px;box-shadow:inset 0 1px 0 var(--djp-highlight),0 1px 2px rgb(0 0 0 / 4%);transition:background .16s,border-color .16s,box-shadow .16s,transform .12s; }
.djp-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.djp-btn:disabled { opacity: 0.5; cursor: default; }
.djp-btn.djp-error { color: var(--dsw-alias-state-error-primary); }
.djp-export { display:inline-flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0;height:32px;padding:0 15px;border:1px solid rgb(255 255 255 / 12%);border-radius:9px;background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-button-info-fill) 90%,white),var(--dsw-alias-button-info-fill));color:#fff;font-size:12px;font-weight:600;text-decoration:none;cursor:pointer;box-shadow:inset 0 1px 0 rgb(255 255 255 / 16%),0 2px 6px rgb(0 0 0 / 12%);transition:filter .16s,box-shadow .16s,transform .12s; }
.djp-export:disabled { opacity: 0.5; cursor: default; }
.djp-export.djp-error { background: var(--dsw-alias-state-error-primary); }
.djp-add { display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:32px;height:32px;padding:0;border:1px solid var(--djp-line);border-radius:9px;background:var(--djp-surface);color:var(--dsw-alias-label-secondary);cursor:pointer;box-shadow:inset 0 1px 0 var(--djp-highlight);transition:background .16s,border-color .16s,transform .12s; }
.djp-add:hover { background: var(--dsw-alias-interactive-bg-hover); }

/* ---- 舞台与空态 ---- */
.djp-stage { background: #090b10; overflow: hidden; flex: 0 0 auto; height: clamp(140px, 30vh, 300px); border-bottom: 0.5px solid var(--dsw-alias-border-l3); }
.djp-empty { padding: 36px 12px; text-align: center; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-2); flex: 0 0 auto; }

/* ---- 分段式 tab ---- */
.djp-tabs { display:flex;overflow-x:auto;gap:3px;flex:0 0 auto;margin:10px 12px 0;padding:4px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--djp-line);border-radius:11px;scrollbar-width:none; }
.djp-tab { white-space:nowrap;flex:1 0 auto;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:12px;padding:6px 8px;cursor:pointer;border-radius:7px;transition:background .16s,color .16s,box-shadow .16s; }
.djp-tab:hover { color: var(--dsw-alias-label-primary); }
.djp-tab.djp-on { color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border-color:var(--djp-line);box-shadow:0 1px 3px rgb(0 0 0 / 7%);font-weight:600; }
.djp-tabwrap { flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:14px 12px; }

/* ---- 内容卡 ---- */
.djp-section { display:flex;flex-direction:column;gap:12px; }
.djp-section-head { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.djp-card { position:relative;display:flex;flex-direction:column;gap:12px;padding:14px;background:linear-gradient(145deg,var(--djp-surface),var(--dsw-alias-bg-layer-2));border:1px solid var(--djp-line);border-radius:14px;box-shadow:inset 0 1px 0 var(--djp-highlight),0 3px 10px rgb(0 0 0 / 4%);transition:border-color .18s,box-shadow .18s; }
.djp-card:hover { border-color: var(--dsw-alias-border-l4); }
.djp-card-head { display:flex;align-items:center;gap:7px;min-width:0; }
.djp-idx { display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;min-width:26px;height:24px;padding:0 5px;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-secondary);font-size:10px;font-weight:600;font-variant-numeric:tabular-nums; }
.djp-drag { display:inline-flex;align-items:center;cursor:grab;color:var(--dsw-alias-label-quaternary);user-select:none;margin-left:-4px; }
.djp-card-title { flex:1;min-width:0;font-size:12px;font-weight:550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.djp-del { display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:28px;height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;transition:background .16s,color .16s; }
.djp-del:hover { color: var(--dsw-alias-state-error-primary); }

/* ---- 表单件 ---- */
.djp-fields { display:flex;gap:9px 10px;flex-wrap:wrap;align-items:center; }
.djp-field { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.djp-field input { width:66px;height:30px;border:1px solid var(--djp-input-line);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;font-variant-numeric:tabular-nums;padding:0 9px;box-sizing:border-box;transition:border-color .16s,box-shadow .16s; }
.djp-field input:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.djp-select { appearance:none;border:1px solid var(--djp-input-line);background-color:var(--dsw-alias-bg-layer-1);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='m3 4.5 3 3 3-3' fill='none' stroke='%238892a3' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;color:var(--dsw-alias-label-secondary);border-radius:8px;font-size:11.5px;height:30px;padding:0 27px 0 9px;cursor:pointer;max-width:100%;transition:border-color .16s,box-shadow .16s; }
.djp-select:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.djp-color { display: inline-flex; }
.djp-color input { width: 26px; height: 30px; padding: 0; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); cursor: pointer; }
.djp-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); }

/* ---- 字幕卡（堆叠式：文本行 + 参数行）---- */
.djp-sub-card { gap: 6px; }
.djp-sub-text { flex: 1; min-width: 0; height: 28px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 13px; padding: 0 9px; box-sizing: border-box; }
.djp-sub-text:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.djp-overlay-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.djp-overlay-row input[type='text'] { flex: 1; min-width: 0; height: 30px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; padding: 0 8px; box-sizing: border-box; }

/* ---- 弹层（导出参数等）---- */
.djp-pop { position:absolute;top:38px;right:0;z-index:30;display:flex;flex-direction:column;gap:12px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--djp-line);border-radius:14px;padding:16px;box-shadow:0 12px 36px rgb(0 0 0 / 18%),inset 0 1px 0 var(--djp-highlight);min-width:230px; }
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
.djp-preset { display:flex;flex-direction:column;gap:5px;align-items:flex-start;border:1px solid var(--djp-line);background:var(--djp-surface);color:var(--dsw-alias-label-primary);border-radius:11px;padding:11px 12px;font-size:12px;cursor:pointer;transition:border-color .16s,background .16s; }
.djp-preset span { font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.djp-preset.djp-on { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-overlay); }

/* ---- 素材库 ---- */
.djp-assets { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
.djp-asset { position:relative;border:1px solid var(--djp-line);border-radius:12px;overflow:hidden;background:var(--djp-surface);box-shadow:0 2px 6px rgb(0 0 0 / 4%);transition:border-color .16s,box-shadow .16s; }
.djp-asset-thumb { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; background: #000; }
.djp-asset-audio { display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--dsw-alias-label-tertiary); }
.djp-asset-name { font-size:11px;color:var(--dsw-alias-label-secondary);padding:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.djp-asset-acts { position: absolute; top: 4px; right: 4px; display: flex; gap: 4px; }
.djp-asset:hover .djp-asset-acts, .djp-asset:focus-within .djp-asset-acts { display: flex; }
.djp-asset-acts button { display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:26px;border:1px solid rgb(255 255 255 / 14%);border-radius:7px;padding:3px 7px;font-size:11px;cursor:pointer;background:rgb(12 17 25 / 82%);backdrop-filter:blur(8px);color:#fff; }

/* ---- 音量滑杆 ---- */
.djp-card-head label.djp-field input[type='range'] { accent-color: var(--dsw-alias-brand-primary); width: 70px; }

.djp-save-status { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 12px 8px; font-size: 11px; color: var(--dsw-alias-label-tertiary); flex: none; }
.djp-notice { padding: 8px 12px; color: var(--dsw-alias-state-error-primary); font-size: 12px; flex: none; overflow-wrap: anywhere; }
.djp-dialog { max-width: calc(100vw - 24px); max-height: calc(100vh - 24px); overflow: auto; }

.djp-root { --djp-line:color-mix(in srgb,var(--dsw-alias-border-l3) 65%,transparent);--djp-input-line:color-mix(in srgb,var(--dsw-alias-border-l3) 85%,transparent);--djp-surface:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 94%,var(--dsw-alias-label-primary));--djp-highlight:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);container-type:inline-size;-webkit-font-smoothing:antialiased; }
.djp-icon { display:block;flex-shrink:0; }
.djp-btn:hover:not(:disabled),.djp-add:hover { border-color:var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary);box-shadow:inset 0 1px 0 var(--djp-highlight),0 2px 5px rgb(0 0 0 / 7%); }
.djp-export:hover:not(:disabled) { filter:brightness(1.08);box-shadow:inset 0 1px 0 rgb(255 255 255 / 16%),0 3px 10px rgb(0 0 0 / 16%); }
.djp-btn:active:not(:disabled),.djp-export:active:not(:disabled),.djp-add:active { transform:translateY(1px); }
.djp-del:hover { background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent); }
.djp-card:hover,.djp-asset:hover { border-color:var(--dsw-alias-border-l4); }
.djp-card:focus-within { border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,var(--djp-line));box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,transparent); }
.djp-field input:focus-visible,.djp-select:focus-visible { outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent); }
.djp-projbar { padding-top:12px;gap:8px; }
.djp-proj-icon { display:inline-flex; }
.djp-head { padding-top:10px;padding-bottom:8px; }
.djp-stage { margin:0 12px;border:1px solid var(--djp-line);border-radius:12px; }
.djp-save-status { padding-bottom:10px; }
.djp-save-status > span::before { content:'';display:inline-block;width:5px;height:5px;margin-right:6px;border-radius:50%;background:currentColor;opacity:.6;vertical-align:middle; }

.djp-dialog { padding:20px;border-radius:18px;border:1px solid var(--djp-line);box-shadow:0 24px 64px rgb(0 0 0 / 24%); }
.djp-dialog-title { font-size:15px;margin-bottom:6px; }
.djp-mask { backdrop-filter:blur(4px); }
.djp-exppop { top:38px; }
.djp-root * { scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l4) transparent; }
@container (max-width:360px) { .djp-proj-tag { display:none; } .djp-card { padding:11px; } .djp-tabs { gap:1px; } .djp-tab { padding-inline:6px; } }


/* Flat lists and a single contextual inspector. */
.djp-item-list { display:flex;flex-direction:column;gap:0; }
.djp-item { border-bottom:1px solid var(--djp-line);min-width:0; }
.djp-item-trigger { display:flex;align-items:center;gap:8px;width:100%;min-height:46px;padding:10px 4px;border:0;border-radius:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:left;font-size:12px; }
.djp-item-trigger:hover { background:color-mix(in srgb,var(--dsw-alias-label-primary) 3%,transparent); }
.djp-item-number { color:var(--dsw-alias-label-quaternary);font-variant-numeric:tabular-nums;font-size:10px;flex-shrink:0; }
.djp-item-name { flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500; }
.djp-item-summary { flex-shrink:0;font-size:11px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary); }
.djp-chevron { flex-shrink:0;transition:transform .16s;color:var(--dsw-alias-label-tertiary); }
.djp-item-open > .djp-item-trigger { color:var(--dsw-alias-brand-primary); }
.djp-item-open > .djp-item-trigger .djp-chevron { transform:rotate(90deg); }
.djp-inspector { display:flex;flex-direction:column;gap:14px;padding:4px 4px 16px; }
.djp-inspector-head { display:flex;align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary); }
.djp-inspector-head > span { flex:1; }
.djp-advanced { border-top:1px solid var(--djp-line);padding-top:10px; }
.djp-advanced > summary,.djp-track-settings > summary { cursor:pointer;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:24px; }
.djp-advanced[open] > summary { margin-bottom:10px; }
.djp-audio-group { display:flex;flex-direction:column;gap:0; }
.djp-audio-group > .djp-card-head { padding:6px 4px; }
.djp-section { gap:0; }
.djp-section-head { padding-bottom:10px; }
.djp-btn,.djp-add { background:transparent;box-shadow:none;border-color:var(--djp-line);border-radius:6px; }
.djp-btn:hover:not(:disabled),.djp-add:hover { box-shadow:none;background:var(--dsw-alias-interactive-bg-hover); }
.djp-export { background:var(--dsw-alias-button-info-fill);box-shadow:none;border-color:transparent;border-radius:7px; }
.djp-export:hover:not(:disabled) { box-shadow:none; }
.djp-tabs { background:transparent;border:0;border-bottom:1px solid var(--djp-line);border-radius:0;margin-top:6px;padding:0;gap:8px; }
.djp-tab { border:0;border-bottom:2px solid transparent;border-radius:0;padding:10px 6px; }
.djp-tab.djp-on { background:transparent;box-shadow:none;border-bottom-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary); }

.djp-root { position:relative; }
.djp-drawer-mask { position:absolute;inset:0;z-index:45;background:rgb(0 0 0 / 22%);display:flex;align-items:flex-end; }
.djp-property-drawer { display:flex;flex-direction:column;width:100%;max-height:72%;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-top:1px solid var(--djp-line);border-radius:14px 14px 0 0;box-shadow:0 -12px 32px rgb(0 0 0 / 14%);outline:none; }
.djp-drawer-head { display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 16px 14px;border-bottom:1px solid var(--djp-line);flex:none; }
.djp-drawer-head > div { min-width:0;display:flex;flex-direction:column;gap:5px; }
.djp-drawer-label { font-size:10px;color:var(--dsw-alias-label-tertiary); }
.djp-drawer-head strong { font-size:13px;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis; }
.djp-drawer-body { padding:16px;overflow-y:auto;min-height:0; }
.djp-drawer-footer { display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid var(--djp-line);flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary); }
.djp-item-open > .djp-item-trigger .djp-chevron { transform:none; }
.djp-more { position:relative;flex:none; }
.djp-more > summary { list-style:none; }
.djp-more > summary::-webkit-details-marker { display:none; }
.djp-more-content { position:absolute;right:0;top:34px;z-index:40;min-width:150px;padding:5px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--djp-line);border-radius:8px;box-shadow:0 6px 20px rgb(0 0 0 / 12%);display:flex;flex-direction:column;gap:2px; }
.djp-more-content > .djp-btn { border:0;width:100%;justify-content:flex-start; }
.djp-shortcuts { font-size:10px;color:var(--dsw-alias-label-tertiary); }
.djp-shortcuts > summary { cursor:pointer;line-height:18px; }
/* Focused editing surface, inspired by the supplied mobile editor references. */
.djp-root { color-scheme:dark;background:#131313;color:#ededed;--dsw-alias-label-primary:#ededed;--dsw-alias-label-secondary:#c4c4c4;--dsw-alias-label-tertiary:#909090;--dsw-alias-label-quaternary:#737373;--dsw-alias-bg-layer-1:#191919;--dsw-alias-bg-layer-2:#242424;--dsw-alias-bg-layer-3:#303030;--dsw-alias-border-l3:#353535;--dsw-alias-border-l4:#525252;--dsw-alias-brand-primary:#f0f0f0;--dsw-alias-button-info-fill:#fa2858;--dsw-alias-interactive-bg-hover:#323232;--djp-line:#303030;--djp-surface:#242424;--djp-input-line:#404040; }
.djp-head { flex:none;display:flex;flex-wrap:nowrap;gap:10px;padding:16px 16px 6px;min-height:58px; }
.djp-head .djp-projbar { flex:1;min-width:0;padding:0;min-height:0; }
.djp-proj-name { font-size:12px;font-weight:500;color:#c5c5c5; }
.djp-proj-icon,.djp-proj-badge,.djp-proj-tag { display:none; }
.djp-resolution { display:flex;align-items:center;gap:9px;height:34px;padding:0 12px;border:0;border-radius:7px;background:#292929;color:#efefef;font-size:12px;font-weight:600;cursor:pointer; }
.djp-resolution span { font-size:14px; }
.djp-export { height:34px;padding:0 19px;background:#fa2858;border-radius:7px;font-size:13px; }
.djp-save-status { min-height:22px;padding:0 17px 8px;font-size:9px;color:#717171; }
.djp-save-status > span::before { width:3px;height:3px; }
.djp-stage { flex:1.15 1 0;min-height:140px;max-height:none;height:auto;margin:0;border:0;border-radius:0;background:#101010; }
.djp-empty { flex:1.15 1 0;display:flex;align-items:center;justify-content:center;min-height:140px;background:#101010; }
.djp-transport { display:flex;align-items:center;position:relative;flex:none;height:50px;padding:0 14px;background:#131313; }
.djp-transport-time { font:11px ui-sans-serif,system-ui,sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap; }
.djp-transport-time span { color:#777; }
.djp-play-toggle { position:absolute;left:50%;transform:translateX(-50%);display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;background:transparent;color:#eee;cursor:pointer; }
.djp-play-toggle .djp-icon { width:24px;height:24px; }
.djp-transport-actions { margin-left:auto;display:flex;gap:6px; }
.djp-transport-actions .djp-iconbtn { width:28px;height:32px; }
.djp-transport-actions .djp-icon { width:19px;height:19px; }
.djp-tdock { display:flex;flex-direction:column;flex:1 1 0;min-height:180px;max-height:none;padding:0;border:0;background:#1d1d1d;overflow:hidden; }
.djp-editor-timeline { position:relative;display:flex;flex-direction:column;flex:1;min-height:0; }
.djp-timeline-tools { position:absolute;right:8px;bottom:4px;z-index:9;display:flex;align-items:center;gap:6px;height:28px;padding:0 4px;background:#1d1d1deb;border-radius:4px; }
.djp-timeline-tools .djp-iconbtn { width:24px;height:24px;color:#8a8a8a; }
.djp-timeline-tools .djp-icon { width:13px;height:13px; }
.djp-snap[aria-pressed=true] { color:#dadada; }
.djp-zoom { display:flex;align-items:center;gap:6px;font-size:12px;color:#777; }
.djp-zoom input { width:52px;height:12px;accent-color:#adadad; }
.djp-timeline-viewport { position:relative;flex:1;min-height:0;overflow:hidden; }
.djp-timeline-scroll { width:100%;height:100%;overflow:auto;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:none; }
.djp-timeline-scroll::-webkit-scrollbar { display:none; }
.djp-tstrip { position:relative;box-sizing:border-box;display:flex;flex-direction:column;gap:0;min-height:100%;padding-bottom:48px; }
.djp-trow { position:relative;display:flex;align-items:stretch;flex:none; }
.djp-trow-name { display:none; }
.djp-trow-lane { flex:1;min-width:0; }
.djp-track { position:relative;height:56px;overflow:visible;border:0;border-radius:0;background:transparent; }
.djp-lane-main { margin-top:0; }
.djp-lane-main .djp-track { height:68px; }
.djp-lane-audio .djp-track { height:56px; }
.djp-lane-subs .djp-track { height:44px; }
.djp-track-overview { display:flex;flex-direction:column;flex:none;margin-top:16px; }
.djp-track-summary { position:relative;width:100%;height:10px;padding:0;border:0;background:transparent;cursor:pointer;flex:none; }
.djp-track-summary > span { position:absolute;top:3px;height:3px;border-radius:2px;pointer-events:none;background:var(--djp-summary-color);opacity:.7; }
.djp-track-summary:hover > span,.djp-track-summary:focus-visible > span { opacity:1;height:4px; }
.djp-summary-main { --djp-summary-color:#a4a4a4; }
.djp-summary-audio { --djp-summary-color:#15989e; }
.djp-summary-pip { --djp-summary-color:#a693d2; }
.djp-summary-subs { --djp-summary-color:#d56b50; }
.djp-active-tracks { margin-top:12px;display:flex;flex-direction:column;gap:3px; }
.djp-lane-muted .djp-track { opacity:.35; }
.djp-ruler-row { position:sticky;top:0;z-index:5;margin-inline:0; }
.djp-ruler { position:relative;flex:1;height:32px;overflow:visible;cursor:ew-resize;touch-action:none;background:#1d1d1d; }
.djp-tick { position:absolute;top:0;bottom:0;padding-left:0;font:10px/30px ui-sans-serif,system-ui,sans-serif;color:#808080;white-space:nowrap;pointer-events:none;transform:translateX(-50%); }
.djp-tick::after { content:'·';position:absolute;left:calc(var(--djp-grid-step) / 2);top:0;color:#676767; }
.djp-center-playhead { position:absolute;left:50%;top:38px;bottom:34px;width:2px;border-radius:2px;background:#f6f6f6;box-shadow:0 0 3px #0004;pointer-events:none;z-index:7; }
.djp-timeline-add { position:absolute;right:12px;top:calc(76px + var(--djp-summary-count) * 10px);z-index:8;display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:6px;background:#f3f3f3;color:#292929;box-shadow:0 1px 5px #0005;cursor:pointer; }
.djp-timeline-add .djp-icon { width:23px;height:23px; }
.djp-track-block { position:absolute;top:4px;bottom:4px;display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid #242424;border-radius:2px;background:#323232;cursor:grab;touch-action:none;user-select:none; }
.djp-main-block { border-radius:0; }
.djp-filmstrip { display:flex;flex:1;min-height:0;overflow:hidden;pointer-events:none; }
.djp-filmstrip > span { flex:1;min-width:0;background-size:auto 100%;background-repeat:repeat-x;background-position:center; }
.djp-clip-caption { display:flex;align-items:center;gap:6px;min-width:0;padding:5px 9px;font-size:11px;line-height:16px;pointer-events:none; }
.djp-clip-caption > span:nth-child(2) { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.djp-clip-caption .djp-icon { width:12px;height:12px; }
.djp-clip-caption small { margin-left:auto;font-size:9px; }
.djp-main-block .djp-clip-caption,.djp-pip-block .djp-clip-caption { position:absolute;inset:0 0 auto;z-index:1;background:linear-gradient(#0009,transparent);font-size:9px;color:#fff;opacity:0; }
.djp-main-block:hover .djp-clip-caption,.djp-pip-block:hover .djp-clip-caption,.djp-clip-selected .djp-clip-caption { opacity:1; }
.djp-audio-block { background:#143436;border:0;border-radius:2px;justify-content:flex-end; }
.djp-audio-block .djp-clip-caption { position:absolute;left:0;top:0;padding:1px 6px;font-size:8px;color:#8ab7ba;opacity:0; }
.djp-audio-block:hover .djp-clip-caption,.djp-audio-block.djp-clip-selected .djp-clip-caption { opacity:1; }
.djp-waveform { width:100%;height:100%;color:#15989e;pointer-events:none; }
.djp-wave-baseline { height:1px;background:#15989e;pointer-events:none; }
.djp-subs-block { background:#d56b50;border:0;border-radius:3px;justify-content:center;color:#fff4ec; }
.djp-subs-block .djp-clip-caption > span:first-child { display:grid;place-items:center;width:16px;height:16px;border:1px solid #f9dfcd8c;border-radius:2px;font-size:10px;flex:none; }
.djp-track-block.djp-clip-selected,.djp-track-block.djp-dragging { border-color:#fff;box-shadow:inset 0 0 0 1px #fff;z-index:2; }
.djp-dragging { opacity:.85;cursor:grabbing!important; }
.djp-handle { position:absolute;top:0;bottom:0;width:8px;z-index:3;cursor:ew-resize;touch-action:none; }
.djp-hl { left:0; }.djp-hr { right:0; }
.djp-clip-selected .djp-handle,.djp-handle:hover { background:#f8f8f8; }
.djp-handle::after { content:'';position:absolute;left:3px;top:calc(50% - 6px);width:2px;height:12px;background:#272727;border-radius:2px;opacity:0; }
.djp-clip-selected .djp-handle::after,.djp-handle:hover::after { opacity:1; }
.djp-transition-mark { position:absolute;left:0;bottom:0;width:16px;height:25px;background:linear-gradient(135deg,#ffffff88,transparent 55%);pointer-events:none; }
.djp-trow-empty { display:inline-block;padding:12px 8px;font-size:10px;color:#626262;white-space:nowrap; }
.djp-empty-audio { display:flex;align-items:center;gap:6px;margin:12px 8px;padding:0;border:0;background:transparent;color:#777;font-size:10px;cursor:pointer;white-space:nowrap; }
.djp-empty-audio .djp-icon { width:12px;height:12px; }
.djp-tool-dock { flex:none;display:flex;justify-content:space-around;gap:4px;padding:17px 8px 20px;background:#202020; }
.djp-tool-dock > button { flex:1;display:flex;align-items:center;flex-direction:column;gap:9px;padding:3px 0;border:0;background:transparent;color:#bebebe;font-size:11px;cursor:pointer; }
.djp-tool-dock .djp-icon { width:25px;height:25px;stroke-width:1.4; }
.djp-tool-dock > button:hover,.djp-tool-dock > .djp-tool-active { color:#fff; }
.djp-tool-active::after { content:'';height:2px;width:14px;background:#fb416a;border-radius:1px;margin-top:-5px; }
.djp-collection { position:absolute;inset:auto 0 88px;z-index:30;display:flex;flex-direction:column;max-height:48%;background:#232323;border-top:1px solid #383838;border-radius:12px 12px 0 0;box-shadow:0 -16px 32px #0003; }
.djp-collection[hidden] { display:none; }
.djp-collection-head { display:flex;align-items:center;justify-content:space-between;flex:none;padding:10px 16px 6px; }
.djp-collection-head strong { font-size:12px;font-weight:500; }
.djp-tabwrap { flex:1;min-height:0;overflow:auto;padding:8px 16px 16px; }
.djp-section-head { font-size:11px;color:#969696; }
.djp-property-drawer { background:#232323;border-color:#3a3a3a; }
.djp-drawer-mask { z-index:45; }
@container (max-width:360px) { .djp-head { gap:6px;padding-inline:12px; }.djp-resolution { padding-inline:9px; }.djp-export { padding-inline:13px; }.djp-proj-name { font-size:10px; }.djp-transport-actions { gap:2px; }.djp-tool-dock { padding-block:13px; }.djp-collection { bottom:80px; } }

@media (prefers-reduced-motion: reduce) { .djp-root * { transition: none !important; } }
`;
