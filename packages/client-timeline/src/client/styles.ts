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
`;
