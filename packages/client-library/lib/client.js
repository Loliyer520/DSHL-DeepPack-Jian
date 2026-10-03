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
		//#region ../client-timeline/src/client/engine.ts
		const SERVICE = "djian-engine";
		const DEFAULT_PORT = 5180;
		const PORT_CACHE = "djian.enginePort";
		const HEADERS = { "X-Djian-Client": "panel" };
		const hostBase = () => typeof window !== "undefined" && window.location?.hostname ? "http://" + (window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname) : "http://127.0.0.1";
		let base = hostBase() + ":5180";
		async function isEngine(candidate) {
			try {
				const r = await fetch(candidate + "/api/health", { signal: AbortSignal.timeout(1500) });
				const j = await r.json().catch(() => null);
				return r.ok && j?.service === SERVICE && (j.protocol ?? 1) >= 2;
			} catch {
				return false;
			}
		}
		function fragmentPort() {
			try {
				const m = /(?:^|[#&])djian-engine=(\d+)/.exec(window.location.hash || "");
				const p = m ? Number(m[1]) : 0;
				return p > 0 && p < 65536 ? p : 0;
			} catch {
				return 0;
			}
		}
		let discovery = null;
		function discoverEngine(force = false) {
			if (force) discovery = null;
			discovery ?? (discovery = (async () => {
				const ports = [];
				const push = (p) => {
					if (p > 0 && !ports.includes(p)) ports.push(p);
				};
				push(fragmentPort());
				try {
					push(Number(localStorage.getItem(PORT_CACHE)));
				} catch {}
				for (let p = DEFAULT_PORT; p <= 5190; p++) push(p);
				for (const p of ports) {
					const candidate = hostBase() + ":" + p;
					if (await isEngine(candidate)) {
						base = candidate;
						try {
							localStorage.setItem(PORT_CACHE, String(p));
						} catch {}
						return candidate;
					}
				}
				discovery = null;
				throw new EngineError("找不到剪辑引擎服务，请确认 D剪 已启动", 503);
			})());
			return discovery;
		}
		var EngineError = class extends Error {
			constructor(message, status, code, body) {
				super(message);
				this.status = status;
				this.code = code;
				this.body = body;
			}
		};
		let lastHeal = 0;
		async function request(method, path, init = {}) {
			await discoverEngine();
			const doFetch = () => fetch(base + path, {
				method,
				signal: init.signal ?? AbortSignal.timeout(init.timeoutMs ?? 2e4),
				headers: {
					...HEADERS,
					...init.body !== void 0 ? { "Content-Type": "application/json" } : {},
					...init.headers
				},
				body: init.raw ?? (init.body === void 0 ? void 0 : JSON.stringify(init.body))
			});
			let r;
			try {
				r = await doFetch();
			} catch (e) {
				if (!(e instanceof TypeError) || Date.now() - lastHeal < 1e4) throw e;
				lastHeal = Date.now();
				try {
					localStorage.removeItem(PORT_CACHE);
				} catch {}
				await discoverEngine(true);
				r = await doFetch();
			}
			const text = await r.text();
			let data = void 0;
			try {
				data = text ? JSON.parse(text) : void 0;
			} catch {
				data = text;
			}
			if (!r.ok) {
				const d = data;
				throw new EngineError(d?.error ?? "HTTP " + r.status, r.status, d?.code, data);
			}
			return data;
		}
		const P = (pid) => "/api/p/" + encodeURIComponent(pid);
		const api = {
			bindSession: (sessionId) => request("POST", "/api/session-project", { body: { sessionId } }).then((r) => r.project),
			timeline: (pid) => request("GET", P(pid) + "/timeline"),
			ops: (pid, body) => request("POST", P(pid) + "/ops", {
				body: {
					...body,
					actor: "user"
				},
				timeoutMs: 3e4
			}),
			changes: (pid, since) => request("GET", P(pid) + "/changes?since=" + since + "&patch=1&limit=200"),
			presence: (pid, body) => request("POST", P(pid) + "/presence", {
				body,
				timeoutMs: 5e3
			}),
			assets: (pid, signal) => request("GET", P(pid) + "/assets", { signal }),
			upload: (pid, file, signal) => request("POST", P(pid) + "/assets?name=" + encodeURIComponent(file.name), {
				raw: file,
				headers: { "Content-Type": "application/octet-stream" },
				signal,
				timeoutMs: 6e5
			}),
			deleteAsset: (pid, name) => request("DELETE", P(pid) + "/assets/" + encodeURIComponent(name)),
			sprite: (pid, name) => request("GET", P(pid) + "/assets/" + encodeURIComponent(name) + "/sprite", { timeoutMs: 2e5 }),
			history: (pid) => request("GET", P(pid) + "/history"),
			saveVersion: (pid, label) => request("POST", P(pid) + "/history", { body: { label } }),
			restore: (pid, id, clientId) => request("POST", P(pid) + "/history/" + encodeURIComponent(id) + "/restore", {
				body: { clientId },
				timeoutMs: 3e4
			}),
			fonts: () => request("GET", "/api/fonts").then((r) => r.fonts),
			startExport: (pid, body) => request("POST", P(pid) + "/export", { body }),
			exportStatus: (jobId) => request("GET", "/api/export/" + encodeURIComponent(jobId)),
			cancelExport: (jobId) => request("POST", "/api/export/" + encodeURIComponent(jobId) + "/cancel", { body: {} }),
			rename: (pid, name) => request("PATCH", "/api/projects/" + encodeURIComponent(pid), { body: { name } })
		};
		//#endregion
		//#region src/client/api.ts
		const searchLibrary = (q, kind, page) => request("GET", "/api/library/search?q=" + encodeURIComponent(q) + "&type=" + kind + "&page=" + page, { timeoutMs: 3e4 });
		/** 导入到当前会话绑定的项目（与剪辑面板、AI 工具同一个项目） */
		async function importLibrary(item, name, sessionId) {
			const project = await api.bindSession(sessionId ?? "standalone");
			const r = await request("POST", "/api/p/" + encodeURIComponent(project.id) + "/library/import", {
				body: {
					url: item.url,
					name,
					kind: item.kind,
					title: item.title,
					license: item.license,
					creator: item.creator ?? null
				},
				timeoutMs: 18e4
			});
			try {
				window.dispatchEvent(new CustomEvent("djian:assets-changed", { detail: {
					projectId: project.id,
					name: r.name
				} }));
			} catch {}
			return r;
		}
		//#endregion
		//#region src/client/LibraryPanel.tsx
		const fmtDur = (s) => {
			if (s == null) return "";
			const m = Math.floor(s / 60);
			const sec = Math.round(s % 60);
			return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `0:${String(sec).padStart(2, "0")}`;
		};
		const LibraryPanel = ({ sessionId }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LibraryContents, { sessionId }, sessionId ?? "default");
		const LibraryContents = ({ sessionId }) => {
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
					const r = await importLibrary(it, it.title.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 60) || void 0, sessionId);
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
						children: lastQuery.current ? "无结果——换个关键词试试（英文更准）" : "输入关键词搜索 CC 授权素材，导入后到「D剪 · 素材」使用"
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
						children: "Openverse CC 聚合 · 导入后到「D剪 · 素材」拖上轨道 · AI 也能用 djian_search_media 搜同一资源库"
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
			ctx.effect(() => {
				injectStyles();
				return () => document.getElementById("djl-styles")?.remove();
			}, "djian-library: styles");
			ctx.effect(() => ctx.sidebarRightTabs.register({
				id: "@djian/client-ui-library",
				kind: "djian.library",
				keepMounted: true,
				priority: "extension",
				title: () => "资源库",
				guide: [{
					id: "djian.library.open",
					order: 20,
					title: () => "资源库",
					description: () => "在线 CC 素材 · 搜索 · 试听 · 导入",
					icon: LibraryGlyph
				}]
			}), "djian-library: tab type");
			ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
				name: "sidebar.right.pane.tab",
				key: "@djian/client-ui-library"
			}, LibraryPanel)), "djian-library: tab body");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
