// 资源库面板样式：dsw 设计令牌，扁平紧凑（与剪辑面板同一语言）
const CSS = `
.djl-root { display: flex; flex-direction: column; gap: 0; padding: 0; height: 100%; overflow: hidden; box-sizing: border-box; color: var(--dsw-alias-label-primary); font-size: 13px; }
.djl-head { display: flex; gap: 6px; padding: 8px 10px; flex: 0 0 auto; }
.djl-input { flex: 1; min-width: 0; height: 28px; padding: 0 8px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 4px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-size: 12px; outline: none; }
.djl-input:focus { border-color: var(--dsw-alias-border-l1); }
.djl-tabs { display: flex; gap: 2px; align-items: center; padding: 0 10px 6px; border-bottom: 0.5px solid var(--dsw-alias-border-l3); flex: 0 0 auto; }
.djl-tab { height: 24px; padding: 0 10px; border: none; background: transparent; color: var(--dsw-alias-label-tertiary); font-size: 12px; cursor: pointer; border-radius: 4px; }
.djl-tab.djl-active { background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); }
.djl-total { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.djl-btn { height: 28px; padding: 0 10px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 4px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-size: 12px; cursor: pointer; }
.djl-btn:disabled { opacity: 0.5; cursor: default; }
.djl-primary { background: var(--dsw-alias-bg-layer-3); }
.djl-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px 10px; align-content: start; }
.djl-grid.djl-list { grid-template-columns: 1fr; }
.djl-card { display: flex; flex-direction: column; gap: 4px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 4px; background: var(--dsw-alias-bg-layer-2); padding: 6px; overflow: hidden; }
.djl-thumb { aspect-ratio: 4/3; background: #000; border-radius: 3px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.djl-thumb img { width: 100%; height: 100%; object-fit: cover; }
.djl-audio { display: flex; flex-direction: column; gap: 4px; }
.djl-audio audio { width: 100%; height: 28px; }
.djl-dur { font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.djl-meta { display: flex; align-items: center; gap: 6px; min-width: 0; }
.djl-title { flex: 1; min-width: 0; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.djl-lic { flex: 0 0 auto; font-size: 9px; color: var(--dsw-alias-label-tertiary); border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 3px; padding: 0 3px; }
.djl-import { height: 24px; font-size: 11px; }
.djl-done { color: var(--dsw-alias-label-tertiary); }
.djl-error { margin: 8px 10px 0; padding: 6px 8px; font-size: 12px; color: #e5484d; border: 0.5px solid #e5484d44; border-radius: 4px; }
.djl-hint { padding: 24px 14px; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 1.6; }
.djl-pager { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 6px 10px; border-top: 0.5px solid var(--dsw-alias-border-l3); flex: 0 0 auto; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.djl-pager .djl-btn { height: 24px; font-size: 11px; }
.djl-foot { padding: 6px 10px 8px; font-size: 10px; color: var(--dsw-alias-label-tertiary); flex: 0 0 auto; }
`;

export const injectStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('djl-styles')) return;
  const el = document.createElement('style');
  el.id = 'djl-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
};
