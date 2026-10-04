// 面板样式：一套设计令牌（映射宿主 --dsw-alias-* 语义色，提供暗色兜底），按 .dj- 前缀隔离。
// 插件卸载时移除 <style>（index.tsx 的 effect 负责）。
export const CSS = String.raw`
/* 设计令牌：右键菜单经 portal 挂到 body 上，不在 .dj-root 内，所以也要声明 */
.dj-root,.dj-menu{--dj-bg:var(--dsw-alias-bg-base,#121214);--dj-s1:var(--dsw-alias-bg-layer-1,#1a1a1d);--dj-s2:var(--dsw-alias-bg-layer-2,#222226);--dj-s3:var(--dsw-alias-bg-layer-3,#2b2b30);
--dj-t1:var(--dsw-alias-label-primary,#ececef);--dj-t2:var(--dsw-alias-label-secondary,#b4b4bb);--dj-t3:var(--dsw-alias-label-tertiary,#86868f);
--dj-line:var(--dsw-alias-border-l2,rgba(255,255,255,.1));--dj-line2:var(--dsw-alias-border-l3,rgba(255,255,255,.16));--dj-hover:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));
--dj-accent:var(--dsw-alias-button-primary-fill,#4d6bfe);--dj-on-accent:var(--dsw-alias-label-primary-foreground,#fff);--dj-hl:var(--dsw-alias-button-info-fill,#7aaaff);--dj-danger:var(--dsw-alias-state-error-primary,#f0505a);--dj-ok:var(--dsw-alias-state-success-primary,#34b27b);--dj-warn:var(--dsw-alias-state-warn-primary,#f2a43a);
--dj-r1:var(--dsw-radius-xs,4px);--dj-r2:var(--dsw-radius-sm,6px);--dj-r3:var(--dsw-radius-md,8px);--dj-font:var(--dsw-font-family,system-ui,"PingFang SC","Microsoft YaHei",sans-serif);
--dj-main:#3b82f6;--dj-pip:#8b5cf6;--dj-audio:#14b8a6;--dj-text:#f59e0b;--dj-marker:#ef4444;--dj-ai:#c084fc;}
.dj-root{position:relative;display:grid;height:100%;min-height:0;box-sizing:border-box;background:var(--dj-bg);color:var(--dj-t1);font:13px/1.45 var(--dj-font);outline:none;overflow:hidden;
grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(150px,42%) auto minmax(180px,1fr);grid-template-areas:"top" "stage" "transport" "timeline"}
.dj-root *,.dj-root *::before,.dj-root *::after{box-sizing:border-box}
.dj-root.dj-medium{grid-template-columns:minmax(0,1fr) 300px;grid-template-rows:auto minmax(180px,50%) auto minmax(180px,1fr);grid-template-areas:"top top" "stage side" "transport side" "timeline side"}
.dj-root.dj-wide{grid-template-columns:280px minmax(0,1fr) 320px;grid-template-rows:auto minmax(220px,55%) auto minmax(200px,1fr);grid-template-areas:"top top top" "left stage side" "left transport side" "timeline timeline timeline"}
.dj-top{grid-area:top;display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:.5px solid var(--dj-line);min-width:0}
.dj-stagewrap{grid-area:stage;position:relative;min-height:0;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}
.dj-transport{grid-area:transport;display:flex;align-items:center;gap:6px;padding:4px 8px;border-top:.5px solid var(--dj-line);border-bottom:.5px solid var(--dj-line);background:var(--dj-s1)}
.dj-timeline{grid-area:timeline;display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--dj-s1)}
.dj-side{grid-area:side;display:flex;flex-direction:column;min-height:0;border-left:.5px solid var(--dj-line);background:var(--dj-s1)}
.dj-left{grid-area:left;display:flex;flex-direction:column;min-height:0;border-right:.5px solid var(--dj-line);background:var(--dj-s1)}
/* 侧栏跨多行：内容高度不能参与网格行的尺寸计算，否则属性面板一长就把时间线挤出可视区 */
.dj-side,.dj-left{contain:size;overflow:hidden}
.dj-root.dj-narrow .dj-side{position:absolute;left:0;right:0;bottom:0;height:min(62%,520px);z-index:30;border-left:0;border-top:.5px solid var(--dj-line2);box-shadow:0 -12px 32px rgba(0,0,0,.45);border-radius:12px 12px 0 0}
.dj-root.dj-narrow .dj-side[hidden],.dj-root.dj-medium .dj-left{display:none}
.dj-title{flex:1;min-width:0;display:flex;align-items:center;gap:8px}
.dj-title input{all:unset;font-weight:600;min-width:40px;max-width:100%;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;border-radius:var(--dj-r1);padding:2px 4px}
.dj-title input:focus{background:var(--dj-s2);outline:1px solid var(--dj-accent)}
.dj-pill{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 8px;border-radius:11px;font-size:12px;color:var(--dj-t2);background:var(--dj-s2);white-space:nowrap}
.dj-pill i{width:6px;height:6px;border-radius:50%;background:var(--dj-ok)}
.dj-pill.dj-saving i{background:var(--dj-warn)}.dj-pill.dj-offline i,.dj-pill.dj-error i{background:var(--dj-danger)}.dj-pill.dj-readonly i{background:var(--dj-t3)}
.dj-pill.dj-ai{color:#fff;background:linear-gradient(90deg,#7c3aed,#c026d3);animation:dj-pulse 1.6s ease-in-out infinite}
@keyframes dj-pulse{50%{opacity:.7}}
.dj-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;padding:0 10px;border:0;border-radius:var(--dj-r2);background:var(--dj-s2);color:var(--dj-t1);font:inherit;cursor:pointer;white-space:nowrap}
a.dj-btn{text-decoration:none}
.dj-btn:hover:not(:disabled){background:var(--dj-s3)}.dj-btn:disabled{opacity:.45;cursor:default}
.dj-btn.dj-primary{background:var(--dj-accent);color:var(--dj-on-accent)}.dj-btn.dj-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dj-accent))}
.dj-btn.dj-danger{color:var(--dj-danger)}
.dj-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:var(--dj-r2);background:transparent;color:var(--dj-t2);cursor:pointer;flex:none}
.dj-icon-btn:hover:not(:disabled){background:var(--dj-hover);color:var(--dj-t1)}.dj-icon-btn:disabled{opacity:.35;cursor:default}
.dj-icon-btn[aria-pressed=true]{color:var(--dj-hl);background:var(--dj-hover)}
.dj-icon{width:16px;height:16px;flex:none}
.dj-sep{width:.5px;align-self:stretch;margin:4px 2px;background:var(--dj-line)}
.dj-root :focus-visible{outline:2px solid var(--dj-accent);outline-offset:1px}
`;
export const CSS_STAGE = String.raw`
.dj-stage{position:relative;width:100%;height:100%}
.dj-canvas{position:absolute;pointer-events:none}
.dj-gizmo{position:absolute;pointer-events:auto;outline:1.5px solid var(--dj-hl);cursor:move;touch-action:none}
.dj-gizmo.dj-text-gizmo{outline-style:dashed}
.dj-gizmo b{position:absolute;width:10px;height:10px;background:#fff;border:1.5px solid var(--dj-hl);border-radius:2px}
.dj-gizmo b[data-h=nw]{left:-6px;top:-6px;cursor:nwse-resize}.dj-gizmo b[data-h=ne]{right:-6px;top:-6px;cursor:nesw-resize}
.dj-gizmo b[data-h=sw]{left:-6px;bottom:-6px;cursor:nesw-resize}.dj-gizmo b[data-h=se]{right:-6px;bottom:-6px;cursor:nwse-resize}
.dj-guide{position:absolute;background:#f0f;pointer-events:none;opacity:.8}
.dj-guide.dj-v{top:0;bottom:0;width:1px}.dj-guide.dj-h{left:0;right:0;height:1px}
.dj-textedit{position:absolute;pointer-events:auto;background:rgba(0,0,0,.6);color:#fff;border:1.5px solid var(--dj-hl);border-radius:4px;font:inherit;resize:none;padding:4px 6px;outline:none;text-align:center}
.dj-stage-empty,.dj-stage-error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#bbb;text-align:center;padding:16px}
.dj-stage-error{background:rgba(0,0,0,.82)}
.dj-time{font-variant-numeric:tabular-nums;font-size:12px;color:var(--dj-t2);background:transparent;border:0;cursor:pointer;padding:2px 6px;border-radius:var(--dj-r1)}
.dj-time b{color:var(--dj-t1);font-weight:600}
.dj-time:hover{background:var(--dj-hover)}
.dj-play{width:34px;height:34px;border-radius:50%;background:var(--dj-t1);color:var(--dj-bg)}
.dj-play:hover:not(:disabled){background:#fff;color:#000}
.dj-spacer{flex:1}
.dj-jump{position:absolute;bottom:calc(100% + 6px);left:8px;z-index:40;width:240px;padding:12px;border-radius:var(--dj-r3);background:var(--dj-s2);box-shadow:0 12px 32px rgba(0,0,0,.4);display:grid;gap:8px}
.dj-jump input{height:30px}
`;
export const CSS_TIMELINE = String.raw`
.dj-tl-tools{display:flex;align-items:center;gap:2px;padding:4px 6px;border-bottom:.5px solid var(--dj-line);min-width:0;overflow-x:auto;scrollbar-width:none}
.dj-tl-tools input[type=range]{width:96px;accent-color:var(--dj-hl)}
.dj-tl-body{position:relative;flex:1;min-height:0;display:grid;grid-template-columns:var(--dj-head-w,96px) minmax(0,1fr);overflow:hidden}
.dj-root.dj-narrow .dj-tl-body{--dj-head-w:64px}
.dj-heads{position:relative;overflow:hidden;border-right:.5px solid var(--dj-line);background:var(--dj-s1);z-index:3}
.dj-scroll{position:relative;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin}
.dj-canvas-tl{position:relative;min-height:100%}
.dj-ruler{position:sticky;top:0;height:26px;z-index:5;background:var(--dj-s1);border-bottom:.5px solid var(--dj-line);cursor:ew-resize;touch-action:none}
.dj-tick{position:absolute;top:0;height:100%;border-left:.5px solid var(--dj-line2);padding-left:3px;font-size:10px;color:var(--dj-t3);white-space:nowrap;font-variant-numeric:tabular-nums;pointer-events:none}
.dj-tick.dj-minor{height:30%;top:70%;padding:0}
.dj-marker{position:absolute;top:0;width:12px;height:12px;margin-left:-6px;background:var(--dj-marker);clip-path:polygon(0 0,100% 0,100% 60%,50% 100%,0 60%);cursor:pointer;z-index:2}
.dj-marker.dj-sel{outline:2px solid #fff}
.dj-head-ruler{height:26px;border-bottom:.5px solid var(--dj-line);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--dj-t3)}
.dj-head{position:absolute;left:0;right:0;display:flex;align-items:center;gap:2px;padding:0 4px;border-bottom:.5px solid var(--dj-line);overflow:hidden}
.dj-head .dj-hname{flex:1;min-width:0;font-size:11px;color:var(--dj-t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.dj-head .dj-icon-btn{width:22px;height:22px}
.dj-head .dj-icon{width:13px;height:13px}
.dj-head i{width:3px;align-self:stretch;margin:6px 2px 6px 0;border-radius:2px}
.dj-lane{position:absolute;left:0;border-bottom:.5px solid var(--dj-line)}
.dj-lane.dj-locked{background:repeating-linear-gradient(135deg,transparent 0 6px,rgba(255,255,255,.03) 6px 12px)}
.dj-lane.dj-drop{background:rgba(77,107,254,.12)}
.dj-collapsed{position:absolute;left:0;height:8px;border-radius:4px;opacity:.85;cursor:pointer}
.dj-clip{position:absolute;top:3px;bottom:3px;border-radius:var(--dj-r2);overflow:hidden;cursor:grab;user-select:none;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.dj-clip:active{cursor:grabbing}
.dj-clip.dj-main{background:color-mix(in srgb,var(--dj-main) 55%,#0b1220)}
.dj-clip.dj-pip{background:color-mix(in srgb,var(--dj-pip) 50%,#120b20)}
.dj-clip.dj-audio{background:color-mix(in srgb,var(--dj-audio) 40%,#071a18)}
.dj-clip.dj-text{background:color-mix(in srgb,var(--dj-text) 45%,#1d1404);cursor:grab}
.dj-clip.dj-sel{box-shadow:inset 0 0 0 2px #fff,0 0 0 1px rgba(0,0,0,.5)}
.dj-clip.dj-dim{opacity:.35}
.dj-clip.dj-flash{animation:dj-flash 1.2s ease-out 2}
@keyframes dj-flash{0%{box-shadow:inset 0 0 0 2px var(--dj-ai),0 0 14px var(--dj-ai)}100%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}}
.dj-clip-label{position:absolute;left:6px;right:6px;top:2px;font-size:11px;line-height:16px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,.8);pointer-events:none;z-index:2;display:flex;gap:4px;align-items:center}
.dj-badge{flex:none;font-size:9px;line-height:13px;padding:0 3px;border-radius:3px;background:rgba(0,0,0,.45)}
.dj-film{position:absolute;inset:0;display:flex;opacity:.92;pointer-events:none}
.dj-film span{flex:none;height:100%;background-repeat:no-repeat}
.dj-wave{position:absolute;left:0;right:0;bottom:0;height:70%;pointer-events:none;color:rgba(255,255,255,.55)}
.dj-trim{position:absolute;top:0;bottom:0;width:8px;cursor:ew-resize;z-index:3}
.dj-trim.dj-l{left:0}.dj-trim.dj-r{right:0}
.dj-clip.dj-sel .dj-trim{background:rgba(255,255,255,.85)}
.dj-clip.dj-sel .dj-trim.dj-l{border-radius:var(--dj-r2) 0 0 var(--dj-r2)}.dj-clip.dj-sel .dj-trim.dj-r{border-radius:0 var(--dj-r2) var(--dj-r2) 0}
.dj-fade{position:absolute;top:0;width:10px;height:10px;background:#fff;border-radius:50%;z-index:4;cursor:ew-resize;box-shadow:0 0 0 1.5px rgba(0,0,0,.5)}
.dj-ramp{position:absolute;top:0;bottom:0;pointer-events:none;z-index:1}
.dj-env{position:absolute;inset:0;z-index:2;overflow:visible}
.dj-env polyline{fill:none;stroke:#fde047;stroke-width:1.5}
.dj-env circle{fill:#fde047;stroke:#000;stroke-width:1;cursor:grab}
.dj-kf{position:absolute;bottom:2px;width:8px;height:8px;margin-left:-4px;background:#fde047;transform:rotate(45deg);z-index:3;pointer-events:none;box-shadow:0 0 0 1px rgba(0,0,0,.6)}
.dj-trans{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:4px;background:#fff;color:#111;z-index:4;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.5)}
.dj-playhead{position:absolute;top:0;bottom:0;width:0;z-index:6;pointer-events:none}
.dj-playhead::before{content:"";position:absolute;top:0;bottom:0;left:-.5px;width:1px;background:#fff}
.dj-playhead::after{content:"";position:absolute;top:0;left:-6px;border:6px solid transparent;border-top:8px solid #fff}
.dj-snapline{position:absolute;top:0;bottom:0;width:1px;background:#22d3ee;z-index:7;pointer-events:none}
.dj-marquee{position:absolute;border:1px solid var(--dj-accent);background:rgba(77,107,254,.15);z-index:8;pointer-events:none}
.dj-insert{position:absolute;width:2px;background:#22d3ee;z-index:7;pointer-events:none}
.dj-heads-inner{position:absolute;left:0;right:0;top:0;will-change:transform}
.dj-head-ruler{position:relative;z-index:2;background:var(--dj-s1)}
.dj-trans.dj-none{background:rgba(255,255,255,.18);color:#fff;opacity:0;transition:opacity .12s}
.dj-scroll:hover .dj-trans.dj-none{opacity:.8}
.dj-trans.dj-none:hover{opacity:1;background:var(--dj-hl);color:#111}
.dj-seg{display:inline-flex;flex:none;padding:2px;gap:1px;border-radius:7px;background:var(--dj-s2)}
.dj-seg button{height:22px;padding:0 8px;border:0;border-radius:5px;background:transparent;color:var(--dj-t3);font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
.dj-seg button:hover{color:var(--dj-t1)}
.dj-seg button[aria-checked=true]{background:var(--dj-s3);color:var(--dj-t1)}
.dj-icon-btn[aria-pressed=true]{color:var(--dj-hl)}
.dj-newtrack{position:absolute;left:0;right:0;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dj-t3);border:1px dashed var(--dj-line2);border-radius:var(--dj-r2)}
`;
export const CSS_PANELS = String.raw`
.dj-tabs{display:flex;gap:2px;padding:6px 6px 0;border-bottom:.5px solid var(--dj-line);flex:none}
.dj-tabs button{flex:1;height:30px;border:0;background:transparent;color:var(--dj-t3);font:inherit;cursor:pointer;border-bottom:2px solid transparent}
.dj-tabs button[aria-selected=true]{color:var(--dj-t1);border-bottom-color:var(--dj-accent)}
.dj-tabs .dj-icon-btn{flex:none}
.dj-pane{flex:1;min-height:0;overflow:auto;padding:10px;scrollbar-width:thin}
.dj-section{margin:0 0 14px}
.dj-section>h4{margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:.04em;color:var(--dj-t3);display:flex;align-items:center;gap:6px}
.dj-section>h4 .dj-spacer{flex:1}
.dj-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.dj-field{display:flex;flex-direction:column;gap:3px;min-width:0}
.dj-field>span{font-size:11px;color:var(--dj-t3);display:flex;align-items:center;gap:4px}
.dj-field.dj-row{flex-direction:row;align-items:center;justify-content:space-between;gap:8px}
.dj-input,.dj-select,.dj-textarea{width:100%;min-width:0;height:28px;padding:0 8px;border:0;border-radius:var(--dj-r2);background:var(--dj-s2);color:var(--dj-t1);font:inherit;box-shadow:inset 0 0 0 .5px var(--dj-line)}
.dj-textarea{height:auto;min-height:56px;padding:6px 8px;resize:vertical;line-height:1.5}
.dj-input:focus,.dj-select:focus,.dj-textarea:focus{outline:1px solid var(--dj-accent)}
.dj-scrub{cursor:ew-resize;font-variant-numeric:tabular-nums}
.dj-scrub[aria-invalid=true]{outline:1px solid var(--dj-danger)}
.dj-kfbtn{width:18px;height:18px;border:0;padding:0;background:transparent;color:var(--dj-t3);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.dj-kfbtn svg{width:11px;height:11px}
.dj-kfbtn[data-state=on]{color:#fde047}.dj-kfbtn[data-state=has]{color:#a1a1aa}
.dj-chips{display:flex;flex-wrap:wrap;gap:6px}
.dj-chip{height:26px;padding:0 10px;border:0;border-radius:13px;background:var(--dj-s2);color:var(--dj-t2);font:inherit;font-size:12px;cursor:pointer}
.dj-chip:hover{background:var(--dj-s3);color:var(--dj-t1)}.dj-chip[aria-pressed=true]{background:var(--dj-accent);color:var(--dj-on-accent)}
.dj-slider{width:100%;accent-color:var(--dj-hl)}
.dj-swatch{width:28px;height:28px;padding:0;border:0;border-radius:var(--dj-r2);background:none;cursor:pointer}
.dj-hint{color:var(--dj-t3);font-size:12px;line-height:1.6}
.dj-empty-state{padding:24px 8px;text-align:center;color:var(--dj-t3)}
.dj-assets{display:flex;flex-direction:column;gap:6px}
.dj-asset{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:8px;align-items:center;padding:6px;border-radius:var(--dj-r2);cursor:grab}
.dj-asset:hover{background:var(--dj-hover)}
.dj-asset img,.dj-asset .dj-athumb{width:56px;height:32px;border-radius:4px;object-fit:cover;background:var(--dj-s3);display:flex;align-items:center;justify-content:center;color:var(--dj-t3)}
.dj-asset .dj-aname{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dj-asset small{display:block;color:var(--dj-t3);font-size:11px}
.dj-dropzone{border:1px dashed var(--dj-line2);border-radius:var(--dj-r3);padding:14px;text-align:center;color:var(--dj-t3)}
.dj-dropzone.dj-over{border-color:var(--dj-hl);color:var(--dj-t1);background:rgba(77,107,254,.08)}
.dj-progress{height:4px;border-radius:2px;background:var(--dj-s3);overflow:hidden}
.dj-progress i{display:block;height:100%;background:var(--dj-hl);transition:width .3s}
.dj-activity{display:flex;flex-direction:column;gap:8px}
.dj-ev{padding:8px;border-radius:var(--dj-r2);background:var(--dj-s2)}
.dj-ev header{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dj-t3)}
.dj-ev header b{color:var(--dj-t1);font-weight:600}
.dj-ev.dj-ai{box-shadow:inset 2px 0 0 var(--dj-ai)}.dj-ev.dj-user{box-shadow:inset 2px 0 0 var(--dj-hl)}
.dj-ev ul{margin:4px 0 0;padding-left:16px;color:var(--dj-t2);font-size:12px}
.dj-ev footer{display:flex;gap:6px;margin-top:6px}
.dj-menu{box-sizing:border-box}
.dj-menu *{box-sizing:border-box}
.dj-menu{position:fixed;z-index:1000;min-width:180px;padding:4px;border-radius:var(--dj-r3);background:var(--dj-s2);box-shadow:var(--dsw-elevation-prominent,0 16px 40px rgba(0,0,0,.45));color:var(--dj-t1);font:13px/1.4 var(--dj-font)}
.dj-menu button{display:flex;align-items:center;gap:8px;width:100%;height:28px;padding:0 10px;border:0;border-radius:var(--dj-r1);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dj-menu button:hover:not(:disabled),.dj-menu button:focus-visible{background:var(--dj-hover)}
.dj-menu button:disabled{opacity:.4}
.dj-menu kbd{margin-left:auto;font:11px var(--dj-font);color:var(--dj-t3)}
.dj-menu hr{border:0;height:.5px;margin:4px 0;background:var(--dj-line)}
.dj-mask{position:absolute;inset:0;z-index:100;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px}
.dj-dialog{width:min(440px,100%);max-height:100%;overflow:auto;padding:16px;border-radius:12px;background:var(--dj-s1);box-shadow:var(--dsw-elevation-prominent,0 24px 60px rgba(0,0,0,.5))}
.dj-dialog h3{margin:0 0 12px;font-size:15px;display:flex;align-items:center}
.dj-dialog h3 .dj-spacer{flex:1}
.dj-dialog footer{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
.dj-list{display:flex;flex-direction:column;gap:4px}
.dj-list>div{display:flex;align-items:center;gap:8px;padding:8px;border-radius:var(--dj-r2);background:var(--dj-s2)}
.dj-list small{color:var(--dj-t3)}
.dj-toasts{position:absolute;right:10px;bottom:10px;z-index:200;display:flex;flex-direction:column;gap:6px;max-width:min(360px,calc(100% - 20px))}
.dj-toast{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--dj-r3);background:var(--dj-s3);box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:12px}
.dj-toast.dj-error{box-shadow:inset 3px 0 0 var(--dj-danger),0 8px 24px rgba(0,0,0,.35)}
.dj-toast.dj-ai{box-shadow:inset 3px 0 0 var(--dj-ai),0 8px 24px rgba(0,0,0,.35)}
.dj-toast span{flex:1}
.dj-kbd-table{width:100%;border-collapse:collapse;font-size:12px}
.dj-kbd-table td{padding:4px 0;border-bottom:.5px solid var(--dj-line)}
.dj-kbd-table td:last-child{text-align:right;color:var(--dj-t3)}
.dj-banner{grid-column:1/-1;padding:6px 10px;font-size:12px;background:color-mix(in srgb,var(--dj-warn) 20%,transparent);color:var(--dj-t1)}
.dj-inspector{display:flex;flex-direction:column}
.dj-insp-head{display:flex;align-items:center;gap:8px;margin:0 0 10px}
.dj-insp-head>.dj-icon{flex:none;color:var(--dj-t3)}
.dj-insp-title{flex:1;min-width:0;display:flex;flex-direction:column}
.dj-insp-title b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dj-insp-title small{font-size:11px;color:var(--dj-t3);font-variant-numeric:tabular-nums}
.dj-subtabs{margin:0 -10px 12px;padding:0 6px}
.dj-subtabs button{height:28px;font-size:12px}
.dj-seg-full{display:flex;width:100%}
.dj-seg-full button{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.dj-toggle{min-height:28px}
.dj-toggle>span:empty{display:none}
.dj-toggle input{appearance:none;-webkit-appearance:none;flex:none;width:30px;height:18px;margin:0;border-radius:9px;background:var(--dj-s3);position:relative;cursor:pointer;transition:background .15s;box-shadow:inset 0 0 0 .5px var(--dj-line2)}
.dj-toggle input::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s}
.dj-toggle input:checked{background:var(--dj-hl)}
.dj-toggle input:checked::after{transform:translateX(12px)}
.dj-toggle input:disabled{opacity:.4;cursor:default}
.dj-toggle input:focus-visible{outline:2px solid var(--dj-accent);outline-offset:2px}
.dj-section>h4 .dj-toggle{min-height:0}
.dj-dot{display:inline-block;width:6px;height:6px;margin-left:4px;border-radius:50%;background:var(--dj-ai);vertical-align:middle}
.dj-side-title{flex:none;padding:10px 10px 0;font-size:12px;font-weight:600;color:var(--dj-t2)}
.dj-root.dj-narrow .dj-hide-narrow{display:none}
.dj-root:focus{outline:none}
.dj-scrub:focus{cursor:text}
`;
export const ALL_CSS = CSS + CSS_STAGE + CSS_TIMELINE + CSS_PANELS;
