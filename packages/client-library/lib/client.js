window.__ModuleLoader__.load({
	id: "@djian/client-ui-library",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/api.ts
		const API_BASE = typeof window !== "undefined" && window.location ? `${window.location.protocol}//${window.location.hostname}:5180` : "http://127.0.0.1:5180";
		async function searchLibrary(q, kind, page) {
			const r = await fetch(`${API_BASE}/api/library/search?q=${encodeURIComponent(q)}&type=${kind}&page=${page}`);
			const d = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
			return d;
		}
		async function importLibrary(url, name, kind) {
			const r = await fetch(`${API_BASE}/api/library/import`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					url,
					name,
					kind
				})
			});
			const d = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
			return d;
		}
		//#endregion
		//#region src/client/LibraryPanel.tsx
		const fmtDur = (s) => {
			if (s == null) return "";
			const m = Math.floor(s / 60);
			const sec = Math.round(s % 60);
			return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `0:${String(sec).padStart(2, "0")}`;
		};
		const LibraryPanel = () => {
			const [q, setQ] = (0, react.useState)("");
			const [kind, setKind] = (0, react.useState)("image");
			const [page, setPage] = (0, react.useState)(1);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [total, setTotal] = (0, react.useState)(0);
			const [items, setItems] = (0, react.useState)([]);
			const [imports, setImports] = (0, react.useState)({});
			const lastQuery = (0, react.useRef)("");
			const doSearch = async (query, k, p) => {
				if (!query.trim()) return;
				setLoading(true);
				setError("");
				try {
					const r = await searchLibrary(query.trim(), k, p);
					setItems(r.items);
					setTotal(r.total);
					setPage(r.page);
					lastQuery.current = query.trim();
				} catch (e) {
					setError(e instanceof Error ? e.message : String(e));
				} finally {
					setLoading(false);
				}
			};
			(0, react.useEffect)(() => {
				if (lastQuery.current) doSearch(lastQuery.current, kind, 1);
			}, [kind]);
			const doImport = async (it) => {
				setImports((m) => ({
					...m,
					[it.id]: { st: "busy" }
				}));
				try {
					const safe = it.title.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 60);
					const r = await importLibrary(it.url, safe || void 0, it.kind);
					setImports((m) => ({
						...m,
						[it.id]: {
							st: "done",
							name: r.name
						}
					}));
				} catch (e) {
					setImports((m) => ({
						...m,
						[it.id]: {
							st: "err",
							err: e instanceof Error ? e.message : String(e)
						}
					}));
				}
			};
			const totalPages = Math.max(1, Math.ceil(total / 20));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "djl-root",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djl-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "djl-input",
							placeholder: "搜素材…（英文更准，如 ocean / piano）",
							value: q,
							onChange: (e) => setQ(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter") doSearch(q, kind, 1);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: "djl-btn djl-primary",
							disabled: loading || !q.trim(),
							onClick: () => doSearch(q, kind, 1),
							children: loading ? "搜索中…" : "搜索"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djl-tabs",
						children: [["image", "audio"].map((k) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: `djl-tab ${kind === k ? "djl-active" : ""}`,
							onClick: () => setKind(k),
							children: k === "image" ? "图片" : "音频"
						}, k)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "djl-total",
							children: total > 0 ? `${total} 条` : ""
						})]
					}),
					error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djl-error",
						children: error
					}),
					!loading && !error && items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djl-hint",
						children: lastQuery.current ? "无结果——换个关键词试试（英文更准）" : "输入关键词搜索 CC 授权素材，导入后到「剪辑面板 · 素材」使用"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: `djl-grid ${kind === "audio" ? "djl-list" : ""}`,
						children: items.map((it) => {
							const im = imports[it.id] ?? { st: "idle" };
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "djl-card",
								children: [
									it.kind === "image" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djl-thumb",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											src: it.thumb ?? it.url,
											alt: it.title,
											loading: "lazy"
										})
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djl-audio",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "djl-dur",
											children: fmtDur(it.duration)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
											controls: true,
											preload: "none",
											src: it.url
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djl-meta",
										title: `${it.title} · ${it.license}/${it.source}`,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "djl-title",
											children: it.title
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "djl-lic",
											children: it.license
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: `djl-btn djl-import ${im.st === "done" ? "djl-done" : ""}`,
										disabled: im.st === "busy" || im.st === "done",
										title: im.st === "err" ? im.err : im.st === "done" ? `已存为 ${im.name}` : "下载进当前项目素材库",
										onClick: () => doImport(it),
										children: im.st === "busy" ? "导入中…" : im.st === "done" ? "✓ 已入库" : im.st === "err" ? "失败·重试" : "导入"
									})
								]
							}, it.id);
						})
					}),
					total > 20 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djl-pager",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djl-btn",
								disabled: page <= 1 || loading,
								onClick: () => doSearch(lastQuery.current, kind, page - 1),
								children: "‹ 上一页"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								page,
								" / ",
								totalPages
							] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djl-btn",
								disabled: page >= totalPages || loading,
								onClick: () => doSearch(lastQuery.current, kind, page + 1),
								children: "下一页 ›"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djl-foot",
						children: "Openverse CC 聚合 · 导入后到「剪辑面板 · 素材」拖上轨道 · AI 也可经 search_media 用同一资源库"
					})
				]
			});
		};
		//#endregion
		//#region src/client/styles.ts
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
		const injectStyles = () => {
			if (typeof document === "undefined") return;
			if (document.getElementById("djl-styles")) return;
			const el = document.createElement("style");
			el.id = "djl-styles";
			el.textContent = CSS;
			document.head.appendChild(el);
		};
		//#endregion
		//#region src/client/index.tsx
		const LibraryGlyph = ({ size = 16, className }) => react.default.createElement("svg", {
			width: size,
			height: size,
			viewBox: "0 0 16 16",
			fill: "none",
			className
		}, react.default.createElement("path", {
			d: "M4.5 6.5a3 3 0 0 1 .6-5.9 3.5 3.5 0 0 1 6.7 1A2.75 2.75 0 0 1 11.5 7H5a2.5 2.5 0 0 1-.5-.5z",
			stroke: "currentColor",
			strokeWidth: 1.2,
			strokeLinejoin: "round"
		}), react.default.createElement("path", {
			d: "M8 8.5v5m0 0l-2-2m2 2l2-2",
			stroke: "currentColor",
			strokeWidth: 1.2,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}));
		const inject = ["slots", "sidebarRightTabs"];
		function apply(ctx) {
			injectStyles();
			ctx.effect(() => ctx.sidebarRightTabs.register({
				id: "djian.library",
				kind: "djian.library",
				priority: "builtin",
				title: () => "资源库",
				guide: [{
					order: 20,
					title: () => "资源库",
					description: () => "在线 CC 素材 · 搜索 · 试听 · 导入",
					icon: LibraryGlyph
				}]
			}), "djian-library: tab type");
			ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
				name: "sidebar.right.pane.tab",
				key: "djian.library"
			}, LibraryPanel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
