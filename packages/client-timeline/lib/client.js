window.__ModuleLoader__.load({
	id: "@djian/client-ui-timeline",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp$1 = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp$1(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp$1(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		//#region \0@oxc-project+runtime@0.150.0/helpers/esm/typeof.js
		function _typeof(o) {
			"@babel/helpers - typeof";
			return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
				return typeof o;
			} : function(o) {
				return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
			}, _typeof(o);
		}
		//#endregion
		//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPrimitive.js
		function toPrimitive(t, r) {
			if ("object" != _typeof(t) || !t) return t;
			var e = t[Symbol.toPrimitive];
			if (void 0 !== e) {
				var i = e.call(t, r || "default");
				if ("object" != _typeof(i)) return i;
				throw new TypeError("@@toPrimitive must return a primitive value.");
			}
			return ("string" === r ? String : Number)(t);
		}
		//#endregion
		//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPropertyKey.js
		function toPropertyKey(t) {
			var i = toPrimitive(t, "string");
			return "symbol" == _typeof(i) ? i : i + "";
		}
		//#endregion
		//#region \0@oxc-project+runtime@0.150.0/helpers/esm/defineProperty.js
		function _defineProperty(e, r, t) {
			return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
				value: t,
				enumerable: !0,
				configurable: !0,
				writable: !0
			}) : e[r] = t, e;
		}
		//#endregion
		//#region ../../node_modules/remotion/dist/esm/index.mjs
		var __defProp = Object.defineProperty;
		var __export = (target, all) => {
			for (var name in all) __defProp(target, name, {
				get: all[name],
				enumerable: true,
				configurable: true,
				set: (newValue) => all[name] = () => newValue
			});
		};
		if (typeof react.createContext !== "function") throw new Error([
			"Remotion requires React.createContext, but it is \"undefined\".",
			"If you are in a React Server Component, turn it into a client component by adding \"use client\" at the top of the file.",
			"",
			"Before:",
			"  import {useCurrentFrame} from \"remotion\";",
			"",
			"After:",
			"  \"use client\";",
			"  import {useCurrentFrame} from \"remotion\";"
		].join(`
`));
		var CanUseRemotionHooks = (0, react.createContext)(false);
		var CanUseRemotionHooksProvider = ({ children }) => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanUseRemotionHooks.Provider, {
				value: true,
				children
			});
		};
		var CompositionRenderErrorContext = (0, react.createContext)({
			setError: () => {},
			clearError: () => {}
		});
		var getHot = () => {
			try {
				if (typeof __webpack_module__ === "undefined") return null;
				return __webpack_module__.hot ?? null;
			} catch {
				return null;
			}
		};
		var CompositionErrorBoundary = class extends react.default.Component {
			constructor(..._args) {
				super(..._args);
				_defineProperty(this, "state", { hasError: false });
				_defineProperty(this, "hmrStatusHandler", null);
			}
			static getDerivedStateFromError() {
				return { hasError: true };
			}
			componentDidCatch(error) {
				this.props.onError(error);
				this.subscribeToHmrReset();
			}
			componentDidMount() {
				if (!this.state.hasError) this.props.onClear();
			}
			componentDidUpdate(_prevProps, prevState) {
				if (prevState.hasError && !this.state.hasError) this.props.onClear();
			}
			componentWillUnmount() {
				this.unsubscribeFromHmrReset();
			}
			subscribeToHmrReset() {
				if (this.hmrStatusHandler) return;
				const hot = getHot();
				if (!hot) return;
				const handler = (status) => {
					if (status !== "idle") return;
					this.unsubscribeFromHmrReset();
					this.setState({ hasError: false });
				};
				this.hmrStatusHandler = handler;
				hot.addStatusHandler(handler);
			}
			unsubscribeFromHmrReset() {
				const handler = this.hmrStatusHandler;
				if (!handler) return;
				this.hmrStatusHandler = null;
				const hot = getHot();
				if (!hot) return;
				hot.removeStatusHandler(handler);
			}
			render() {
				if (this.state.hasError) return null;
				return this.props.children;
			}
		};
		var getAssetPreviewCompositionId = (asset) => `asset:${asset}`;
		var CompositionManager = (0, react.createContext)({
			compositions: [],
			folders: [],
			currentCompositionMetadata: null,
			currentAssetMetadata: null,
			canvasContent: null
		});
		var CompositionSetters = (0, react.createContext)({
			registerComposition: () => {},
			unregisterComposition: () => {},
			registerFolder: () => {},
			unregisterFolder: () => {},
			setCanvasContent: () => {},
			setCurrentAssetMetadata: () => {},
			onlyRenderComposition: null
		});
		var componentsToAddStacksTo = [];
		var sequenceComponent = null;
		var stacksByControls = /* @__PURE__ */ new WeakMap();
		var componentIdentityResolver = null;
		var REMOTION_INTERNAL_STACK_PROP = "_remotionInternalStack";
		var getComponentsToAddStacksTo = () => componentsToAddStacksTo;
		var addSequenceStackTraces = (component) => {
			componentsToAddStacksTo.push(component);
		};
		var setSequenceComponent = (component) => {
			sequenceComponent = component;
		};
		var getSequenceComponent = () => sequenceComponent;
		var setComponentIdentityResolver = (resolver) => {
			componentIdentityResolver = resolver;
		};
		var resolveComponentIdentity = (component) => {
			return componentIdentityResolver?.(component) ?? component;
		};
		var setStackForControls = (controls, stack) => {
			if (stack === void 0) {
				stacksByControls.delete(controls);
				return;
			}
			stacksByControls.set(controls, stack);
		};
		var getStackForControls = (controls) => {
			return stacksByControls.get(controls) ?? null;
		};
		var getSingleChildComponent = (children) => {
			const mountedChildren = react.default.Children.toArray(children);
			if (mountedChildren.length !== 1) return null;
			const child = mountedChildren[0];
			if (!react.default.isValidElement(child)) return null;
			if (typeof child.type !== "function" && typeof child.type !== "object") return null;
			return resolveComponentIdentity(child.type);
		};
		var SEQUENCE_ORDER_MARKER = Symbol.for("remotion.sequence-order-marker");
		var SEQUENCE_MANAGER_ORDER_MARKER = Symbol.for("remotion.sequence-manager-order-marker");
		var COMPOSITION_ORDER_MARKER = Symbol.for("remotion.composition-order-marker");
		var FOLDER_ORDER_MARKER = Symbol.for("remotion.folder-order-marker");
		var COMPOSITION_MANAGER_ORDER_MARKER = Symbol.for("remotion.composition-manager-order-marker");
		var COMMIT_ORDER_EVENT = "remotion:commit-order";
		var getCompositionAndFolderOrderKey = (item) => `${item.type}:${item.id}`;
		var getFolderOrderId = ({ name, parent }) => [parent, name].filter(Boolean).join("/");
		var SequenceOrderMarker = ({ children }) => children;
		Object.defineProperty(SequenceOrderMarker, SEQUENCE_ORDER_MARKER, { value: true });
		var SequenceManagerOrderMarker = ({ children }) => children;
		Object.defineProperty(SequenceManagerOrderMarker, SEQUENCE_MANAGER_ORDER_MARKER, { value: true });
		var CompositionOrderMarker = ({ children }) => children;
		Object.defineProperty(CompositionOrderMarker, COMPOSITION_ORDER_MARKER, { value: true });
		var FolderOrderMarker = ({ children }) => children;
		Object.defineProperty(FolderOrderMarker, FOLDER_ORDER_MARKER, { value: true });
		var CompositionManagerOrderMarker = ({ children }) => children;
		Object.defineProperty(CompositionManagerOrderMarker, COMPOSITION_MANAGER_ORDER_MARKER, { value: true });
		var CommitOrderInternals = {
			compositionManagerMarker: COMPOSITION_MANAGER_ORDER_MARKER,
			compositionMarker: COMPOSITION_ORDER_MARKER,
			folderMarker: FOLDER_ORDER_MARKER,
			sequenceManagerMarker: SEQUENCE_MANAGER_ORDER_MARKER,
			sequenceMarker: SEQUENCE_ORDER_MARKER,
			eventName: COMMIT_ORDER_EVENT
		};
		function truthy$1(value) {
			return Boolean(value);
		}
		function getNodeEnvString() {
			return [
				"NOD",
				"E_EN",
				"V"
			].join("");
		}
		var getEnvString = () => {
			return ["e", "nv"].join("");
		};
		var getRemotionEnvironment = () => {
			const isPlayer = typeof window !== "undefined" && window.remotion_isPlayer;
			const isRendering = typeof window !== "undefined" && typeof window.process !== "undefined" && typeof window.process.env !== "undefined" && (window.process[getEnvString()][getNodeEnvString()] === "test" || window.process[getEnvString()][getNodeEnvString()] === "production" && typeof window !== "undefined" && typeof window.remotion_puppeteerTimeout !== "undefined");
			return {
				isStudio: typeof window !== "undefined" && window.remotion_isStudio,
				isRendering,
				isPlayer,
				isReadOnlyStudio: typeof window !== "undefined" && window.remotion_isReadOnlyStudio,
				isClientSideRendering: false
			};
		};
		var RemotionEnvironmentContext = react.default.createContext(null);
		var useRemotionEnvironment = () => {
			const context = (0, react.useContext)(RemotionEnvironmentContext);
			const [env] = (0, react.useState)(() => getRemotionEnvironment());
			return context ?? env;
		};
		var getRegex = () => /^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g;
		var isFolderNameValid = (name) => name.match(getRegex());
		var validateFolderName = (name) => {
			if (name === void 0 || name === null) throw new TypeError("You must pass a name to a <Folder />.");
			if (typeof name !== "string") throw new TypeError(`The "name" you pass into <Folder /> must be a string. Got: ${typeof name}`);
			if (!isFolderNameValid(name)) throw new Error(`Folder name can only contain a-z, A-Z, 0-9 and -. You passed ${name}`);
		};
		var invalidFolderNameErrorMessage = `Folder name must match ${String(getRegex())}`;
		var FolderContext = (0, react.createContext)({
			folderName: null,
			parentName: null
		});
		var Folder = (props) => {
			const { name, children } = props;
			const parent = (0, react.useContext)(FolderContext);
			const { registerFolder, unregisterFolder } = (0, react.useContext)(CompositionSetters);
			const environment = useRemotionEnvironment();
			const stack = props._remotionInternalStack ?? null;
			validateFolderName(name);
			const parentNameArr = [parent.parentName, parent.folderName].filter(truthy$1);
			const parentName = parentNameArr.length === 0 ? null : parentNameArr.join("/");
			const value = (0, react.useMemo)(() => {
				return {
					folderName: name,
					parentName
				};
			}, [name, parentName]);
			(0, react.useEffect)(() => {
				registerFolder(name, parentName, stack);
				return () => {
					unregisterFolder(name, parentName);
				};
			}, [
				name,
				parent.folderName,
				parentName,
				registerFolder,
				unregisterFolder,
				stack
			]);
			const folder = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FolderContext.Provider, {
				value,
				children
			});
			return environment.isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FolderOrderMarker, {
				folderId: getFolderOrderId({
					name,
					parent: parentName
				}),
				children: folder
			}) : folder;
		};
		var DATE_TOKEN$1 = "remotion-date:";
		var FILE_TOKEN$1 = "remotion-file:";
		var serializeJSONWithSpecialTypes$1 = ({ data, indent, staticBase }) => {
			let customDateUsed = false;
			let customFileUsed = false;
			let mapUsed = false;
			let setUsed = false;
			try {
				return {
					serializedString: JSON.stringify(data, function(key, value) {
						const item = this[key];
						if (item instanceof Date) {
							customDateUsed = true;
							return `${DATE_TOKEN$1}${item.toISOString()}`;
						}
						if (item instanceof Map) {
							mapUsed = true;
							return value;
						}
						if (item instanceof Set) {
							setUsed = true;
							return value;
						}
						if (typeof item === "string" && staticBase !== null && staticBase !== "" && item.startsWith(staticBase)) {
							customFileUsed = true;
							return `${FILE_TOKEN$1}${item.replace(staticBase + "/", "")}`;
						}
						return value;
					}, indent),
					customDateUsed,
					customFileUsed,
					mapUsed,
					setUsed
				};
			} catch (err) {
				throw new Error("Could not serialize the passed input props to JSON: " + err.message);
			}
		};
		var resolveFileTokenToUrl$1 = (value) => {
			const encodedName = value.replace(FILE_TOKEN$1, "");
			let name = encodedName;
			try {
				name = encodedName.split("/").map(decodeURIComponent).join("/");
			} catch {}
			const matchingStaticFile = window.remotion_staticFiles?.find((file) => file.name === name);
			if (matchingStaticFile) return matchingStaticFile.src;
			return `${window.remotion_staticBase}/${encodedName}`;
		};
		var deserializeJSONWithSpecialTypes$1 = (data) => {
			return JSON.parse(data, (_, value) => {
				if (typeof value === "string" && value.startsWith(DATE_TOKEN$1)) return new Date(value.replace(DATE_TOKEN$1, ""));
				if (typeof value === "string" && value.startsWith(FILE_TOKEN$1)) return resolveFileTokenToUrl$1(value);
				return value;
			});
		};
		var serializeThenDeserialize = (props) => {
			return deserializeJSONWithSpecialTypes$1(serializeJSONWithSpecialTypes$1({
				data: props,
				indent: 2,
				staticBase: window.remotion_staticBase
			}).serializedString);
		};
		var serializeThenDeserializeInStudio = (props) => {
			if (getRemotionEnvironment().isStudio) return serializeThenDeserialize(props);
			return props;
		};
		var IsPlayerContext = (0, react.createContext)(false);
		var IsPlayerContextProvider = ({ children }) => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IsPlayerContext.Provider, {
				value: true,
				children
			});
		};
		var useIsPlayer = () => {
			return (0, react.useContext)(IsPlayerContext);
		};
		var hasTailwindClassName = ({ className, classPrefix, type }) => {
			if (!className) return false;
			if (type === "exact") {
				const split = className.split(" ");
				return classPrefix.some((token) => {
					return split.some((part) => {
						return part.trim() === token || part.trim().endsWith(`:${token}`) || part.trim().endsWith(`!${token}`);
					});
				});
			}
			return classPrefix.some((prefix) => {
				return className.startsWith(prefix) || className.includes(` ${prefix}`) || className.includes(`!${prefix}`) || className.includes(`:${prefix}`);
			});
		};
		var AbsoluteFillElementRefForwarding = (props, ref) => {
			const { style, ...other } = props;
			const actualStyle = (0, react.useMemo)(() => {
				return {
					position: "absolute",
					top: hasTailwindClassName({
						className: other.className,
						classPrefix: ["top-", "inset-"],
						type: "prefix"
					}) ? void 0 : 0,
					left: hasTailwindClassName({
						className: other.className,
						classPrefix: ["left-", "inset-"],
						type: "prefix"
					}) ? void 0 : 0,
					right: hasTailwindClassName({
						className: other.className,
						classPrefix: ["right-", "inset-"],
						type: "prefix"
					}) ? void 0 : 0,
					bottom: hasTailwindClassName({
						className: other.className,
						classPrefix: ["bottom-", "inset-"],
						type: "prefix"
					}) ? void 0 : 0,
					width: hasTailwindClassName({
						className: other.className,
						classPrefix: ["w-"],
						type: "prefix"
					}) ? void 0 : "100%",
					height: hasTailwindClassName({
						className: other.className,
						classPrefix: ["h-"],
						type: "prefix"
					}) ? void 0 : "100%",
					display: hasTailwindClassName({
						className: other.className,
						classPrefix: [
							"block",
							"inline-block",
							"inline",
							"flex",
							"inline-flex",
							"flow-root",
							"grid",
							"inline-grid",
							"contents",
							"list-item",
							"hidden"
						],
						type: "exact"
					}) ? void 0 : "flex",
					flexDirection: hasTailwindClassName({
						className: other.className,
						classPrefix: [
							"flex-row",
							"flex-col",
							"flex-row-reverse",
							"flex-col-reverse"
						],
						type: "exact"
					}) ? void 0 : "column",
					...style
				};
			}, [other.className, style]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref,
				style: actualStyle,
				...other
			});
		};
		var AbsoluteFillElement = (0, react.forwardRef)(AbsoluteFillElementRefForwarding);
		var _portalNode = null;
		var portalNodeCurrentScale = 1;
		var portalNodeCurrentScaleListeners = [];
		var getPortalNodeCurrentScale = () => portalNodeCurrentScale;
		var subscribeToPortalNodeCurrentScale = (listener) => {
			portalNodeCurrentScaleListeners.push(listener);
			return () => {
				portalNodeCurrentScaleListeners = portalNodeCurrentScaleListeners.filter((currentListener) => currentListener !== listener);
			};
		};
		var setPortalNodeCurrentScale = (scale) => {
			if (portalNodeCurrentScale === scale) return;
			portalNodeCurrentScale = scale;
			for (const listener of portalNodeCurrentScaleListeners) listener();
		};
		var portalNode = () => {
			if (!_portalNode) {
				if (typeof document === "undefined") throw new Error("Tried to call an API that only works in the browser from outside the browser");
				_portalNode = document.createElement("div");
				_portalNode.style.position = "absolute";
				_portalNode.style.top = "0px";
				_portalNode.style.left = "0px";
				_portalNode.style.right = "0px";
				_portalNode.style.bottom = "0px";
				_portalNode.style.width = "100%";
				_portalNode.style.height = "100%";
				_portalNode.style.display = "flex";
				_portalNode.style.flexDirection = "column";
				const containerNode = document.createElement("div");
				containerNode.style.position = "fixed";
				containerNode.style.top = "-999999px";
				containerNode.appendChild(_portalNode);
				document.body.appendChild(containerNode);
			}
			return _portalNode;
		};
		var SequenceContext = (0, react.createContext)(null);
		var getKey = () => {
			return `remotion_inputPropsOverride` + window.location.origin;
		};
		var getInputPropsOverride = () => {
			if (typeof localStorage === "undefined") return null;
			const override = localStorage.getItem(getKey());
			if (!override) return null;
			return JSON.parse(override);
		};
		var setInputPropsOverride = (override) => {
			if (typeof localStorage === "undefined") return;
			if (override === null) {
				localStorage.removeItem(getKey());
				return;
			}
			localStorage.setItem(getKey(), JSON.stringify(override));
		};
		var didWarnSSRImport = false;
		var warnOnceSSRImport = () => {
			if (didWarnSSRImport) return;
			didWarnSSRImport = true;
			console.warn("Called `getInputProps()` on the server. This function is not available server-side and has returned an empty object.");
			console.warn("To hide this warning, don't call this function on the server:");
			console.warn("  typeof window === 'undefined' ? {} : getInputProps()");
		};
		var getInputProps = () => {
			if (typeof window === "undefined") {
				warnOnceSSRImport();
				return {};
			}
			if (getRemotionEnvironment().isPlayer) throw new Error("You cannot call `getInputProps()` from a <Player>. Instead, the props are available as React props from component that you passed as `component` prop.");
			const override = getInputPropsOverride();
			if (override) return override;
			if (typeof window === "undefined" || typeof window.remotion_inputProps === "undefined") throw new Error("Cannot call `getInputProps()` - window.remotion_inputProps is not set. This API is only available if you are in the Studio, or while you are rendering server-side.");
			const param = window.remotion_inputProps;
			if (!param) return {};
			return deserializeJSONWithSpecialTypes$1(param);
		};
		var EditorPropsContext = (0, react.createContext)({
			props: {},
			updateProps: () => {
				throw new Error("Not implemented");
			}
		});
		var timeValueRef = react.default.createRef();
		var EditorPropsProvider = ({ children }) => {
			const [props, setProps] = react.default.useState({});
			const updateProps = (0, react.useCallback)(({ defaultProps, id, newProps }) => {
				setProps((prev) => {
					return {
						...prev,
						[id]: typeof newProps === "function" ? newProps(prev[id] ?? defaultProps) : newProps
					};
				});
			}, []);
			const ctx = (0, react.useMemo)(() => {
				return {
					props,
					updateProps
				};
			}, [props, updateProps]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EditorPropsContext.Provider, {
				value: ctx,
				children
			});
		};
		function validateDimension$2(amount, nameOfProp, location) {
			if (typeof amount !== "number") throw new Error(`The "${nameOfProp}" prop ${location} must be a number, but you passed a value of type ${typeof amount}`);
			if (isNaN(amount)) throw new TypeError(`The "${nameOfProp}" prop ${location} must not be NaN, but is NaN.`);
			if (!Number.isFinite(amount)) throw new TypeError(`The "${nameOfProp}" prop ${location} must be finite, but is ${amount}.`);
			if (amount % 1 !== 0) throw new TypeError(`The "${nameOfProp}" prop ${location} must be an integer, but is ${amount}.`);
			if (amount <= 0) throw new TypeError(`The "${nameOfProp}" prop ${location} must be positive, but got ${amount}.`);
		}
		function validateDurationInFrames$2(durationInFrames, options) {
			const { allowFloats, component } = options;
			if (typeof durationInFrames === "undefined") throw new Error(`The "durationInFrames" prop ${component} is missing.`);
			if (typeof durationInFrames !== "number") throw new Error(`The "durationInFrames" prop ${component} must be a number, but you passed a value of type ${typeof durationInFrames}`);
			if (durationInFrames <= 0) throw new TypeError(`The "durationInFrames" prop ${component} must be positive, but got ${durationInFrames}.`);
			if (!allowFloats && durationInFrames % 1 !== 0) throw new TypeError(`The "durationInFrames" prop ${component} must be an integer, but got ${durationInFrames}.`);
			if (!Number.isFinite(durationInFrames)) throw new TypeError(`The "durationInFrames" prop ${component} must be finite, but got ${durationInFrames}.`);
		}
		function validateFps$2(fps, location, isGif) {
			if (typeof fps !== "number") throw new Error(`"fps" must be a number, but you passed a value of type ${typeof fps} ${location}`);
			if (!Number.isFinite(fps)) throw new Error(`"fps" must be a finite, but you passed ${fps} ${location}`);
			if (isNaN(fps)) throw new Error(`"fps" must not be NaN, but got ${fps} ${location}`);
			if (fps <= 0) throw new TypeError(`"fps" must be positive, but got ${fps} ${location}`);
			if (isGif && fps > 50) throw new TypeError(`The FPS for a GIF cannot be higher than 50. Use the --every-nth-frame option to lower the FPS: https://remotion.dev/docs/render-as-gif`);
		}
		var ResolveCompositionContext = (0, react.createContext)(null);
		var resolveCompositionsRef = (0, react.createRef)();
		var needsResolution = (composition) => {
			return Boolean(composition.calculateMetadata);
		};
		var useResolvedVideoConfig = (preferredCompositionId) => {
			const context = (0, react.useContext)(ResolveCompositionContext);
			const { props: allEditorProps } = (0, react.useContext)(EditorPropsContext);
			const { compositions, canvasContent, currentCompositionMetadata, currentAssetMetadata } = (0, react.useContext)(CompositionManager);
			const currentComposition = canvasContent?.type === "composition" ? canvasContent.compositionId : null;
			const compositionId = preferredCompositionId ?? currentComposition;
			const composition = compositions.find((c) => c.id === compositionId);
			const selectedEditorProps = (0, react.useMemo)(() => {
				return composition ? allEditorProps[composition.id] ?? {} : {};
			}, [allEditorProps, composition]);
			const env = useRemotionEnvironment();
			return (0, react.useMemo)(() => {
				if (preferredCompositionId === null && canvasContent?.type === "asset" && currentAssetMetadata?.asset === canvasContent.asset) return {
					type: "success",
					metadataSource: null,
					result: {
						...currentAssetMetadata,
						id: getAssetPreviewCompositionId(canvasContent.asset),
						defaultProps: {}
					}
				};
				if (!composition) return null;
				if (currentCompositionMetadata) return {
					type: "success",
					metadataSource: null,
					result: {
						...currentCompositionMetadata,
						id: composition.id,
						defaultProps: composition.defaultProps ?? {}
					}
				};
				if (!needsResolution(composition)) {
					validateDurationInFrames$2(composition.durationInFrames, {
						allowFloats: false,
						component: `in <Composition id="${composition.id}">`
					});
					validateFps$2(composition.fps, `in <Composition id="${composition.id}">`, false);
					validateDimension$2(composition.width, "width", `in <Composition id="${composition.id}">`);
					validateDimension$2(composition.height, "height", `in <Composition id="${composition.id}">`);
					return {
						type: "success",
						metadataSource: null,
						result: {
							width: composition.width,
							height: composition.height,
							fps: composition.fps,
							id: composition.id,
							durationInFrames: composition.durationInFrames,
							defaultProps: composition.defaultProps ?? {},
							props: {
								...composition.defaultProps ?? {},
								...selectedEditorProps ?? {},
								...typeof window === "undefined" || env.isPlayer || !window.remotion_inputProps ? {} : getInputProps() ?? {}
							},
							defaultCodec: null,
							defaultOutName: null,
							defaultVideoImageFormat: null,
							defaultPixelFormat: null,
							defaultProResProfile: null,
							defaultSampleRate: null
						}
					};
				}
				if (!context) return null;
				if (!context[composition.id]) return null;
				return context[composition.id];
			}, [
				composition,
				canvasContent,
				context,
				currentAssetMetadata,
				currentCompositionMetadata,
				preferredCompositionId,
				selectedEditorProps,
				env.isPlayer
			]);
		};
		var AssetPreviewComposition = () => null;
		var useVideo = () => {
			const { canvasContent, compositions, currentCompositionMetadata, currentAssetMetadata } = (0, react.useContext)(CompositionManager);
			const selected = compositions.find((c) => {
				return canvasContent?.type === "composition" && c.id === canvasContent.compositionId;
			});
			const resolved = useResolvedVideoConfig(selected?.id ?? null);
			return (0, react.useMemo)(() => {
				if (canvasContent?.type === "asset" && currentAssetMetadata?.asset === canvasContent.asset) return {
					...currentAssetMetadata,
					id: getAssetPreviewCompositionId(canvasContent.asset),
					defaultProps: {},
					component: AssetPreviewComposition
				};
				if (!resolved) return null;
				if (resolved.type === "error") return null;
				if (resolved.type === "loading") return null;
				if (!selected) return null;
				return {
					...resolved.result,
					defaultProps: selected.defaultProps ?? {},
					id: selected.id,
					...currentCompositionMetadata ?? {},
					component: selected.component
				};
			}, [
				canvasContent,
				currentAssetMetadata,
				currentCompositionMetadata,
				resolved,
				selected
			]);
		};
		var useUnsafeVideoConfig = () => {
			const context = (0, react.useContext)(SequenceContext);
			const ctxWidth = context?.width ?? null;
			const ctxHeight = context?.height ?? null;
			const ctxDuration = context?.durationInFrames ?? null;
			const video = useVideo();
			return (0, react.useMemo)(() => {
				if (!video) return null;
				const { id, durationInFrames, fps, height, width, defaultProps, props, defaultCodec, defaultOutName, defaultVideoImageFormat, defaultPixelFormat, defaultProResProfile, defaultSampleRate } = video;
				return {
					id,
					width: ctxWidth ?? width,
					height: ctxHeight ?? height,
					fps,
					durationInFrames: ctxDuration ?? durationInFrames,
					defaultProps,
					props,
					defaultCodec,
					defaultOutName,
					defaultVideoImageFormat,
					defaultPixelFormat,
					defaultProResProfile,
					defaultSampleRate
				};
			}, [
				ctxDuration,
				ctxHeight,
				ctxWidth,
				video
			]);
		};
		var CurrentScaleContext = react.default.createContext(null);
		var PreviewSizeContext = (0, react.createContext)({
			setSize: () => {},
			size: {
				size: "auto",
				translation: {
					x: 0,
					y: 0
				}
			}
		});
		var calculateScale = ({ canvasSize, compositionHeight, compositionWidth, previewSize }) => {
			const heightRatio = canvasSize.height / compositionHeight;
			const widthRatio = canvasSize.width / compositionWidth;
			const ratio = Math.min(heightRatio, widthRatio);
			if (previewSize === "auto") {
				if (ratio === 0) return 1;
				return ratio;
			}
			return Number(previewSize);
		};
		var useCurrentScale = (options) => {
			const hasContext = react.default.useContext(CurrentScaleContext);
			const zoomContext = react.default.useContext(PreviewSizeContext);
			const config = useUnsafeVideoConfig();
			const env = useRemotionEnvironment();
			const [portalScale, setPortalScale] = react.default.useState(getPortalNodeCurrentScale);
			react.default.useEffect(() => {
				const update = () => setPortalScale(getPortalNodeCurrentScale());
				update();
				return subscribeToPortalNodeCurrentScale(update);
			}, []);
			if (hasContext === null || config === null || zoomContext === null) {
				if (options?.dontThrowIfOutsideOfRemotion) return 1;
				if (env.isRendering) return 1;
				throw new Error([
					"useCurrentScale() was called outside of a Remotion context.",
					"This hook can only be called in a component that is being rendered by Remotion.",
					"If you want to this hook to return 1 outside of Remotion, pass {dontThrowIfOutsideOfRemotion: true} as an option.",
					"If you think you called this hook in a Remotion component, make sure all versions of Remotion are aligned."
				].join(`
`));
			}
			if (hasContext.type === "scale") return hasContext.scale;
			return portalScale;
		};
		var rotate = { transform: `rotate(90deg)` };
		var ICON_SIZE$1 = 40;
		var LABEL_SIZE = 14;
		var label$1 = {
			color: "rgba(255, 255, 255, 0.8)",
			fontFamily: "sans-serif"
		};
		var container = {
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: "#1f2428"
		};
		var content = {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			animation: "anim 2s",
			animationFillMode: "forwards"
		};
		var Loading = () => {
			const scale = useCurrentScale({ dontThrowIfOutsideOfRemotion: true });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(AbsoluteFillElement, {
				style: container,
				id: "remotion-comp-loading",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", {
					type: "text/css",
					children: `
				@keyframes anim {
					from {
						opacity: 0
					}
					to {
						opacity: 1
					}
				}
			`
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					id: "remotion-comp-loading-content",
					style: content,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						width: ICON_SIZE$1 / scale,
						height: ICON_SIZE$1 / scale,
						viewBox: "-100 -100 400 400",
						style: rotate,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							fill: "#555",
							stroke: "#555",
							strokeWidth: "100",
							strokeLinejoin: "round",
							d: "M 2 172 a 196 100 0 0 0 195 5 A 196 240 0 0 0 100 2.259 A 196 240 0 0 0 2 172 z"
						})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						style: {
							...label$1,
							fontSize: LABEL_SIZE / scale
						},
						children: [
							"Resolving ",
							"<Suspense>",
							"..."
						]
					})]
				})]
			});
		};
		var getErrorStackWithMessage = (error) => {
			const stack = error.stack ?? "";
			return stack.startsWith("Error:") ? stack : `${error.message}
${stack}`;
		};
		var isErrorLike = (err) => {
			if (err instanceof Error) return true;
			if (err === null) return false;
			if (typeof err !== "object") return false;
			if (!("stack" in err)) return false;
			if (typeof err.stack !== "string") return false;
			if (!("message" in err)) return false;
			if (typeof err.message !== "string") return false;
			return true;
		};
		function cancelRenderInternal(scope, err) {
			let error;
			if (isErrorLike(err)) {
				error = err;
				if (!error.stack) error.stack = new Error(error.message).stack;
			} else if (typeof err === "string") error = Error(err);
			else error = Error("Rendering was cancelled");
			if (scope) scope.remotion_cancelledError = getErrorStackWithMessage(error);
			throw error;
		}
		function cancelRender(err) {
			return cancelRenderInternal(typeof window !== "undefined" ? window : void 0, err);
		}
		var DELAY_RENDER_CALLSTACK_TOKEN$1 = "The delayRender was called:";
		var DELAY_RENDER_RETRIES_LEFT$1 = "Retries left: ";
		var DELAY_RENDER_RETRY_TOKEN$1 = "- Rendering the frame will be retried.";
		var DELAY_RENDER_CLEAR_TOKEN$1 = "handle was cleared after";
		var logLevels = [
			"trace",
			"verbose",
			"info",
			"warn",
			"error"
		];
		var getNumberForLogLevel = (level) => {
			return logLevels.indexOf(level);
		};
		var isEqualOrBelowLogLevel = (currentLevel, level) => {
			return getNumberForLogLevel(currentLevel) <= getNumberForLogLevel(level);
		};
		var transformArgs = ({ args, logLevel, tag }) => {
			const arr = [...args];
			if (getRemotionEnvironment().isRendering && !getRemotionEnvironment().isClientSideRendering) arr.unshift(Symbol.for(`__remotion_level_${logLevel}`));
			if (tag && getRemotionEnvironment().isRendering && !getRemotionEnvironment().isClientSideRendering) arr.unshift(Symbol.for(`__remotion_tag_${tag}`));
			return arr;
		};
		var verbose = (options, ...args) => {
			if (isEqualOrBelowLogLevel(options.logLevel, "verbose")) return console.debug(...transformArgs({
				args,
				logLevel: "verbose",
				tag: options.tag
			}));
		};
		var trace = (options, ...args) => {
			if (isEqualOrBelowLogLevel(options.logLevel, "trace")) return console.debug(...transformArgs({
				args,
				logLevel: "trace",
				tag: options.tag
			}));
		};
		var info = (options, ...args) => {
			if (isEqualOrBelowLogLevel(options.logLevel, "info")) return console.log(...transformArgs({
				args,
				logLevel: "info",
				tag: options.tag
			}));
		};
		var warn = (options, ...args) => {
			if (isEqualOrBelowLogLevel(options.logLevel, "warn")) return console.warn(...transformArgs({
				args,
				logLevel: "warn",
				tag: options.tag
			}));
		};
		var error = (options, ...args) => {
			return console.error(...transformArgs({
				args,
				logLevel: "error",
				tag: options.tag
			}));
		};
		var Log = {
			trace,
			verbose,
			info,
			warn,
			error
		};
		if (typeof window !== "undefined") {
			window.remotion_renderReady = false;
			if (!window.remotion_delayRenderTimeouts) window.remotion_delayRenderTimeouts = {};
			window.remotion_delayRenderHandles = [];
		}
		var defaultTimeout = 3e4;
		var delayRenderInternal = ({ scope, environment, label: label2, options }) => {
			if (typeof label2 !== "string" && label2 !== null) throw new Error("The label parameter of delayRender() must be a string or undefined, got: " + JSON.stringify(label2));
			const handle = Math.random();
			scope.remotion_delayRenderHandles.push(handle);
			const called = Error().stack?.replace(/^Error/g, "") ?? "";
			if (environment.isRendering) {
				const timeoutToUse = Math.max(0, (options?.timeoutInMilliseconds ?? scope.remotion_puppeteerTimeout ?? defaultTimeout) - 2e3);
				const retriesLeft = (options?.retries ?? 0) - (scope.remotion_attempt - 1);
				scope.remotion_delayRenderTimeouts[handle] = {
					label: label2 ?? null,
					startTime: Date.now(),
					timeout: setTimeout(() => {
						const message = [
							`A delayRender()`,
							label2 ? `"${label2}"` : null,
							`was called but not cleared after ${timeoutToUse}ms. See https://remotion.dev/docs/timeout for help.`,
							retriesLeft > 0 ? DELAY_RENDER_RETRIES_LEFT$1 + retriesLeft : null,
							retriesLeft > 0 ? DELAY_RENDER_RETRY_TOKEN$1 : null,
							DELAY_RENDER_CALLSTACK_TOKEN$1,
							called
						].filter(truthy$1).join(" ");
						if (environment.isClientSideRendering) scope.remotion_cancelledError = getErrorStackWithMessage(Error(message));
						else cancelRenderInternal(scope, Error(message));
					}, timeoutToUse)
				};
			}
			scope.remotion_renderReady = false;
			return handle;
		};
		var continueRenderInternal = ({ scope, handle, environment, logLevel }) => {
			if (typeof handle === "undefined") throw new TypeError("The continueRender() method must be called with a parameter that is the return value of delayRender(). No value was passed.");
			if (typeof handle !== "number") throw new TypeError("The parameter passed into continueRender() must be the return value of delayRender() which is a number. Got: " + JSON.stringify(handle));
			const handleExists = scope.remotion_delayRenderHandles.includes(handle);
			const timeoutEntry = scope.remotion_delayRenderTimeouts[handle];
			if (handleExists && environment.isRendering && timeoutEntry) {
				const { label: label2, startTime, timeout } = timeoutEntry;
				clearTimeout(timeout);
				const message = [
					label2 ? `"${label2}"` : "A handle",
					DELAY_RENDER_CLEAR_TOKEN$1,
					`${Date.now() - startTime}ms`
				].filter(truthy$1).join(" ");
				Log.verbose({
					logLevel,
					tag: "delayRender()"
				}, message);
				delete scope.remotion_delayRenderTimeouts[handle];
			}
			scope.remotion_delayRenderHandles = scope.remotion_delayRenderHandles.filter((h) => h !== handle);
			if (scope.remotion_delayRenderHandles.length === 0) scope.remotion_renderReady = true;
		};
		var LogLevelContext = (0, react.createContext)({
			logLevel: "info",
			mountTime: 0
		});
		var useLogLevel = () => {
			const { logLevel } = react.useContext(LogLevelContext);
			if (logLevel === null) throw new Error("useLogLevel must be used within a LogLevelProvider");
			return logLevel;
		};
		var useMountTime = () => {
			const { mountTime } = react.useContext(LogLevelContext);
			if (mountTime === null) throw new Error("useMountTime must be used within a LogLevelProvider");
			return mountTime;
		};
		var DelayRenderContextType = (0, react.createContext)(null);
		var useDelayRender = () => {
			const environment = useRemotionEnvironment();
			const scope = (0, react.useContext)(DelayRenderContextType) ?? (typeof window !== "undefined" ? window : void 0);
			const logLevel = useLogLevel();
			return {
				delayRender: (0, react.useCallback)((label2, options) => {
					if (!scope) return Math.random();
					return delayRenderInternal({
						scope,
						environment,
						label: label2 ?? null,
						options: options ?? {}
					});
				}, [environment, scope]),
				continueRender: (0, react.useCallback)((handle) => {
					if (!scope) return;
					continueRenderInternal({
						scope,
						handle,
						environment,
						logLevel
					});
				}, [
					environment,
					logLevel,
					scope
				]),
				cancelRender: (0, react.useCallback)((err) => {
					return cancelRenderInternal(scope ?? (typeof window !== "undefined" ? window : void 0), err);
				}, [scope])
			};
		};
		var useLazyComponent = ({ compProps, componentName, noSuspense }) => {
			const componentRef = (0, react.useRef)(null);
			if ("component" in compProps) componentRef.current = compProps.component;
			return (0, react.useMemo)(() => {
				if ("component" in compProps) {
					if (typeof document === "undefined" || noSuspense) return compProps.component;
					if (typeof compProps.component === "undefined") throw new Error(`A value of \`undefined\` was passed to the \`component\` prop. Check the value you are passing to the <${componentName}/> component.`);
					const Wrapper = (props) => {
						const Comp = componentRef.current;
						return react.default.createElement(Comp, props);
					};
					return Wrapper;
				}
				if ("lazyComponent" in compProps && typeof compProps.lazyComponent !== "undefined") {
					if (typeof compProps.lazyComponent === "undefined") throw new Error(`A value of \`undefined\` was passed to the \`lazyComponent\` prop. Check the value you are passing to the <${componentName}/> component.`);
					return react.default.lazy(compProps.lazyComponent);
				}
				throw new Error("You must pass either 'component' or 'lazyComponent'");
			}, [compProps.lazyComponent]);
		};
		var getRegex2 = () => /^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g;
		var isCompositionIdValid = (id) => id.match(getRegex2());
		var validateCompositionId = (id) => {
			if (!isCompositionIdValid(id)) throw new Error(`Composition id can only contain a-z, A-Z, 0-9, CJK characters and -. You passed ${id}`);
		};
		var invalidCompositionErrorMessage = `Composition ID must match ${String(getRegex2())}`;
		var validateDefaultAndInputProps$2 = (defaultProps, name, compositionId) => {
			if (!defaultProps) return;
			if (typeof defaultProps !== "object") throw new Error(`"${name}" must be an object, but you passed a value of type ${typeof defaultProps}`);
			if (Array.isArray(defaultProps)) throw new Error(`"${name}" must be an object, an array was passed ${compositionId ? `for composition "${compositionId}"` : ""}`);
		};
		var Fallback = () => {
			const { continueRender: continueRender2, delayRender: delayRender2 } = useDelayRender();
			(0, react.useEffect)(() => {
				const fallback = delayRender2("Waiting for Root component to unsuspend");
				return () => continueRender2(fallback);
			}, [continueRender2, delayRender2]);
			return null;
		};
		var InnerComposition = ({ width, height, fps, durationInFrames, id, defaultProps, schema, ...compProps }) => {
			const { registerComposition, unregisterComposition } = (0, react.useContext)(CompositionSetters);
			const video = useVideo();
			const lazy = useLazyComponent({
				compProps,
				componentName: "Composition",
				noSuspense: false
			});
			const isPlayer = useIsPlayer();
			const environment = useRemotionEnvironment();
			const canUseComposition = (0, react.useContext)(CanUseRemotionHooks);
			if (typeof window !== "undefined") window.remotion_seenCompositionIds = Array.from(/* @__PURE__ */ new Set([...window.remotion_seenCompositionIds ?? [], id]));
			if (canUseComposition) {
				if (isPlayer) throw new Error("<Composition> was mounted inside the `component` that was passed to the <Player>. See https://remotion.dev/docs/wrong-composition-mount for help.");
				throw new Error("<Composition> mounted inside another composition. See https://remotion.dev/docs/wrong-composition-mount for help.");
			}
			const { folderName, parentName } = (0, react.useContext)(FolderContext);
			const stack = compProps._remotionInternalStack ?? null;
			const componentFromProps = "component" in compProps ? resolveComponentIdentity(compProps.component) : null;
			(0, react.useEffect)(() => {
				if (!id) throw new Error("No id for composition passed.");
				validateCompositionId(id);
				validateDefaultAndInputProps$2(defaultProps, "defaultProps", id);
				registerComposition({
					durationInFrames: durationInFrames ?? void 0,
					fps: fps ?? void 0,
					height: height ?? void 0,
					width: width ?? void 0,
					id,
					folderName,
					component: lazy,
					defaultProps: serializeThenDeserializeInStudio(defaultProps ?? {}),
					order: null,
					parentFolderName: parentName,
					componentFromProps,
					schema: schema ?? null,
					calculateMetadata: compProps.calculateMetadata ?? null,
					stack
				});
				return () => {
					unregisterComposition(id);
				};
			}, [
				durationInFrames,
				fps,
				height,
				lazy,
				id,
				folderName,
				defaultProps,
				width,
				parentName,
				componentFromProps,
				schema,
				compProps.calculateMetadata,
				stack,
				registerComposition,
				unregisterComposition
			]);
			const resolved = useResolvedVideoConfig(id);
			const { setError, clearError } = (0, react.useContext)(CompositionRenderErrorContext);
			const onError = (0, react.useCallback)((error2) => {
				setError(error2);
			}, [setError]);
			const onClear = (0, react.useCallback)(() => {
				clearError();
			}, [clearError]);
			if (environment.isStudio && video && video.component === lazy && video.id === id) {
				const Comp = lazy;
				if (resolved === null || resolved.type !== "success" && resolved.type !== "success-and-refreshing") return null;
				return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanUseRemotionHooksProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionErrorBoundary, {
					onError,
					onClear,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
						fallback: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Loading, {}),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Comp, { ...resolved.result.props ?? {} })
					})
				}) }), portalNode());
			}
			if (environment.isRendering && video && video.component === lazy && video.id === id) {
				const Comp = lazy;
				if (resolved === null || resolved.type !== "success" && resolved.type !== "success-and-refreshing") return null;
				return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanUseRemotionHooksProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
					fallback: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Fallback, {}),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Comp, { ...resolved.result.props ?? {} })
				}) }), portalNode());
			}
			return null;
		};
		var Composition = (props) => {
			const { onlyRenderComposition } = (0, react.useContext)(CompositionSetters);
			const environment = useRemotionEnvironment();
			if (onlyRenderComposition && onlyRenderComposition !== props.id) return null;
			const composition = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InnerComposition, { ...props });
			return environment.isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionOrderMarker, {
				compositionId: props.id,
				children: composition
			}) : composition;
		};
		var VERSION = "4.0.526";
		var checkMultipleRemotionVersions = () => {
			if (typeof globalThis === "undefined") return;
			const set = () => {
				globalThis.remotion_imported = VERSION;
				if (typeof window !== "undefined") window.remotion_imported = VERSION;
			};
			const alreadyImported = globalThis.remotion_imported || typeof window !== "undefined" && window.remotion_imported;
			if (alreadyImported) {
				if (alreadyImported === "4.0.526") return;
				if (typeof alreadyImported === "string" && alreadyImported.includes("webcodecs")) {
					set();
					return;
				}
				throw new TypeError(`\uD83D\uDEA8 Multiple versions of Remotion detected: ${[VERSION, typeof alreadyImported === "string" ? alreadyImported : "an older version"].filter(truthy$1).join(" and ")}. This will cause things to break in an unexpected way.
Check that all your Remotion packages are on the same version. If your dependencies depend on Remotion, make them peer dependencies. You can also run \`npx remotion versions\` from your terminal to see which versions are mismatching.`);
			}
			set();
		};
		var exports_timeline_position_state = {};
		__export(exports_timeline_position_state, {
			useTimelineSetFrame: () => useTimelineSetFrame,
			useTimelinePosition: () => useTimelinePosition,
			useTimelineContext: () => useTimelineContext,
			usePlaying: () => usePlaying,
			usePlaybackRate: () => usePlaybackRate,
			useIsInsideFreeze: () => useIsInsideFreeze,
			useBuffering: () => useBuffering,
			useAbsoluteTimelinePosition: () => useAbsoluteTimelinePosition,
			persistCurrentFrame: () => persistCurrentFrame,
			getInitialFrameState: () => getInitialFrameState,
			getFrameForComposition: () => getFrameForComposition,
			clampFrameToCompositionRange: () => clampFrameToCompositionRange
		});
		var createRuntimeValueStore = (initialSnapshot) => {
			let snapshot = initialSnapshot;
			const listeners = /* @__PURE__ */ new Set();
			return {
				store: {
					getSnapshot: () => snapshot,
					subscribe: (listener) => {
						listeners.add(listener);
						return () => {
							listeners.delete(listener);
						};
					}
				},
				setSnapshot: (newSnapshot) => {
					if (snapshot === newSnapshot) return;
					snapshot = newSnapshot;
					for (const listener of listeners) listener(snapshot);
				}
			};
		};
		var missingSetTimelineContext = () => {
			throw new Error("SetTimelineContext is missing. This is likely caused by a Remotion version mismatch.");
		};
		var SetTimelineContext = (0, react.createContext)({
			setFrame: missingSetTimelineContext,
			setPlaying: missingSetTimelineContext,
			setBuffering: missingSetTimelineContext,
			subscribePlaying: () => () => {},
			subscribeBuffering: () => () => {},
			isPlaying: () => false,
			isBuffering: missingSetTimelineContext,
			frameRef: { current: {} },
			audioAndVideoTags: { current: [] }
		});
		var TimelineContext = (0, react.createContext)(null);
		var PlaybackRateContext = (0, react.createContext)(null);
		var AbsoluteTimeContext = (0, react.createContext)(null);
		var TimelineContextProvider = ({ children, frameState }) => {
			const playingStore = (0, react.useMemo)(() => createRuntimeValueStore({ playing: false }), []);
			const bufferingStore = (0, react.useMemo)(() => createRuntimeValueStore({ buffering: false }), []);
			const [playbackRate, setPlaybackRate] = (0, react.useState)(1);
			const audioAndVideoTags = (0, react.useRef)([]);
			const [_frame, setFrame] = (0, react.useState)(() => getInitialFrameState());
			const frame = frameState ?? _frame;
			const frameRef = (0, react.useRef)(frame);
			frameRef.current = frame;
			const readIsPlaying = (0, react.useCallback)(() => playingStore.store.getSnapshot().playing, [playingStore]);
			const readIsBuffering = (0, react.useCallback)(() => bufferingStore.store.getSnapshot().buffering, [bufferingStore]);
			const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
			if (typeof window !== "undefined") (0, react.useLayoutEffect)(() => {
				window.remotion_setFrame = (f, composition, attempt) => {
					window.remotion_attempt = attempt;
					const id = delayRender2(`Setting the current frame to ${f}`);
					let asyncUpdate = true;
					setFrame((s) => {
						if ((s[composition] ?? window.remotion_initialFrame) === f) {
							asyncUpdate = false;
							return s;
						}
						return {
							...s,
							[composition]: f
						};
					});
					if (asyncUpdate) requestAnimationFrame(() => continueRender2(id));
					else continueRender2(id);
				};
				window.remotion_isPlayer = false;
			}, [continueRender2, delayRender2]);
			const timelineContextValue = (0, react.useMemo)(() => {
				return {
					frame,
					isPlaying: readIsPlaying,
					isInsideFreeze: false,
					audioAndVideoTags
				};
			}, [frame, readIsPlaying]);
			const playbackRateContextValue = (0, react.useMemo)(() => {
				return {
					playbackRate,
					setPlaybackRate
				};
			}, [playbackRate]);
			const setTimelineContextValue = (0, react.useMemo)(() => {
				return {
					setFrame,
					setPlaying: (updater) => {
						const current = playingStore.store.getSnapshot().playing;
						const next = typeof updater === "function" ? updater(current) : updater;
						if (current !== next) playingStore.setSnapshot({ playing: next });
					},
					setBuffering: (buffering) => {
						if (readIsBuffering() !== buffering) bufferingStore.setSnapshot({ buffering });
					},
					subscribePlaying: playingStore.store.subscribe,
					subscribeBuffering: bufferingStore.store.subscribe,
					isPlaying: readIsPlaying,
					isBuffering: readIsBuffering,
					frameRef,
					audioAndVideoTags
				};
			}, [
				bufferingStore,
				playingStore,
				readIsBuffering,
				readIsPlaying
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AbsoluteTimeContext.Provider, {
				value: timelineContextValue,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlaybackRateContext.Provider, {
					value: playbackRateContextValue,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TimelineContext.Provider, {
						value: timelineContextValue,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SetTimelineContext.Provider, {
							value: setTimelineContextValue,
							children
						})
					})
				})
			});
		};
		var objectIs = typeof Object.is === "function" ? Object.is : (first, second) => first === second && (first !== 0 || 1 / first === 1 / second) || Number.isNaN(first) && Number.isNaN(second);
		var checkIfSnapshotChanged = (instance) => {
			try {
				return !objectIs(instance.value, instance.getSnapshot());
			} catch {
				return true;
			}
		};
		var useSyncExternalStoreShimClient = (subscribe, getSnapshot) => {
			const value = getSnapshot();
			const [{ instance }, forceUpdate] = react.useState({ instance: {
				value,
				getSnapshot
			} });
			react.useLayoutEffect(() => {
				instance.value = value;
				instance.getSnapshot = getSnapshot;
				if (checkIfSnapshotChanged(instance)) forceUpdate({ instance });
			}, [
				getSnapshot,
				instance,
				subscribe,
				value
			]);
			react.useEffect(() => {
				if (checkIfSnapshotChanged(instance)) forceUpdate({ instance });
				return subscribe(() => {
					if (checkIfSnapshotChanged(instance)) forceUpdate({ instance });
				});
			}, [instance, subscribe]);
			react.useDebugValue(value);
			return value;
		};
		var useSyncExternalStoreShimServer = (_subscribe, getSnapshot) => getSnapshot();
		var shim = typeof window === "undefined" || typeof window.document === "undefined" || typeof window.document.createElement === "undefined" ? useSyncExternalStoreShimServer : useSyncExternalStoreShimClient;
		var useSyncExternalStore2 = react.useSyncExternalStore ?? shim;
		var usePlaying = () => {
			const { isPlaying } = useTimelineContext();
			const { subscribePlaying } = (0, react.useContext)(SetTimelineContext);
			return useSyncExternalStore2(subscribePlaying, isPlaying, isPlaying);
		};
		var useBuffering = () => {
			const { isBuffering, subscribeBuffering } = (0, react.useContext)(SetTimelineContext);
			return useSyncExternalStore2(subscribeBuffering, isBuffering, isBuffering);
		};
		var makeKey = () => {
			return `remotion.time-all`;
		};
		var persistCurrentFrame = (time) => {
			localStorage.setItem(makeKey(), JSON.stringify(time));
		};
		var getInitialFrameState = () => {
			const item = localStorage.getItem(makeKey()) ?? "{}";
			return JSON.parse(item);
		};
		var getFrameForComposition = (composition) => {
			const item = localStorage.getItem(makeKey()) ?? "{}";
			const obj = JSON.parse(item);
			if (obj[composition] !== void 0) return Number(obj[composition]);
			if (typeof window === "undefined") return 0;
			return window.remotion_initialFrame ?? 0;
		};
		var clampFrameToCompositionRange = (frame, durationInFrames) => {
			return Math.max(0, Math.min(Math.max(0, durationInFrames - 1), frame));
		};
		var useTimelinePositionFromContext = (state) => {
			const videoConfig = useVideo();
			const env = useRemotionEnvironment();
			if (!videoConfig) return typeof window === "undefined" ? 0 : window.remotion_initialFrame ?? 0;
			return clampFrameToCompositionRange(state.frame[videoConfig.id] ?? (env.isPlayer ? 0 : getFrameForComposition(videoConfig.id)), videoConfig.durationInFrames);
		};
		var useTimelineContext = () => {
			const state = (0, react.useContext)(TimelineContext);
			if (state === null) throw new Error("TimelineContext is not available. This hook must be used inside a <Player> or the Remotion Studio.");
			return state;
		};
		var usePlaybackRate = () => {
			const state = (0, react.useContext)(PlaybackRateContext);
			if (state === null) throw new Error("PlaybackRateContext is not available. This hook must be used inside a <Player> or the Remotion Studio.");
			return state;
		};
		var useTimelinePosition = () => {
			return useTimelinePositionFromContext(useTimelineContext());
		};
		var useIsInsideFreeze = () => {
			return useTimelineContext().isInsideFreeze;
		};
		var useAbsoluteTimelinePosition = () => {
			const state = (0, react.useContext)(AbsoluteTimeContext);
			if (state === null) throw new Error("AbsoluteTimeContext is not available. This hook must be used inside a <Player> or the Remotion Studio.");
			return useTimelinePositionFromContext(state);
		};
		var useTimelineSetFrame = () => {
			const { setFrame } = (0, react.useContext)(SetTimelineContext);
			return setFrame;
		};
		var useCurrentFrame = () => {
			const canUseRemotionHooks = (0, react.useContext)(CanUseRemotionHooks);
			const env = useRemotionEnvironment();
			if (!canUseRemotionHooks) {
				if (env.isPlayer) throw new Error(`useCurrentFrame can only be called inside a component that was passed to <Player>. See: https://www.remotion.dev/docs/player/examples`);
				throw new Error(`useCurrentFrame() can only be called inside a component that was registered as a composition. See https://www.remotion.dev/docs/the-fundamentals#defining-compositions`);
			}
			const frame = useTimelinePosition();
			const context = (0, react.useContext)(SequenceContext);
			return frame - (context ? context.cumulatedFrom + context.relativeFrom : 0);
		};
		var useVideoConfig = () => {
			const videoConfig = useUnsafeVideoConfig();
			const context = (0, react.useContext)(CanUseRemotionHooks);
			const isPlayer = useIsPlayer();
			if (!videoConfig) {
				if (typeof window !== "undefined" && window.remotion_isPlayer || isPlayer) throw new Error([
					"No video config found. Likely reasons:",
					"- You are probably calling useVideoConfig() from outside the component passed to <Player />. See https://www.remotion.dev/docs/player/examples for how to set up the Player correctly.",
					"- You have multiple versions of Remotion installed which causes the React context to get lost."
				].join("-"));
				throw new Error("No video config found. You are probably calling useVideoConfig() from a component which has not been registered as a <Composition />. See https://www.remotion.dev/docs/the-fundamentals#defining-compositions for more information.");
			}
			if (!context) throw new Error("Called useVideoConfig() outside a Remotion composition.");
			return videoConfig;
		};
		var Freeze = ({ frame: frameToFreeze, children, active = true }) => {
			const frame = useCurrentFrame();
			const videoConfig = useVideoConfig();
			if (typeof frameToFreeze === "undefined") throw new Error(`The <Freeze /> component requires a 'frame' prop, but none was passed.`);
			if (typeof frameToFreeze !== "number") throw new Error(`The 'frame' prop of <Freeze /> must be a number, but is of type ${typeof frameToFreeze}`);
			if (Number.isNaN(frameToFreeze)) throw new Error(`The 'frame' prop of <Freeze /> must be a real number, but it is NaN.`);
			if (!Number.isFinite(frameToFreeze)) throw new Error(`The 'frame' prop of <Freeze /> must be a finite number, but it is ${frameToFreeze}.`);
			const isActive = (0, react.useMemo)(() => {
				if (typeof active === "boolean") return active;
				if (typeof active === "function") return active(frame);
			}, [active, frame]);
			const timelineContext = useTimelineContext();
			const sequenceContext = (0, react.useContext)(SequenceContext);
			const relativeFrom = sequenceContext?.relativeFrom ?? 0;
			const timelineValue = (0, react.useMemo)(() => {
				if (!isActive) return timelineContext;
				return {
					...timelineContext,
					isPlaying: () => false,
					isInsideFreeze: true,
					frame: { [videoConfig.id]: frameToFreeze + relativeFrom }
				};
			}, [
				isActive,
				timelineContext,
				videoConfig.id,
				frameToFreeze,
				relativeFrom
			]);
			const newSequenceContext = (0, react.useMemo)(() => {
				if (!sequenceContext) return null;
				if (!isActive) return sequenceContext;
				return {
					...sequenceContext,
					cumulatedFrom: 0
				};
			}, [sequenceContext, isActive]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TimelineContext.Provider, {
				value: timelineValue,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceContext.Provider, {
					value: newSequenceContext,
					children
				})
			});
		};
		var captionsSchema = { captions: {
			type: "remotion-captions",
			default: void 0,
			description: "Captions",
			keyframable: false
		} };
		var transformSchema$1 = {
			"style.transformOrigin": {
				type: "transform-origin",
				step: 1,
				default: "50% 50%",
				description: "Transform origin"
			},
			"style.translate": {
				type: "translate",
				step: 1,
				default: "0px 0px",
				description: "Offset"
			},
			"style.scale": {
				type: "scale",
				max: 100,
				step: .01,
				default: 1,
				description: "Scale",
				defaultKeyframeOutput: "perceptual-scale"
			},
			"style.rotate": {
				type: "rotation-css",
				step: 1,
				default: "0deg",
				description: "Rotation"
			},
			"style.opacity": {
				type: "number",
				min: 0,
				max: 1,
				step: .01,
				default: 1,
				description: "Opacity",
				hiddenFromList: false
			}
		};
		var sequenceVisualStyleSchema = transformSchema$1;
		var textSchema = {
			"style.color": {
				type: "color",
				default: void 0,
				description: "Color"
			},
			"style.fontFamily": {
				type: "font-family",
				default: void 0,
				description: "Font family",
				keyframable: false
			},
			"style.fontSize": {
				type: "number",
				default: void 0,
				min: 0,
				step: 1,
				description: "Font size",
				hiddenFromList: false
			},
			"style.lineHeight": {
				type: "number",
				default: void 0,
				min: 0,
				step: .05,
				description: "Line height",
				hiddenFromList: false
			},
			"style.fontWeight": {
				type: "font-weight",
				default: 400,
				description: "Font weight"
			},
			"style.fontStyle": {
				type: "enum",
				default: "normal",
				description: "Font style",
				variants: {
					normal: {},
					italic: {},
					oblique: {}
				}
			},
			"style.textAlign": {
				type: "enum",
				default: "left",
				description: "Text align",
				variants: {
					left: {},
					center: {},
					right: {},
					justify: {},
					start: {},
					end: {}
				}
			},
			"style.letterSpacing": {
				type: "number",
				default: void 0,
				step: .1,
				description: "Letter spacing",
				hiddenFromList: false
			}
		};
		var borderSchema$1 = {
			"style.borderWidth": {
				type: "number",
				default: void 0,
				min: 0,
				step: 1,
				description: "Border width",
				hiddenFromList: false
			},
			"style.borderStyle": {
				type: "enum",
				default: "none",
				description: "Border style",
				variants: {
					none: {},
					hidden: {},
					solid: {},
					dashed: {},
					dotted: {},
					double: {},
					groove: {},
					ridge: {},
					inset: {},
					outset: {}
				}
			},
			"style.borderColor": {
				type: "color",
				default: void 0,
				description: "Border color"
			}
		};
		var borderRadiusSchema$1 = {
			"style.borderRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Border radius",
				hiddenFromList: false,
				keyframable: true
			},
			"style.borderTopLeftRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Top left radius",
				hiddenFromList: false
			},
			"style.borderTopRightRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Top right radius",
				hiddenFromList: false
			},
			"style.borderBottomRightRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Bottom right radius",
				hiddenFromList: false
			},
			"style.borderBottomLeftRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Bottom left radius",
				hiddenFromList: false
			}
		};
		var backgroundSchema$1 = { "style.backgroundColor": {
			type: "color",
			default: "transparent",
			description: "Color"
		} };
		var svgStrokeSchema = {
			color: {
				type: "color",
				default: void 0,
				description: "Current color"
			},
			stroke: {
				type: "color",
				default: "none",
				description: "Stroke"
			},
			strokeWidth: {
				type: "number",
				default: 1,
				description: "Stroke width",
				min: 0,
				step: 1,
				hiddenFromList: false
			}
		};
		var svgPaintSchema = {
			fill: {
				type: "color",
				default: void 0,
				description: "Fill"
			},
			...svgStrokeSchema
		};
		var textContentSchema = { children: {
			type: "text-content",
			default: "",
			description: "Text",
			keyframable: false
		} };
		var premountSchema = {
			premountFor: {
				type: "number",
				default: 0,
				description: "Premount For",
				min: 0,
				step: 1,
				hiddenFromList: false,
				keyframable: false
			},
			postmountFor: {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				hiddenFromList: true,
				keyframable: false
			}
		};
		var sequencePremountSchema$1 = { ...premountSchema };
		var cropSchema = {
			cropLeft: {
				type: "number",
				default: 0,
				description: "Crop left",
				min: 0,
				max: 1,
				step: .01,
				hiddenFromList: false,
				keyframable: true
			},
			cropRight: {
				type: "number",
				default: 0,
				description: "Crop right",
				min: 0,
				max: 1,
				step: .01,
				hiddenFromList: false,
				keyframable: true
			},
			cropTop: {
				type: "number",
				default: 0,
				description: "Crop top",
				min: 0,
				max: 1,
				step: .01,
				hiddenFromList: false,
				keyframable: true
			},
			cropBottom: {
				type: "number",
				default: 0,
				description: "Crop bottom",
				min: 0,
				max: 1,
				step: .01,
				hiddenFromList: false,
				keyframable: true
			}
		};
		var sequenceCropSchema = cropSchema;
		var sequenceStyleSchema = {
			...sequenceCropSchema,
			...transformSchema$1,
			...backgroundSchema$1,
			...borderSchema$1,
			...borderRadiusSchema$1,
			...sequencePremountSchema$1
		};
		var hiddenField = {
			type: "boolean",
			default: false,
			description: "Hidden"
		};
		var showInTimelineField = { type: "hidden" };
		var sequenceNameField = { type: "hidden" };
		var extendSchemaWithSequenceName = (schema) => {
			return {
				name: sequenceNameField,
				...schema
			};
		};
		var durationInFramesField = {
			type: "number",
			default: void 0,
			min: 1,
			step: 1,
			hiddenFromList: true
		};
		var fromField = {
			type: "number",
			default: 0,
			step: 1,
			hiddenFromList: true
		};
		var trimBeforeField = {
			type: "number",
			default: 0,
			min: 0,
			step: 1,
			hiddenFromList: true
		};
		var freezeField = {
			type: "number",
			default: null,
			step: 1,
			hiddenFromList: true
		};
		var baseSchema = {
			durationInFrames: durationInFramesField,
			from: fromField,
			trimBefore: trimBeforeField,
			freeze: freezeField,
			hidden: hiddenField,
			name: sequenceNameField,
			showInTimeline: showInTimelineField
		};
		var sequenceSchema$1 = {
			...baseSchema,
			layout: {
				type: "enum",
				default: "absolute-fill",
				description: "Layout",
				variants: {
					"absolute-fill": sequenceStyleSchema,
					none: {}
				}
			}
		};
		var sequenceSchemaWithoutFrom = {
			durationInFrames: durationInFramesField,
			trimBefore: trimBeforeField,
			freeze: freezeField,
			hidden: hiddenField,
			name: sequenceNameField,
			showInTimeline: showInTimelineField,
			layout: sequenceSchema$1.layout
		};
		var sequenceSchemaDefaultLayoutNone = {
			...sequenceSchema$1,
			layout: {
				...sequenceSchema$1.layout,
				default: "none"
			}
		};
		var clampCrop = (value) => {
			return Math.min(1, Math.max(0, value ?? 0));
		};
		var resolveAxis = (start, end) => {
			const resolvedStart = clampCrop(start);
			const resolvedEnd = clampCrop(end);
			if (resolvedStart + resolvedEnd > 1) return [.5, .5];
			return [resolvedStart, resolvedEnd];
		};
		var resolveSequenceCrop = ({ cropLeft, cropRight, cropTop, cropBottom }) => {
			const [left, right] = resolveAxis(cropLeft, cropRight);
			const [top, bottom] = resolveAxis(cropTop, cropBottom);
			return {
				left,
				right,
				top,
				bottom
			};
		};
		var getSequenceCropClipPath = ({ left, right, top, bottom, style }) => {
			if (left === 0 && right === 0 && top === 0 && bottom === 0) return null;
			const serializeRadius = (radius) => typeof radius === "number" ? `${radius}px` : radius;
			const shorthand = serializeRadius(style?.borderRadius);
			const longhands = [
				style?.borderTopLeftRadius,
				style?.borderTopRightRadius,
				style?.borderBottomRightRadius,
				style?.borderBottomLeftRadius
			];
			const serializedBorderRadius = shorthand || (longhands.some((radius) => radius !== void 0) ? longhands.map((radius) => serializeRadius(radius) ?? "0px").join(" ") : void 0);
			const rounded = serializedBorderRadius ? ` round ${serializedBorderRadius}` : "";
			return `inset(${top * 100}% ${right * 100}% ${bottom * 100}% ${left * 100}%${rounded})`;
		};
		var validateSequenceCrop = (crop, componentName = "<Sequence />") => {
			for (const [name, value] of Object.entries(crop)) {
				if (value === void 0) continue;
				if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`The "${name}" prop of ${componentName} must be a finite number, but got ${String(value)}.`);
				if (value > 100) throw new RangeError(`The "${name}" prop of ${componentName} must be between 0 and 1, but got ${value}. The crop range is 0 to 1, not 0 to 100.`);
			}
		};
		var useIsomorphicLayoutEffect = typeof window === "undefined" ? react.default.useEffect : react.default.useLayoutEffect;
		var SequenceManager = react.default.createContext({
			registerSequence: () => {
				throw new Error("SequenceManagerContext not initialized");
			},
			updateSequence: null,
			unregisterSequence: () => {
				throw new Error("SequenceManagerContext not initialized");
			},
			sequences: []
		});
		var SequenceManagerRefContext = react.default.createContext({ current: [] });
		var SequenceRegistrationContext = react.default.createContext(false);
		var makeSequencePropsSubscriptionKey = (key) => {
			return `${key.absolutePath}\x00${key.nodePath.join(".")}\x00${key.sequenceKeys.join(".")}\x00${key.effectKeys.map((keys) => keys.join(".")).join(".")}`;
		};
		var VisualModePropStatusesContext = react.default.createContext({ propStatuses: {} });
		var VisualModePropStatusesRefContext = react.default.createContext({ current: {} });
		var VisualModeDragOverridesContext = react.default.createContext({
			getDragOverrides: () => {
				throw new Error("VisualModeDragOverridesContext not initialized");
			},
			getEffectDragOverrides: () => {
				throw new Error("VisualModeDragOverridesContext not initialized");
			}
		});
		var VisualModeSettersContext = react.default.createContext({
			setDragOverrides: () => {
				throw new Error("VisualModeSettersContext not initialized");
			},
			clearDragOverrides: () => {
				throw new Error("VisualModeSettersContext not initialized");
			},
			setEffectDragOverrides: () => {
				throw new Error("VisualModeSettersContext not initialized");
			},
			clearEffectDragOverrides: () => {
				throw new Error("VisualModeSettersContext not initialized");
			},
			setPropStatuses: () => {
				throw new Error("VisualModeSettersContext not initialized");
			},
			remapPropStatuses: () => {
				throw new Error("VisualModeSettersContext not initialized");
			}
		});
		var effectDragOverridesKey = (nodePath, effectIndex) => `${makeSequencePropsSubscriptionKey(nodePath)}.effects.${effectIndex}`;
		var SequenceManagerProvider = ({ children }) => {
			const { isStudio } = useRemotionEnvironment();
			const [sequenceManagerId] = (0, react.useState)(() => String(Math.random()));
			const committedOrderRef = (0, react.useRef)(null);
			const committedOrderIdsRef = (0, react.useRef)(null);
			const [sequences, setSequences] = (0, react.useState)([]);
			const sequencesRef = (0, react.useRef)(sequences);
			sequencesRef.current = sequences;
			const [dragOverrides, setControlOverrides] = (0, react.useState)({});
			const controlOverridesRef = (0, react.useRef)(dragOverrides);
			controlOverridesRef.current = dragOverrides;
			const [effectDragOverridesState, setEffectDragOverridesState] = (0, react.useState)({});
			const [propStatuses, setPropStatusesMapState] = (0, react.useState)({});
			const propStatusesRef = (0, react.useRef)(propStatuses);
			propStatusesRef.current = propStatuses;
			const setDragOverrides = (0, react.useCallback)((nodePath, key, value) => {
				setControlOverrides((prev) => ({
					...prev,
					[makeSequencePropsSubscriptionKey(nodePath)]: {
						...prev[makeSequencePropsSubscriptionKey(nodePath)],
						[key]: value
					}
				}));
			}, []);
			const clearDragOverrides = (0, react.useCallback)((nodePath) => {
				setControlOverrides((prev) => {
					const key = makeSequencePropsSubscriptionKey(nodePath);
					if (!prev[key]) return prev;
					const next = { ...prev };
					delete next[key];
					return next;
				});
			}, []);
			const setEffectDragOverrides = (0, react.useCallback)((nodePath, effectIndex, key, value) => {
				setEffectDragOverridesState((prev) => {
					const mapKey = effectDragOverridesKey(nodePath, effectIndex);
					return {
						...prev,
						[mapKey]: {
							...prev[mapKey],
							[key]: value
						}
					};
				});
			}, []);
			const clearEffectDragOverrides = (0, react.useCallback)((nodePath, effectIndex) => {
				setEffectDragOverridesState((prev) => {
					const mapKey = effectDragOverridesKey(nodePath, effectIndex);
					if (!prev[mapKey]) return prev;
					const next = { ...prev };
					delete next[mapKey];
					return next;
				});
			}, []);
			const setPropStatuses = (0, react.useCallback)((nodePath, values) => {
				setPropStatusesMapState((prev) => {
					const key = makeSequencePropsSubscriptionKey(nodePath);
					const prevKey = prev[key];
					const newKey = values(prevKey);
					if (prevKey === newKey) return prev;
					return {
						...prev,
						[key]: newKey
					};
				});
			}, []);
			const remapPropStatuses = (0, react.useCallback)((remappings) => {
				setPropStatusesMapState((prev) => {
					const next = { ...prev };
					for (const remapping of remappings) delete next[makeSequencePropsSubscriptionKey(remapping.previousNodePath)];
					for (const remapping of remappings) if (remapping.nodePath !== null && remapping.result !== null) next[makeSequencePropsSubscriptionKey(remapping.nodePath)] = remapping.result;
					return next;
				});
			}, []);
			useIsomorphicLayoutEffect(() => {
				if (!isStudio) return;
				let unmounted = false;
				const onCommitOrder = (event) => {
					const { detail } = event;
					const managerOrder = detail.sequenceManagers.find((item) => item.managerId === sequenceManagerId);
					if (!managerOrder) return;
					const previousOrder = committedOrderIdsRef.current;
					if (previousOrder !== null && previousOrder.length === managerOrder.sequenceIds.length && previousOrder.every((sequenceId, index) => sequenceId === managerOrder.sequenceIds[index])) return;
					const order = new Map(managerOrder.sequenceIds.map((sequenceId, index) => [sequenceId, index]));
					committedOrderIdsRef.current = managerOrder.sequenceIds;
					committedOrderRef.current = order;
					queueMicrotask(() => {
						if (unmounted) return;
						setSequences((currentSequences) => {
							let changed = false;
							const nextSequences = currentSequences.map((sequence) => {
								const timelineOrder = order.get(sequence.id) ?? null;
								if (sequence.timelineOrder === timelineOrder) return sequence;
								changed = true;
								return {
									...sequence,
									timelineOrder
								};
							});
							return changed ? nextSequences : currentSequences;
						});
					});
				};
				window.addEventListener(COMMIT_ORDER_EVENT, onCommitOrder);
				return () => {
					unmounted = true;
					window.removeEventListener(COMMIT_ORDER_EVENT, onCommitOrder);
				};
			}, [isStudio, sequenceManagerId]);
			const registerSequence = (0, react.useCallback)((seq) => {
				setSequences((seqs) => {
					return [...seqs, {
						...seq,
						timelineOrder: committedOrderRef.current?.get(seq.id) ?? null
					}];
				});
			}, []);
			const updateSequence = (0, react.useCallback)((seq) => {
				setSequences((seqs) => {
					const index = seqs.findIndex((item) => item.id === seq.id);
					if (index === -1) return seqs;
					const next = [...seqs];
					next[index] = {
						...seq,
						timelineOrder: committedOrderRef.current?.get(seq.id) ?? null
					};
					return next;
				});
			}, []);
			const unregisterSequence = (0, react.useCallback)((seq) => {
				setSequences((seqs) => seqs.filter((s) => s.id !== seq));
			}, []);
			const sequenceContext = (0, react.useMemo)(() => {
				return {
					registerSequence,
					sequences,
					updateSequence,
					unregisterSequence
				};
			}, [
				registerSequence,
				sequences,
				unregisterSequence,
				updateSequence
			]);
			const getDragOverrides = (0, react.useCallback)((nodePath) => {
				return dragOverrides[makeSequencePropsSubscriptionKey(nodePath)] ?? {};
			}, [dragOverrides]);
			const getEffectDragOverrides = (0, react.useCallback)((nodePath, effectIndex) => {
				return effectDragOverridesState[effectDragOverridesKey(nodePath, effectIndex)] ?? {};
			}, [effectDragOverridesState]);
			const propStatusesContext = (0, react.useMemo)(() => {
				return { propStatuses };
			}, [propStatuses]);
			const dragOverridesContext = (0, react.useMemo)(() => {
				return {
					getDragOverrides,
					getEffectDragOverrides
				};
			}, [getDragOverrides, getEffectDragOverrides]);
			const settersContext = (0, react.useMemo)(() => {
				return {
					setDragOverrides,
					clearDragOverrides,
					setEffectDragOverrides,
					clearEffectDragOverrides,
					setPropStatuses,
					remapPropStatuses
				};
			}, [
				setDragOverrides,
				clearDragOverrides,
				setEffectDragOverrides,
				clearEffectDragOverrides,
				setPropStatuses,
				remapPropStatuses
			]);
			const providers = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceManagerRefContext.Provider, {
				value: sequencesRef,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceManager.Provider, {
					value: sequenceContext,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VisualModePropStatusesRefContext.Provider, {
						value: propStatusesRef,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VisualModePropStatusesContext.Provider, {
							value: propStatusesContext,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VisualModeDragOverridesContext.Provider, {
								value: dragOverridesContext,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VisualModeSettersContext.Provider, {
									value: settersContext,
									children
								})
							})
						})
					})
				})
			});
			return isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceManagerOrderMarker, {
				managerId: sequenceManagerId,
				children: providers
			}) : providers;
		};
		var IsInsideSeriesContext = (0, react.createContext)(false);
		var IsInsideSeriesContainer = ({ children }) => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IsInsideSeriesContext.Provider, {
				value: true,
				children
			});
		};
		var IsNotInsideSeriesProvider = ({ children }) => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IsInsideSeriesContext.Provider, {
				value: false,
				children
			});
		};
		var useRequireToBeInsideSeries = () => {
			if (!react.default.useContext(IsInsideSeriesContext)) throw new Error("This component must be inside a <Series /> component.");
		};
		var PremountContext = (0, react.createContext)({ premountFramesRemaining: 0 });
		var ENABLE_V5_BREAKING_CHANGES$1 = false;
		var resolveV5Default = (value) => {
			return value ?? ENABLE_V5_BREAKING_CHANGES$1;
		};
		var usePremounting = ({ from, durationInFrames, premountFor, postmountFor, style, styleWhilePremounted, styleWhilePostmounted, hideWhilePremounted }) => {
			const parentPremountContext = (0, react.useContext)(PremountContext);
			const frame = useCurrentFrame() - parentPremountContext.premountFramesRemaining;
			const environment = useRemotionEnvironment();
			const { fps } = useVideoConfig();
			const effectivePremountFor = ENABLE_V5_BREAKING_CHANGES$1 ? premountFor ?? fps : premountFor ?? 0;
			const effectivePostmountFor = postmountFor ?? 0;
			const endThreshold = Math.ceil(from + durationInFrames - 1);
			const premountingActive = !environment.isRendering && frame < from && frame >= from - effectivePremountFor;
			const postmountingActive = !environment.isRendering && frame > endThreshold && frame <= endThreshold + effectivePostmountFor;
			const isPremountingOrPostmounting = premountingActive || postmountingActive;
			return {
				effectivePremountFor,
				effectivePostmountFor,
				premountingActive,
				postmountingActive,
				isPremountingOrPostmounting,
				freezeFrame: premountingActive ? from : postmountingActive ? from + durationInFrames - 1 : 0,
				premountingStyle: (0, react.useMemo)(() => {
					if (!isPremountingOrPostmounting) return style;
					return {
						...style,
						...hideWhilePremounted === "opacity" ? { opacity: 0 } : { display: "none" },
						pointerEvents: "none",
						...premountingActive ? styleWhilePremounted : {},
						...postmountingActive ? styleWhilePostmounted : {}
					};
				}, [
					isPremountingOrPostmounting,
					hideWhilePremounted,
					postmountingActive,
					premountingActive,
					style,
					styleWhilePostmounted,
					styleWhilePremounted
				])
			};
		};
		var useSequenceRegistration = ({ getSequence, id }) => {
			const { registerSequence, unregisterSequence, updateSequence } = (0, react.useContext)(SequenceManager);
			const getSequenceRef = (0, react.useRef)(getSequence);
			getSequenceRef.current = getSequence;
			const lastRegisteredGetterRef = (0, react.useRef)(null);
			const registrationEnabled = getSequence !== null;
			(0, react.useEffect)(() => {
				if (!registrationEnabled) return;
				const currentGetter = getSequenceRef.current;
				if (currentGetter === null) throw new Error("Expected a sequence registration getter");
				registerSequence(currentGetter());
				lastRegisteredGetterRef.current = currentGetter;
				return () => {
					lastRegisteredGetterRef.current = null;
					unregisterSequence(id);
				};
			}, [
				id,
				registerSequence,
				registrationEnabled,
				unregisterSequence
			]);
			(0, react.useEffect)(() => {
				if (getSequence === null || updateSequence === null || lastRegisteredGetterRef.current === getSequence) return;
				updateSequence(getSequence());
				lastRegisteredGetterRef.current = getSequence;
			}, [getSequence, updateSequence]);
		};
		var deleteNestedKey = (obj, keysToRemove) => {
			for (const key of keysToRemove) {
				const parts = key.split(".");
				const parents = [obj];
				let current = obj;
				for (let i = 0; i < parts.length - 1; i++) {
					const part = parts[i];
					const next = current[part];
					if (next === void 0 || next === null) {
						current = null;
						break;
					}
					current = next;
					parents.push(current);
				}
				if (current === null) continue;
				delete current[parts[parts.length - 1]];
				for (let i = parents.length - 1; i > 0; i--) {
					const parent = parents[i];
					if (Object.keys(parent).length === 0) {
						const parentKey = parts[i - 1];
						delete parents[i - 1][parentKey];
					} else break;
				}
			}
			return obj;
		};
		var NEWTON_ITERATIONS$1 = 4;
		var NEWTON_MIN_SLOPE$1 = .001;
		var SUBDIVISION_PRECISION$1 = 1e-7;
		var SUBDIVISION_MAX_ITERATIONS$1 = 10;
		var kSplineTableSize$1 = 11;
		var kSampleStepSize$1 = 1 / (kSplineTableSize$1 - 1);
		var float32ArraySupported$1 = typeof Float32Array === "function";
		function a$1(aA1, aA2) {
			return 1 - 3 * aA2 + 3 * aA1;
		}
		function b$1(aA1, aA2) {
			return 3 * aA2 - 6 * aA1;
		}
		function c$1(aA1) {
			return 3 * aA1;
		}
		function calcBezier$1(aT, aA1, aA2) {
			return ((a$1(aA1, aA2) * aT + b$1(aA1, aA2)) * aT + c$1(aA1)) * aT;
		}
		function getSlope$1(aT, aA1, aA2) {
			return 3 * a$1(aA1, aA2) * aT * aT + 2 * b$1(aA1, aA2) * aT + c$1(aA1);
		}
		function binarySubdivide$1({ aX, _aA, _aB, mX1, mX2 }) {
			let currentX;
			let currentT;
			let i = 0;
			let aA = _aA;
			let aB = _aB;
			do {
				currentT = aA + (aB - aA) / 2;
				currentX = calcBezier$1(currentT, mX1, mX2) - aX;
				if (currentX > 0) aB = currentT;
				else aA = currentT;
			} while (Math.abs(currentX) > SUBDIVISION_PRECISION$1 && ++i < SUBDIVISION_MAX_ITERATIONS$1);
			return currentT;
		}
		function newtonRaphsonIterate$1(aX, _aGuessT, mX1, mX2) {
			let aGuessT = _aGuessT;
			for (let i = 0; i < NEWTON_ITERATIONS$1; ++i) {
				const currentSlope = getSlope$1(aGuessT, mX1, mX2);
				if (currentSlope === 0) return aGuessT;
				const currentX = calcBezier$1(aGuessT, mX1, mX2) - aX;
				aGuessT -= currentX / currentSlope;
			}
			return aGuessT;
		}
		function bezier$1(mX1, mY1, mX2, mY2) {
			if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) throw new Error("bezier x values must be in [0, 1] range");
			const sampleValues = float32ArraySupported$1 ? new Float32Array(kSplineTableSize$1) : new Array(kSplineTableSize$1);
			if (mX1 !== mY1 || mX2 !== mY2) for (let i = 0; i < kSplineTableSize$1; ++i) sampleValues[i] = calcBezier$1(i * kSampleStepSize$1, mX1, mX2);
			function getTForX(aX) {
				let intervalStart = 0;
				let currentSample = 1;
				const lastSample = kSplineTableSize$1 - 1;
				for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) intervalStart += kSampleStepSize$1;
				--currentSample;
				const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
				const guessForT = intervalStart + dist * kSampleStepSize$1;
				const initialSlope = getSlope$1(guessForT, mX1, mX2);
				if (initialSlope >= NEWTON_MIN_SLOPE$1) return newtonRaphsonIterate$1(aX, guessForT, mX1, mX2);
				if (initialSlope === 0) return guessForT;
				return binarySubdivide$1({
					aX,
					_aA: intervalStart,
					_aB: intervalStart + kSampleStepSize$1,
					mX1,
					mX2
				});
			}
			return function(x) {
				const clampedX = Math.min(1, Math.max(0, x));
				if (mX1 === mY1 && mX2 === mY2) return clampedX;
				if (clampedX === 0) return 0;
				if (clampedX === 1) return 1;
				return calcBezier$1(getTForX(clampedX), mY1, mY2);
			};
		}
		var normalizeNumber$1 = (value) => {
			return Math.round(value * 1e6) / 1e6;
		};
		var angleUnits$1 = /* @__PURE__ */ new Set([
			"deg",
			"rad",
			"grad",
			"turn"
		]);
		var lengthUnits$1 = /* @__PURE__ */ new Set([
			"%",
			"cap",
			"ch",
			"cm",
			"cqb",
			"cqh",
			"cqi",
			"cqmax",
			"cqmin",
			"cqw",
			"dvh",
			"dvw",
			"em",
			"ex",
			"ic",
			"in",
			"lh",
			"lvh",
			"lvw",
			"mm",
			"pc",
			"pt",
			"px",
			"q",
			"rem",
			"rlh",
			"svh",
			"svw",
			"vb",
			"vh",
			"vi",
			"vmax",
			"vmin",
			"vw"
		]);
		var cssNumberRegex$1 = /^([+-]?(?:\d+\.?\d*|\.\d+))([a-zA-Z%]+)?$/;
		var transformOriginKeywords$1 = /* @__PURE__ */ new Set([
			"left",
			"center",
			"right",
			"top",
			"bottom"
		]);
		var transformOriginKeywordOptions$1 = (keyword) => {
			if (keyword === "left") return [{
				axis: "x",
				value: {
					value: 0,
					unit: "%"
				}
			}];
			if (keyword === "right") return [{
				axis: "x",
				value: {
					value: 100,
					unit: "%"
				}
			}];
			if (keyword === "top") return [{
				axis: "y",
				value: {
					value: 0,
					unit: "%"
				}
			}];
			if (keyword === "bottom") return [{
				axis: "y",
				value: {
					value: 100,
					unit: "%"
				}
			}];
			return [{
				axis: "x",
				value: {
					value: 50,
					unit: "%"
				}
			}, {
				axis: "y",
				value: {
					value: 50,
					unit: "%"
				}
			}];
		};
		var transformOriginCenter$1 = {
			value: 50,
			unit: "%"
		};
		var stringifyNumber$1 = (value) => {
			return String(normalizeNumber$1(value));
		};
		var UnsupportedStringInterpolationValueError$1 = class extends TypeError {};
		var parseStringInterpolationComponent$1 = (component, value) => {
			const match = cssNumberRegex$1.exec(component);
			if (match === null) throw new UnsupportedStringInterpolationValueError$1(`Cannot interpolate "${value}" because "${component}" is not a supported scale, translate, or rotate value`);
			const unit = match[2] ?? null;
			const numberValue = Number(match[1]);
			if (!Number.isFinite(numberValue)) throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not finite`);
			if (unit === null) return {
				kind: "scale",
				value: numberValue,
				unit: null
			};
			if (angleUnits$1.has(unit)) return {
				kind: "rotate",
				value: numberValue,
				unit
			};
			if (lengthUnits$1.has(unit)) return {
				kind: "translate",
				value: numberValue,
				unit
			};
			throw new TypeError(`Cannot interpolate "${value}" because "${unit}" is not a supported translate or rotate unit`);
		};
		var parseTransformOriginLengthPercentage$1 = ({ component, value, allowPercentage }) => {
			const match = cssNumberRegex$1.exec(component);
			if (match === null) throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not a supported transform-origin ${allowPercentage ? "length-percentage" : "z length"}`);
			const unit = match[2] ?? null;
			const numberValue = Number(match[1]);
			if (!Number.isFinite(numberValue)) throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not finite`);
			if (unit === null || !lengthUnits$1.has(unit) || !allowPercentage && unit === "%") throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not a supported transform-origin ${allowPercentage ? "length-percentage" : "z length"}`);
			return {
				value: numberValue,
				unit
			};
		};
		var parseTransformOriginToken$1 = (component, value) => {
			const lower = component.toLowerCase();
			if (transformOriginKeywords$1.has(lower)) return {
				type: "keyword",
				keyword: lower
			};
			return {
				type: "length-percentage",
				parsed: parseTransformOriginLengthPercentage$1({
					component,
					value,
					allowPercentage: true
				})
			};
		};
		var parseTwoTransformOriginKeywords$1 = (first, second, value) => {
			const candidates = [];
			for (const firstOption of transformOriginKeywordOptions$1(first)) for (const secondOption of transformOriginKeywordOptions$1(second)) {
				if (firstOption.axis === secondOption.axis) continue;
				candidates.push(firstOption.axis === "x" ? [firstOption.value, secondOption.value] : [secondOption.value, firstOption.value]);
			}
			if (candidates.length === 0) throw new TypeError(`Cannot interpolate "${value}" because "${first} ${second}" is not a valid transform-origin keyword pair`);
			return candidates[0];
		};
		var parseTransformOriginXY$1 = (parts, value) => {
			if (parts.length === 1) {
				const token = parseTransformOriginToken$1(parts[0], value);
				if (token.type === "length-percentage") return [token.parsed, transformOriginCenter$1];
				if (token.keyword === "top" || token.keyword === "bottom") return [transformOriginCenter$1, transformOriginKeywordOptions$1(token.keyword)[0].value];
				return [transformOriginKeywordOptions$1(token.keyword)[0].value, transformOriginCenter$1];
			}
			const first = parseTransformOriginToken$1(parts[0], value);
			const second = parseTransformOriginToken$1(parts[1], value);
			if (first.type === "length-percentage" && second.type === "length-percentage") return [first.parsed, second.parsed];
			if (first.type === "keyword" && second.type === "keyword") return parseTwoTransformOriginKeywords$1(first.keyword, second.keyword, value);
			const keyword = first.type === "keyword" ? first : second.type === "keyword" ? second : null;
			const length = first.type === "length-percentage" ? first.parsed : second.type === "length-percentage" ? second.parsed : null;
			if (keyword === null || length === null) throw new Error("Expected a keyword and a length-percentage value");
			const keywordIsFirst = first.type === "keyword";
			if (keyword.keyword === "left" || keyword.keyword === "right") {
				if (!keywordIsFirst) throw new TypeError(`Cannot interpolate "${value}" because horizontal transform-origin keywords must come before a length-percentage value`);
				return [transformOriginKeywordOptions$1(keyword.keyword)[0].value, length];
			}
			if (keyword.keyword === "top" || keyword.keyword === "bottom") return [length, transformOriginKeywordOptions$1(keyword.keyword)[0].value];
			return keywordIsFirst ? [transformOriginCenter$1, length] : [length, transformOriginCenter$1];
		};
		var parseTransformOriginValue$1 = (output, parts) => {
			const [x, y] = parseTransformOriginXY$1(parts.slice(0, 2), output);
			const z = parts[2] === void 0 ? {
				value: 0,
				unit: null
			} : parseTransformOriginLengthPercentage$1({
				component: parts[2],
				value: output,
				allowPercentage: false
			});
			return {
				kind: "translate",
				values: [
					x.value,
					y.value,
					z.value,
					0
				],
				units: [
					x.unit,
					y.unit,
					z.unit,
					null
				],
				dimensions: parts[2] === void 0 ? 2 : 3,
				axisRotation: false
			};
		};
		var parseAxisRotationValue$1 = (output) => {
			const parts = output.trim().split(/\s+/);
			const keywordAxis = parts.length === 2 ? parts[0].toLowerCase() : null;
			if (keywordAxis === "x" || keywordAxis === "y" || keywordAxis === "z") {
				const keywordAngle = parseStringInterpolationComponent$1(parts[1], output);
				if (keywordAngle.kind !== "rotate") return null;
				return {
					kind: "rotate",
					values: keywordAxis === "x" ? [
						1,
						0,
						0,
						keywordAngle.value
					] : keywordAxis === "y" ? [
						0,
						1,
						0,
						keywordAngle.value
					] : [
						0,
						0,
						1,
						keywordAngle.value
					],
					units: [
						null,
						null,
						null,
						keywordAngle.unit
					],
					dimensions: 4,
					axisRotation: true
				};
			}
			if (parts.length !== 4) return null;
			const axis = parts.slice(0, 3).map(Number);
			if (!axis.every(Number.isFinite)) return null;
			const vectorAngle = parseStringInterpolationComponent$1(parts[3], output);
			if (vectorAngle.kind !== "rotate") return null;
			return {
				kind: "rotate",
				values: [
					axis[0],
					axis[1],
					axis[2],
					vectorAngle.value
				],
				units: [
					null,
					null,
					null,
					vectorAngle.unit
				],
				dimensions: 4,
				axisRotation: true
			};
		};
		var parseStringInterpolationValue$1 = (output) => {
			if (typeof output === "number") {
				if (!Number.isFinite(output)) throw new Error(`outputRange must contain only finite numbers, but got [${output}]`);
				return {
					kind: "scale",
					values: [
						output,
						output,
						1,
						0
					],
					units: [
						null,
						null,
						null,
						null
					],
					dimensions: 1,
					axisRotation: false
				};
			}
			const axisRotation = parseAxisRotationValue$1(output);
			if (axisRotation !== null) return axisRotation;
			const parts = output.trim().split(/\s+/);
			if (parts.length < 1 || parts.length > 3 || parts[0] === "") throw new TypeError(`String outputRange values must contain 1 to 3 components, but got "${output}"`);
			if (parts.some((part) => transformOriginKeywords$1.has(part.toLowerCase()))) return parseTransformOriginValue$1(output, parts);
			const parsed = parts.map((part) => parseStringInterpolationComponent$1(part, output));
			const [{ kind }] = parsed;
			for (const part of parsed) if (part.kind !== kind) throw new TypeError(`Cannot interpolate "${output}" because it mixes ${kind} and ${part.kind} values`);
			if (kind === "scale") {
				const x = parsed[0].value;
				return {
					kind,
					values: [
						x,
						parsed[1]?.value ?? x,
						parsed[2]?.value ?? 1,
						0
					],
					units: [
						null,
						null,
						null,
						null
					],
					dimensions: parsed.length,
					axisRotation: false
				};
			}
			return {
				kind,
				values: [
					parsed[0].value,
					parsed[1]?.value ?? 0,
					parsed[2]?.value ?? 0,
					0
				],
				units: [
					parsed[0].unit,
					parsed[1]?.unit ?? null,
					parsed[2]?.unit ?? null,
					null
				],
				dimensions: parsed.length,
				axisRotation: false
			};
		};
		var serializeStringInterpolationValue$1 = ({ kind, values, units, dimensions, axisRotation }) => {
			if (axisRotation) return `${stringifyNumber$1(values[0])} ${stringifyNumber$1(values[1])} ${stringifyNumber$1(values[2])} ${stringifyNumber$1(values[3])}${units[3]}`;
			if (kind === "scale") return values.slice(0, dimensions).map((value) => stringifyNumber$1(value)).join(" ");
			return values.slice(0, dimensions).map((value, index) => `${stringifyNumber$1(value)}${units[index]}`).join(" ");
		};
		var toSignedArea$1 = (scale) => {
			if (scale === 0) return 0;
			return Math.sign(scale) * scale * scale;
		};
		var fromSignedArea$1 = (area) => {
			if (area === 0) return 0;
			return Math.sign(area) * Math.sqrt(Math.abs(area));
		};
		function interpolateFunction$1(input, inputRange, outputRange, options) {
			const { extrapolateLeft, extrapolateRight, easing, output } = options;
			let result = input;
			const [inputMin, inputMax] = inputRange;
			const [outputMin, outputMax] = outputRange;
			if (result < inputMin) {
				if (extrapolateLeft === "identity") return result;
				if (extrapolateLeft === "clamp") result = inputMin;
				else if (extrapolateLeft === "wrap") {
					const range = inputMax - inputMin;
					result = ((result - inputMin) % range + range) % range + inputMin;
				} else if (extrapolateLeft === "extend") {}
			}
			if (result > inputMax) {
				if (extrapolateRight === "identity") return result;
				if (extrapolateRight === "clamp") result = inputMax;
				else if (extrapolateRight === "wrap") {
					const range = inputMax - inputMin;
					result = ((result - inputMin) % range + range) % range + inputMin;
				} else if (extrapolateRight === "extend") {}
			}
			if (outputMin === outputMax) return outputMin;
			result = (result - inputMin) / (inputMax - inputMin);
			result = easing(result);
			if (output === "perceptual-scale") {
				const signedAreaMin = toSignedArea$1(outputMin);
				const signedAreaMax = toSignedArea$1(outputMax);
				result = fromSignedArea$1(result * (signedAreaMax - signedAreaMin) + signedAreaMin);
			} else result = result * (outputMax - outputMin) + outputMin;
			return result;
		}
		function findRange$1(input, inputRange) {
			let i = 1;
			for (; i < inputRange.length - 1; ++i) if (inputRange[i] >= input) break;
			return i - 1;
		}
		var defaultEasing$1 = (num) => num;
		var resolveOutputOption$1 = (output) => {
			return output ?? "linear";
		};
		var shouldExtendRightForEasing$1 = (easing) => {
			return easing.remotionShouldExtendRight === true;
		};
		var resolveEasingForSegment$1 = ({ easing, segmentIndex }) => {
			if (easing === void 0) return defaultEasing$1;
			if (typeof easing === "function") return easing;
			return easing[segmentIndex];
		};
		var interpolateSegment$1 = ({ input, inputRange, outputRange, easing, extrapolateLeft, extrapolateRight, output }) => {
			return interpolateFunction$1(input, inputRange, outputRange, {
				easing,
				extrapolateLeft,
				extrapolateRight: input > inputRange[1] && extrapolateRight === "clamp" && shouldExtendRightForEasing$1(easing) ? "extend" : extrapolateRight,
				output
			});
		};
		var interpolateNumber$1 = ({ input, inputRange, outputRange, options }) => {
			const output = resolveOutputOption$1(options?.output);
			if (inputRange.length === 1) return outputRange[0];
			const easingOption = options?.easing;
			let extrapolateLeft = "extend";
			if (options?.extrapolateLeft !== void 0) extrapolateLeft = options.extrapolateLeft;
			let extrapolateRight = "extend";
			if (options?.extrapolateRight !== void 0) extrapolateRight = options.extrapolateRight;
			const posterizedInput = options?.posterize === void 0 ? input : Math.floor(input / options.posterize) * options.posterize;
			const range = findRange$1(posterizedInput, inputRange);
			const easing = resolveEasingForSegment$1({
				easing: easingOption,
				segmentIndex: range
			});
			let result = interpolateSegment$1({
				input: posterizedInput,
				inputRange: [inputRange[range], inputRange[range + 1]],
				outputRange: [outputRange[range], outputRange[range + 1]],
				easing,
				extrapolateLeft,
				extrapolateRight,
				output
			});
			for (let segmentIndex = 0; segmentIndex < range; segmentIndex++) {
				const previousEasing = resolveEasingForSegment$1({
					easing: easingOption,
					segmentIndex
				});
				if (!shouldExtendRightForEasing$1(previousEasing)) continue;
				const previousSegmentEnd = inputRange[segmentIndex + 1];
				if (posterizedInput <= previousSegmentEnd) continue;
				const continuedSegmentValue = interpolateSegment$1({
					input: posterizedInput,
					inputRange: [inputRange[segmentIndex], previousSegmentEnd],
					outputRange: [outputRange[segmentIndex], outputRange[segmentIndex + 1]],
					easing: previousEasing,
					extrapolateLeft,
					extrapolateRight: "extend",
					output
				});
				result += continuedSegmentValue - outputRange[segmentIndex + 1];
			}
			return result;
		};
		var interpolateString$1 = ({ input, inputRange, outputRange, options }) => {
			const initiallyParsedOutputRange = outputRange.map(parseStringInterpolationValue$1);
			const hasAxisRotation = initiallyParsedOutputRange.some((parsed) => parsed.axisRotation);
			const posterizedInput = options?.posterize === void 0 ? input : Math.floor(input / options.posterize) * options.posterize;
			const segmentIndex = inputRange.length === 1 ? 0 : findRange$1(posterizedInput, inputRange);
			const parsedOutputRange = hasAxisRotation ? initiallyParsedOutputRange.map((parsed, index) => {
				if (parsed.kind !== "rotate") return parsed;
				if (parsed.axisRotation) return parsed;
				if (parsed.dimensions !== 1) throw new TypeError("Cannot interpolate a multi-angle rotate value with an axis rotation");
				const adjacentAxisRotation = parsed.values[0] === 0 ? index === 0 ? initiallyParsedOutputRange.find((candidate) => candidate.axisRotation) : index === initiallyParsedOutputRange.length - 1 ? [...initiallyParsedOutputRange].reverse().find((candidate) => candidate.axisRotation) : index === segmentIndex ? initiallyParsedOutputRange[index + 1] : index === segmentIndex + 1 ? initiallyParsedOutputRange[index - 1] : void 0 : void 0;
				const axis = adjacentAxisRotation?.axisRotation ? adjacentAxisRotation.values : [
					0,
					0,
					1
				];
				return {
					kind: "rotate",
					values: [
						axis[0],
						axis[1],
						axis[2],
						parsed.values[0]
					],
					units: [
						null,
						null,
						null,
						parsed.units[0]
					],
					dimensions: 4,
					axisRotation: true
				};
			}) : initiallyParsedOutputRange;
			const kind = parsedOutputRange[0]?.kind;
			if (kind === void 0) throw new Error("outputRange must have at least 1 element");
			for (const parsed of parsedOutputRange) if (parsed.kind !== kind) throw new TypeError(`Cannot interpolate ${kind} values with ${parsed.kind} values`);
			const dimensions = Math.max(...parsedOutputRange.map((parsed) => parsed.dimensions));
			const units = [
				null,
				null,
				null,
				null
			];
			if (kind !== "scale") for (let axis = 0; axis < dimensions; axis++) {
				if (hasAxisRotation && axis < 3) continue;
				for (const parsed of parsedOutputRange) {
					const unit = parsed.units[axis];
					if (unit === null) continue;
					if (units[axis] === null) {
						units[axis] = unit;
						continue;
					}
					if (units[axis] !== unit) throw new TypeError(`Cannot interpolate ${kind} values with different units on axis ${axis + 1}: ${units[axis]} and ${unit}`);
				}
				if (units[axis] === null) throw new TypeError(`Cannot interpolate ${kind} values because axis ${axis + 1} has no unit`);
			}
			const values = [
				0,
				0,
				0,
				0
			];
			for (let axis = 0; axis < dimensions; axis++) values[axis] = interpolateNumber$1({
				input,
				inputRange,
				outputRange: parsedOutputRange.map((parsed) => parsed.values[axis]),
				options
			});
			return serializeStringInterpolationValue$1({
				kind,
				values,
				units,
				dimensions,
				axisRotation: hasAxisRotation
			});
		};
		var interpolateDiscreteString$1 = ({ input, inputRange, outputRange, options }) => {
			if (inputRange.length === 1) return outputRange[0];
			for (let segmentIndex = 0; segmentIndex < inputRange.length - 1; segmentIndex++) if (resolveEasingForSegment$1({
				easing: options?.easing,
				segmentIndex
			}) !== Easing$1.step1) throw new TypeError("Non-numeric strings can only be interpolated using Easing.step1");
			const posterizedInput = options?.posterize === void 0 ? input : Math.floor(input / options.posterize) * options.posterize;
			const inputMin = inputRange[0];
			const inputMax = inputRange[inputRange.length - 1];
			let resolvedInput = posterizedInput;
			if (resolvedInput < inputMin) {
				if (options?.extrapolateLeft === "identity") throw new TypeError("extrapolateLeft: \"identity\" is not supported for non-numeric strings");
				if (options?.extrapolateLeft === "wrap") {
					const wrapRange = inputMax - inputMin;
					resolvedInput = ((resolvedInput - inputMin) % wrapRange + wrapRange) % wrapRange + inputMin;
				} else return outputRange[0];
			}
			if (resolvedInput > inputMax) {
				if (options?.extrapolateRight === "identity") throw new TypeError("extrapolateRight: \"identity\" is not supported for non-numeric strings");
				if (options?.extrapolateRight === "wrap") {
					const wrapRange = inputMax - inputMin;
					resolvedInput = ((resolvedInput - inputMin) % wrapRange + wrapRange) % wrapRange + inputMin;
				} else return outputRange[outputRange.length - 1];
			}
			const range = findRange$1(resolvedInput, inputRange);
			return resolvedInput >= inputRange[range + 1] ? outputRange[range + 1] : outputRange[range];
		};
		var validateTupleOutputRange$1 = (outputRange) => {
			const dimensions = outputRange[0]?.length;
			if (dimensions === void 0) throw new Error("outputRange must have at least 1 element");
			if (dimensions === 0) throw new TypeError("outputRange tuples must contain at least 1 number");
			for (const output of outputRange) {
				if (output.length !== dimensions) throw new TypeError(`outputRange tuples must all have the same length, but got ${dimensions} and ${output.length}`);
				for (const value of output) if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`outputRange tuples must contain only finite numbers, but got [${output.join(",")}]`);
			}
			return dimensions;
		};
		var interpolateTuple$1 = ({ input, inputRange, outputRange, options }) => {
			const dimensions = validateTupleOutputRange$1(outputRange);
			return new Array(dimensions).fill(true).map((_, axis) => interpolateNumber$1({
				input,
				inputRange,
				outputRange: outputRange.map((output) => output[axis]),
				options
			}));
		};
		function checkValidInputRange$1(arr) {
			for (let i = 1; i < arr.length; ++i) if (!(arr[i] > arr[i - 1])) throw new Error(`inputRange must be strictly monotonically increasing but got [${arr.join(",")}]`);
		}
		function checkInfiniteRange$1(name, arr) {
			if (arr.length < 1) throw new Error(name + " must have at least 1 element");
			for (const element of arr) {
				if (typeof element !== "number") throw new Error(`${name} must contain only numbers`);
				if (!Number.isFinite(element)) throw new Error(`${name} must contain only finite numbers, but got [${arr.join(",")}]`);
			}
		}
		function assertValidInterpolateEasingOption$1(easing, inputRangeLength) {
			if (easing === void 0) return;
			if (typeof easing === "function") return;
			const expectedLength = inputRangeLength - 1;
			if (easing.length !== expectedLength) throw new Error(`When easing is an array, it must have one entry per segment between keyframes (length inputRange.length - 1 = ${expectedLength}), but got length ${easing.length}`);
			for (let i = 0; i < easing.length; i++) if (typeof easing[i] !== "function") throw new Error(`easing[${i}] must be a function`);
		}
		function assertValidInterpolatePosterizeOption$1(posterize) {
			if (posterize === void 0) return;
			if (typeof posterize !== "number" || !Number.isFinite(posterize) || posterize <= 0) throw new Error(`posterize must be a positive finite number, but got ${posterize}`);
		}
		function assertValidInterpolateOutputOption$1(output) {
			if (output === void 0 || output === "linear" || output === "perceptual-scale") return;
			throw new Error(`output must be "linear" or "perceptual-scale", but got ${String(output)}`);
		}
		function interpolate$1(input, inputRange, outputRange, options) {
			if (typeof input === "undefined") throw new Error("input can not be undefined");
			if (typeof inputRange === "undefined") throw new Error("inputRange can not be undefined");
			if (typeof outputRange === "undefined") throw new Error("outputRange can not be undefined");
			if (inputRange.length !== outputRange.length) throw new Error("inputRange (" + inputRange.length + ") and outputRange (" + outputRange.length + ") must have the same length");
			checkInfiniteRange$1("inputRange", inputRange);
			checkValidInputRange$1(inputRange);
			assertValidInterpolateEasingOption$1(options?.easing, inputRange.length);
			assertValidInterpolatePosterizeOption$1(options?.posterize);
			assertValidInterpolateOutputOption$1(options?.output);
			if (typeof input !== "number") throw new TypeError("Cannot interpolate an input which is not a number");
			if (!Array.isArray(outputRange)) throw new Error("outputRange must contain only numbers");
			if (outputRange.some((output) => typeof output === "string")) {
				if (!outputRange.every((output) => typeof output === "string" || typeof output === "number")) throw new TypeError("outputRange must contain only numbers, or supported scale, translate, and rotate strings");
				try {
					return interpolateString$1({
						input,
						inputRange,
						outputRange,
						options
					});
				} catch (error2) {
					if (!outputRange.every((output) => typeof output === "string")) throw error2;
					if (!outputRange.some((output) => {
						try {
							parseStringInterpolationValue$1(output);
							return false;
						} catch (parseError) {
							return parseError instanceof UnsupportedStringInterpolationValueError$1;
						}
					})) throw error2;
					return interpolateDiscreteString$1({
						input,
						inputRange,
						outputRange,
						options
					});
				}
			}
			if (outputRange.every((output) => Array.isArray(output))) return interpolateTuple$1({
				input,
				inputRange,
				outputRange,
				options
			});
			if (!outputRange.every((output) => typeof output === "number")) throw new TypeError("outputRange must contain only numbers, numeric tuples, or supported scale, translate, and rotate strings");
			checkInfiniteRange$1("outputRange", outputRange);
			return interpolateNumber$1({
				input,
				inputRange,
				outputRange,
				options
			});
		}
		var validateFrame$1 = ({ allowFloats, durationInFrames, frame }) => {
			if (typeof frame === "undefined") throw new TypeError(`Argument missing for parameter "frame"`);
			if (typeof frame !== "number") throw new TypeError(`Argument passed for "frame" is not a number: ${frame}`);
			if (!Number.isFinite(frame)) throw new RangeError(`Frame ${frame} is not finite`);
			if (frame % 1 !== 0 && !allowFloats) throw new RangeError(`Argument for frame must be an integer, but got ${frame}`);
			if (frame < 0 && frame < -durationInFrames) throw new RangeError(`Cannot use frame ${frame}: Duration of composition is ${durationInFrames}, therefore the lowest frame that can be rendered is ${-durationInFrames}`);
			if (frame > durationInFrames - 1) throw new RangeError(`Cannot use frame ${frame}: Duration of composition is ${durationInFrames}, therefore the highest frame that can be rendered is ${durationInFrames - 1}`);
		};
		var validateSpringDuration$1 = (dur) => {
			if (typeof dur === "undefined") return;
			if (typeof dur !== "number") throw new TypeError(`A "duration" of a spring must be a "number" but is "${typeof dur}"`);
			if (Number.isNaN(dur)) throw new TypeError("A \"duration\" of a spring is NaN, which it must not be");
			if (!Number.isFinite(dur)) throw new TypeError("A \"duration\" of a spring must be finite, but is " + dur);
			if (dur <= 0) throw new TypeError("A \"duration\" of a spring must be positive, but is " + dur);
		};
		var defaultSpringConfig$1 = {
			damping: 10,
			mass: 1,
			stiffness: 100,
			overshootClamping: false
		};
		var advanceCache$1 = {};
		function advance$1({ animation, now, config }) {
			const { toValue, lastTimestamp, current, velocity } = animation;
			const deltaTime = Math.min(now - lastTimestamp, 64);
			if (config.damping <= 0) throw new Error("Spring damping must be greater than 0, otherwise the spring() animation will never end, causing an infinite loop.");
			const c2 = config.damping;
			const m = config.mass;
			const k = config.stiffness;
			const cacheKey = [
				toValue,
				lastTimestamp,
				current,
				velocity,
				c2,
				m,
				k,
				now
			].join("-");
			if (advanceCache$1[cacheKey]) return advanceCache$1[cacheKey];
			const v0 = -velocity;
			const x0 = toValue - current;
			const zeta = c2 / (2 * Math.sqrt(k * m));
			const omega0 = Math.sqrt(k / m);
			const omega1 = omega0 * Math.sqrt(1 - zeta ** 2);
			const t = deltaTime / 1e3;
			const sin1 = Math.sin(omega1 * t);
			const cos1 = Math.cos(omega1 * t);
			const underDampedEnvelope = Math.exp(-zeta * omega0 * t);
			const underDampedFrag1 = underDampedEnvelope * (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
			const underDampedPosition = toValue - underDampedFrag1;
			const underDampedVelocity = zeta * omega0 * underDampedFrag1 - underDampedEnvelope * (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1);
			const criticallyDampedEnvelope = Math.exp(-omega0 * t);
			const criticallyDampedPosition = toValue - criticallyDampedEnvelope * (x0 + (v0 + omega0 * x0) * t);
			const criticallyDampedVelocity = criticallyDampedEnvelope * (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0);
			const animationNode = {
				toValue,
				prevPosition: current,
				lastTimestamp: now,
				current: zeta < 1 ? underDampedPosition : criticallyDampedPosition,
				velocity: zeta < 1 ? underDampedVelocity : criticallyDampedVelocity
			};
			advanceCache$1[cacheKey] = animationNode;
			return animationNode;
		}
		var calculationCache$1 = {};
		function springCalculation$1({ frame, fps, config = {} }) {
			const from = 0;
			const to = 1;
			const cacheKey = [
				frame,
				fps,
				config.damping,
				config.mass,
				config.overshootClamping,
				config.stiffness
			].join("-");
			if (calculationCache$1[cacheKey]) return calculationCache$1[cacheKey];
			let animation = {
				lastTimestamp: 0,
				current: from,
				toValue: to,
				velocity: 0,
				prevPosition: 0
			};
			const frameClamped = Math.max(0, frame);
			const unevenRest = frameClamped % 1;
			for (let f = 0; f <= Math.floor(frameClamped); f++) {
				const time = f / fps * 1e3;
				animation = advance$1({
					animation,
					now: time,
					config: {
						...defaultSpringConfig$1,
						...config
					}
				});
			}
			if (unevenRest > 0) animation = advance$1({
				animation,
				now: frameClamped / fps * 1e3,
				config: {
					...defaultSpringConfig$1,
					...config
				}
			});
			calculationCache$1[cacheKey] = animation;
			return animation;
		}
		var cache$1 = /* @__PURE__ */ new Map();
		function measureSpring$1({ fps, config = {}, threshold = .005 }) {
			if (typeof threshold !== "number") throw new TypeError(`threshold must be a number, got ${threshold} of type ${typeof threshold}`);
			if (threshold === 0) return Infinity;
			if (threshold === 1) return 0;
			if (isNaN(threshold)) throw new TypeError("Threshold is NaN");
			if (!Number.isFinite(threshold)) throw new TypeError("Threshold is not finite");
			if (threshold < 0) throw new TypeError("Threshold is below 0");
			const cacheKey = [
				fps,
				config.damping,
				config.mass,
				config.overshootClamping,
				config.stiffness,
				threshold
			].join("-");
			if (cache$1.has(cacheKey)) return cache$1.get(cacheKey);
			validateFps$2(fps, "to the measureSpring() function", false);
			let frame = 0;
			let finishedFrame = 0;
			const calc = () => {
				return springCalculation$1({
					fps,
					frame,
					config
				});
			};
			let animation = calc();
			const calcDifference = () => {
				return Math.abs(animation.current - animation.toValue);
			};
			let difference = calcDifference();
			while (difference >= threshold) {
				frame++;
				animation = calc();
				difference = calcDifference();
			}
			finishedFrame = frame;
			for (let i = 0; i < 20; i++) {
				frame++;
				animation = calc();
				difference = calcDifference();
				if (difference >= threshold) {
					i = 0;
					finishedFrame = frame + 1;
				}
			}
			cache$1.set(cacheKey, finishedFrame);
			return finishedFrame;
		}
		function spring$1({ frame: passedFrame, fps, config = {}, from = 0, to = 1, durationInFrames: passedDurationInFrames, durationRestThreshold, delay = 0, reverse = false }) {
			validateSpringDuration$1(passedDurationInFrames);
			validateFrame$1({
				frame: passedFrame,
				durationInFrames: Infinity,
				allowFloats: true
			});
			validateFps$2(fps, "to spring()", false);
			const needsToCalculateNaturalDuration = reverse || typeof passedDurationInFrames !== "undefined";
			const naturalDuration = needsToCalculateNaturalDuration ? measureSpring$1({
				fps,
				config,
				threshold: durationRestThreshold
			}) : void 0;
			const naturalDurationGetter = needsToCalculateNaturalDuration ? { get: () => naturalDuration } : { get: () => {
				throw new Error("did not calculate natural duration, this is an error with Remotion. Please report");
			} };
			const delayProcessed = (reverse ? (passedDurationInFrames ?? naturalDurationGetter.get()) - passedFrame : passedFrame) + (reverse ? delay : -delay);
			const durationProcessed = passedDurationInFrames === void 0 ? delayProcessed : delayProcessed / (passedDurationInFrames / naturalDurationGetter.get());
			if (passedDurationInFrames && delayProcessed > passedDurationInFrames) return to;
			const spr = springCalculation$1({
				fps,
				frame: durationProcessed,
				config
			});
			const inner = config.overshootClamping ? to >= from ? Math.min(spr.current, to) : Math.max(spr.current, to) : spr.current;
			return from === 0 && to === 1 ? inner : interpolate$1(inner, [0, 1], [from, to]);
		}
		var clampUnit$1 = (t) => Math.min(1, Math.max(0, t));
		var springEasingDurationInFrames$1 = 30;
		var Easing$1 = class Easing$1 {
			static step0(n) {
				return n > 0 ? 1 : 0;
			}
			static step1(n) {
				return n >= 1 ? 1 : 0;
			}
			static linear(t) {
				return t;
			}
			static ease(t) {
				return Easing$1.bezier(.42, 0, 1, 1)(t);
			}
			static quad(t) {
				return t * t;
			}
			static cubic(t) {
				return t * t * t;
			}
			static poly(n) {
				return (t) => t ** n;
			}
			static sin(t) {
				return 1 - Math.cos(t * Math.PI / 2);
			}
			static circle(t) {
				const u = clampUnit$1(t);
				return 1 - Math.sqrt(1 - u * u);
			}
			static exp(t) {
				return 2 ** (10 * (t - 1));
			}
			static elastic(bounciness = 1) {
				const p = bounciness * Math.PI;
				return (t) => 1 - Math.cos(t * Math.PI / 2) ** 3 * Math.cos(t * p);
			}
			static back(s = 1.70158) {
				return (t) => t * t * ((s + 1) * t - s);
			}
			static spring({ allowTail = false, durationRestThreshold, ...config } = {}) {
				const easing = (t) => {
					if (t <= 0) return 0;
					if (!allowTail && t >= 1) return 1;
					if (allowTail) return spring$1({
						fps: springEasingDurationInFrames$1,
						frame: t * measureSpring$1({
							fps: springEasingDurationInFrames$1,
							config,
							threshold: durationRestThreshold
						}),
						config
					});
					return spring$1({
						fps: springEasingDurationInFrames$1,
						frame: t * springEasingDurationInFrames$1,
						config,
						durationInFrames: springEasingDurationInFrames$1,
						durationRestThreshold
					});
				};
				return Object.assign(easing, { remotionShouldExtendRight: allowTail });
			}
			static bounce(t) {
				const u = clampUnit$1(t);
				if (u < 1 / 2.75) return 7.5625 * u * u;
				if (u < 2 / 2.75) {
					const t2_ = u - 1.5 / 2.75;
					return 7.5625 * t2_ * t2_ + .75;
				}
				if (u < 2.5 / 2.75) {
					const t2_ = u - 2.25 / 2.75;
					return 7.5625 * t2_ * t2_ + .9375;
				}
				const t2 = u - 2.625 / 2.75;
				return 7.5625 * t2 * t2 + .984375;
			}
			static bezier(x1, y1, x2, y2) {
				return bezier$1(x1, y1, x2, y2);
			}
			static in(easing) {
				return easing;
			}
			static out(easing) {
				return (t) => 1 - easing(1 - t);
			}
			static inOut(easing) {
				return (t) => {
					if (t < .5) return easing(t * 2) / 2;
					return 1 - easing((1 - t) * 2) / 2;
				};
			}
		};
		var NUMBER$1 = "[-+]?\\d*\\.?\\d+";
		var PERCENTAGE$1 = NUMBER$1 + "%";
		function call$1(...args) {
			return "\\(\\s*(" + args.join(")\\s*,\\s*(") + ")\\s*\\)";
		}
		var MODERN_VALUE$1 = "(?:none|[-+]?\\d*\\.?\\d+(?:%|deg|rad|grad|turn)?)";
		function modernColorCall$1(name) {
			return new RegExp(name + "\\(\\s*(" + MODERN_VALUE$1 + ")\\s+(" + MODERN_VALUE$1 + ")\\s+(" + MODERN_VALUE$1 + ")(?:\\s*\\/\\s*(" + MODERN_VALUE$1 + "))?\\s*\\)");
		}
		function getMatchers$1() {
			const cachedMatchers = {
				rgb: void 0,
				rgba: void 0,
				hsl: void 0,
				hsla: void 0,
				hex3: void 0,
				hex4: void 0,
				hex5: void 0,
				hex6: void 0,
				hex8: void 0,
				oklch: void 0,
				oklab: void 0,
				lab: void 0,
				lch: void 0,
				hwb: void 0
			};
			if (cachedMatchers.rgb === void 0) {
				cachedMatchers.rgb = new RegExp("rgb" + call$1(NUMBER$1, NUMBER$1, NUMBER$1));
				cachedMatchers.rgba = new RegExp("rgba" + call$1(NUMBER$1, NUMBER$1, NUMBER$1, NUMBER$1));
				cachedMatchers.hsl = new RegExp("hsl" + call$1(NUMBER$1, PERCENTAGE$1, PERCENTAGE$1));
				cachedMatchers.hsla = new RegExp("hsla" + call$1(NUMBER$1, PERCENTAGE$1, PERCENTAGE$1, NUMBER$1));
				cachedMatchers.hex3 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
				cachedMatchers.hex4 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
				cachedMatchers.hex6 = /^#([0-9a-fA-F]{6})$/;
				cachedMatchers.hex8 = /^#([0-9a-fA-F]{8})$/;
				cachedMatchers.oklch = modernColorCall$1("oklch");
				cachedMatchers.oklab = modernColorCall$1("oklab");
				cachedMatchers.lab = modernColorCall$1("lab");
				cachedMatchers.lch = modernColorCall$1("lch");
				cachedMatchers.hwb = modernColorCall$1("hwb");
			}
			return cachedMatchers;
		}
		function hue2rgb$1(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}
		function hslToRgb$1(h, s, l) {
			const q = l < .5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			const r = hue2rgb$1(p, q, h + 1 / 3);
			const g = hue2rgb$1(p, q, h);
			const b2 = hue2rgb$1(p, q, h - 1 / 3);
			return Math.round(r * 255) << 24 | Math.round(g * 255) << 16 | Math.round(b2 * 255) << 8;
		}
		function parse255$1(str) {
			const int = Number.parseInt(str, 10);
			if (int < 0) return 0;
			if (int > 255) return 255;
			return int;
		}
		function parse360$1(str) {
			return (Number.parseFloat(str) % 360 + 360) % 360 / 360;
		}
		function parse1$1(str) {
			const num = Number.parseFloat(str);
			if (num < 0) return 0;
			if (num > 1) return 255;
			return Math.round(num * 255);
		}
		function parsePercentage$1(str) {
			const int = Number.parseFloat(str);
			if (int < 0) return 0;
			if (int > 100) return 1;
			return int / 100;
		}
		function parseModernComponent$1(str, percentScale) {
			if (str === "none") return 0;
			if (str.endsWith("%")) return Number.parseFloat(str) / 100 * percentScale;
			return Number.parseFloat(str);
		}
		function parseHueAngle$1(str) {
			if (str === "none") return 0;
			if (str.endsWith("rad")) return Number.parseFloat(str) * 180 / Math.PI;
			if (str.endsWith("grad")) return Number.parseFloat(str) * .9;
			if (str.endsWith("turn")) return Number.parseFloat(str) * 360;
			return Number.parseFloat(str);
		}
		function parseModernAlpha$1(str) {
			if (str === void 0 || str === "none") return 1;
			if (str.endsWith("%")) return Math.max(0, Math.min(1, Number.parseFloat(str) / 100));
			return Math.max(0, Math.min(1, Number.parseFloat(str)));
		}
		function linearToSrgb$1(c2) {
			if (c2 <= .0031308) return 12.92 * c2;
			return 1.055 * c2 ** (1 / 2.4) - .055;
		}
		function clamp01$1(v) {
			return Math.max(0, Math.min(1, v));
		}
		function rgbFloatToInt$1(r, g, b2, alpha) {
			const ri = Math.round(clamp01$1(r) * 255);
			const gi = Math.round(clamp01$1(g) * 255);
			const bi = Math.round(clamp01$1(b2) * 255);
			const ai = Math.round(clamp01$1(alpha) * 255);
			return (ri << 24 | gi << 16 | bi << 8 | ai) >>> 0;
		}
		function oklabToSrgb$1(L, a2, b2) {
			const l_ = L + .3963377774 * a2 + .2158037573 * b2;
			const m_ = L - .1055613458 * a2 - .0638541728 * b2;
			const s_ = L - .0894841775 * a2 - 1.291485548 * b2;
			const l = l_ * l_ * l_;
			const m = m_ * m_ * m_;
			const s = s_ * s_ * s_;
			const rLin = 4.0767416621 * l - 3.3077115913 * m + .2309699292 * s;
			const gLin = -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s;
			const bLin = -.0041960863 * l - .7034186147 * m + 1.707614701 * s;
			return [
				linearToSrgb$1(rLin),
				linearToSrgb$1(gLin),
				linearToSrgb$1(bLin)
			];
		}
		function labToSrgb$1(L, a2, b2) {
			const epsilon = 216 / 24389;
			const kappa = 24389 / 27;
			const Xn = .95047;
			const Yn = 1;
			const Zn = 1.08883;
			const fy = (L + 16) / 116;
			const fx = a2 / 500 + fy;
			const fz = fy - b2 / 200;
			const fx3 = fx * fx * fx;
			const fz3 = fz * fz * fz;
			const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa;
			const yr = L > kappa * epsilon ? ((L + 16) / 116) ** 3 : L / kappa;
			const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa;
			const X = xr * Xn;
			const Y = yr * Yn;
			const Z = zr * Zn;
			const rLin = 3.2404542 * X - 1.5371385 * Y - .4985314 * Z;
			const gLin = -.969266 * X + 1.8760108 * Y + .041556 * Z;
			const bLin = .0556434 * X - .2040259 * Y + 1.0572252 * Z;
			return [
				linearToSrgb$1(rLin),
				linearToSrgb$1(gLin),
				linearToSrgb$1(bLin)
			];
		}
		function hwbToSrgb$1(h, w, bk) {
			if (w + bk >= 1) {
				const gray = w / (w + bk);
				return [
					gray,
					gray,
					gray
				];
			}
			const q = 1;
			const p = 0;
			const r = hue2rgb$1(p, q, h + 1 / 3);
			const g = hue2rgb$1(p, q, h);
			const bl = hue2rgb$1(p, q, h - 1 / 3);
			const factor = 1 - w - bk;
			return [
				r * factor + w,
				g * factor + w,
				bl * factor + w
			];
		}
		var colorNames$1 = {
			transparent: 0,
			aliceblue: 4042850303,
			antiquewhite: 4209760255,
			aqua: 16777215,
			aquamarine: 2147472639,
			azure: 4043309055,
			beige: 4126530815,
			bisque: 4293182719,
			black: 255,
			blanchedalmond: 4293643775,
			blue: 65535,
			blueviolet: 2318131967,
			brown: 2771004159,
			burlywood: 3736635391,
			burntsienna: 3934150143,
			cadetblue: 1604231423,
			chartreuse: 2147418367,
			chocolate: 3530104575,
			coral: 4286533887,
			cornflowerblue: 1687547391,
			cornsilk: 4294499583,
			crimson: 3692313855,
			cyan: 16777215,
			darkblue: 35839,
			darkcyan: 9145343,
			darkgoldenrod: 3095792639,
			darkgray: 2846468607,
			darkgreen: 6553855,
			darkgrey: 2846468607,
			darkkhaki: 3182914559,
			darkmagenta: 2332068863,
			darkolivegreen: 1433087999,
			darkorange: 4287365375,
			darkorchid: 2570243327,
			darkred: 2332033279,
			darksalmon: 3918953215,
			darkseagreen: 2411499519,
			darkslateblue: 1211993087,
			darkslategray: 793726975,
			darkslategrey: 793726975,
			darkturquoise: 13554175,
			darkviolet: 2483082239,
			deeppink: 4279538687,
			deepskyblue: 12582911,
			dimgray: 1768516095,
			dimgrey: 1768516095,
			dodgerblue: 512819199,
			firebrick: 2988581631,
			floralwhite: 4294635775,
			forestgreen: 579543807,
			fuchsia: 4278255615,
			gainsboro: 3705462015,
			ghostwhite: 4177068031,
			gold: 4292280575,
			goldenrod: 3668254975,
			gray: 2155905279,
			green: 8388863,
			greenyellow: 2919182335,
			grey: 2155905279,
			honeydew: 4043305215,
			hotpink: 4285117695,
			indianred: 3445382399,
			indigo: 1258324735,
			ivory: 4294963455,
			khaki: 4041641215,
			lavender: 3873897215,
			lavenderblush: 4293981695,
			lawngreen: 2096890111,
			lemonchiffon: 4294626815,
			lightblue: 2916673279,
			lightcoral: 4034953471,
			lightcyan: 3774873599,
			lightgoldenrodyellow: 4210742015,
			lightgray: 3553874943,
			lightgreen: 2431553791,
			lightgrey: 3553874943,
			lightpink: 4290167295,
			lightsalmon: 4288707327,
			lightseagreen: 548580095,
			lightskyblue: 2278488831,
			lightslategray: 2005441023,
			lightslategrey: 2005441023,
			lightsteelblue: 2965692159,
			lightyellow: 4294959359,
			lime: 16711935,
			limegreen: 852308735,
			linen: 4210091775,
			magenta: 4278255615,
			maroon: 2147483903,
			mediumaquamarine: 1724754687,
			mediumblue: 52735,
			mediumorchid: 3126187007,
			mediumpurple: 2473647103,
			mediumseagreen: 1018393087,
			mediumslateblue: 2070474495,
			mediumspringgreen: 16423679,
			mediumturquoise: 1221709055,
			mediumvioletred: 3340076543,
			midnightblue: 421097727,
			mintcream: 4127193855,
			mistyrose: 4293190143,
			moccasin: 4293178879,
			navajowhite: 4292783615,
			navy: 33023,
			oldlace: 4260751103,
			olive: 2155872511,
			olivedrab: 1804477439,
			orange: 4289003775,
			orangered: 4282712319,
			orchid: 3664828159,
			palegoldenrod: 4008225535,
			palegreen: 2566625535,
			paleturquoise: 2951671551,
			palevioletred: 3681588223,
			papayawhip: 4293907967,
			peachpuff: 4292524543,
			peru: 3448061951,
			pink: 4290825215,
			plum: 3718307327,
			powderblue: 2967529215,
			purple: 2147516671,
			rebeccapurple: 1714657791,
			red: 4278190335,
			rosybrown: 3163525119,
			royalblue: 1097458175,
			saddlebrown: 2336560127,
			salmon: 4202722047,
			sandybrown: 4104413439,
			seagreen: 780883967,
			seashell: 4294307583,
			sienna: 2689740287,
			silver: 3233857791,
			skyblue: 2278484991,
			slateblue: 1784335871,
			slategray: 1887473919,
			slategrey: 1887473919,
			snow: 4294638335,
			springgreen: 16744447,
			steelblue: 1182971135,
			tan: 3535047935,
			teal: 8421631,
			thistle: 3636451583,
			tomato: 4284696575,
			turquoise: 1088475391,
			violet: 4001558271,
			wheat: 4125012991,
			white: 4294967295,
			whitesmoke: 4126537215,
			yellow: 4294902015,
			yellowgreen: 2597139199
		};
		function normalizeColor$1(color) {
			const matchers = getMatchers$1();
			let match;
			if (matchers.hex6) {
				if (match = matchers.hex6.exec(color)) return Number.parseInt(match[1] + "ff", 16) >>> 0;
			}
			if (colorNames$1[color] !== void 0) return colorNames$1[color];
			if (matchers.rgb) {
				if (match = matchers.rgb.exec(color)) return (parse255$1(match[1]) << 24 | parse255$1(match[2]) << 16 | parse255$1(match[3]) << 8 | 255) >>> 0;
			}
			if (matchers.rgba) {
				if (match = matchers.rgba.exec(color)) return (parse255$1(match[1]) << 24 | parse255$1(match[2]) << 16 | parse255$1(match[3]) << 8 | parse1$1(match[4])) >>> 0;
			}
			if (matchers.hex3) {
				if (match = matchers.hex3.exec(color)) return Number.parseInt(match[1] + match[1] + match[2] + match[2] + match[3] + match[3] + "ff", 16) >>> 0;
			}
			if (matchers.hex8) {
				if (match = matchers.hex8.exec(color)) return Number.parseInt(match[1], 16) >>> 0;
			}
			if (matchers.hex4) {
				if (match = matchers.hex4.exec(color)) return Number.parseInt(match[1] + match[1] + match[2] + match[2] + match[3] + match[3] + match[4] + match[4], 16) >>> 0;
			}
			if (matchers.hsl) {
				if (match = matchers.hsl.exec(color)) return (hslToRgb$1(parse360$1(match[1]), parsePercentage$1(match[2]), parsePercentage$1(match[3])) | 255) >>> 0;
			}
			if (matchers.hsla) {
				if (match = matchers.hsla.exec(color)) return (hslToRgb$1(parse360$1(match[1]), parsePercentage$1(match[2]), parsePercentage$1(match[3])) | parse1$1(match[4])) >>> 0;
			}
			if (matchers.oklch) {
				if (match = matchers.oklch.exec(color)) {
					const L = parseModernComponent$1(match[1], 1);
					const C = parseModernComponent$1(match[2], .4);
					const H = parseHueAngle$1(match[3]);
					const alpha = parseModernAlpha$1(match[4]);
					const hRad = H * Math.PI / 180;
					const [r, g, b2] = oklabToSrgb$1(L, C * Math.cos(hRad), C * Math.sin(hRad));
					return rgbFloatToInt$1(r, g, b2, alpha);
				}
			}
			if (matchers.oklab) {
				if (match = matchers.oklab.exec(color)) {
					const L = parseModernComponent$1(match[1], 1);
					const a2 = parseModernComponent$1(match[2], .4);
					const b2 = parseModernComponent$1(match[3], .4);
					const alpha = parseModernAlpha$1(match[4]);
					const [r, g, bl] = oklabToSrgb$1(L, a2, b2);
					return rgbFloatToInt$1(r, g, bl, alpha);
				}
			}
			if (matchers.lab) {
				if (match = matchers.lab.exec(color)) {
					const L = parseModernComponent$1(match[1], 100);
					const a2 = parseModernComponent$1(match[2], 125);
					const b2 = parseModernComponent$1(match[3], 125);
					const alpha = parseModernAlpha$1(match[4]);
					const [r, g, bl] = labToSrgb$1(L, a2, b2);
					return rgbFloatToInt$1(r, g, bl, alpha);
				}
			}
			if (matchers.lch) {
				if (match = matchers.lch.exec(color)) {
					const L = parseModernComponent$1(match[1], 100);
					const C = parseModernComponent$1(match[2], 150);
					const H = parseHueAngle$1(match[3]);
					const alpha = parseModernAlpha$1(match[4]);
					const hRad = H * Math.PI / 180;
					const [r, g, bl] = labToSrgb$1(L, C * Math.cos(hRad), C * Math.sin(hRad));
					return rgbFloatToInt$1(r, g, bl, alpha);
				}
			}
			if (matchers.hwb) {
				if (match = matchers.hwb.exec(color)) {
					const H = parseHueAngle$1(match[1]);
					const W = parseModernComponent$1(match[2], 1);
					const B = parseModernComponent$1(match[3], 1);
					const alpha = parseModernAlpha$1(match[4]);
					const [r, g, bl] = hwbToSrgb$1(H / 360, W, B);
					return rgbFloatToInt$1(r, g, bl, alpha);
				}
			}
			throw new Error(`invalid color string ${color} provided`);
		}
		var opacity = (c2) => {
			return (c2 >> 24 & 255) / 255;
		};
		var red = (c2) => {
			return c2 >> 16 & 255;
		};
		var green = (c2) => {
			return c2 >> 8 & 255;
		};
		var blue = (c2) => {
			return c2 & 255;
		};
		var rgbaColor = (r, g, b2, alpha) => {
			return `rgba(${r}, ${g}, ${b2}, ${alpha})`;
		};
		function processColor$1(color) {
			const normalizedColor = normalizeColor$1(color);
			return (normalizedColor << 24 | normalizedColor >>> 8) >>> 0;
		}
		var interpolateColorsRGB = (value, inputRange, colors, options) => {
			const [r, g, b2, a2] = [
				red,
				green,
				blue,
				opacity
			].map((f) => {
				const unrounded = interpolate$1(value, inputRange, colors.map((c2) => f(c2)), {
					easing: options?.easing,
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
					posterize: options?.posterize
				});
				if (f === opacity) return Number(unrounded.toFixed(3));
				return Math.round(unrounded);
			});
			return rgbaColor(r, g, b2, a2);
		};
		var interpolateColors = (input, inputRange, outputRange, options) => {
			if (typeof input === "undefined") throw new TypeError("input can not be undefined");
			if (typeof inputRange === "undefined") throw new TypeError("inputRange can not be undefined");
			if (typeof outputRange === "undefined") throw new TypeError("outputRange can not be undefined");
			if (inputRange.length !== outputRange.length) throw new TypeError("inputRange (" + inputRange.length + " values provided) and outputRange (" + outputRange.length + " values provided) must have the same length");
			return interpolateColorsRGB(input, inputRange, outputRange.map((c2) => processColor$1(c2)), options);
		};
		var easingToFn = ({ easing, forceSpringAllowTail }) => {
			switch (easing.type) {
				case "linear": return Easing$1.linear;
				case "step1": return Easing$1.step1;
				case "spring": return Easing$1.spring({
					allowTail: forceSpringAllowTail ?? easing.allowTail ?? void 0,
					damping: easing.damping,
					durationRestThreshold: easing.durationRestThreshold ?? void 0,
					mass: easing.mass,
					overshootClamping: easing.overshootClamping,
					stiffness: easing.stiffness
				});
				case "bezier": return bezier$1(easing.x1, easing.y1, easing.x2, easing.y2);
				default: throw new TypeError(`Unsupported easing: ${JSON.stringify(easing)}`);
			}
		};
		var interpolateKeyframedStatus = ({ frame, forceSpringAllowTail, status }) => {
			const { keyframes, easing, clamping, interpolationFunction } = status;
			if (keyframes.length === 0) return null;
			const sortedKeyframes = [...keyframes].sort((a2, b2) => a2.frame - b2.frame);
			const inputRange = sortedKeyframes.map((k) => k.frame);
			const outputs = sortedKeyframes.map((k) => k.value);
			if (interpolationFunction === "interpolateColors") {
				if (!outputs.every((v) => typeof v === "string")) return null;
				if (keyframes.length === 1) return outputs[0];
				try {
					return interpolateColors(frame, inputRange, outputs, {
						easing: easing.map((e) => easingToFn({
							easing: e,
							forceSpringAllowTail
						})),
						posterize: status.posterize
					});
				} catch {
					return null;
				}
			}
			if (interpolationFunction !== "interpolate") return null;
			try {
				return interpolate$1(frame, inputRange, outputs, {
					easing: easing.map((e) => easingToFn({
						easing: e,
						forceSpringAllowTail
					})),
					extrapolateLeft: clamping.left,
					extrapolateRight: clamping.right,
					output: status.output,
					posterize: status.posterize
				});
			} catch {
				return null;
			}
		};
		var getFrameInKeyframedStatusClock = ({ frame, status }) => frame - (status.keyframeDisplayOffsetAdjustment ?? 0);
		var resolveDragOverrideValue = ({ dragOverrideValue, frame }) => {
			if (dragOverrideValue === void 0) return { type: "none" };
			if (dragOverrideValue.type === "static") return {
				type: "resolved",
				value: dragOverrideValue.value
			};
			if (frame === null) return { type: "none" };
			const interpolated = interpolateKeyframedStatus({
				forceSpringAllowTail: null,
				frame: getFrameInKeyframedStatusClock({
					frame,
					status: dragOverrideValue.status
				}),
				status: dragOverrideValue.status
			});
			if (interpolated === null) return { type: "none" };
			return {
				type: "resolved",
				value: interpolated
			};
		};
		var getEffectiveVisualModeValue = ({ propStatus, dragOverrideValue, defaultValue, frame = null, shouldResortToDefaultValueIfUndefined = false }) => {
			const dragOverride = resolveDragOverrideValue({
				dragOverrideValue,
				frame
			});
			if (dragOverride.type === "resolved" && dragOverride.value !== void 0) return dragOverride.value;
			if (propStatus.status === "keyframed") {
				if (frame !== null) return interpolateKeyframedStatus({
					forceSpringAllowTail: null,
					frame: getFrameInKeyframedStatusClock({
						frame,
						status: propStatus
					}),
					status: propStatus
				});
				return shouldResortToDefaultValueIfUndefined ? defaultValue : void 0;
			}
			if (propStatus.codeValue === void 0 && shouldResortToDefaultValueIfUndefined) return defaultValue;
			return propStatus.codeValue;
		};
		var OverrideIdsToNodePathsGettersContext = (0, react.createContext)({ overrideIdToNodePathMappings: {} });
		var OverrideIdsToNodePathsSettersContext = (0, react.createContext)({ setOverrideIdToNodePath: () => {
			throw new Error("OverrideIdsToNodePathsSettersContext not initialized");
		} });
		var mergeOverrides = ({ descriptor, propStatusOverrides, dragOverrides, frame }) => {
			if (!propStatusOverrides && !dragOverrides) return {
				params: descriptor.params,
				effectKey: descriptor.effectKey
			};
			const merged = { ...descriptor.params };
			if (propStatusOverrides) {
				for (const [key, value] of Object.entries(propStatusOverrides)) if (value !== void 0) merged[key] = value;
			}
			if (dragOverrides) for (const [key, value] of Object.entries(dragOverrides)) {
				const resolved = resolveDragOverrideValue({
					dragOverrideValue: value,
					frame
				});
				if (resolved.type === "resolved") merged[key] = resolved.value;
			}
			return {
				params: merged,
				effectKey: descriptor.definition.calculateKey(merged)
			};
		};
		var resolvePropStatusOverrides = (propStatus, frame) => {
			if (!propStatus) return null;
			const out = {};
			let hasAny = false;
			for (const [key, status] of Object.entries(propStatus)) {
				if (status.status === "static") {
					out[key] = status.codeValue;
					hasAny = true;
					continue;
				}
				if (status.status === "keyframed") {
					const value = interpolateKeyframedStatus({
						forceSpringAllowTail: null,
						frame,
						status
					});
					if (value !== null) {
						out[key] = value;
						hasAny = true;
					}
				}
			}
			return hasAny ? out : null;
		};
		var useMemoizedEffectDefinitions = (effects) => {
			const previousRef = (0, react.useRef)(null);
			const definitions = effects.map((descriptor) => descriptor.definition);
			const previous = previousRef.current;
			const isSame = previous !== null && previous.definitions.length === definitions.length && previous.definitions.every((definition, i) => definition === definitions[i]);
			const controllers = isSame ? previous.controllers : effects.map((effect) => createRuntimeValueStore(effect.params));
			const stableDefinitions = isSame ? previous.definitions : definitions;
			(0, react.useLayoutEffect)(() => {
				stableDefinitions.forEach((_definition, index) => {
					const snapshot = effects[index]?.params;
					controllers[index].setSnapshot(snapshot);
				});
			}, [
				controllers,
				effects,
				stableDefinitions
			]);
			previousRef.current = {
				definitions: stableDefinitions,
				controllers
			};
			return Object.assign(stableDefinitions, { runtimeValues: controllers.map((controller) => controller.store) });
		};
		var getEffectPropStatusesCtx = ({ propStatuses, nodePath, effectIndex }) => {
			const status = propStatuses[makeSequencePropsSubscriptionKey(nodePath)];
			if (!status) return {
				type: "cannot-update-sequence",
				reason: "not-found"
			};
			if (!status.canUpdate) return {
				type: "cannot-update-sequence",
				reason: status.reason
			};
			const effect = status.effects.find((e) => e.effectIndex === effectIndex);
			if (!effect) return {
				type: "cannot-update-effect",
				reason: "not-found"
			};
			if (!effect.canUpdate) return {
				type: "cannot-update-effect",
				reason: effect.reason
			};
			return {
				type: "can-update-effect",
				props: effect.props
			};
		};
		var getPropStatusesCtx = (propStatuses, nodePath) => {
			const status = propStatuses[makeSequencePropsSubscriptionKey(nodePath)];
			if (!status) return;
			if (!status.canUpdate) return;
			return status.props;
		};
		var useMemoizedEffects = ({ effects, overrideId }) => {
			const previousRef = (0, react.useRef)(null);
			const { propStatuses } = (0, react.useContext)(VisualModePropStatusesContext);
			const { getEffectDragOverrides } = (0, react.useContext)(VisualModeDragOverridesContext);
			const frame = useCurrentFrame();
			const { overrideIdToNodePathMappings } = (0, react.useContext)(OverrideIdsToNodePathsGettersContext);
			const previous = previousRef.current;
			const nodePath = overrideId ? overrideIdToNodePathMappings[overrideId] ?? null : null;
			const resolved = effects.map((descriptor, index) => {
				if (nodePath === null) return {
					descriptor,
					params: descriptor.params,
					effectKey: descriptor.effectKey
				};
				const effectStatus = getEffectPropStatusesCtx({
					propStatuses,
					nodePath,
					effectIndex: index
				});
				const propStatusOverrides = effectStatus.type === "can-update-effect" ? resolvePropStatusOverrides(effectStatus.props, frame) : null;
				const dragOverridesMap = getEffectDragOverrides(nodePath, index);
				const { params, effectKey } = mergeOverrides({
					descriptor,
					propStatusOverrides,
					dragOverrides: Object.keys(dragOverridesMap).length === 0 ? null : dragOverridesMap,
					frame
				});
				return {
					descriptor,
					params,
					effectKey
				};
			});
			if (previous !== null && previous.length === resolved.length && previous.every((p, i) => p.definition === resolved[i].descriptor.definition && p.effectKey === resolved[i].effectKey)) return previous;
			const next = resolved.map(({ descriptor, params, effectKey }) => ({
				definition: descriptor.definition,
				effectKey,
				params,
				memoized: true
			}));
			previousRef.current = next;
			return next;
		};
		var flattenActiveSchema = (schema, resolve) => {
			const out = {};
			for (const key of Object.keys(schema)) {
				const field = schema[key];
				if (field.type === "hidden") continue;
				else if (field.type === "enum") {
					out[key] = field;
					const current = resolve(key) ?? field.default;
					const variant = field.variants[current];
					if (variant) Object.assign(out, flattenActiveSchema(variant, resolve));
				} else out[key] = field;
			}
			return out;
		};
		var getFlatSchemaWithAllKeys = (schema) => {
			const out = {};
			const addKey = (key, field) => {
				if (key in out) return;
				out[key] = field;
			};
			for (const key of Object.keys(schema)) {
				const field = schema[key];
				addKey(key, field);
				if (field.type === "enum") for (const variant of Object.values(field.variants)) {
					const flatVariant = getFlatSchemaWithAllKeys(variant);
					for (const variantKey of Object.keys(flatVariant)) addKey(variantKey, flatVariant[variantKey]);
				}
			}
			return out;
		};
		var findPropsToDelete$1 = ({ schema, key, value }) => {
			const fieldSchema = schema[key];
			if (!fieldSchema) throw new Error("Key " + JSON.stringify(key) + " not found in schema");
			if (typeof value !== "string") throw new Error("Value must be a string, but is " + JSON.stringify(value));
			if (fieldSchema.type !== "enum") throw new Error("Key " + JSON.stringify(key) + " is not an enum");
			if (!fieldSchema.variants[value]) throw new Error("Value for " + JSON.stringify(key) + " must be one of " + Object.keys(fieldSchema.variants).map((v) => JSON.stringify(v)).join(", ") + ", got " + JSON.stringify(value));
			const otherVariants = Object.keys(fieldSchema.variants).filter((v) => v !== value);
			const otherKeys = /* @__PURE__ */ new Set();
			for (const variant of otherVariants) {
				const otherVariant = fieldSchema.variants[variant];
				const keys = Object.keys(otherVariant);
				for (const k of keys) otherKeys.add(k);
			}
			return [...otherKeys];
		};
		var DEFAULT_LINEAR_EASING = { type: "linear" };
		var getEasingIndexToDuplicate = ({ insertedKeyframeIndex, easingLength, keyframeCount }) => {
			if (!(insertedKeyframeIndex > 0 && insertedKeyframeIndex < keyframeCount - 1) || easingLength === 0) return null;
			return Math.min(insertedKeyframeIndex - 1, easingLength - 1);
		};
		var makeStaticDragOverride = (value) => {
			return {
				type: "static",
				value
			};
		};
		var makeKeyframedDragOverride = ({ status, frame, value, defaultEasing: defaultEasing2 = DEFAULT_LINEAR_EASING }) => {
			const existingIndex = status.keyframes.findIndex((keyframe) => keyframe.frame === frame);
			const keyframes = existingIndex === -1 ? [...status.keyframes, {
				frame,
				value
			}].sort((first, second) => first.frame - second.frame) : status.keyframes.map((keyframe, index) => index === existingIndex ? {
				frame,
				value
			} : keyframe);
			const easing = [...status.easing];
			if (existingIndex === -1) {
				const insertedKeyframeIndex = keyframes.findIndex((keyframe) => keyframe.frame === frame);
				const easingIndexToDuplicate = getEasingIndexToDuplicate({
					insertedKeyframeIndex,
					easingLength: easing.length,
					keyframeCount: keyframes.length
				});
				const easingToDuplicate = easingIndexToDuplicate === null ? defaultEasing2 : easing[easingIndexToDuplicate];
				easing.splice(insertedKeyframeIndex, 0, easingToDuplicate);
			}
			while (easing.length < keyframes.length - 1) easing.push(defaultEasing2);
			if (easing.length > keyframes.length - 1) easing.length = keyframes.length - 1;
			return {
				type: "keyframed",
				status: {
					...status,
					keyframes,
					easing
				}
			};
		};
		var getStaticDragOverrideValue = (dragOverrideValue) => {
			if (dragOverrideValue?.type !== "static") return;
			return dragOverrideValue.value;
		};
		var isKeyframedStatus = (status) => {
			return status !== null && status.status === "keyframed";
		};
		var findFieldInSchema = (schema, key) => {
			if (key in schema) return schema[key];
			for (const field of Object.values(schema)) {
				if (field.type !== "enum") continue;
				for (const variant of Object.values(field.variants)) {
					const found = findFieldInSchema(variant, key);
					if (found) return found;
				}
			}
		};
		var computeEffectiveSchemaValuesDotNotation = ({ schema, currentValue, overrideValues, propStatus, frame }) => {
			const merged = {};
			const propsToDelete = /* @__PURE__ */ new Set();
			for (const key of Object.keys(currentValue)) {
				const status = propStatus?.[key] ?? null;
				const field = findFieldInSchema(schema, key);
				if (field?.type === "hidden") continue;
				let value;
				if (status === null) value = currentValue[key];
				else if (isKeyframedStatus(status)) {
					if (field?.type === "array" || field?.keyframable === false) value = currentValue[key];
					else {
						const dragOverride = resolveDragOverrideValue({
							dragOverrideValue: overrideValues[key],
							frame
						});
						if (dragOverride.type === "resolved") value = dragOverride.value;
						else if (frame !== null) value = interpolateKeyframedStatus({
							forceSpringAllowTail: null,
							frame: getFrameInKeyframedStatusClock({
								frame,
								status
							}),
							status
						}) ?? currentValue[key];
						else value = currentValue[key];
					}
				} else if (status.status === "computed") value = currentValue[key];
				else value = getEffectiveVisualModeValue({
					propStatus: status,
					dragOverrideValue: overrideValues[key],
					defaultValue: field?.default,
					frame,
					shouldResortToDefaultValueIfUndefined: false
				});
				if (field?.type === "asset" && typeof value === "string" && value.startsWith(FILE_TOKEN$1)) value = resolveFileTokenToUrl$1(value);
				if (value === void 0) propsToDelete.add(key);
				merged[key] = value;
			}
			for (const key of Object.keys(overrideValues)) if (schema[key]?.type === "enum") {
				const propsToDeleteForKey = findPropsToDelete$1({
					schema,
					key,
					value: merged[key]
				});
				for (const propToDelete of propsToDeleteForKey) propsToDelete.add(propToDelete);
			}
			return {
				merged,
				propsToDelete
			};
		};
		var getNestedValue = (obj, key) => {
			const parts = key.split(".");
			let current = obj;
			for (const part of parts) {
				if (current === null || current === void 0 || typeof current !== "object") return;
				current = current[part];
			}
			return current;
		};
		var getRuntimeValueForSchemaKey = ({ flatSchema, key, props }) => {
			const value = getNestedValue(props, key);
			if (flatSchema[key]?.type === "text-content" && typeof value !== "string") return;
			return value;
		};
		var readValuesFromProps = (props, keys, flatSchema) => {
			const out = {};
			for (const key of keys) out[key] = flatSchema ? getRuntimeValueForSchemaKey({
				flatSchema,
				key,
				props
			}) : getNestedValue(props, key);
			return out;
		};
		var selectActiveKeys = (schema, values) => {
			return Object.keys(flattenActiveSchema(schema, (key) => values[key]));
		};
		var mergeValues$1 = ({ flatSchema, props, valuesDotNotation, schemaKeys, propsToDelete }) => {
			const merged = { ...props };
			for (const key of schemaKeys) {
				const value = valuesDotNotation[key];
				if (flatSchema[key]?.type === "text-content" && value === void 0) continue;
				const parts = key.split(".");
				if (parts.length === 1) {
					merged[key] = value;
					continue;
				}
				let current = merged;
				for (let i = 0; i < parts.length - 1; i++) {
					const part = parts[i];
					if (typeof current[part] === "object" && current[part] !== null) current[part] = { ...current[part] };
					else current[part] = {};
					current = current[part];
				}
				current[parts[parts.length - 1]] = value;
			}
			deleteNestedKey(merged, new Set([...propsToDelete].filter((key) => !(flatSchema[key]?.type === "text-content" && valuesDotNotation[key] === void 0))));
			return merged;
		};
		var stackToOverrideMap = {};
		var DisableInteractivityContext = (0, react.createContext)(false);
		var DisableInteractivityProvider = ({ children }) => {
			return react.default.createElement(DisableInteractivityContext.Provider, { value: true }, children);
		};
		var withInteractivitySchema = ({ Component, componentName, componentIdentity = null, schema, supportsEffects }) => {
			const schemaWithSequenceName = extendSchemaWithSequenceName(schema);
			const flatSchema = getFlatSchemaWithAllKeys(schemaWithSequenceName);
			const flatKeys = Object.keys(flatSchema);
			const Wrapped = (0, react.forwardRef)((props, ref) => {
				const { _remotionInternalStack: internalStack, ...propsWithoutInternalStack } = props;
				const cleanProps = propsWithoutInternalStack;
				const env = useRemotionEnvironment();
				const canUseRemotionHooks = (0, react.useContext)(CanUseRemotionHooks);
				const disableInteractivity = (0, react.useContext)(DisableInteractivityContext);
				if (!env.isStudio || env.isRendering || !canUseRemotionHooks || disableInteractivity) return react.default.createElement(Component, {
					...cleanProps,
					controls: null,
					ref
				});
				const { propStatuses } = (0, react.useContext)(VisualModePropStatusesContext);
				const { getDragOverrides } = (0, react.useContext)(VisualModeDragOverridesContext);
				const nodePathMapping = (0, react.useContext)(OverrideIdsToNodePathsGettersContext);
				const frame = useCurrentFrame();
				const videoConfig = useUnsafeVideoConfig();
				const durationInFrames = videoConfig?.durationInFrames;
				const fps = videoConfig?.fps;
				const height = videoConfig?.height;
				const width = videoConfig?.width;
				const videoConfigValues = (0, react.useMemo)(() => durationInFrames === void 0 || fps === void 0 || height === void 0 || width === void 0 ? null : {
					durationInFrames,
					fps,
					height,
					width
				}, [
					durationInFrames,
					fps,
					height,
					width
				]);
				if (cleanProps.controls) {
					const passedControls = cleanProps.controls;
					if (getStackForControls(passedControls) === null) setStackForControls(passedControls, internalStack);
					return react.default.createElement(Component, {
						...cleanProps,
						ref
					});
				}
				const [overrideId] = (0, react.useState)(() => {
					if (!internalStack) return String(Math.random());
					const existingOverrideId = stackToOverrideMap[internalStack];
					if (existingOverrideId) return existingOverrideId;
					const newOverrideId = String(Math.random());
					stackToOverrideMap[internalStack] = newOverrideId;
					return newOverrideId;
				});
				const nodePath = env.isReadOnlyStudio ? null : nodePathMapping.overrideIdToNodePathMappings[overrideId] ?? null;
				const runtimeValues = flatKeys.map((key) => getRuntimeValueForSchemaKey({
					flatSchema,
					key,
					props: cleanProps
				}));
				const currentRuntimeValueDotNotation = (0, react.useMemo)(() => readValuesFromProps(cleanProps, flatKeys, flatSchema), runtimeValues);
				const [runtimeValueStore] = (0, react.useState)(() => createRuntimeValueStore(currentRuntimeValueDotNotation));
				(0, react.useLayoutEffect)(() => {
					runtimeValueStore.setSnapshot(currentRuntimeValueDotNotation);
				}, [currentRuntimeValueDotNotation, runtimeValueStore]);
				const controls = (0, react.useMemo)(() => {
					return {
						schema: schemaWithSequenceName,
						currentRuntimeValueDotNotation,
						runtimeValues: runtimeValueStore.store,
						videoConfigValues,
						overrideId,
						supportsEffects,
						componentIdentity,
						componentName
					};
				}, [
					currentRuntimeValueDotNotation,
					overrideId,
					runtimeValueStore.store,
					videoConfigValues
				]);
				setStackForControls(controls, internalStack);
				const { merged: valuesDotNotation, propsToDelete } = (0, react.useMemo)(() => {
					return computeEffectiveSchemaValuesDotNotation({
						schema: schemaWithSequenceName,
						currentValue: currentRuntimeValueDotNotation,
						overrideValues: nodePath === null ? {} : getDragOverrides(nodePath),
						propStatus: nodePath === null ? void 0 : getPropStatusesCtx(propStatuses, nodePath),
						frame
					});
				}, [
					currentRuntimeValueDotNotation,
					getDragOverrides,
					nodePath,
					propStatuses,
					frame
				]);
				const activeKeys = selectActiveKeys(schemaWithSequenceName, valuesDotNotation);
				const mergedProps = mergeValues$1({
					flatSchema,
					props: cleanProps,
					valuesDotNotation,
					schemaKeys: activeKeys,
					propsToDelete
				});
				return react.default.createElement(Component, {
					...mergedProps,
					controls,
					ref
				});
			});
			Wrapped.displayName = `withInteractivitySchema(${Component.displayName || Component.name || "Component"})`;
			return Wrapped;
		};
		var EMPTY_EFFECTS = [];
		var RegularSequenceRefForwardingFunction = ({ from = 0, trimBefore = 0, freeze, durationInFrames = Infinity, children, name, height, width, showInTimeline = true, hidden = false, controls, _remotionInternalEffects, _remotionInternalLoopDisplay: loopDisplay, _remotionInternalStack: stack, _remotionInternalDocumentationLink: documentationLink, _remotionInternalSingleChildComponent: singleChildComponent, _remotionInternalPremountDisplay: premountDisplay, _remotionInternalPostmountDisplay: postmountDisplay, _remotionInternalIsMedia: isMedia, outlineRef: passedRefForOutline, cropLeft, cropRight, cropTop, cropBottom, ...other }, ref) => {
			const { layout = "absolute-fill" } = other;
			const [id] = (0, react.useState)(() => String(Math.random()));
			const parentSequence = (0, react.useContext)(SequenceContext);
			const cumulatedFrom = parentSequence ? parentSequence.cumulatedFrom + parentSequence.relativeFrom : 0;
			if (layout !== "absolute-fill" && layout !== "none") throw new TypeError(`The layout prop of <Sequence /> expects either "absolute-fill" or "none", but you passed: ${layout}`);
			const cropProps = {
				cropLeft,
				cropRight,
				cropTop,
				cropBottom
			};
			const hasCropProp = Object.values(cropProps).some((value) => value !== void 0);
			if (layout === "none" && hasCropProp) throw new TypeError("The cropLeft, cropRight, cropTop and cropBottom props of <Sequence /> are only supported with layout=\"absolute-fill\".");
			validateSequenceCrop(cropProps);
			const { left: resolvedCropLeft, right: resolvedCropRight, top: resolvedCropTop, bottom: resolvedCropBottom } = resolveSequenceCrop(cropProps);
			if (layout === "none" && typeof other.style !== "undefined") throw new TypeError("If layout=\"none\", you may not pass a style. Passed: " + JSON.stringify(other.style));
			if (typeof durationInFrames !== "number") throw new TypeError(`You passed to durationInFrames an argument of type ${typeof durationInFrames}, but it must be a number.`);
			if (durationInFrames <= 0) throw new TypeError(`durationInFrames must be positive, but got ${durationInFrames}`);
			if (typeof from !== "number") throw new TypeError(`You passed to the "from" props of your <Sequence> an argument of type ${typeof from}, but it must be a number.`);
			if (!Number.isFinite(from)) throw new TypeError(`The "from" prop of a sequence must be finite, but got ${from}.`);
			if (typeof trimBefore !== "number") throw new TypeError(`You passed to the "trimBefore" prop of your <Sequence> an argument of type ${typeof trimBefore}, but it must be a number.`);
			if (trimBefore < 0) throw new TypeError(`The "trimBefore" prop of <Sequence /> must be greater than or equal to 0, but got ${trimBefore}.`);
			if (Number.isNaN(trimBefore)) throw new TypeError("The \"trimBefore\" prop of <Sequence /> must be a real number, but it is NaN.");
			if (!Number.isFinite(trimBefore)) throw new TypeError(`The "trimBefore" prop of <Sequence /> must be finite, but it is ${trimBefore}.`);
			if (typeof freeze !== "undefined" && freeze !== null) {
				if (typeof freeze !== "number") throw new TypeError(`The "freeze" prop of <Sequence /> must be a number, but is of type ${typeof freeze}.`);
				if (Number.isNaN(freeze)) throw new TypeError(`The "freeze" prop of <Sequence /> must be a real number, but it is NaN.`);
				if (!Number.isFinite(freeze)) throw new TypeError(`The "freeze" prop of <Sequence /> must be finite, but it is ${freeze}.`);
			}
			const absoluteFrame = useTimelinePosition();
			const videoConfig = useVideoConfig();
			const effectiveRelativeFrom = from - trimBefore;
			const absoluteFrom = (parentSequence?.absoluteFrom ?? 0) + effectiveRelativeFrom;
			const parentSequenceDuration = parentSequence ? Math.min(parentSequence.durationInFrames - effectiveRelativeFrom, durationInFrames) : durationInFrames;
			const actualDurationInFrames = Math.max(0, Math.min(videoConfig.durationInFrames - from, parentSequenceDuration));
			const sequenceRegistrationEnabled = (0, react.useContext)(SequenceRegistrationContext);
			const wrapperRefForOutline = (0, react.useRef)(null);
			const refForOutline = other.layout === "none" ? passedRefForOutline ?? null : passedRefForOutline ?? wrapperRefForOutline;
			const premounting = (0, react.useMemo)(() => {
				return parentSequence?.premounting || Boolean(other._remotionInternalIsPremounting);
			}, [other._remotionInternalIsPremounting, parentSequence?.premounting]);
			const postmounting = (0, react.useMemo)(() => {
				return parentSequence?.postmounting || Boolean(other._remotionInternalIsPostmounting);
			}, [other._remotionInternalIsPostmounting, parentSequence?.postmounting]);
			const currentSequenceStart = cumulatedFrom + effectiveRelativeFrom;
			const parentSequenceStart = parentSequence ? parentSequence.cumulatedFrom + parentSequence.relativeFrom : 0;
			const parentFirstFrame = parentSequence ? parentSequenceStart - parentSequence.cumulatedNegativeFrom : 0;
			const cumulatedNegativeFrom = currentSequenceStart - Math.max(0, parentFirstFrame, currentSequenceStart);
			const contextValue = (0, react.useMemo)(() => {
				return {
					absoluteFrom,
					cumulatedFrom,
					relativeFrom: effectiveRelativeFrom,
					cumulatedNegativeFrom,
					durationInFrames: actualDurationInFrames,
					parentFrom: parentSequence?.relativeFrom ?? 0,
					id,
					height: height ?? parentSequence?.height ?? null,
					width: width ?? parentSequence?.width ?? null,
					premounting,
					postmounting,
					premountDisplay: premountDisplay ?? null,
					postmountDisplay: postmountDisplay ?? null
				};
			}, [
				cumulatedFrom,
				absoluteFrom,
				effectiveRelativeFrom,
				actualDurationInFrames,
				parentSequence,
				id,
				height,
				width,
				premounting,
				postmounting,
				premountDisplay,
				postmountDisplay,
				cumulatedNegativeFrom
			]);
			const timelineClipName = (0, react.useMemo)(() => {
				return name ?? "";
			}, [name]);
			const resolvedDocumentationLink = documentationLink ?? "https://www.remotion.dev/docs/sequence";
			const env = useRemotionEnvironment();
			const isInsideSeries = (0, react.useContext)(IsInsideSeriesContext);
			const stackRef = (0, react.useRef)(null);
			stackRef.current = controls ? getStackForControls(controls) ?? stack ?? null : stack ?? null;
			const registeredFrozenFrame = typeof freeze === "number" ? freeze : null;
			const registeredTrimBefore = trimBefore === 0 ? null : trimBefore;
			const parentCumulatedNegativeFrom = parentSequence?.cumulatedNegativeFrom ?? 0;
			const startMediaFrom = isMedia && isMedia.type !== "image" ? isMedia.data.startMediaFrom + parentCumulatedNegativeFrom - cumulatedNegativeFrom : null;
			const mediaFrameAtSequenceZero = isMedia && isMedia.type !== "image" ? isMedia.data.startMediaFrom + parentCumulatedNegativeFrom : null;
			const frozenMediaFrame = isMedia && isMedia.type !== "image" && mediaFrameAtSequenceZero !== null ? registeredFrozenFrame === null ? null : mediaFrameAtSequenceZero + (loopDisplay ? registeredFrozenFrame % loopDisplay.durationInFrames : registeredFrozenFrame) * isMedia.data.playbackRate : null;
			const controlsSchema = controls?.schema;
			const controlsRuntimeValues = controls?.runtimeValues;
			const controlsOverrideId = controls?.overrideId;
			const controlsSupportsEffects = controls?.supportsEffects;
			const controlsComponentIdentity = controls?.componentIdentity;
			const controlsComponentName = controls?.componentName;
			const controlsVideoConfigValues = controls?.videoConfigValues;
			const effectRuntimeValues = (0, react.useMemo)(() => _remotionInternalEffects?.runtimeValues ?? null, [_remotionInternalEffects]);
			const registrationControls = (0, react.useMemo)(() => {
				if (controlsSchema === void 0 || controlsRuntimeValues === void 0 || controlsOverrideId === void 0 || controlsSupportsEffects === void 0 || controlsComponentIdentity === void 0 || controlsComponentName === void 0 || controlsVideoConfigValues === void 0) return null;
				return {
					schema: controlsSchema,
					runtimeValues: controlsRuntimeValues,
					overrideId: controlsOverrideId,
					supportsEffects: controlsSupportsEffects,
					componentIdentity: controlsComponentIdentity,
					componentName: controlsComponentName,
					videoConfigValues: controlsVideoConfigValues
				};
			}, [
				controlsComponentIdentity,
				controlsComponentName,
				controlsVideoConfigValues,
				controlsOverrideId,
				controlsRuntimeValues,
				controlsSchema,
				controlsSupportsEffects
			]);
			const getSequenceForRegistration = (0, react.useCallback)(() => {
				if (isMedia) {
					if (isMedia.type === "image") return {
						type: "image",
						controls: registrationControls,
						effects: _remotionInternalEffects ?? EMPTY_EFFECTS,
						effectRuntimeValues,
						displayName: timelineClipName,
						documentationLink: resolvedDocumentationLink,
						duration: actualDurationInFrames,
						from,
						trimBefore: registeredTrimBefore,
						id,
						loopDisplay,
						parent: parentSequence?.id ?? null,
						postmountDisplay: postmountDisplay ?? null,
						premountDisplay: premountDisplay ?? null,
						showInTimeline,
						timelineOrder: null,
						src: isMedia.src,
						getStack: () => stackRef.current,
						refForOutline: refForOutline ?? null,
						isInsideSeries,
						frozenFrame: registeredFrozenFrame,
						singleChildComponent: singleChildComponent ?? null
					};
					return {
						type: isMedia.type,
						controls: registrationControls,
						effects: _remotionInternalEffects ?? EMPTY_EFFECTS,
						effectRuntimeValues,
						displayName: timelineClipName,
						documentationLink: resolvedDocumentationLink,
						doesVolumeChange: isMedia.data.doesVolumeChange,
						duration: actualDurationInFrames,
						from,
						trimBefore: registeredTrimBefore,
						id,
						loopDisplay,
						parent: parentSequence?.id ?? null,
						playbackRate: isMedia.data.playbackRate,
						postmountDisplay: postmountDisplay ?? null,
						premountDisplay: premountDisplay ?? null,
						showInTimeline,
						timelineOrder: null,
						src: isMedia.data.src,
						getStack: () => stackRef.current,
						startMediaFrom: startMediaFrom ?? isMedia.data.startMediaFrom,
						mediaFrameAtSequenceZero,
						volume: isMedia.data.volumes,
						muted: isMedia.data.muted,
						refForOutline: refForOutline ?? null,
						isInsideSeries,
						frozenFrame: registeredFrozenFrame,
						frozenMediaFrame,
						singleChildComponent: singleChildComponent ?? null
					};
				}
				return {
					from,
					trimBefore: registeredTrimBefore,
					duration: actualDurationInFrames,
					id,
					displayName: timelineClipName,
					documentationLink: resolvedDocumentationLink,
					parent: parentSequence?.id ?? null,
					type: "sequence",
					showInTimeline,
					timelineOrder: null,
					loopDisplay,
					getStack: () => stackRef.current,
					premountDisplay: premountDisplay ?? null,
					postmountDisplay: postmountDisplay ?? null,
					controls: registrationControls,
					effects: _remotionInternalEffects ?? EMPTY_EFFECTS,
					effectRuntimeValues,
					refForOutline: refForOutline ?? null,
					isInsideSeries,
					frozenFrame: registeredFrozenFrame,
					singleChildComponent: singleChildComponent ?? null
				};
			}, [
				id,
				timelineClipName,
				parentSequence?.id,
				actualDurationInFrames,
				from,
				registeredTrimBefore,
				showInTimeline,
				loopDisplay,
				premountDisplay,
				postmountDisplay,
				registrationControls,
				_remotionInternalEffects,
				effectRuntimeValues,
				isMedia,
				resolvedDocumentationLink,
				refForOutline,
				isInsideSeries,
				registeredFrozenFrame,
				startMediaFrom,
				mediaFrameAtSequenceZero,
				frozenMediaFrame,
				singleChildComponent
			]);
			useSequenceRegistration({
				getSequence: env.isStudio || sequenceRegistrationEnabled ? getSequenceForRegistration : null,
				id
			});
			const endThreshold = Math.ceil(cumulatedFrom + from + durationInFrames - 1);
			const content2 = absoluteFrame < cumulatedFrom + from ? null : absoluteFrame > endThreshold ? null : children;
			const frozenContent = content2 === null || typeof freeze === "undefined" || freeze === null ? content2 : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Freeze, {
				frame: freeze,
				children: content2
			});
			const styleIfThere = other.layout === "none" ? void 0 : other.style;
			const cropClipPath = getSequenceCropClipPath({
				left: resolvedCropLeft,
				right: resolvedCropRight,
				top: resolvedCropTop,
				bottom: resolvedCropBottom,
				style: styleIfThere
			});
			const sequenceRef = (0, react.useCallback)((node) => {
				wrapperRefForOutline.current = node;
				if (typeof ref === "function") ref(node);
				else if (ref) ref.current = node;
			}, [ref]);
			const defaultStyle = (0, react.useMemo)(() => {
				return {
					flexDirection: void 0,
					...width ? { width } : {},
					...height ? { height } : {},
					...styleIfThere ?? {},
					...cropClipPath ? { clipPath: cropClipPath } : {}
				};
			}, [
				cropClipPath,
				height,
				styleIfThere,
				width
			]);
			if (ref !== null && layout === "none") throw new TypeError("It is not supported to pass both a `ref` and `layout=\"none\"` to <Sequence />.");
			if (hidden) return env.isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceOrderMarker, {
				sequenceId: id,
				children: null
			}) : null;
			const sequence = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceContext.Provider, {
				value: contextValue,
				children: frozenContent === null ? null : other.layout === "none" ? frozenContent : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AbsoluteFillElement, {
					ref: sequenceRef,
					style: defaultStyle,
					className: other.className,
					children: frozenContent
				})
			});
			return env.isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceOrderMarker, {
				sequenceId: id,
				children: sequence
			}) : sequence;
		};
		var RegularSequence = (0, react.forwardRef)(RegularSequenceRefForwardingFunction);
		var PremountedPostmountedSequenceRefForwardingFunction = (props, ref) => {
			if (props.layout === "none") throw new Error("`<Sequence>` with `premountFor` and `postmountFor` props does not support layout=\"none\"");
			const { style: passedStyle, from = 0, durationInFrames = Infinity, premountFor = 0, postmountFor = 0, styleWhilePremounted, styleWhilePostmounted, ...otherProps } = props;
			const { freezeFrame, isPremountingOrPostmounting, postmountingActive, premountingActive, premountingStyle } = usePremounting({
				from,
				durationInFrames,
				premountFor,
				postmountFor,
				style: passedStyle ?? null,
				styleWhilePremounted: styleWhilePremounted ?? null,
				styleWhilePostmounted: styleWhilePostmounted ?? null,
				hideWhilePremounted: "opacity"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Freeze, {
				frame: freezeFrame,
				active: isPremountingOrPostmounting,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceInner, {
					ref,
					from,
					durationInFrames,
					style: premountingStyle ?? void 0,
					_remotionInternalPremountDisplay: premountFor,
					_remotionInternalPostmountDisplay: postmountFor,
					_remotionInternalIsPremounting: premountingActive,
					_remotionInternalIsPostmounting: postmountingActive,
					...otherProps
				})
			});
		};
		var PremountedPostmountedSequence = (0, react.forwardRef)(PremountedPostmountedSequenceRefForwardingFunction);
		var SequenceRefForwardingFunction = (props, ref) => {
			const env = useRemotionEnvironment();
			const { fps } = useVideoConfig();
			if (props.layout !== "none" && !env.isRendering) {
				const effectivePremountFor = ENABLE_V5_BREAKING_CHANGES$1 ? props.premountFor ?? fps : props.premountFor;
				if (effectivePremountFor || props.postmountFor) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PremountedPostmountedSequence, {
					ref,
					...props,
					premountFor: effectivePremountFor
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RegularSequence, {
				...props,
				ref
			});
		};
		var SequenceInner = (0, react.forwardRef)(SequenceRefForwardingFunction);
		var SequenceWithoutSchema = SequenceInner;
		var Sequence = withInteractivitySchema({
			Component: SequenceInner,
			componentName: "<Sequence>",
			componentIdentity: "dev.remotion.remotion.Sequence",
			schema: sequenceSchema$1,
			supportsEffects: false
		});
		withInteractivitySchema({
			Component: SequenceInner,
			componentName: "<Sequence>",
			componentIdentity: null,
			schema: sequenceSchemaWithoutFrom,
			supportsEffects: false
		});
		var absoluteFillSchema = {
			...baseSchema,
			...transformSchema$1,
			...backgroundSchema$1,
			...borderSchema$1,
			...borderRadiusSchema$1,
			...textSchema,
			...textContentSchema
		};
		var setRef = (ref, value) => {
			if (typeof ref === "function") ref(value);
			else if (ref) ref.current = value;
		};
		var AbsoluteFillInner = ({ ref, from, trimBefore, freeze, durationInFrames, hidden, name, showInTimeline, stack, controls, children, ...divProps }) => {
			const videoConfig = useUnsafeVideoConfig();
			const refForOutline = (0, react.useRef)(null);
			const callbackRef = (0, react.useCallback)((element) => {
				refForOutline.current = element;
				setRef(ref, element);
			}, [ref]);
			if (videoConfig === null) return hidden ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AbsoluteFillElement, {
				ref: callbackRef,
				...divProps,
				children
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				layout: "none",
				from: from ?? 0,
				trimBefore,
				freeze,
				durationInFrames: durationInFrames ?? Infinity,
				hidden,
				name: name ?? "<AbsoluteFill>",
				showInTimeline: showInTimeline ?? true,
				controls,
				_remotionInternalStack: stack,
				_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/absolute-fill",
				outlineRef: refForOutline,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AbsoluteFillElement, {
					ref: callbackRef,
					...divProps,
					children
				})
			});
		};
		var AbsoluteFill = withInteractivitySchema({
			Component: AbsoluteFillInner,
			componentName: "<AbsoluteFill>",
			componentIdentity: "dev.remotion.remotion.AbsoluteFill",
			schema: absoluteFillSchema,
			supportsEffects: false
		});
		addSequenceStackTraces(AbsoluteFill);
		var useCropStyle = ({ cropLeft, cropRight, cropTop, cropBottom, style, componentName }) => {
			validateSequenceCrop({
				cropLeft,
				cropRight,
				cropTop,
				cropBottom
			}, componentName);
			return (0, react.useMemo)(() => {
				const cropClipPath = getSequenceCropClipPath({
					...resolveSequenceCrop({
						cropLeft,
						cropRight,
						cropTop,
						cropBottom
					}),
					style
				});
				if (cropClipPath === null) return style;
				return {
					...style,
					clipPath: cropClipPath
				};
			}, [
				cropBottom,
				cropLeft,
				cropRight,
				cropTop,
				style
			]);
		};
		var calculateImageFit = (fit, imageSize, canvasSize) => {
			switch (fit) {
				case "fill": return [
					0,
					0,
					imageSize.width,
					imageSize.height,
					0,
					0,
					canvasSize.width,
					canvasSize.height
				];
				case "contain": {
					const ratio = Math.min(canvasSize.width / imageSize.width, canvasSize.height / imageSize.height);
					const centerX = (canvasSize.width - imageSize.width * ratio) / 2;
					const centerY = (canvasSize.height - imageSize.height * ratio) / 2;
					return [
						0,
						0,
						imageSize.width,
						imageSize.height,
						centerX,
						centerY,
						imageSize.width * ratio,
						imageSize.height * ratio
					];
				}
				case "cover": {
					const ratio = Math.max(canvasSize.width / imageSize.width, canvasSize.height / imageSize.height);
					const centerX = (canvasSize.width - imageSize.width * ratio) / 2;
					const centerY = (canvasSize.height - imageSize.height * ratio) / 2;
					return [
						0,
						0,
						imageSize.width,
						imageSize.height,
						centerX,
						centerY,
						imageSize.width * ratio,
						imageSize.height * ratio
					];
				}
				default: throw new Error("Unknown fit: " + fit);
			}
		};
		var WEBGL_CONTEXT_DOCS_URL = "https://remotion.dev/docs/troubleshooting/webgl2-context";
		var webGlContextErrorMessage = (versionLabel, effectName) => `Failed to acquire ${versionLabel} context for ${effectName}. Pass --gl=angle when using the CLI, set chromiumOptions: { gl: "angle" } when using SSR APIs, or set "OpenGL render backend" to "angle" in the Advanced section when rendering in the Studio. See ${WEBGL_CONTEXT_DOCS_URL}`;
		var createWebGLContextError = (effectName) => new Error(webGlContextErrorMessage("WebGL", effectName));
		var createWebGL2ContextError = (effectName) => new Error(webGlContextErrorMessage("WebGL2", effectName));
		var CanvasPool = class {
			constructor(width, height) {
				_defineProperty(this, "width", void 0);
				_defineProperty(this, "height", void 0);
				_defineProperty(this, "pairs", /* @__PURE__ */ new Map());
				_defineProperty(this, "lostContexts", /* @__PURE__ */ new Set());
				this.width = width;
				this.height = height;
			}
			getPair(backend) {
				const existing = this.pairs.get(backend);
				if (existing) return existing;
				const pair = [this.allocateCanvas(backend), this.allocateCanvas(backend)];
				this.pairs.set(backend, pair);
				return pair;
			}
			assertContextNotLost(canvas) {
				if (this.lostContexts.has(canvas)) throw new Error("WebGL context was lost during canvas effect rendering. This typically happens in headless or memory-constrained environments (e.g. Remotion Lambda). Try reducing concurrency or increasing the Lambda function memory.");
			}
			allocateCanvas(backend) {
				const canvas = document.createElement("canvas");
				canvas.width = this.width;
				canvas.height = this.height;
				switch (backend) {
					case "2d":
						if (!canvas.getContext("2d", { colorSpace: "srgb" })) throw new Error("Failed to acquire 2D context for canvas effect");
						return canvas;
					case "webgl2": {
						const ctx = canvas.getContext("webgl2", {
							premultipliedAlpha: true,
							alpha: true,
							preserveDrawingBuffer: true
						});
						if (!ctx) throw createWebGL2ContextError("canvas effect");
						canvas.addEventListener("webglcontextlost", (e) => {
							e.preventDefault();
							this.lostContexts.add(canvas);
						});
						canvas.addEventListener("webglcontextrestored", () => {
							this.lostContexts.delete(canvas);
						});
						ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
						return canvas;
					}
					case "webgpu":
						if (typeof navigator === "undefined" || !("gpu" in navigator)) throw new Error("WebGPU is not available in this environment for canvas effect");
						return canvas;
					default: throw new Error(`Unknown effect backend: ${backend}`);
				}
			}
		};
		var groupByBackend = (effects) => {
			const runs = [];
			let current = [];
			let currentBackend = null;
			for (const eff of effects) {
				const { backend } = eff.definition;
				if (currentBackend === null || backend === currentBackend) {
					current.push(eff);
					currentBackend = backend;
				} else {
					runs.push({
						backend: currentBackend,
						effects: current
					});
					current = [eff];
					currentBackend = backend;
				}
			}
			if (currentBackend !== null && current.length > 0) runs.push({
				backend: currentBackend,
				effects: current
			});
			return runs;
		};
		var devicePromise = null;
		var getGpuDevice = () => {
			if (devicePromise) return devicePromise;
			devicePromise = (async () => {
				if (typeof navigator === "undefined" || !("gpu" in navigator)) throw new Error("WebGPU is not available in this environment");
				const { gpu } = navigator;
				const adapter = await gpu.requestAdapter();
				if (!adapter) throw new Error("No WebGPU adapter available");
				return adapter.requestDevice();
			})();
			return devicePromise;
		};
		var createEffectChainState = (width, height) => ({
			pool: new CanvasPool(width, height),
			setupCache: /* @__PURE__ */ new WeakMap(),
			cleanupRegistry: [],
			currentRunId: 0
		});
		var cleanupEffectChainState = (state) => {
			state.currentRunId++;
			for (const entry of state.cleanupRegistry) entry.definition.cleanup(entry.state);
		};
		var ensureSetup = (state, def, target) => {
			const widened = def;
			let cacheForDefinition = state.setupCache.get(widened);
			if (!cacheForDefinition) {
				cacheForDefinition = /* @__PURE__ */ new WeakMap();
				state.setupCache.set(widened, cacheForDefinition);
			}
			if (cacheForDefinition.has(target)) return cacheForDefinition.get(target);
			const setupState = def.setup(target);
			cacheForDefinition.set(target, setupState);
			state.cleanupRegistry.push({
				definition: widened,
				state: setupState
			});
			return setupState;
		};
		var runEffectChain = async ({ state, source, effects, output, width, height }) => {
			const runId = ++state.currentRunId;
			const isCancelled = () => state.currentRunId !== runId;
			const runs = groupByBackend(effects.filter((e) => !e.params.disabled));
			let currentImage = source;
			let lastTarget = null;
			if (runs.length === 0) {
				if (source === output) return true;
				const ctx = output.getContext("2d");
				if (!ctx) throw new Error("Failed to acquire 2D context for output canvas");
				ctx.clearRect(0, 0, width, height);
				ctx.drawImage(currentImage, 0, 0, width, height);
				return true;
			}
			let needsGpuDevice = false;
			for (const run of runs) if (run.backend === "webgpu") {
				needsGpuDevice = true;
				break;
			}
			const gpuDevice = needsGpuDevice ? await getGpuDevice() : null;
			if (isCancelled()) return false;
			let flipWebGLSourceY = true;
			for (let runIndex = 0; runIndex < runs.length; runIndex++) {
				const run = runs[runIndex];
				const [a2, b2] = state.pool.getPair(run.backend);
				let dst = a2;
				for (const eff of run.effects) {
					const def = eff.definition;
					const setupState = ensureSetup(state, def, dst);
					def.apply({
						source: currentImage,
						target: dst,
						state: setupState,
						params: eff.params,
						width,
						height,
						gpuDevice,
						flipSourceY: run.backend === "webgl2" ? flipWebGLSourceY : false
					});
					if (run.backend === "webgl2") {
						flipWebGLSourceY = true;
						state.pool.assertContextNotLost(dst);
					}
					currentImage = dst;
					dst = dst === a2 ? b2 : a2;
				}
				lastTarget = currentImage ?? lastTarget;
				const nextRun = runs[runIndex + 1];
				if (nextRun && nextRun.backend !== run.backend && lastTarget) {
					if (run.backend === "2d" && nextRun.backend === "webgl2") {
						currentImage = lastTarget;
						flipWebGLSourceY = true;
					} else {
						const bitmap = await createImageBitmap(lastTarget);
						if (isCancelled()) {
							bitmap.close();
							return false;
						}
						currentImage = bitmap;
						if (nextRun.backend === "webgl2") flipWebGLSourceY = false;
					}
				}
			}
			if (!lastTarget) return true;
			const outCtx = output.getContext("2d");
			if (!outCtx) throw new Error("Failed to acquire 2D context for output canvas");
			outCtx.clearRect(0, 0, width, height);
			outCtx.drawImage(lastTarget, 0, 0, width, height);
			return true;
		};
		var useEffectChainState = () => {
			const chainStateRef = (0, react.useRef)(null);
			const sizeRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				return () => {
					if (chainStateRef.current) cleanupEffectChainState(chainStateRef.current);
				};
			}, []);
			return (0, react.useMemo)(() => ({ get: (width, height) => {
				if (!sizeRef.current || sizeRef.current.width !== width || sizeRef.current.height !== height) {
					if (chainStateRef.current) cleanupEffectChainState(chainStateRef.current);
					chainStateRef.current = createEffectChainState(width, height);
					sizeRef.current = {
						width,
						height
					};
				}
				return chainStateRef.current;
			} }), []);
		};
		var CanvasRefForwardingFunction = ({ width, height, fit, className, style, effects, ...props }, ref) => {
			const canvasRef = (0, react.useRef)(null);
			const chainState = useEffectChainState();
			const sourceCanvas = (0, react.useMemo)(() => {
				if (typeof document === "undefined") return null;
				return document.createElement("canvas");
			}, []);
			const draw = (0, react.useCallback)((imageData) => {
				const canvas = canvasRef.current;
				const canvasWidth = width ?? imageData.displayWidth;
				const canvasHeight = height ?? imageData.displayHeight;
				if (!canvas) throw new Error("Canvas ref is not set");
				if (!sourceCanvas) throw new Error("Source canvas is not available");
				sourceCanvas.width = canvasWidth;
				sourceCanvas.height = canvasHeight;
				const sourceCtx = sourceCanvas.getContext("2d");
				if (!sourceCtx) throw new Error("Could not get 2d context for source canvas");
				sourceCtx.drawImage(imageData, ...calculateImageFit(fit, {
					height: imageData.displayHeight,
					width: imageData.displayWidth
				}, {
					width: canvasWidth,
					height: canvasHeight
				}));
				canvas.width = canvasWidth;
				canvas.height = canvasHeight;
				return runEffectChain({
					state: chainState.get(canvasWidth, canvasHeight),
					source: sourceCanvas,
					effects,
					output: canvas,
					width: canvasWidth,
					height: canvasHeight
				});
			}, [
				chainState,
				effects,
				fit,
				height,
				sourceCanvas,
				width
			]);
			(0, react.useImperativeHandle)(ref, () => {
				return {
					draw,
					getCanvas: () => {
						if (!canvasRef.current) throw new Error("Canvas ref is not set");
						return canvasRef.current;
					},
					clear: () => {
						const ctx = canvasRef.current?.getContext("2d");
						if (!ctx) throw new Error("Could not get 2d context");
						ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
					}
				};
			}, [draw]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className,
				style,
				...props
			});
		};
		var Canvas = react.default.forwardRef(CanvasRefForwardingFunction);
		var createImageDecoder = async ({ resolvedSrc, signal, requestInit, contentType }) => {
			if (typeof ImageDecoder === "undefined") throw new Error("Your browser does not support the WebCodecs ImageDecoder API.");
			const response = await fetch(resolvedSrc, {
				...requestInit,
				signal
			});
			const { body } = response;
			if (!body) throw new Error("Got no body");
			const decoder = new ImageDecoder({
				data: body,
				type: contentType ?? response.headers.get("Content-Type") ?? "image/gif"
			});
			await Promise.all([decoder.completed, decoder.tracks.ready]);
			const { selectedTrack } = decoder.tracks;
			if (!selectedTrack) {
				decoder.close();
				throw new Error("No selected track");
			}
			return {
				decoder,
				selectedTrack
			};
		};
		var CACHE_SIZE = 5;
		var getActualTime = ({ loopBehavior, durationFound, timeInSec }) => {
			return loopBehavior === "loop" ? durationFound ? timeInSec % durationFound : timeInSec : Math.min(timeInSec, durationFound || Infinity);
		};
		var decodeImage = async ({ resolvedSrc, signal, requestInit, currentTime, initialLoopBehavior }) => {
			const { decoder, selectedTrack } = await createImageDecoder({
				resolvedSrc,
				signal,
				requestInit,
				contentType: null
			});
			const cache2 = [];
			let durationFound = null;
			const getFrameByIndex = async (frameIndex) => {
				const foundInCache = cache2.find((c2) => c2.frameIndex === frameIndex);
				if (foundInCache && foundInCache.frame) return foundInCache;
				const frame = await decoder.decode({
					frameIndex,
					completeFramesOnly: true
				});
				if (foundInCache) foundInCache.frame = frame.image;
				else cache2.push({
					frame: frame.image,
					frameIndex,
					timeInSeconds: frame.image.timestamp / 1e6
				});
				return {
					frame: frame.image,
					frameIndex,
					timeInSeconds: frame.image.timestamp / 1e6
				};
			};
			const clearCache = (closeToTimeInSec) => {
				const sortByClosestToCurrentTime = cache2.filter((c2) => c2.frame).sort((a2, b2) => {
					return Math.abs(a2.timeInSeconds - closeToTimeInSec) - Math.abs(b2.timeInSeconds - closeToTimeInSec);
				});
				for (let i = 0; i < sortByClosestToCurrentTime.length; i++) {
					if (i < CACHE_SIZE) continue;
					const item = sortByClosestToCurrentTime[i];
					item.frame = null;
				}
			};
			const ensureFrameBeforeAndAfter = async ({ timeInSec, loopBehavior }) => {
				const actualTimeInSec = getActualTime({
					durationFound,
					loopBehavior,
					timeInSec
				});
				const biggestIndex = cache2.filter((c2) => c2.timeInSeconds <= actualTimeInSec).map((c2) => c2.frameIndex).reduce((a2, b2) => Math.max(a2, b2), 0);
				let i = biggestIndex;
				while (true) {
					const f = await getFrameByIndex(i);
					i++;
					if (!f.frame) throw new Error("No frame found");
					if (!f.frame.duration) break;
					if (i === selectedTrack.frameCount && durationFound === null) durationFound = (f.frame.timestamp + f.frame.duration) / 1e6;
					if (f.timeInSeconds > actualTimeInSec || i === selectedTrack.frameCount) break;
				}
				if (selectedTrack.frameCount - biggestIndex < 3 && loopBehavior === "loop") await getFrameByIndex(0);
				clearCache(actualTimeInSec);
			};
			await ensureFrameBeforeAndAfter({
				timeInSec: currentTime,
				loopBehavior: initialLoopBehavior
			});
			await ensureFrameBeforeAndAfter({
				timeInSec: currentTime,
				loopBehavior: initialLoopBehavior
			});
			const getFrame = async (timeInSec, loopBehavior) => {
				if (durationFound !== null && timeInSec > durationFound && loopBehavior === "clear-after-finish") return null;
				const actualTimeInSec = getActualTime({
					loopBehavior,
					durationFound,
					timeInSec
				});
				await ensureFrameBeforeAndAfter({
					timeInSec: actualTimeInSec,
					loopBehavior
				});
				const closest = cache2.filter((c2) => c2.frame).reduce((a2, b2) => {
					return Math.abs(a2.timeInSeconds - actualTimeInSec) < Math.abs(b2.timeInSeconds - actualTimeInSec) ? a2 : b2;
				});
				if (!closest.frame) throw new Error("No frame found");
				return closest;
			};
			return {
				close: () => {
					for (const item of cache2) {
						item.frame?.close();
						item.frame = null;
					}
					decoder.close();
				},
				getFrame,
				frameCount: selectedTrack.frameCount
			};
		};
		var getCurrentTime = ({ frame, playbackRate, fps }) => {
			return frame * playbackRate / fps;
		};
		var serializeRequestInit = (requestInit) => {
			if (!requestInit) return null;
			const requestInitWithoutSignal = { ...requestInit };
			delete requestInitWithoutSignal.signal;
			const { headers, ...rest } = requestInitWithoutSignal;
			return JSON.stringify({
				...rest,
				headers: headers ? Array.from(new Headers(headers).entries()) : null
			});
		};
		var resolveAnimatedImageSource = (src) => {
			if (typeof window === "undefined") return src;
			return new URL(src, document.baseURI).href;
		};
		var animatedImageSchema = {
			src: {
				type: "asset",
				assetType: "image",
				default: void 0,
				description: "Source",
				keyframable: false
			},
			...baseSchema,
			...cropSchema,
			...premountSchema,
			playbackRate: {
				type: "number",
				min: 0,
				max: 10,
				step: .1,
				default: 1,
				description: "Playback rate",
				hiddenFromList: false,
				keyframable: false
			},
			...transformSchema$1,
			...backgroundSchema$1,
			...borderSchema$1,
			...borderRadiusSchema$1
		};
		var getCanvasPropsFromSequenceProps = (props) => {
			const canvasProps = {};
			const mutableCanvasProps = canvasProps;
			for (const key in props) if (Object.prototype.hasOwnProperty.call(props, key) && (key.startsWith("data-") || key.startsWith("aria-"))) mutableCanvasProps[key] = props[key];
			return canvasProps;
		};
		var AnimatedImageContent = (0, react.forwardRef)(({ src, width, height, onError, loopBehavior = "loop", playbackRate = 1, fit = "fill", requestInit, effects, controls, ...props }, canvasRef) => {
			const resolvedSrc = resolveAnimatedImageSource(src);
			const [imageDecoder, setImageDecoder] = (0, react.useState)(null);
			const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
			const [decodeHandle] = (0, react.useState)(() => delayRender2(`Rendering <AnimatedImage/> with src="${resolvedSrc}"`));
			const frame = useCurrentFrame();
			const { fps } = useVideoConfig();
			const currentTime = getCurrentTime({
				frame,
				playbackRate,
				fps
			});
			const currentTimeRef = (0, react.useRef)(currentTime);
			currentTimeRef.current = currentTime;
			const requestInitKey = serializeRequestInit(requestInit);
			const requestInitRef = (0, react.useRef)(requestInit);
			requestInitRef.current = requestInit;
			const ref = (0, react.useRef)(null);
			const memoizedEffects = useMemoizedEffects({
				effects,
				overrideId: controls?.overrideId ?? null
			});
			(0, react.useImperativeHandle)(canvasRef, () => {
				const c2 = ref.current?.getCanvas();
				if (!c2) throw new Error("Canvas ref is not set");
				return c2;
			}, []);
			const [initialLoopBehavior] = (0, react.useState)(() => loopBehavior);
			(0, react.useEffect)(() => {
				const controller = new AbortController();
				let cancelled = false;
				let continued = false;
				const continueRenderOnce = () => {
					if (continued) return;
					continued = true;
					continueRender2(decodeHandle);
				};
				decodeImage({
					resolvedSrc,
					signal: controller.signal,
					requestInit: requestInitRef.current,
					currentTime: currentTimeRef.current,
					initialLoopBehavior
				}).then((d) => {
					if (cancelled) {
						d.close();
						return;
					}
					setImageDecoder(d);
					continueRenderOnce();
				}).catch((err) => {
					if (cancelled) return;
					if (err.name === "AbortError") {
						continueRenderOnce();
						return;
					}
					if (onError) {
						onError?.(err);
						continueRenderOnce();
					} else cancelRender(err);
				});
				return () => {
					cancelled = true;
					controller.abort();
					continueRenderOnce();
				};
			}, [
				resolvedSrc,
				decodeHandle,
				onError,
				requestInitKey,
				initialLoopBehavior,
				continueRender2
			]);
			(0, react.useEffect)(() => {
				return () => {
					imageDecoder?.close();
				};
			}, [imageDecoder]);
			(0, react.useLayoutEffect)(() => {
				if (!imageDecoder) return;
				const delay = delayRender2(`Rendering frame at ${currentTime} of <AnimatedImage src="${src}"/>`);
				let cancelled = false;
				imageDecoder.getFrame(currentTime, loopBehavior).then(async (videoFrame) => {
					if (cancelled) return;
					if (videoFrame === null) {
						ref.current?.clear();
						continueRender2(delay);
						return;
					}
					if (await ref.current?.draw(videoFrame.frame) && !cancelled) continueRender2(delay);
				}).catch((err) => {
					if (cancelled) return;
					if (onError) {
						onError(err);
						continueRender2(delay);
					} else cancelRender(err);
				});
				return () => {
					cancelled = true;
					continueRender2(delay);
				};
			}, [
				currentTime,
				imageDecoder,
				loopBehavior,
				onError,
				src,
				continueRender2,
				delayRender2,
				memoizedEffects,
				fit,
				width,
				height
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Canvas, {
				ref,
				width,
				height,
				fit,
				effects: memoizedEffects,
				...props
			});
		});
		AnimatedImageContent.displayName = "AnimatedImageContent";
		var AnimatedImageInner = ({ src, width, height, onError, fit, playbackRate, loopBehavior, id, className, style, durationInFrames, from, premountFor, postmountFor, styleWhilePremounted, styleWhilePostmounted, cropLeft, cropRight, cropTop, cropBottom, requestInit, effects = [], controls, ref, ...sequenceProps }) => {
			const actualRef = (0, react.useRef)(null);
			const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
			(0, react.useImperativeHandle)(ref, () => {
				return actualRef.current;
			}, []);
			const { effectivePostmountFor, effectivePremountFor, freezeFrame, isPremountingOrPostmounting, postmountingActive, premountingActive, premountingStyle } = usePremounting({
				from: from ?? 0,
				durationInFrames: durationInFrames ?? Infinity,
				premountFor: premountFor ?? null,
				postmountFor: postmountFor ?? null,
				style: style ?? null,
				styleWhilePremounted: styleWhilePremounted ?? null,
				styleWhilePostmounted: styleWhilePostmounted ?? null,
				hideWhilePremounted: "display-none"
			});
			const croppedStyle = useCropStyle({
				cropLeft,
				cropRight,
				cropTop,
				cropBottom,
				style: premountingStyle,
				componentName: "<AnimatedImage />"
			});
			const canvasProps = getCanvasPropsFromSequenceProps(sequenceProps);
			const animatedImageProps = {
				src,
				width,
				height,
				onError,
				fit,
				playbackRate,
				loopBehavior,
				id,
				className,
				style: croppedStyle ?? void 0,
				requestInit,
				...canvasProps
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Freeze, {
				frame: freezeFrame,
				active: isPremountingOrPostmounting,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
					layout: "none",
					from: from ?? 0,
					durationInFrames: durationInFrames ?? Infinity,
					name: "<AnimatedImage>",
					_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/animatedimage",
					controls,
					_remotionInternalEffects: memoizedEffectDefinitions,
					_remotionInternalPremountDisplay: effectivePremountFor || null,
					_remotionInternalPostmountDisplay: effectivePostmountFor || null,
					_remotionInternalIsPremounting: premountingActive,
					_remotionInternalIsPostmounting: postmountingActive,
					...sequenceProps,
					outlineRef: actualRef,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AnimatedImageContent, {
						...animatedImageProps,
						ref: actualRef,
						effects,
						controls
					})
				})
			});
		};
		var AnimatedImage = withInteractivitySchema({
			Component: AnimatedImageInner,
			componentName: "<AnimatedImage>",
			componentIdentity: "dev.remotion.remotion.AnimatedImage",
			schema: animatedImageSchema,
			supportsEffects: true
		});
		AnimatedImage.displayName = "AnimatedImage";
		addSequenceStackTraces(AnimatedImage);
		var disabledEffectField = {
			type: "boolean",
			default: false,
			description: "Disabled"
		};
		var createEffect = (definition) => {
			const { calculateKey: userCalculateKey, validateParams } = definition;
			const widened = {
				...definition,
				documentationLink: definition.documentationLink ?? null,
				calculateKey: (params) => {
					const disabled = params.disabled ?? false;
					return `${userCalculateKey(params)}-disabled-${disabled}`;
				},
				schema: {
					disabled: disabledEffectField,
					...definition.schema
				}
			};
			const factory = (params = {}) => {
				validateParams(params);
				return {
					definition: widened,
					params,
					effectKey: widened.calculateKey(params),
					memoized: false
				};
			};
			return factory;
		};
		var validateArtifactFilename = (filename) => {
			if (typeof filename !== "string") throw new TypeError(`The "filename" must be a string, but you passed a value of type ${typeof filename}`);
			if (filename.trim() === "") throw new Error("The `filename` must not be empty");
			if (!filename.match(/^([0-9a-zA-Z-!_.*'()/:&$@=;+,?]+)/g)) throw new Error("The `filename` must match \"/^([0-9a-zA-Z-!_.*'()/:&$@=;+,?]+)/g\". Use forward slashes only, even on Windows.");
		};
		var validateContent = (content2) => {
			if (typeof content2 !== "string" && !(content2 instanceof Uint8Array)) throw new TypeError(`The "content" must be a string or Uint8Array, but you passed a value of type ${typeof content2}`);
			if (typeof content2 === "string" && content2.trim() === "") throw new Error("The `content` must not be empty");
		};
		var validateRenderAsset = (artifact) => {
			if (artifact.type !== "artifact") return;
			validateArtifactFilename(artifact.filename);
			if (artifact.contentType === "thumbnail") return;
			validateContent(artifact.content);
		};
		var RenderAssetManager = (0, react.createContext)({
			registerRenderAsset: () => {},
			unregisterRenderAsset: () => {},
			renderAssets: []
		});
		var RenderAssetManagerProvider = ({ children, collectAssets }) => {
			const [renderAssets, setRenderAssets] = (0, react.useState)([]);
			const renderAssetsRef = (0, react.useRef)([]);
			const registerRenderAsset = (0, react.useCallback)((renderAsset) => {
				validateRenderAsset(renderAsset);
				renderAssetsRef.current = [...renderAssetsRef.current, renderAsset];
				setRenderAssets(renderAssetsRef.current);
			}, []);
			if (collectAssets) (0, react.useImperativeHandle)(collectAssets, () => {
				return { collectAssets: () => {
					const assets = renderAssetsRef.current;
					renderAssetsRef.current = [];
					setRenderAssets([]);
					return assets;
				} };
			}, []);
			const unregisterRenderAsset = (0, react.useCallback)((id) => {
				renderAssetsRef.current = renderAssetsRef.current.filter((a2) => a2.id !== id);
				setRenderAssets(renderAssetsRef.current);
			}, []);
			(0, react.useLayoutEffect)(() => {
				if (typeof window !== "undefined") window.remotion_collectAssets = () => {
					const assets = renderAssetsRef.current;
					renderAssetsRef.current = [];
					setRenderAssets([]);
					return assets;
				};
			}, []);
			const contextValue = (0, react.useMemo)(() => {
				return {
					registerRenderAsset,
					unregisterRenderAsset,
					renderAssets
				};
			}, [
				renderAssets,
				registerRenderAsset,
				unregisterRenderAsset
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenderAssetManager.Provider, {
				value: contextValue,
				children
			});
		};
		var ArtifactThumbnail = Symbol("Thumbnail");
		var Artifact = ({ filename, content: content2, downloadBehavior }) => {
			const { registerRenderAsset, unregisterRenderAsset } = (0, react.useContext)(RenderAssetManager);
			const env = useRemotionEnvironment();
			const frame = useCurrentFrame();
			const [id] = (0, react.useState)(() => {
				return String(Math.random());
			});
			(0, react.useLayoutEffect)(() => {
				if (!env.isRendering) return;
				if (content2 instanceof Uint8Array) registerRenderAsset({
					type: "artifact",
					id,
					content: btoa(new TextDecoder("utf8").decode(content2)),
					filename,
					frame,
					contentType: "binary",
					downloadBehavior: downloadBehavior ?? null
				});
				else if (content2 === ArtifactThumbnail) registerRenderAsset({
					type: "artifact",
					id,
					filename,
					frame,
					contentType: "thumbnail",
					downloadBehavior: downloadBehavior ?? null
				});
				else registerRenderAsset({
					type: "artifact",
					id,
					content: content2,
					filename,
					frame,
					contentType: "text",
					downloadBehavior: downloadBehavior ?? null
				});
				return () => {
					return unregisterRenderAsset(id);
				};
			}, [
				content2,
				env.isRendering,
				filename,
				frame,
				id,
				registerRenderAsset,
				unregisterRenderAsset,
				downloadBehavior
			]);
			return null;
		};
		Artifact.Thumbnail = ArtifactThumbnail;
		var getAbsoluteSrc$1 = (relativeSrc) => {
			if (typeof window === "undefined") return relativeSrc;
			if (relativeSrc.startsWith("http://") || relativeSrc.startsWith("https://") || relativeSrc.startsWith("file://") || relativeSrc.startsWith("blob:") || relativeSrc.startsWith("data:")) return relativeSrc;
			return new URL(relativeSrc, document.baseURI).href;
		};
		var calculateMediaDuration = ({ trimAfter, mediaDurationInFrames, playbackRate, trimBefore }) => {
			let duration = mediaDurationInFrames;
			if (typeof trimAfter !== "undefined") duration = trimAfter;
			if (typeof trimBefore !== "undefined") duration -= trimBefore;
			const actualDuration = duration / playbackRate;
			return Number(actualDuration.toFixed(10));
		};
		var LoopContext = (0, react.createContext)(null);
		var useLoop = () => {
			return react.default.useContext(LoopContext);
		};
		var Loop = ({ durationInFrames, times = Infinity, children, name, showInTimeline, ...props }) => {
			const currentFrame = useCurrentFrame();
			const { durationInFrames: compDuration } = useVideoConfig();
			validateDurationInFrames$2(durationInFrames, {
				component: "of the <Loop /> component",
				allowFloats: true
			});
			if (typeof times !== "number") throw new TypeError(`You passed to "times" an argument of type ${typeof times}, but it must be a number.`);
			if (times !== Infinity && times % 1 !== 0) throw new TypeError(`The "times" prop of a loop must be an integer, but got ${times}.`);
			if (times < 0) throw new TypeError(`The "times" prop of a loop must be at least 0, but got ${times}`);
			const maxTimes = Math.ceil(compDuration / durationInFrames);
			const actualTimes = Math.min(maxTimes, times);
			const style = props.layout === "none" ? void 0 : props.style;
			const maxFrame = durationInFrames * (actualTimes - 1);
			const start = Math.floor(currentFrame / durationInFrames) * durationInFrames;
			const from = Math.min(start, maxFrame);
			const loopDisplay = (0, react.useMemo)(() => {
				return {
					numberOfTimes: Math.min(compDuration / durationInFrames, times),
					startOffset: -from,
					durationInFrames
				};
			}, [
				compDuration,
				durationInFrames,
				from,
				times
			]);
			const loopContext = (0, react.useMemo)(() => {
				return {
					iteration: Math.floor(currentFrame / durationInFrames),
					durationInFrames
				};
			}, [currentFrame, durationInFrames]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LoopContext.Provider, {
				value: loopContext,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
					durationInFrames,
					from,
					name: name ?? "<Loop>",
					_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/loop",
					_remotionInternalLoopDisplay: loopDisplay,
					layout: props.layout,
					style,
					showInTimeline,
					children
				})
			});
		};
		Loop.useLoop = useLoop;
		var playbackLogging = ({ logLevel, tag, message, mountTime }) => {
			const tags = [mountTime ? Date.now() - mountTime + "ms " : null, tag].filter(Boolean).join(" ");
			Log.trace({
				logLevel,
				tag: null
			}, `[${tags}]`, message);
		};
		var PreloadContext = (0, react.createContext)({});
		var preloads = {};
		var updaters = [];
		var PrefetchProvider = ({ children }) => {
			const [_preloads, _setPreloads] = (0, react.useState)(() => preloads);
			(0, react.useEffect)(() => {
				const updaterFunction = () => {
					_setPreloads(preloads);
				};
				updaters.push(updaterFunction);
				return () => {
					updaters = updaters.filter((u) => u !== updaterFunction);
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PreloadContext.Provider, {
				value: _preloads,
				children
			});
		};
		var removeAndGetHashFragment = (src) => {
			const hashIndex = src.indexOf("#");
			if (hashIndex === -1) return null;
			return hashIndex;
		};
		var getSrcWithoutHash = (src) => {
			const hashIndex = removeAndGetHashFragment(src);
			if (hashIndex === null) return src;
			return src.slice(0, hashIndex);
		};
		var usePreload = (src) => {
			const preloads2 = (0, react.useContext)(PreloadContext);
			const hashFragmentIndex = removeAndGetHashFragment(src);
			const withoutHashFragment = getSrcWithoutHash(src);
			if (!preloads2[withoutHashFragment]) return src;
			if (hashFragmentIndex !== null) return preloads2[withoutHashFragment] + src.slice(hashFragmentIndex);
			return preloads2[withoutHashFragment];
		};
		var validateMediaProps = (props, component) => {
			if (typeof props.volume !== "number" && typeof props.volume !== "function" && typeof props.volume !== "undefined") throw new TypeError(`You have passed a volume of type ${typeof props.volume} to your <${component} /> component. Volume must be a number or a function with the signature '(frame: number) => number' undefined.`);
			if (typeof props.volume === "number" && props.volume < 0) throw new TypeError(`You have passed a volume below 0 to your <${component} /> component. Volume must be between 0 and 1`);
			if (typeof props.playbackRate !== "number" && typeof props.playbackRate !== "undefined") throw new TypeError(`You have passed a playbackRate of type ${typeof props.playbackRate} to your <${component} /> component. Playback rate must a real number or undefined.`);
			if (typeof props.playbackRate === "number" && (isNaN(props.playbackRate) || !Number.isFinite(props.playbackRate) || props.playbackRate <= 0)) throw new TypeError(`You have passed a playbackRate of ${props.playbackRate} to your <${component} /> component. Playback rate must be a real number above 0.`);
			if (typeof props.preservePitch !== "boolean" && typeof props.preservePitch !== "undefined") throw new TypeError(`'preservePitch' must be a boolean or undefined but got '${typeof props.preservePitch}' instead`);
		};
		var validateStartFromProps = (startFrom, endAt) => {
			if (typeof startFrom !== "undefined") {
				if (typeof startFrom !== "number") throw new TypeError(`type of startFrom prop must be a number, instead got type ${typeof startFrom}.`);
				if (isNaN(startFrom) || startFrom === Infinity) throw new TypeError("startFrom prop can not be NaN or Infinity.");
				if (startFrom < 0) throw new TypeError(`startFrom must be greater than equal to 0 instead got ${startFrom}.`);
			}
			if (typeof endAt !== "undefined") {
				if (typeof endAt !== "number") throw new TypeError(`type of endAt prop must be a number, instead got type ${typeof endAt}.`);
				if (isNaN(endAt)) throw new TypeError("endAt prop can not be NaN.");
				if (endAt <= 0) throw new TypeError(`endAt must be a positive number, instead got ${endAt}.`);
			}
			if (endAt < startFrom) throw new TypeError("endAt prop must be greater than startFrom prop.");
		};
		var validateTrimProps = (trimBefore, trimAfter) => {
			if (typeof trimBefore !== "undefined") {
				if (typeof trimBefore !== "number") throw new TypeError(`type of trimBefore prop must be a number, instead got type ${typeof trimBefore}.`);
				if (isNaN(trimBefore) || trimBefore === Infinity) throw new TypeError("trimBefore prop can not be NaN or Infinity.");
				if (trimBefore < 0) throw new TypeError(`trimBefore must be greater than equal to 0 instead got ${trimBefore}.`);
			}
			if (typeof trimAfter !== "undefined") {
				if (typeof trimAfter !== "number") throw new TypeError(`type of trimAfter prop must be a number, instead got type ${typeof trimAfter}.`);
				if (isNaN(trimAfter)) throw new TypeError("trimAfter prop can not be NaN.");
				if (trimAfter <= 0) throw new TypeError(`trimAfter must be a positive number, instead got ${trimAfter}.`);
			}
			if (trimAfter <= trimBefore) throw new TypeError("trimAfter prop must be greater than trimBefore prop.");
		};
		var validateMediaTrimProps = ({ startFrom, endAt, trimBefore, trimAfter }) => {
			if (typeof startFrom !== "undefined" && typeof trimBefore !== "undefined") throw new TypeError("Cannot use both startFrom and trimBefore props. Use trimBefore instead as startFrom is deprecated.");
			if (typeof endAt !== "undefined" && typeof trimAfter !== "undefined") throw new TypeError("Cannot use both endAt and trimAfter props. Use trimAfter instead as endAt is deprecated.");
			const hasNewProps = typeof trimBefore !== "undefined" || typeof trimAfter !== "undefined";
			const hasOldProps = typeof startFrom !== "undefined" || typeof endAt !== "undefined";
			if (hasNewProps) validateTrimProps(trimBefore, trimAfter);
			else if (hasOldProps) validateStartFromProps(startFrom, endAt);
		};
		var resolveTrimProps = ({ startFrom, endAt, trimBefore, trimAfter }) => {
			return {
				trimBeforeValue: trimBefore ?? startFrom ?? void 0,
				trimAfterValue: trimAfter ?? endAt ?? void 0
			};
		};
		var durationReducer = (state, action) => {
			switch (action.type) {
				case "got-duration": {
					const absoluteSrc = getAbsoluteSrc$1(action.src);
					if (state[absoluteSrc] === action.durationInSeconds) return state;
					return {
						...state,
						[absoluteSrc]: action.durationInSeconds
					};
				}
				default: return state;
			}
		};
		var DurationsContext = (0, react.createContext)({
			durations: {},
			setDurations: () => {
				throw new Error("context missing");
			}
		});
		var DurationsContextProvider = ({ children }) => {
			const [durations, setDurations] = (0, react.useReducer)(durationReducer, {});
			const value = (0, react.useMemo)(() => {
				return {
					durations,
					setDurations
				};
			}, [durations]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DurationsContext.Provider, {
				value,
				children
			});
		};
		var getCrossOriginValue = ({ crossOrigin, requestsVideoFrame, isClientSideRendering }) => {
			if (crossOrigin !== void 0 && crossOrigin !== null) return crossOrigin;
			if (isClientSideRendering) return "anonymous";
			if (requestsVideoFrame) return "anonymous";
		};
		function mulberry32(a2) {
			let t = a2 + 1831565813;
			t = Math.imul(t ^ t >>> 15, t | 1);
			t ^= t + Math.imul(t ^ t >>> 7, t | 61);
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		}
		function hashCode(str) {
			let i = 0;
			let chr = 0;
			let hash = 0;
			for (i = 0; i < str.length; i++) {
				chr = str.charCodeAt(i);
				hash = (hash << 5) - hash + chr;
				hash |= 0;
			}
			return hash;
		}
		var random = (seed, dummy) => {
			if (dummy !== void 0) throw new TypeError("random() takes only one argument");
			if (seed === null) return Math.random();
			if (typeof seed === "string") return mulberry32(hashCode(seed));
			if (typeof seed === "number") return mulberry32(seed * 1e10);
			throw new Error("random() argument must be a number or a string");
		};
		var playAndHandleNotAllowedError = ({ mediaRef, mediaType, onAutoPlayError, logLevel, mountTime, reason, isPlayer }) => {
			const { current } = mediaRef;
			if (!current) return;
			playbackLogging({
				logLevel,
				tag: "play",
				message: `Attempting to play ${current.src}. Reason: ${reason}`,
				mountTime
			});
			const prom = current.play();
			if (!prom.catch) return;
			prom.catch((err) => {
				if (!current) return;
				if (err.message.includes("request was interrupted by a call to pause")) return;
				if (err.message.includes("The operation was aborted.")) return;
				if (err.message.includes("The fetching process for the media resource was aborted by the user agent")) return;
				if (err.message.includes("request was interrupted by a new load request")) return;
				if (err.message.includes("because the media was removed from the document")) return;
				if (err.message.includes("user didn't interact with the document") && current.muted) return;
				console.log(`Could not play ${mediaType} due to following error: `, err);
				if (!current.muted) {
					if (onAutoPlayError) {
						onAutoPlayError();
						return;
					}
					if (mediaType === "video" && isPlayer) {
						Log.info({
							logLevel,
							tag: "<" + mediaType + ">"
						}, `The video will be muted and we'll retry playing it.`);
						Log.info({
							logLevel,
							tag: "<" + mediaType + ">"
						}, "Use onAutoPlayError() to handle this error yourself.");
						current.muted = true;
						current.play();
					}
				}
			});
		};
		var makeSharedElementSourceNode = ({ audioContext, ref }) => {
			let connected = null;
			let disposed = false;
			let currentAudioContext = audioContext;
			return {
				setAudioContext: (newAudioContext) => {
					currentAudioContext = newAudioContext;
				},
				attemptToConnect: () => {
					if (disposed) throw new Error("SharedElementSourceNode has been disposed");
					if (!connected && ref.current && currentAudioContext) connected = currentAudioContext.createMediaElementSource(ref.current);
				},
				get: () => {
					if (!connected) throw new Error("Audio element not connected");
					return connected;
				},
				cleanup: () => {
					if (connected) {
						connected.disconnect();
						connected = null;
					}
					disposed = true;
				}
			};
		};
		var warned = false;
		var warnOnce = (logLevel) => {
			if (warned) return;
			warned = true;
			if (typeof window !== "undefined") Log.warn({
				logLevel,
				tag: null
			}, "AudioContext is not supported in this browser");
		};
		var useSingletonAudioContext = ({ logLevel, latencyHint, audioEnabled, sampleRate }) => {
			const env = useRemotionEnvironment();
			const initialSampleRate = (0, react.useRef)(sampleRate);
			if (sampleRate !== initialSampleRate.current) throw new Error(`Changing the AudioContext sample rate dynamically is not supported. The sample rate was initialized with ${initialSampleRate.current} Hz, but ${sampleRate} Hz was passed later.`);
			return (0, react.useMemo)(() => {
				if (env.isRendering) return null;
				if (!audioEnabled) return null;
				if (typeof AudioContext === "undefined") {
					warnOnce(logLevel);
					return null;
				}
				const audioContext = new AudioContext({
					latencyHint,
					sampleRate
				});
				const gainNode = audioContext.createGain();
				gainNode.connect(audioContext.destination);
				Log.trace({
					logLevel,
					tag: "audio"
				}, "Creating new audio context");
				audioContext.suspend();
				let transitionTarget = null;
				const getState = () => {
					const nativeState = audioContext.state;
					if (transitionTarget === "running" && nativeState !== "running") return "suspended-to-running";
					if (transitionTarget === "suspended" && nativeState !== "suspended") return "running-to-suspended";
					return nativeState;
				};
				const resume = () => {
					transitionTarget = "running";
					const promise = audioContext.resume();
					promise.finally(() => {
						if (transitionTarget === "running") transitionTarget = null;
					});
					return promise;
				};
				const suspend = () => {
					transitionTarget = "suspended";
					const promise = audioContext.suspend();
					promise.finally(() => {
						if (transitionTarget === "suspended") transitionTarget = null;
					});
					return promise;
				};
				return {
					audioContext,
					gainNode,
					getState,
					resume,
					suspend
				};
			}, [
				logLevel,
				latencyHint,
				env.isRendering,
				audioEnabled,
				sampleRate
			]);
		};
		var RESUME_WAIT_TIMEOUT = 1e3;
		var waitUntilActuallyResumed = (audioContext, logLevel, signal, isAutoPlayAttempt) => {
			return new Promise((resolve) => {
				const startCurrentTime = audioContext.currentTime;
				const startOutputPerformanceTime = audioContext.getOutputTimestamp().performanceTime;
				const startWallClock = performance.now();
				let animationFrame = null;
				let timeout = null;
				let settled = false;
				let onAbort = () => {};
				const finish = (result) => {
					if (settled) return;
					settled = true;
					if (animationFrame !== null) cancelAnimationFrame(animationFrame);
					if (timeout !== null) clearTimeout(timeout);
					signal.removeEventListener("abort", onAbort);
					resolve(result);
				};
				onAbort = () => finish("cancelled");
				const hasAudiblyStarted = (startPerformanceTime) => {
					const outputTimestamp = audioContext.getOutputTimestamp();
					return startPerformanceTime !== void 0 && outputTimestamp.performanceTime !== void 0 && outputTimestamp.performanceTime > startPerformanceTime && outputTimestamp.contextTime !== void 0 && outputTimestamp.contextTime > startCurrentTime;
				};
				const check = () => {
					animationFrame = null;
					const { currentTime } = audioContext;
					const outputTimestamp = audioContext.getOutputTimestamp();
					const elapsedWallClock = performance.now() - startWallClock;
					if (hasAudiblyStarted(startOutputPerformanceTime)) {
						Log.verbose({
							logLevel,
							tag: "audio"
						}, `waitUntilActuallyResumed: getOutputTimestamp.performanceTime advanced from ${startOutputPerformanceTime.toFixed(6)} to ${outputTimestamp.performanceTime?.toFixed(6)} after ${elapsedWallClock.toFixed(1)}ms. currentTime=${currentTime.toFixed(6)} (advanced by ${(currentTime - startCurrentTime).toFixed(6)}), getOutputTimestamp.performanceTime=${outputTimestamp.performanceTime?.toFixed(1) ?? "undefined"}`);
						finish("resumed");
						return;
					}
					animationFrame = requestAnimationFrame(check);
				};
				if (signal.aborted) {
					finish("cancelled");
					return;
				}
				signal.addEventListener("abort", onAbort, { once: true });
				if (isAutoPlayAttempt) timeout = setTimeout(() => {
					if (hasAudiblyStarted(startOutputPerformanceTime)) {
						finish("resumed");
						return;
					}
					Log.warn({
						logLevel,
						tag: "audio"
					}, "WARNING: You enabled autoPlay on an unmuted <Player /> and the browser did not allow the video to be started. Remotion muted the <Player /> so it can play. To properly handle this, either set the `muted` prop or remove the `autoPlay` prop");
					finish("failed");
				}, RESUME_WAIT_TIMEOUT);
				animationFrame = requestAnimationFrame(check);
			});
		};
		var EMPTY_AUDIO = "data:audio/mp3;base64,/+MYxAAJcAV8AAgAABn//////+/gQ5BAMA+D4Pg+BAQBAEAwD4Pg+D4EBAEAQDAPg++hYBH///hUFQVBUFREDQNHmf///////+MYxBUGkAGIMAAAAP/29Xt6lUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDUAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
		var compareProps = (obj1, obj2) => {
			const keysA = Object.keys(obj1).sort();
			const keysB = Object.keys(obj2).sort();
			if (keysA.length !== keysB.length) return false;
			for (let i = 0; i < keysA.length; i++) {
				if (keysA[i] !== keysB[i]) return false;
				if (obj1[keysA[i]] !== obj2[keysB[i]]) return false;
			}
			return true;
		};
		var didPropChange = (key, newProp, prevProp) => {
			if (key === "src" && !prevProp.startsWith("data:") && !newProp.startsWith("data:")) return new URL(prevProp, document.baseURI).toString() !== new URL(newProp, document.baseURI).toString();
			if (prevProp === newProp) return false;
			return true;
		};
		var SharedAudioContext = (0, react.createContext)(null);
		var SharedAudioTagsContext = (0, react.createContext)(null);
		var shouldSaveForLater = (state) => {
			if (state === "suspended" || state === "running-to-suspended" || state === "interrupted") return true;
			if (state === "running" || state === "suspended-to-running") return false;
			throw new Error(`Unexpected audio context state: ${state}`);
		};
		var SharedAudioContextProvider = ({ children, audioLatencyHint, audioEnabled, previewSampleRate, _experimentalKeepAudioContextAlive }) => {
			const logLevel = useLogLevel();
			const sampleRate = previewSampleRate ?? 48e3;
			const ctxAndGain = useSingletonAudioContext({
				logLevel,
				latencyHint: audioLatencyHint,
				audioEnabled,
				sampleRate
			});
			const audioContextIsPlayingEventually = (0, react.useRef)(false);
			if ((0, react.useRef)(_experimentalKeepAudioContextAlive).current !== _experimentalKeepAudioContextAlive) throw new Error("`_experimentalKeepAudioContextAlive` cannot be changed dynamically.");
			const isResuming = (0, react.useRef)(null);
			const nextResumeAttemptId = (0, react.useRef)(0);
			const nextResumeIsAutoPlayAttempt = (0, react.useRef)(false);
			const audioSyncAnchor = (0, react.useMemo)(() => ({ value: 0 }), []);
			const audioSyncAnchorListeners = (0, react.useRef)([]);
			const audioSyncAnchorEmitter = (0, react.useMemo)(() => {
				return {
					dispatch: (event) => {
						audioSyncAnchorListeners.current.forEach((l) => l(event));
					},
					subscribe: (listener) => {
						audioSyncAnchorListeners.current.push(listener);
						return { remove: () => {
							audioSyncAnchorListeners.current = audioSyncAnchorListeners.current.filter((l) => l !== listener);
						} };
					}
				};
			}, []);
			const prevEndTimes = (0, react.useRef)({
				scheduledEndTime: null,
				mediaEndTime: null
			});
			const nodesToResume = (0, react.useRef)(/* @__PURE__ */ new Map());
			const unscheduleAudioNode = (0, react.useCallback)((node) => {
				nodesToResume.current.delete(node);
			}, []);
			const scheduleAudioNode = (0, react.useMemo)(() => {
				return ({ node, mediaTimestamp, sourceOffset, scheduledTime, duration, offset, originalUnloopedMediaTimestamp }) => {
					if (!ctxAndGain) throw new Error("Audio context not found");
					const currentState = ctxAndGain.getState();
					if (currentState === "closed") return {
						type: "not-started",
						reason: "audio context is closed"
					};
					const saveForLater = shouldSaveForLater(currentState) || _experimentalKeepAudioContextAlive && !audioContextIsPlayingEventually.current;
					if (duration > 0) {
						if (saveForLater) nodesToResume.current.set(node, {
							scheduledTime,
							offset,
							duration
						});
						else node.start(scheduledTime, offset, duration);
					}
					const scheduledEndTime = scheduledTime + duration / node.playbackRate.value;
					const mediaTime = mediaTimestamp + offset - sourceOffset;
					const mediaEndTime = mediaTime + duration;
					const latency = ctxAndGain.audioContext.baseLatency + ctxAndGain.audioContext.outputLatency;
					const timeDiff = scheduledTime - ctxAndGain.audioContext.currentTime;
					const prev = prevEndTimes.current;
					const scheduledMismatch = prev.scheduledEndTime !== null && Math.abs(scheduledTime - prev.scheduledEndTime) > .001;
					const mediaMismatch = prev.mediaEndTime !== null && Math.abs(mediaTime - prev.mediaEndTime) > .001;
					Log.verbose({
						logLevel,
						tag: "audio-scheduling"
					}, "scheduled %c%s%c %s %c%s%c %s %c%s%c %s %s %s %s %s", scheduledMismatch ? "color: red; font-weight: bold" : "", scheduledTime.toFixed(4), "", scheduledEndTime.toFixed(4), mediaMismatch ? "color: red; font-weight: bold" : "", mediaTime.toFixed(4), "", mediaEndTime.toFixed(4), duration < 0 ? "color: red; font-weight: bold" : timeDiff < 0 ? "color: red; font-weight: bold" : "color: blue; font-weight: bold", duration < 0 ? "missed " + Math.abs(offset).toFixed(2) + "s" : Math.abs(timeDiff).toFixed(2) + (timeDiff < 0 ? " delay" : " ahead"), "", "current=" + ctxAndGain.audioContext.currentTime.toFixed(4), "offset=" + offset.toFixed(4), "latency=" + latency.toFixed(4), "state=" + ctxAndGain.audioContext.state, originalUnloopedMediaTimestamp !== mediaTime ? "original_ts=" + originalUnloopedMediaTimestamp.toFixed(4) : "", "action=" + (saveForLater ? "schedule" : "start"), "");
					prev.scheduledEndTime = scheduledEndTime;
					prev.mediaEndTime = mediaEndTime;
					return duration > 0 ? {
						type: "started",
						scheduledTime
					} : {
						type: "not-started",
						reason: "missed " + Math.abs(offset).toFixed(2) + "s"
					};
				};
			}, [
				ctxAndGain,
				_experimentalKeepAudioContextAlive,
				logLevel
			]);
			const resume = (0, react.useCallback)(() => {
				const isAutoPlayAttempt = nextResumeIsAutoPlayAttempt.current;
				nextResumeIsAutoPlayAttempt.current = false;
				if (!ctxAndGain) return Promise.resolve();
				if (audioContextIsPlayingEventually.current) return Promise.resolve();
				audioContextIsPlayingEventually.current = true;
				ctxAndGain.gainNode.gain.cancelScheduledValues(ctxAndGain.audioContext.currentTime);
				ctxAndGain.gainNode.gain.setValueAtTime(0, ctxAndGain.audioContext.currentTime);
				ctxAndGain.gainNode.gain.linearRampToValueAtTime(1, ctxAndGain.audioContext.currentTime + .03);
				nodesToResume.current.forEach((r, node) => {
					node.start(r.scheduledTime, r.offset, r.duration);
				});
				nodesToResume.current.clear();
				if (_experimentalKeepAudioContextAlive && ctxAndGain.audioContext.state === "running") return Promise.resolve();
				const resumePromise = ctxAndGain.resume();
				const abortController = new AbortController();
				const resumeAttemptId = nextResumeAttemptId.current++;
				const waitPromise = new Promise((resolve) => {
					waitUntilActuallyResumed(ctxAndGain.audioContext, logLevel, abortController.signal, isAutoPlayAttempt).then(resolve);
					resumePromise.catch((err) => {
						Log.warn({
							logLevel,
							tag: "audio"
						}, "AudioContext resume rejected, muting playback and continuing without audio", err);
						abortController.abort();
						resolve("failed");
					});
				}).finally(() => {
					if (isResuming.current?.id === resumeAttemptId) isResuming.current = null;
				});
				isResuming.current = {
					abortController,
					id: resumeAttemptId,
					promise: waitPromise
				};
				return resumePromise.catch(() => {});
			}, [
				ctxAndGain,
				_experimentalKeepAudioContextAlive,
				logLevel
			]);
			const resumeAsAutoPlay = (0, react.useCallback)(() => {
				nextResumeIsAutoPlayAttempt.current = true;
				return resume();
			}, [resume]);
			const getIsResumingAudioContext = (0, react.useCallback)(() => {
				return isResuming.current?.promise ?? null;
			}, []);
			const suspend = (0, react.useCallback)(() => {
				isResuming.current?.abortController.abort();
				if (!ctxAndGain) return Promise.resolve();
				if (!audioContextIsPlayingEventually.current) return Promise.resolve();
				audioContextIsPlayingEventually.current = false;
				if (_experimentalKeepAudioContextAlive) {
					ctxAndGain.gainNode.gain.cancelScheduledValues(ctxAndGain.audioContext.currentTime);
					ctxAndGain.gainNode.gain.setValueAtTime(0, ctxAndGain.audioContext.currentTime);
					return Promise.resolve();
				}
				return ctxAndGain.suspend();
			}, [ctxAndGain, _experimentalKeepAudioContextAlive]);
			(0, react.useEffect)(() => {
				if (!_experimentalKeepAudioContextAlive) return;
				if (!ctxAndGain) return;
				if (typeof window === "undefined") return;
				const wake = () => {
					if (ctxAndGain.audioContext.state === "running") return;
					ctxAndGain.resume().catch(() => {});
				};
				wake();
				window.addEventListener("pointerdown", wake, {
					capture: true,
					passive: true
				});
				window.addEventListener("keydown", wake, {
					capture: true,
					passive: true
				});
				return () => {
					window.removeEventListener("pointerdown", wake, { capture: true });
					window.removeEventListener("keydown", wake, { capture: true });
					ctxAndGain.suspend().catch(() => {});
				};
			}, [ctxAndGain, _experimentalKeepAudioContextAlive]);
			const audioContextValue = (0, react.useMemo)(() => {
				return {
					sampleRate,
					audioContext: ctxAndGain?.audioContext ?? null,
					getAudioContextState: () => ctxAndGain?.getState() ?? null,
					gainNode: ctxAndGain?.gainNode ?? null,
					audioSyncAnchor,
					audioSyncAnchorEmitter,
					scheduleAudioNode,
					resume,
					resumeAsAutoPlay,
					suspend,
					getIsResumingAudioContext,
					unscheduleAudioNode,
					_experimentalKeepAudioContextAlive
				};
			}, [
				sampleRate,
				ctxAndGain,
				audioSyncAnchor,
				audioSyncAnchorEmitter,
				scheduleAudioNode,
				resume,
				resumeAsAutoPlay,
				suspend,
				getIsResumingAudioContext,
				unscheduleAudioNode,
				_experimentalKeepAudioContextAlive
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SharedAudioContext.Provider, {
				value: audioContextValue,
				children
			});
		};
		var SharedAudioTagsContextProvider = ({ children, numberOfAudioTags }) => {
			const audios = (0, react.useRef)([]);
			const [initialNumberOfAudioTags] = (0, react.useState)(numberOfAudioTags);
			if (numberOfAudioTags !== initialNumberOfAudioTags) throw new Error("The number of shared audio tags has changed dynamically. Once you have set this property, you cannot change it afterwards.");
			const logLevel = useLogLevel();
			const mountTime = useMountTime();
			const env = useRemotionEnvironment();
			const audioCtx = (0, react.useContext)(SharedAudioContext);
			const audioContext = audioCtx?.audioContext ?? null;
			const resume = audioCtx?.resume;
			const [refs] = (0, react.useState)(() => {
				return new Array(numberOfAudioTags).fill(true).map(() => {
					const ref = (0, react.createRef)();
					return {
						id: Math.random(),
						ref,
						mediaElementSourceNode: makeSharedElementSourceNode({
							audioContext,
							ref
						})
					};
				});
			});
			for (const { mediaElementSourceNode } of refs) mediaElementSourceNode?.setAudioContext(audioContext);
			(react.default.useInsertionEffect ?? react.default.useLayoutEffect)(() => {
				return () => {
					requestAnimationFrame(() => {
						refs.forEach(({ mediaElementSourceNode }) => {
							mediaElementSourceNode?.cleanup();
						});
					});
				};
			}, [refs]);
			const takenAudios = (0, react.useRef)(new Array(numberOfAudioTags).fill(false));
			const rerenderAudios = (0, react.useCallback)(() => {
				refs.forEach(({ ref, id }) => {
					const data = audios.current?.find((a2) => a2.id === id);
					const { current } = ref;
					if (!current) return;
					if (data === void 0) {
						if (current.src !== EMPTY_AUDIO) current.src = EMPTY_AUDIO;
						return;
					}
					if (!data) throw new TypeError("Expected audio data to be there");
					Object.keys(data.props).forEach((key) => {
						if (didPropChange(key, data.props[key], current[key])) current[key] = data.props[key];
					});
				});
			}, [refs]);
			const registerAudio = (0, react.useCallback)((options) => {
				const { aud, audioId, premounting, postmounting } = options;
				const found = audios.current?.find((a2) => a2.audioId === audioId);
				if (found) return found;
				const firstFreeAudio = takenAudios.current.findIndex((a2) => a2 === false);
				if (firstFreeAudio === -1) throw new Error(`Tried to simultaneously mount ${numberOfAudioTags + 1} <Html5Audio /> tags at the same time. With the current settings, the maximum amount of <Html5Audio /> tags is limited to ${numberOfAudioTags} at the same time. Remotion pre-mounts silent audio tags to help avoid browser autoplay restrictions. See https://remotion.dev/docs/player/autoplay#using-the-numberofsharedaudiotags-prop for more information on how to increase this limit.`);
				const { id, ref, mediaElementSourceNode } = refs[firstFreeAudio];
				const cloned = [...takenAudios.current];
				cloned[firstFreeAudio] = id;
				takenAudios.current = cloned;
				const newElem = {
					props: aud,
					id,
					el: ref,
					audioId,
					mediaElementSourceNode,
					premounting,
					audioMounted: Boolean(ref.current),
					postmounting,
					cleanupOnMediaTagUnmount: () => {}
				};
				audios.current?.push(newElem);
				rerenderAudios();
				return newElem;
			}, [
				numberOfAudioTags,
				refs,
				rerenderAudios
			]);
			const unregisterAudio = (0, react.useCallback)((id) => {
				const cloned = [...takenAudios.current];
				const index = refs.findIndex((r) => r.id === id);
				if (index === -1) throw new TypeError(`Unknown audio ref ${id}; refs: ${refs.map((r) => r.id).join(", ")}`);
				cloned[index] = false;
				takenAudios.current = cloned;
				audios.current = audios.current?.filter((a2) => a2.id !== id);
				rerenderAudios();
			}, [refs, rerenderAudios]);
			const updateAudio = (0, react.useCallback)(({ aud, audioId, id, premounting, postmounting }) => {
				let changed = false;
				audios.current = audios.current?.map((prevA) => {
					const audioMounted = Boolean(prevA.el.current);
					if (prevA.audioMounted !== audioMounted) changed = true;
					if (prevA.id === id) {
						if (compareProps(aud, prevA.props) && prevA.premounting === premounting && prevA.postmounting === postmounting) return prevA.audioMounted === audioMounted ? prevA : {
							...prevA,
							audioMounted
						};
						changed = true;
						return {
							...prevA,
							props: aud,
							premounting,
							postmounting,
							audioId,
							audioMounted
						};
					}
					return prevA.audioMounted === audioMounted ? prevA : {
						...prevA,
						audioMounted
					};
				});
				if (changed) rerenderAudios();
			}, [rerenderAudios]);
			const playAllAudios = (0, react.useCallback)(() => {
				refs.forEach((ref) => {
					if (audios.current.find((a2) => a2.el === ref.ref)?.premounting) return;
					playAndHandleNotAllowedError({
						mediaRef: ref.ref,
						mediaType: "audio",
						onAutoPlayError: null,
						logLevel,
						mountTime,
						reason: "playing all audios",
						isPlayer: env.isPlayer
					});
				});
				resume?.();
			}, [
				logLevel,
				mountTime,
				refs,
				env.isPlayer,
				resume
			]);
			const audioTagsValue = (0, react.useMemo)(() => {
				return {
					registerAudio,
					unregisterAudio,
					updateAudio,
					playAllAudios,
					numberOfAudioTags
				};
			}, [
				numberOfAudioTags,
				playAllAudios,
				registerAudio,
				unregisterAudio,
				updateAudio
			]);
			const sharedAudioTagElements = (0, react.useMemo)(() => {
				return refs.map(({ id, ref }) => {
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
						ref,
						preload: "metadata",
						src: EMPTY_AUDIO
					}, id);
				});
			}, [refs]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(SharedAudioTagsContext.Provider, {
				value: audioTagsValue,
				children: [sharedAudioTagElements, children]
			});
		};
		var useSharedAudio = ({ aud, audioId, premounting, postmounting }) => {
			const audioCtx = (0, react.useContext)(SharedAudioContext);
			const tagsCtx = (0, react.useContext)(SharedAudioTagsContext);
			const [elem] = (0, react.useState)(() => {
				if (tagsCtx && tagsCtx.numberOfAudioTags > 0) return tagsCtx.registerAudio({
					aud,
					audioId,
					premounting,
					postmounting
				});
				const el = react.default.createRef();
				const mediaElementSourceNode = makeSharedElementSourceNode({
					audioContext: audioCtx?.audioContext ?? null,
					ref: el
				});
				return {
					el,
					id: Math.random(),
					props: aud,
					audioId,
					mediaElementSourceNode,
					premounting,
					audioMounted: Boolean(el.current),
					postmounting,
					cleanupOnMediaTagUnmount: () => {
						mediaElementSourceNode?.cleanup();
					}
				};
			});
			elem.mediaElementSourceNode?.setAudioContext(audioCtx?.audioContext ?? null);
			const effectToUse = react.default.useInsertionEffect ?? react.default.useLayoutEffect;
			if (typeof document !== "undefined") {
				effectToUse(() => {
					if (tagsCtx && tagsCtx.numberOfAudioTags > 0) tagsCtx.updateAudio({
						id: elem.id,
						aud,
						audioId,
						premounting,
						postmounting
					});
				}, [
					aud,
					tagsCtx,
					elem.id,
					audioId,
					premounting,
					postmounting
				]);
				effectToUse(() => {
					return () => {
						if (tagsCtx && tagsCtx.numberOfAudioTags > 0) tagsCtx.unregisterAudio(elem.id);
					};
				}, [tagsCtx, elem.id]);
			}
			return elem;
		};
		var FLOATING_POINT_ERROR_THRESHOLD = 1e-5;
		var isApproximatelyTheSame = (num1, num2) => {
			return Math.abs(num1 - num2) < FLOATING_POINT_ERROR_THRESHOLD;
		};
		var toSeconds = (time, fps) => {
			return Math.round(time / fps * 100) / 100;
		};
		var isSafari = () => {
			if (typeof window === "undefined") return false;
			if (!/AppleWebKit/.test(window.navigator.userAgent)) return false;
			return !window.navigator.userAgent.includes("Chrome/");
		};
		var isIosSafari = () => {
			if (typeof window === "undefined") return false;
			const { userAgent, platform, maxTouchPoints } = window.navigator;
			return (/iP(ad|od|hone)/i.test(userAgent) || platform === "MacIntel" && maxTouchPoints > 1) && isSafari();
		};
		var isIOSSafariAndBlob = (actualSrc) => {
			return isIosSafari() && actualSrc.startsWith("blob:");
		};
		var getVideoFragmentStart = ({ actualFrom, fps }) => {
			return toSeconds(Math.max(0, -actualFrom), fps);
		};
		var getVideoFragmentEnd = ({ duration, fps }) => {
			return toSeconds(duration, fps);
		};
		var appendVideoFragment = ({ actualSrc, actualFrom, duration, fps }) => {
			if (isIOSSafariAndBlob(actualSrc)) return actualSrc;
			if (actualSrc.startsWith("data:")) return actualSrc;
			if (Boolean(new URL(actualSrc, (typeof window === "undefined" ? null : window.location.href) ?? "http://localhost:3000").hash)) return actualSrc;
			if (!Number.isFinite(actualFrom)) return actualSrc;
			const withStartHash = `${actualSrc}#t=${getVideoFragmentStart({
				actualFrom,
				fps
			})}`;
			if (!Number.isFinite(duration)) return withStartHash;
			return `${withStartHash},${getVideoFragmentEnd({
				duration,
				fps
			})}`;
		};
		var isSubsetOfDuration = ({ prevStartFrom, newStartFrom, prevDuration, newDuration, fps }) => {
			const previousFrom = getVideoFragmentStart({
				actualFrom: prevStartFrom,
				fps
			});
			const newFrom = getVideoFragmentStart({
				actualFrom: newStartFrom,
				fps
			});
			const previousEnd = getVideoFragmentEnd({
				duration: prevDuration,
				fps
			});
			const newEnd = getVideoFragmentEnd({
				duration: newDuration,
				fps
			});
			if (newFrom < previousFrom) return false;
			if (newEnd > previousEnd) return false;
			return true;
		};
		var useAppendVideoFragment = ({ actualSrc: initialActualSrc, actualFrom: initialActualFrom, duration: initialDuration, fps }) => {
			const actualFromRef = (0, react.useRef)(initialActualFrom);
			const actualDuration = (0, react.useRef)(initialDuration);
			const actualSrc = (0, react.useRef)(initialActualSrc);
			if (!isSubsetOfDuration({
				prevStartFrom: actualFromRef.current,
				newStartFrom: initialActualFrom,
				prevDuration: actualDuration.current,
				newDuration: initialDuration,
				fps
			}) || initialActualSrc !== actualSrc.current) {
				actualFromRef.current = initialActualFrom;
				actualDuration.current = initialDuration;
				actualSrc.current = initialActualSrc;
			}
			return appendVideoFragment({
				actualSrc: actualSrc.current,
				actualFrom: actualFromRef.current,
				duration: actualDuration.current,
				fps
			});
		};
		var warned2 = false;
		var warnSafariOnce = (logLevel) => {
			if (warned2) return;
			warned2 = true;
			Log.warn({
				logLevel,
				tag: null
			}, "In Safari, setting a volume and a playback rate at the same time is buggy.");
			Log.warn({
				logLevel,
				tag: null
			}, "In Desktop Safari, only volumes <= 1 will be applied.");
			Log.warn({
				logLevel,
				tag: null
			}, logLevel, "In Mobile Safari, the volume will be ignored and set to 1 if a playbackRate is set.");
		};
		var useVolume = ({ mediaRef, volume, logLevel, source, shouldUseWebAudioApi }) => {
			const audioStuffRef = (0, react.useRef)(null);
			const currentVolumeRef = (0, react.useRef)(volume);
			currentVolumeRef.current = volume;
			const sharedAudioContext = (0, react.useContext)(SharedAudioContext);
			if (!sharedAudioContext) throw new Error("useAmplification must be used within a SharedAudioContext");
			const { audioContext, gainNode: masterGainNode } = sharedAudioContext;
			if (typeof window !== "undefined") (0, react.useLayoutEffect)(() => {
				if (!audioContext) return;
				if (!mediaRef.current) return;
				if (!shouldUseWebAudioApi) return;
				if (mediaRef.current.playbackRate !== 1 && isSafari()) {
					warnSafariOnce(logLevel);
					return;
				}
				if (!source) return;
				if (!masterGainNode) return;
				const gainNode = new GainNode(audioContext, { gain: currentVolumeRef.current });
				source.attemptToConnect();
				source.get().connect(gainNode);
				gainNode.connect(masterGainNode);
				audioStuffRef.current = { gainNode };
				Log.trace({
					logLevel,
					tag: null
				}, `Starting to amplify ${mediaRef.current?.src}. Gain = ${currentVolumeRef.current}, playbackRate = ${mediaRef.current?.playbackRate}`);
				return () => {
					audioStuffRef.current = null;
					gainNode.disconnect();
					source.get().disconnect();
				};
			}, [
				logLevel,
				mediaRef,
				audioContext,
				source,
				shouldUseWebAudioApi,
				masterGainNode
			]);
			if (audioStuffRef.current) {
				const valueToSet = volume;
				if (!isApproximatelyTheSame(audioStuffRef.current.gainNode.gain.value, valueToSet)) {
					audioStuffRef.current.gainNode.gain.value = valueToSet;
					Log.trace({
						logLevel,
						tag: null
					}, `Setting gain to ${valueToSet} for ${mediaRef.current?.src}`);
				}
			}
			if ((isSafari() && mediaRef.current && mediaRef.current?.playbackRate !== 1 || !shouldUseWebAudioApi) && mediaRef.current && !isApproximatelyTheSame(volume, mediaRef.current?.volume)) mediaRef.current.volume = Math.min(volume, 1);
			return audioStuffRef;
		};
		var useMediaStartsAt = () => {
			return (0, react.useContext)(SequenceContext)?.cumulatedNegativeFrom ?? 0;
		};
		var useFrameForVolumeProp = (behavior) => {
			const loop = Loop.useLoop();
			const frame = useCurrentFrame();
			const startsAt = useMediaStartsAt();
			if (behavior === "repeat" || loop === null) return frame + startsAt;
			return frame + startsAt + loop.durationInFrames * loop.iteration;
		};
		var getAssetDisplayName = (filename) => {
			if (filename.startsWith("data:")) return "Data URL";
			if (filename.startsWith("blob:")) {
				const staticFile = typeof window === "undefined" ? void 0 : window.remotion_staticFiles?.find((file) => file.src === filename);
				return staticFile ? getAssetDisplayName(staticFile.name) : "Blob URL";
			}
			const splitted = filename.split("/").map((s) => s.split("\\")).flat(1);
			return splitted[splitted.length - 1];
		};
		var getTimelineDuration = ({ compositionDurationInFrames, playbackRate, trimBefore, trimAfter, parentSequenceDurationInFrames, loop }) => {
			if (loop) return compositionDurationInFrames;
			const mediaDuration = calculateMediaDuration({
				mediaDurationInFrames: compositionDurationInFrames * playbackRate + (trimBefore ?? 0),
				playbackRate,
				trimBefore,
				trimAfter
			});
			if (parentSequenceDurationInFrames !== null) return Number(Math.min(parentSequenceDurationInFrames, mediaDuration).toFixed(10));
			return mediaDuration;
		};
		var evaluateVolume = ({ frame, volume, mediaVolume = 1 }) => {
			if (typeof volume === "number") return volume * mediaVolume;
			if (typeof volume === "undefined") return Number(mediaVolume);
			const evaluated = volume(frame) * mediaVolume;
			if (typeof evaluated !== "number") throw new TypeError(`You passed in a a function to the volume prop but it did not return a number but a value of type ${typeof evaluated} for frame ${frame}`);
			if (Number.isNaN(evaluated)) throw new TypeError(`You passed in a function to the volume prop but it returned NaN for frame ${frame}.`);
			if (!Number.isFinite(evaluated)) throw new TypeError(`You passed in a function to the volume prop but it returned a non-finite number for frame ${frame}.`);
			return Math.max(0, evaluated);
		};
		var didWarn = {};
		var warnOnce2 = (message) => {
			if (didWarn[message]) return;
			console.warn(message);
			didWarn[message] = true;
		};
		var useBasicMediaInTimeline = ({ volume, mediaVolume, mediaType, src, displayName, trimBefore, trimAfter, playbackRate, sequenceDurationInFrames, mediaStartsAt, loop, muted }) => {
			if (!src) throw new Error("No src passed");
			const parentSequence = (0, react.useContext)(SequenceContext);
			const [initialVolume] = (0, react.useState)(() => volume);
			const duration = getTimelineDuration({
				compositionDurationInFrames: sequenceDurationInFrames,
				playbackRate,
				trimBefore,
				trimAfter,
				parentSequenceDurationInFrames: parentSequence?.durationInFrames ?? null,
				loop
			});
			const volumes = (0, react.useMemo)(() => {
				if (typeof volume === "number") return volume;
				if (typeof volume !== "function") return evaluateVolume({
					frame: 0,
					volume,
					mediaVolume
				});
				return new Array(Math.floor(Math.max(0, duration + mediaStartsAt))).fill(true).map((_, i) => {
					return evaluateVolume({
						frame: i + mediaStartsAt,
						volume,
						mediaVolume
					});
				}).join(",");
			}, [
				duration,
				mediaStartsAt,
				volume,
				mediaVolume
			]);
			(0, react.useEffect)(() => {
				if (typeof volume === "number" && volume !== initialVolume) warnOnce2(`Remotion: The ${mediaType} with src ${src} has changed it's volume. Prefer the callback syntax for setting volume to get better timeline display: https://www.remotion.dev/docs/audio/volume`);
			}, [
				initialVolume,
				mediaType,
				src,
				volume
			]);
			const doesVolumeChange = typeof volume === "function";
			const startMediaFrom = 0 - mediaStartsAt + (trimBefore ?? 0);
			return (0, react.useMemo)(() => {
				return {
					volumes,
					duration,
					doesVolumeChange,
					finalDisplayName: displayName ?? getAssetDisplayName(src),
					startMediaFrom,
					src,
					playbackRate,
					muted
				};
			}, [
				volumes,
				duration,
				doesVolumeChange,
				displayName,
				src,
				startMediaFrom,
				playbackRate,
				muted
			]);
		};
		var useMediaInTimeline = ({ volume, mediaVolume, src, mediaType, playbackRate, displayName, id, getStack, showInTimeline, premountDisplay, postmountDisplay, loopDisplay, documentationLink, refForOutline, muted }) => {
			const parentSequence = (0, react.useContext)(SequenceContext);
			const startsAt = useMediaStartsAt();
			const sequenceRegistrationEnabled = (0, react.useContext)(SequenceRegistrationContext);
			const { durationInFrames } = useVideoConfig();
			const { volumes, duration, doesVolumeChange, finalDisplayName } = useBasicMediaInTimeline({
				volume,
				mediaVolume,
				mediaType,
				src,
				displayName,
				trimAfter: void 0,
				trimBefore: void 0,
				playbackRate,
				sequenceDurationInFrames: durationInFrames,
				mediaStartsAt: useMediaStartsAt(),
				loop: false,
				muted
			});
			const { isStudio } = useRemotionEnvironment();
			const getSequenceForRegistration = (0, react.useCallback)(() => {
				if (!src) throw new Error("No src passed");
				return {
					effectRuntimeValues: null,
					type: mediaType,
					src,
					id,
					duration,
					from: 0,
					trimBefore: null,
					parent: parentSequence?.id ?? null,
					displayName: finalDisplayName,
					documentationLink,
					volume: volumes,
					muted,
					showInTimeline: true,
					timelineOrder: null,
					startMediaFrom: 0 - startsAt,
					mediaFrameAtSequenceZero: null,
					doesVolumeChange,
					loopDisplay,
					playbackRate,
					getStack,
					premountDisplay,
					postmountDisplay,
					controls: null,
					effects: [],
					refForOutline,
					isInsideSeries: false,
					frozenFrame: null,
					frozenMediaFrame: null
				};
			}, [
				duration,
				id,
				parentSequence,
				src,
				volumes,
				doesVolumeChange,
				mediaType,
				startsAt,
				playbackRate,
				getStack,
				premountDisplay,
				postmountDisplay,
				loopDisplay,
				documentationLink,
				finalDisplayName,
				refForOutline,
				muted
			]);
			useSequenceRegistration({
				getSequence: (isStudio || sequenceRegistrationEnabled || typeof window !== "undefined" && window.process?.env?.NODE_ENV === "test") && showInTimeline ? getSequenceForRegistration : null,
				id
			});
		};
		var useBufferManager = (logLevel, mountTime, setBuffering, isBuffering) => {
			const [blockCount, setBlockCount] = (0, react.useState)(0);
			const rendering = useRemotionEnvironment().isRendering;
			const addBlock = (0, react.useCallback)(() => {
				if (rendering) return { unblock: () => {} };
				let unblocked = false;
				setBlockCount((count) => count + 1);
				return { unblock: () => {
					if (unblocked) return;
					unblocked = true;
					setBlockCount((count) => count - 1);
				} };
			}, [rendering]);
			(0, react.useEffect)(() => {
				if (rendering) return;
				if (blockCount > 0 && !isBuffering()) {
					setBuffering(true);
					playbackLogging({
						logLevel,
						message: "Player is entering buffer state",
						mountTime,
						tag: "player"
					});
				}
			}, [blockCount]);
			if (typeof window !== "undefined") (0, react.useLayoutEffect)(() => {
				if (rendering) return;
				if (blockCount === 0 && isBuffering()) {
					setBuffering(false);
					playbackLogging({
						logLevel,
						message: "Player is exiting buffer state",
						mountTime,
						tag: "player"
					});
				}
			}, [blockCount]);
			return (0, react.useMemo)(() => ({ addBlock }), [addBlock]);
		};
		var BufferingContextReact = react.default.createContext(null);
		var BufferingProvider = ({ children }) => {
			const { logLevel, mountTime } = (0, react.useContext)(LogLevelContext);
			const { isBuffering, setBuffering } = (0, react.useContext)(SetTimelineContext);
			const bufferManager = useBufferManager(logLevel ?? "info", mountTime, setBuffering, isBuffering);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BufferingContextReact.Provider, {
				value: bufferManager,
				children
			});
		};
		var useBufferState = () => {
			const buffer = (0, react.useContext)(BufferingContextReact);
			const logLevel = useLogLevel();
			const addBlock = buffer ? buffer.addBlock : null;
			return (0, react.useMemo)(() => ({ delayPlayback: () => {
				if (!addBlock) throw new Error("Tried to enable the buffering state, but a Remotion context was not found. This API can only be called in a component that was passed to the Remotion Player or a <Composition>. Or you might have experienced a version mismatch - run `npx remotion versions` and ensure all packages have the same version. This error is thrown by the buffer state https://remotion.dev/docs/player/buffer-state");
				Log.trace({
					logLevel,
					tag: "[buffer-state]"
				}, "Adding buffer handle", (/* @__PURE__ */ new Error()).stack);
				const { unblock } = addBlock();
				let unblocked = false;
				return { unblock: () => {
					if (unblocked) return;
					unblocked = true;
					Log.trace({
						logLevel,
						tag: "[buffer-state]"
					}, "Removing buffer handle");
					unblock();
				} };
			} }), [addBlock, logLevel]);
		};
		var isSafariWebkit = () => {
			return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
		};
		var useBufferUntilFirstFrame = ({ mediaRef, mediaType, onVariableFpsVideoDetected, pauseWhenBuffering, logLevel, mountTime }) => {
			const bufferingRef = (0, react.useRef)(false);
			const { delayPlayback } = useBufferState();
			const bufferUntilFirstFrame = (0, react.useCallback)((requestedTime) => {
				if (mediaType !== "video") return;
				if (!pauseWhenBuffering) return;
				const current = mediaRef.current;
				if (!current) return;
				if (current.readyState >= current.HAVE_FUTURE_DATA && !isSafariWebkit()) {
					playbackLogging({
						logLevel,
						message: `Not using buffer until first frame, because readyState is ${current.readyState} and is not Safari or Desktop Chrome`,
						mountTime,
						tag: "buffer"
					});
					return;
				}
				if (!current.requestVideoFrameCallback) {
					playbackLogging({
						logLevel,
						message: `Not using buffer until first frame, because requestVideoFrameCallback is not supported`,
						mountTime,
						tag: "buffer"
					});
					return;
				}
				bufferingRef.current = true;
				playbackLogging({
					logLevel,
					message: `Buffering ${mediaRef.current?.src} until the first frame is received`,
					mountTime,
					tag: "buffer"
				});
				const playback = delayPlayback();
				const unblock = () => {
					playback.unblock();
					current.removeEventListener("ended", unblock, { once: true });
					current.removeEventListener("pause", unblock, { once: true });
					bufferingRef.current = false;
				};
				const onEndedOrPauseOrCanPlay = () => {
					unblock();
				};
				current.requestVideoFrameCallback((_, info2) => {
					if (Math.abs(info2.mediaTime - requestedTime) > .5) onVariableFpsVideoDetected();
					unblock();
				});
				current.addEventListener("ended", onEndedOrPauseOrCanPlay, { once: true });
				current.addEventListener("pause", onEndedOrPauseOrCanPlay, { once: true });
				current.addEventListener("canplay", onEndedOrPauseOrCanPlay, { once: true });
			}, [
				delayPlayback,
				logLevel,
				mediaRef,
				mediaType,
				mountTime,
				onVariableFpsVideoDetected,
				pauseWhenBuffering
			]);
			return (0, react.useMemo)(() => {
				return {
					isBuffering: () => bufferingRef.current,
					bufferUntilFirstFrame
				};
			}, [bufferUntilFirstFrame]);
		};
		var getMediaSyncAction = (input) => {
			const { duration, currentTime, paused, ended, desiredUnclampedTime, mediaTagTime, mediaTagLastUpdate, rvcTime, rvcLastUpdate, isVariableFpsVideo, acceptableTimeShift, lastSeekDueToShift, playing, playbackRate, mediaTagBufferingOrStalled, playerBuffering, absoluteFrame, onlyWarnForMediaSeekingError, isPremounting, isPostmounting, pauseWhenBuffering } = input;
			const shouldBeTime = !Number.isNaN(duration) && Number.isFinite(duration) ? Math.min(duration, desiredUnclampedTime) : desiredUnclampedTime;
			const timeShiftMediaTag = Math.abs(shouldBeTime - mediaTagTime);
			const timeShiftRvcTag = rvcTime ? Math.abs(shouldBeTime - rvcTime) : null;
			const timeShift = timeShiftRvcTag && !isVariableFpsVideo ? rvcLastUpdate && rvcTime > mediaTagLastUpdate ? timeShiftRvcTag : timeShiftMediaTag : timeShiftMediaTag;
			if (timeShift > acceptableTimeShift && lastSeekDueToShift !== shouldBeTime) return {
				type: "seek-due-to-shift",
				shouldBeTime,
				why: `because time shift is too big. shouldBeTime = ${shouldBeTime}, isTime = ${mediaTagTime}, requestVideoCallbackTime = ${rvcTime}, timeShift = ${timeShift}${isVariableFpsVideo ? ", isVariableFpsVideo = true" : ""}, isPremounting = ${isPremounting}, isPostmounting = ${isPostmounting}, pauseWhenBuffering = ${pauseWhenBuffering}`,
				bufferUntilFirstFrame: playing && playbackRate > 0,
				playReason: playing && paused ? "player is playing but media tag is paused, and just seeked" : null,
				warnAboutNonSeekable: !onlyWarnForMediaSeekingError
			};
			const seekThreshold = playing ? .15 : .01;
			const makesSenseToSeek = Math.abs(currentTime - shouldBeTime) > seekThreshold;
			if (!playing || playerBuffering && !mediaTagBufferingOrStalled) return {
				type: "seek-if-not-playing",
				shouldBeTime,
				why: makesSenseToSeek ? `not playing or something else is buffering. time offset is over seek threshold (${seekThreshold})` : null
			};
			if (!playing || playerBuffering) return { type: "none" };
			const pausedCondition = paused && !ended;
			if (pausedCondition || absoluteFrame === 0) {
				const reason = pausedCondition ? "media tag is paused" : "absolute frame is 0";
				return {
					type: "play-and-seek",
					shouldBeTime,
					why: makesSenseToSeek ? `is over timeshift threshold (threshold = ${seekThreshold}) and ${reason}` : null,
					playReason: `player is playing and ${reason}`,
					bufferUntilFirstFrame: !isVariableFpsVideo && playbackRate > 0
				};
			}
			return { type: "none" };
		};
		var useCurrentTimeOfMediaTagWithUpdateTimeStamp = (mediaRef) => {
			const lastUpdate = react.default.useRef({
				time: mediaRef.current?.currentTime ?? 0,
				lastUpdate: performance.now()
			});
			const nowCurrentTime = mediaRef.current?.currentTime ?? null;
			if (nowCurrentTime !== null) {
				if (lastUpdate.current.time !== nowCurrentTime) {
					lastUpdate.current.time = nowCurrentTime;
					lastUpdate.current.lastUpdate = performance.now();
				}
			}
			return lastUpdate;
		};
		var seek = ({ mediaRef, time, logLevel, why, mountTime }) => {
			const timeToSet = isIosSafari() ? Number(time.toFixed(1)) : time;
			playbackLogging({
				logLevel,
				tag: "seek",
				message: `Seeking from ${mediaRef.currentTime} to ${timeToSet}. src= ${mediaRef.src} Reason: ${why}`,
				mountTime
			});
			mediaRef.currentTime = timeToSet;
			return timeToSet;
		};
		var useMediaBuffering = ({ element, shouldBuffer, isPremounting, isPostmounting, logLevel, mountTime, src }) => {
			const buffer = useBufferState();
			const [isBuffering, setIsBuffering] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let cleanupFns = [];
				const { current } = element;
				if (!current) return;
				if (!shouldBuffer) return;
				if (isPremounting || isPostmounting) {
					if ((isPremounting || isPostmounting) && current.readyState < current.HAVE_FUTURE_DATA) {
						if (!navigator.userAgent.includes("Firefox/")) {
							playbackLogging({
								logLevel,
								message: `Calling .load() on ${current.src} because readyState is ${current.readyState} and it is not Firefox. Element is premounted ${current.playbackRate}`,
								tag: "load",
								mountTime
							});
							const previousPlaybackRate = current.playbackRate;
							current.load();
							current.playbackRate = previousPlaybackRate;
						}
					}
					return;
				}
				const cleanup = (reason) => {
					let didDoSomething = false;
					cleanupFns.forEach((fn) => {
						fn(reason);
						didDoSomething = true;
					});
					cleanupFns = [];
					setIsBuffering((previous) => {
						if (previous) didDoSomething = true;
						return false;
					});
					if (didDoSomething) playbackLogging({
						logLevel,
						message: `Unmarking as buffering: ${current.src}. Reason: ${reason}`,
						tag: "buffer",
						mountTime
					});
				};
				const blockMedia = (reason) => {
					setIsBuffering(true);
					playbackLogging({
						logLevel,
						message: `Marking as buffering: ${current.src}. Reason: ${reason}`,
						tag: "buffer",
						mountTime
					});
					const { unblock } = buffer.delayPlayback();
					const onCanPlay = () => {
						cleanup("\"canplay\" was fired");
						init();
					};
					const onError = () => {
						cleanup("\"error\" event was occurred");
						init();
					};
					current.addEventListener("canplay", onCanPlay, { once: true });
					cleanupFns.push(() => {
						current.removeEventListener("canplay", onCanPlay);
					});
					current.addEventListener("error", onError, { once: true });
					cleanupFns.push(() => {
						current.removeEventListener("error", onError);
					});
					cleanupFns.push((cleanupReason) => {
						playbackLogging({
							logLevel,
							message: `Unblocking ${current.src} from buffer. Reason: ${cleanupReason}`,
							tag: "buffer",
							mountTime
						});
						unblock();
					});
				};
				const init = () => {
					if (current.readyState < current.HAVE_FUTURE_DATA) {
						blockMedia(`readyState is ${current.readyState}, which is less than HAVE_FUTURE_DATA`);
						if (!navigator.userAgent.includes("Firefox/")) {
							playbackLogging({
								logLevel,
								message: `Calling .load() on ${src} because readyState is ${current.readyState} and it is not Firefox. ${current.playbackRate}`,
								tag: "load",
								mountTime
							});
							const previousPlaybackRate = current.playbackRate;
							current.load();
							current.playbackRate = previousPlaybackRate;
						}
					} else {
						const onWaiting = () => {
							blockMedia("\"waiting\" event was fired");
						};
						current.addEventListener("waiting", onWaiting);
						cleanupFns.push(() => {
							current.removeEventListener("waiting", onWaiting);
						});
					}
				};
				init();
				return () => {
					cleanup("element was unmounted or prop changed");
				};
			}, [
				buffer,
				src,
				element,
				isPremounting,
				isPostmounting,
				logLevel,
				shouldBuffer,
				mountTime
			]);
			return isBuffering;
		};
		var useRequestVideoCallbackTime = ({ mediaRef, mediaType, lastSeek, onVariableFpsVideoDetected }) => {
			const currentTime = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const { current } = mediaRef;
				if (current) currentTime.current = {
					time: current.currentTime,
					lastUpdate: performance.now()
				};
				else {
					currentTime.current = null;
					return;
				}
				if (mediaType !== "video") {
					currentTime.current = null;
					return;
				}
				const videoTag = current;
				if (!videoTag.requestVideoFrameCallback) return;
				let cancel = () => {};
				const request = () => {
					if (!videoTag) return;
					const cb = videoTag.requestVideoFrameCallback((_, info2) => {
						if (currentTime.current !== null) {
							const difference = Math.abs(currentTime.current.time - info2.mediaTime);
							const differenceToLastSeek = Math.abs(lastSeek.current === null ? Infinity : info2.mediaTime - lastSeek.current);
							if (difference > .5 && differenceToLastSeek > .5 && info2.mediaTime > currentTime.current.time) onVariableFpsVideoDetected();
						}
						currentTime.current = {
							time: info2.mediaTime,
							lastUpdate: performance.now()
						};
						request();
					});
					cancel = () => {
						videoTag.cancelVideoFrameCallback(cb);
						cancel = () => {};
					};
				};
				request();
				return () => {
					cancel();
				};
			}, [
				lastSeek,
				mediaRef,
				mediaType,
				onVariableFpsVideoDetected
			]);
			return currentTime;
		};
		var getExpectedMediaFrameUncorrected$1 = ({ frame, playbackRate, startFrom }) => {
			return interpolate$1(frame, [
				-1,
				startFrom,
				startFrom + 1
			], [
				-1,
				startFrom,
				startFrom + playbackRate
			]);
		};
		var getMediaTime = ({ fps, frame, playbackRate, startFrom }) => {
			return getExpectedMediaFrameUncorrected$1({
				frame,
				playbackRate,
				startFrom
			}) * (1e3 / fps) / 1e3;
		};
		var alreadyWarned = {};
		var warnAboutNonSeekableMedia = (ref, type) => {
			if (ref === null) return;
			if (ref.seekable.length === 0) return;
			if (ref.seekable.length > 1) return;
			if (alreadyWarned[ref.src]) return;
			const range = {
				start: ref.seekable.start(0),
				end: ref.seekable.end(0)
			};
			if (range.start === 0 && range.end === 0) {
				const msg = [
					`The media ${ref.src} cannot be seeked. This could be one of few reasons:`,
					"1) The media resource was replaced while the video is playing but it was not loaded yet.",
					"2) The media does not support seeking.",
					"3) The media was loaded with security headers prventing it from being included.",
					"Please see https://remotion.dev/docs/non-seekable-media for assistance."
				].join(`
`);
				if (type === "console-error") console.error(msg);
				else if (type === "console-warning") console.warn(`The media ${ref.src} does not support seeking. The video will render fine, but may not play correctly in the Remotion Studio and in the <Player>. See https://remotion.dev/docs/non-seekable-media for an explanation.`);
				else throw new Error(msg);
				alreadyWarned[ref.src] = true;
			}
		};
		var DEFAULT_ACCEPTABLE_TIMESHIFT_WITH_AMPLIFICATION = .65;
		var getPauseReason = ({ reason, isPremounting, isPostmounting }) => {
			if (reason === "buffering") return "player is buffering but media tag is not";
			if (isPremounting) return "media is premounting";
			if (isPostmounting) return "media is postmounting";
			return "Player is not playing";
		};
		var useMediaPlayback = ({ mediaRef, src, mediaType, playbackRate: localPlaybackRate, preservePitch = true, onlyWarnForMediaSeekingError, acceptableTimeshift, pauseWhenBuffering, isPremounting, isPostmounting, onAutoPlayError }) => {
			const { playbackRate: globalPlaybackRate } = usePlaybackRate();
			const frame = useCurrentFrame();
			const absoluteFrame = useTimelinePosition();
			const playing = usePlaying();
			const playerBuffering = useBuffering();
			const { fps } = useVideoConfig();
			const mediaStartsAt = useMediaStartsAt();
			const lastSeekDueToShift = (0, react.useRef)(null);
			const lastSeek = (0, react.useRef)(null);
			const logLevel = useLogLevel();
			const mountTime = useMountTime();
			const isVariableFpsVideoMap = (0, react.useRef)({});
			const onVariableFpsVideoDetected = (0, react.useCallback)(() => {
				if (!src) return;
				if (isVariableFpsVideoMap.current[src]) return;
				Log.verbose({
					logLevel,
					tag: null
				}, `Detected ${src} as a variable FPS video. Disabling buffering while seeking.`);
				isVariableFpsVideoMap.current[src] = true;
			}, [logLevel, src]);
			const rvcCurrentTime = useRequestVideoCallbackTime({
				mediaRef,
				mediaType,
				lastSeek,
				onVariableFpsVideoDetected
			});
			const mediaTagCurrentTime = useCurrentTimeOfMediaTagWithUpdateTimeStamp(mediaRef);
			const desiredUnclampedTime = getMediaTime({
				frame,
				playbackRate: localPlaybackRate,
				startFrom: -mediaStartsAt,
				fps
			});
			const isMediaTagBuffering = useMediaBuffering({
				element: mediaRef,
				shouldBuffer: pauseWhenBuffering,
				isPremounting,
				isPostmounting,
				logLevel,
				mountTime,
				src: src ?? null
			});
			const { bufferUntilFirstFrame, isBuffering } = useBufferUntilFirstFrame({
				mediaRef,
				mediaType,
				onVariableFpsVideoDetected,
				pauseWhenBuffering,
				logLevel,
				mountTime
			});
			const playbackRate = localPlaybackRate * globalPlaybackRate;
			const acceptableTimeShiftButLessThanDuration = (() => {
				if (mediaRef.current?.duration) return Math.min(mediaRef.current.duration, acceptableTimeshift ?? DEFAULT_ACCEPTABLE_TIMESHIFT_WITH_AMPLIFICATION);
				return acceptableTimeshift ?? DEFAULT_ACCEPTABLE_TIMESHIFT_WITH_AMPLIFICATION;
			})();
			const env = useRemotionEnvironment();
			(0, react.useLayoutEffect)(() => {
				const playbackRateToSet = Math.max(0, playbackRate);
				if (mediaRef.current && mediaRef.current.defaultPlaybackRate !== playbackRateToSet) mediaRef.current.defaultPlaybackRate = playbackRateToSet;
				if (mediaRef.current && mediaRef.current.playbackRate !== playbackRateToSet) mediaRef.current.playbackRate = playbackRateToSet;
				if (mediaRef.current && mediaRef.current.preservesPitch !== preservePitch) mediaRef.current.preservesPitch = preservePitch;
			}, [
				mediaRef,
				playbackRate,
				preservePitch
			]);
			(0, react.useEffect)(() => {
				const tagName = mediaType === "audio" ? "<Html5Audio>" : "<Html5Video>";
				if (!mediaRef.current) throw new Error(`No ${mediaType} ref found`);
				if (!src) throw new Error(`No 'src' attribute was passed to the ${tagName} element.`);
				const { current } = mediaRef;
				const isMediaTagBufferingOrStalled = isMediaTagBuffering || isBuffering();
				let pauseReason = null;
				if (!playing) pauseReason = "not-playing";
				else if (playerBuffering && !isMediaTagBufferingOrStalled) pauseReason = "buffering";
				if (!current.paused && pauseReason !== null) {
					playbackLogging({
						logLevel,
						tag: "pause",
						message: `Pausing ${current.src} because ${getPauseReason({
							reason: pauseReason,
							isPremounting,
							isPostmounting
						})}`,
						mountTime
					});
					current.pause();
				}
				const action = getMediaSyncAction({
					duration: current.duration,
					currentTime: current.currentTime,
					paused: current.paused,
					ended: current.ended,
					desiredUnclampedTime,
					mediaTagTime: mediaTagCurrentTime.current.time,
					mediaTagLastUpdate: mediaTagCurrentTime.current.lastUpdate,
					rvcTime: rvcCurrentTime.current?.time ?? null,
					rvcLastUpdate: rvcCurrentTime.current?.lastUpdate ?? null,
					isVariableFpsVideo: Boolean(isVariableFpsVideoMap.current[src]),
					acceptableTimeShift: acceptableTimeShiftButLessThanDuration,
					lastSeekDueToShift: lastSeekDueToShift.current,
					playing,
					playbackRate,
					mediaTagBufferingOrStalled: isMediaTagBufferingOrStalled,
					playerBuffering,
					absoluteFrame,
					onlyWarnForMediaSeekingError,
					isPremounting,
					isPostmounting,
					pauseWhenBuffering
				});
				if (action.type === "none") return;
				if (action.type === "seek-due-to-shift") {
					lastSeek.current = seek({
						mediaRef: current,
						time: action.shouldBeTime,
						logLevel,
						why: action.why,
						mountTime
					});
					lastSeekDueToShift.current = lastSeek.current;
					if (action.bufferUntilFirstFrame) bufferUntilFirstFrame(action.shouldBeTime);
					if (action.playReason !== null) playAndHandleNotAllowedError({
						mediaRef,
						mediaType,
						onAutoPlayError,
						logLevel,
						mountTime,
						reason: action.playReason,
						isPlayer: env.isPlayer
					});
					if (action.warnAboutNonSeekable) warnAboutNonSeekableMedia(current, "console-error");
					return;
				}
				if (action.type === "seek-if-not-playing") {
					if (action.why !== null) lastSeek.current = seek({
						mediaRef: current,
						time: action.shouldBeTime,
						logLevel,
						why: action.why,
						mountTime
					});
					return;
				}
				if (action.why !== null) lastSeek.current = seek({
					mediaRef: current,
					time: action.shouldBeTime,
					logLevel,
					why: action.why,
					mountTime
				});
				playAndHandleNotAllowedError({
					mediaRef,
					mediaType,
					onAutoPlayError,
					logLevel,
					mountTime,
					reason: action.playReason,
					isPlayer: env.isPlayer
				});
				if (action.bufferUntilFirstFrame) bufferUntilFirstFrame(action.shouldBeTime);
			}, [
				absoluteFrame,
				acceptableTimeShiftButLessThanDuration,
				bufferUntilFirstFrame,
				rvcCurrentTime,
				logLevel,
				desiredUnclampedTime,
				isBuffering,
				isMediaTagBuffering,
				mediaRef,
				mediaType,
				onlyWarnForMediaSeekingError,
				playbackRate,
				playerBuffering,
				playing,
				src,
				onAutoPlayError,
				isPremounting,
				isPostmounting,
				pauseWhenBuffering,
				mountTime,
				mediaTagCurrentTime,
				env.isPlayer
			]);
		};
		var useMediaTag = ({ mediaRef, id, mediaType, onAutoPlayError, isPremounting, isPostmounting }) => {
			const { audioAndVideoTags, isPlaying } = useTimelineContext();
			const { subscribePlaying } = (0, react.useContext)(SetTimelineContext);
			const isPlayingRef = (0, react.useRef)(isPlaying);
			isPlayingRef.current = isPlaying;
			const logLevel = useLogLevel();
			const mountTime = useMountTime();
			const env = useRemotionEnvironment();
			(0, react.useEffect)(() => {
				const tag = {
					id,
					play: (reason) => {
						if (!isPlayingRef.current()) return;
						if (isPremounting || isPostmounting) return;
						return playAndHandleNotAllowedError({
							mediaRef,
							mediaType,
							onAutoPlayError,
							logLevel,
							mountTime,
							reason,
							isPlayer: env.isPlayer
						});
					}
				};
				audioAndVideoTags.current.push(tag);
				const unsubscribe = subscribePlaying((state) => {
					if (state.playing) return;
					const media = mediaRef.current;
					if (!media || media.paused) return;
					playbackLogging({
						logLevel,
						tag: "pause",
						message: `Pausing ${media.src} because Player is not playing`,
						mountTime
					});
					media.pause();
				});
				return () => {
					unsubscribe();
					audioAndVideoTags.current = audioAndVideoTags.current.filter((a2) => a2.id !== id);
				};
			}, [
				audioAndVideoTags,
				id,
				mediaRef,
				mediaType,
				onAutoPlayError,
				isPremounting,
				isPostmounting,
				logLevel,
				mountTime,
				env.isPlayer,
				subscribePlaying
			]);
		};
		var MediaVolumeContext = (0, react.createContext)({
			playerMuted: false,
			mediaVolume: 1
		});
		var SetMediaVolumeContext = (0, react.createContext)({
			setPlayerMuted: () => {
				throw new Error("default");
			},
			setMediaVolume: () => {
				throw new Error("default");
			}
		});
		var useMediaVolumeState = () => {
			const { mediaVolume } = (0, react.useContext)(MediaVolumeContext);
			const { setMediaVolume } = (0, react.useContext)(SetMediaVolumeContext);
			return (0, react.useMemo)(() => {
				return [mediaVolume, setMediaVolume];
			}, [mediaVolume, setMediaVolume]);
		};
		var usePlayerMutedState = () => {
			const { playerMuted } = (0, react.useContext)(MediaVolumeContext);
			const { setPlayerMuted } = (0, react.useContext)(SetMediaVolumeContext);
			return (0, react.useMemo)(() => {
				return [playerMuted, setPlayerMuted];
			}, [playerMuted, setPlayerMuted]);
		};
		var warnAboutTooHighVolume = (volume) => {
			if (volume >= 100) throw new Error(`Volume was set to ${volume}, but regular volume is 1, not 100. Did you forget to divide by 100? Set a volume of less than 100 to dismiss this error.`);
		};
		var resolveMediaAudioState = ({ muted, playerMuted, volume, isInsideFreeze, audioEnabled }) => {
			const isMutedForTimeline = muted || isInsideFreeze;
			const isMutedForPlayback = isMutedForTimeline || playerMuted || volume !== null && volume <= 0;
			return {
				isMutedForTimeline,
				isMutedForPlayback,
				shouldUseAudio: audioEnabled && !isMutedForPlayback
			};
		};
		var useMediaAudioState = ({ muted, volume, audioEnabled }) => {
			const [playerMuted] = usePlayerMutedState();
			return resolveMediaAudioState({
				muted,
				playerMuted,
				volume,
				isInsideFreeze: useIsInsideFreeze(),
				audioEnabled
			});
		};
		var AudioForDevelopmentForwardRefFunction = (props, ref) => {
			const [initialShouldPreMountAudioElements] = (0, react.useState)(props.shouldPreMountAudioTags);
			if (props.shouldPreMountAudioTags !== initialShouldPreMountAudioElements) throw new Error("Cannot change the behavior for pre-mounting audio tags dynamically.");
			const logLevel = useLogLevel();
			const { volume, muted, playbackRate, preservePitch, shouldPreMountAudioTags, src, onDuration, acceptableTimeShiftInSeconds, _remotionInternalNeedsDurationCalculation, _remotionInternalNativeLoopPassed, _remotionInternalStack, allowAmplificationDuringRender, name, pauseWhenBuffering, showInTimeline, loopVolumeCurveBehavior, crossOrigin, delayRenderRetries, delayRenderTimeoutInMilliseconds, toneFrequency, useWebAudioApi, onError, onNativeError, audioStreamIndex, ...nativeProps } = props;
			const [mediaVolume] = useMediaVolumeState();
			const volumePropFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
			if (!src) throw new TypeError("No 'src' was passed to <Html5Audio>.");
			const preloadedSrc = usePreload(src);
			const sequenceContext = (0, react.useContext)(SequenceContext);
			const { isStudio } = useRemotionEnvironment();
			const [timelineId] = (0, react.useState)(() => String(Math.random()));
			const userPreferredVolume = evaluateVolume({
				frame: volumePropFrame,
				volume,
				mediaVolume
			});
			const { isMutedForTimeline, isMutedForPlayback } = useMediaAudioState({
				muted: muted ?? false,
				volume: userPreferredVolume,
				audioEnabled: true
			});
			warnAboutTooHighVolume(userPreferredVolume);
			const crossOriginValue = getCrossOriginValue({
				crossOrigin,
				requestsVideoFrame: false,
				isClientSideRendering: false
			});
			const propsToPass = (0, react.useMemo)(() => {
				return {
					muted: isMutedForPlayback,
					src: preloadedSrc,
					loop: _remotionInternalNativeLoopPassed,
					crossOrigin: crossOriginValue,
					...nativeProps
				};
			}, [
				_remotionInternalNativeLoopPassed,
				isMutedForPlayback,
				nativeProps,
				preloadedSrc,
				crossOriginValue
			]);
			const { el: audioRef, mediaElementSourceNode, cleanupOnMediaTagUnmount } = useSharedAudio({
				aud: propsToPass,
				audioId: (0, react.useMemo)(() => `audio-${random(src ?? "")}-${sequenceContext?.relativeFrom}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.durationInFrames}-muted:${props.muted}-loop:${props.loop}`, [
					src,
					sequenceContext?.relativeFrom,
					sequenceContext?.cumulatedFrom,
					sequenceContext?.durationInFrames,
					props.muted,
					props.loop
				]),
				premounting: Boolean(sequenceContext?.premounting),
				postmounting: Boolean(sequenceContext?.postmounting)
			});
			const getStack = (0, react.useCallback)(() => {
				return _remotionInternalStack ?? null;
			}, [_remotionInternalStack]);
			useMediaInTimeline({
				volume,
				mediaVolume,
				src,
				mediaType: "audio",
				playbackRate: playbackRate ?? 1,
				displayName: name ?? null,
				id: timelineId,
				getStack,
				showInTimeline,
				premountDisplay: sequenceContext?.premountDisplay ?? null,
				postmountDisplay: sequenceContext?.postmountDisplay ?? null,
				loopDisplay: void 0,
				documentationLink: "https://www.remotion.dev/docs/html5-audio",
				refForOutline: null,
				muted: isMutedForTimeline
			});
			useMediaPlayback({
				mediaRef: audioRef,
				src,
				mediaType: "audio",
				playbackRate: playbackRate ?? 1,
				preservePitch,
				onlyWarnForMediaSeekingError: false,
				acceptableTimeshift: acceptableTimeShiftInSeconds ?? null,
				isPremounting: Boolean(sequenceContext?.premounting),
				isPostmounting: Boolean(sequenceContext?.postmounting),
				pauseWhenBuffering,
				onAutoPlayError: null
			});
			useMediaTag({
				id: timelineId,
				isPostmounting: Boolean(sequenceContext?.postmounting),
				isPremounting: Boolean(sequenceContext?.premounting),
				mediaRef: audioRef,
				mediaType: "audio",
				onAutoPlayError: null
			});
			useVolume({
				logLevel,
				mediaRef: audioRef,
				source: mediaElementSourceNode,
				volume: userPreferredVolume,
				shouldUseWebAudioApi: useWebAudioApi ?? false
			});
			(react.default.useInsertionEffect ?? react.default.useLayoutEffect)(() => {
				return () => {
					requestAnimationFrame(() => {
						cleanupOnMediaTagUnmount();
					});
				};
			}, [cleanupOnMediaTagUnmount]);
			(0, react.useImperativeHandle)(ref, () => {
				return audioRef.current;
			}, [audioRef]);
			const currentOnDurationCallback = (0, react.useRef)(onDuration);
			currentOnDurationCallback.current = onDuration;
			(0, react.useEffect)(() => {
				const { current } = audioRef;
				if (!current) return;
				if (current.duration) {
					currentOnDurationCallback.current?.(current.src, current.duration);
					return;
				}
				const onLoadedMetadata = () => {
					currentOnDurationCallback.current?.(current.src, current.duration);
				};
				current.addEventListener("loadedmetadata", onLoadedMetadata);
				return () => {
					current.removeEventListener("loadedmetadata", onLoadedMetadata);
				};
			}, [audioRef, src]);
			if (initialShouldPreMountAudioElements) return isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceOrderMarker, {
				sequenceId: timelineId,
				children: null
			}) : null;
			const audio = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				preload: "metadata",
				crossOrigin: crossOriginValue,
				...propsToPass
			});
			return isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceOrderMarker, {
				sequenceId: timelineId,
				children: audio
			}) : audio;
		};
		var AudioForPreview = (0, react.forwardRef)(AudioForDevelopmentForwardRefFunction);
		var MediaEnabledContext = (0, react.createContext)(null);
		var useVideoEnabled = () => {
			const context = (0, react.useContext)(MediaEnabledContext);
			if (!context) return window.remotion_videoEnabled;
			if (context.videoEnabled === null) return window.remotion_videoEnabled;
			return context.videoEnabled;
		};
		var useAudioEnabled = () => {
			const context = (0, react.useContext)(MediaEnabledContext);
			if (!context) return window.remotion_audioEnabled;
			if (context.audioEnabled === null) return window.remotion_audioEnabled;
			return context.audioEnabled;
		};
		var MediaEnabledProvider = ({ children, videoEnabled, audioEnabled }) => {
			const value = (0, react.useMemo)(() => ({
				videoEnabled,
				audioEnabled
			}), [videoEnabled, audioEnabled]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaEnabledContext.Provider, {
				value,
				children
			});
		};
		var AudioForRenderingRefForwardingFunction = (props, ref) => {
			const audioRef = (0, react.useRef)(null);
			const { volume: volumeProp, playbackRate, allowAmplificationDuringRender, onDuration, toneFrequency, _remotionInternalNeedsDurationCalculation, _remotionInternalNativeLoopPassed, acceptableTimeShiftInSeconds, name, onNativeError, delayRenderRetries, delayRenderTimeoutInMilliseconds, loopVolumeCurveBehavior, pauseWhenBuffering, audioStreamIndex, preservePitch: _preservePitch, ...nativeProps } = props;
			const absoluteFrame = useTimelinePosition();
			const volumePropFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
			const frame = useCurrentFrame();
			const sequenceContext = (0, react.useContext)(SequenceContext);
			const { registerRenderAsset, unregisterRenderAsset } = (0, react.useContext)(RenderAssetManager);
			const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
			const id = (0, react.useMemo)(() => `audio-${random(props.src ?? "")}-${sequenceContext?.relativeFrom}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.durationInFrames}`, [
				props.src,
				sequenceContext?.relativeFrom,
				sequenceContext?.cumulatedFrom,
				sequenceContext?.durationInFrames
			]);
			const volume = evaluateVolume({
				volume: volumeProp,
				frame: volumePropFrame,
				mediaVolume: 1
			});
			warnAboutTooHighVolume(volume);
			const audioEnabled = useAudioEnabled();
			const { shouldUseAudio } = useMediaAudioState({
				muted: props.muted ?? false,
				volume,
				audioEnabled
			});
			(0, react.useImperativeHandle)(ref, () => {
				return audioRef.current;
			}, []);
			(0, react.useEffect)(() => {
				if (!props.src) throw new Error("No src passed");
				if (!shouldUseAudio) return;
				registerRenderAsset({
					type: "audio",
					src: getAbsoluteSrc$1(props.src),
					id,
					frame: absoluteFrame,
					volume,
					mediaFrame: frame,
					playbackRate: props.playbackRate ?? 1,
					toneFrequency: toneFrequency ?? 1,
					audioStartFrame: Math.max(0, -(sequenceContext?.cumulatedNegativeFrom ?? 0)),
					audioStreamIndex: audioStreamIndex ?? 0
				});
				return () => unregisterRenderAsset(id);
			}, [
				shouldUseAudio,
				props.src,
				registerRenderAsset,
				absoluteFrame,
				id,
				unregisterRenderAsset,
				volume,
				volumePropFrame,
				frame,
				playbackRate,
				props.playbackRate,
				toneFrequency,
				sequenceContext?.cumulatedNegativeFrom,
				audioStreamIndex
			]);
			const { src } = props;
			const needsToRenderAudioTag = ref || _remotionInternalNeedsDurationCalculation;
			(0, react.useLayoutEffect)(() => {
				if (window.process?.env?.NODE_ENV === "test") return;
				if (!needsToRenderAudioTag) return;
				const newHandle = delayRender2("Loading <Html5Audio> duration with src=" + src, {
					retries: delayRenderRetries ?? void 0,
					timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
				});
				const { current } = audioRef;
				const didLoad = () => {
					if (current?.duration) onDuration(current.src, current.duration);
					continueRender2(newHandle);
				};
				if (current?.duration) {
					onDuration(current.src, current.duration);
					continueRender2(newHandle);
				} else current?.addEventListener("loadedmetadata", didLoad, { once: true });
				return () => {
					current?.removeEventListener("loadedmetadata", didLoad);
					continueRender2(newHandle);
				};
			}, [
				src,
				onDuration,
				needsToRenderAudioTag,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				continueRender2,
				delayRender2
			]);
			if (!needsToRenderAudioTag) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				...nativeProps,
				onError: onNativeError
			});
		};
		var AudioForRendering = (0, react.forwardRef)(AudioForRenderingRefForwardingFunction);
		var AudioRefForwardingFunction = (props, ref) => {
			const audioTagsContext = (0, react.useContext)(SharedAudioTagsContext);
			const propsWithFreeze = props;
			const { startFrom, endAt, trimBefore, trimAfter, name, _remotionInternalStack, pauseWhenBuffering, showInTimeline, onError: onRemotionError, freeze, ...otherProps } = propsWithFreeze;
			const { loop, freeze: _freeze, ...propsOtherThanLoop } = propsWithFreeze;
			const { fps } = useVideoConfig();
			const environment = useRemotionEnvironment();
			const shouldPauseWhenBuffering = resolveV5Default(pauseWhenBuffering);
			if (environment.isClientSideRendering) throw new Error("<Html5Audio> is not supported in @remotion/web-renderer. Use <Audio> from @remotion/media instead. See https://remotion.dev/docs/client-side-rendering/limitations");
			if (typeof freeze !== "undefined") throw new TypeError("The \"freeze\" prop is not supported on <Html5Audio />. Use <Sequence freeze={...}> to freeze media playback.");
			const { durations, setDurations } = (0, react.useContext)(DurationsContext);
			if (typeof props.src !== "string") throw new TypeError(`The \`<Html5Audio>\` tag requires a string for \`src\`, but got ${JSON.stringify(props.src)} instead.`);
			const preloadedSrc = usePreload(props.src);
			const onError = (0, react.useCallback)((e) => {
				console.log(e.currentTarget.error);
				const errMessage = `Could not play audio with src ${preloadedSrc}: ${e.currentTarget.error}. See https://remotion.dev/docs/media-playback-error for help.`;
				if (loop) {
					if (onRemotionError) {
						onRemotionError(new Error(errMessage));
						return;
					}
					cancelRender(new Error(errMessage));
				} else {
					onRemotionError?.(new Error(errMessage));
					console.warn(errMessage);
				}
			}, [
				loop,
				onRemotionError,
				preloadedSrc
			]);
			const onDuration = (0, react.useCallback)((src, durationInSeconds) => {
				setDurations({
					type: "got-duration",
					durationInSeconds,
					src
				});
			}, [setDurations]);
			const durationFetched = durations[getAbsoluteSrc$1(preloadedSrc)] ?? durations[getAbsoluteSrc$1(props.src)];
			validateMediaTrimProps({
				startFrom,
				endAt,
				trimBefore,
				trimAfter
			});
			const { trimBeforeValue, trimAfterValue } = resolveTrimProps({
				startFrom,
				endAt,
				trimBefore,
				trimAfter
			});
			if (loop && durationFetched !== void 0) {
				if (!Number.isFinite(durationFetched)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Html5Audio, {
					...propsOtherThanLoop,
					ref,
					_remotionInternalNativeLoopPassed: true
				});
				const duration = durationFetched * fps;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Loop, {
					layout: "none",
					durationInFrames: calculateMediaDuration({
						trimAfter: trimAfterValue,
						mediaDurationInFrames: duration,
						playbackRate: props.playbackRate ?? 1,
						trimBefore: trimBeforeValue
					}),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Html5Audio, {
						...propsOtherThanLoop,
						ref,
						_remotionInternalNativeLoopPassed: true
					})
				});
			}
			if (typeof trimBeforeValue !== "undefined" || typeof trimAfterValue !== "undefined") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				layout: "none",
				from: 0 - (trimBeforeValue ?? 0),
				showInTimeline: false,
				durationInFrames: trimAfterValue,
				name,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Html5Audio, {
					_remotionInternalNeedsDurationCalculation: Boolean(loop),
					pauseWhenBuffering: shouldPauseWhenBuffering,
					...otherProps,
					ref
				})
			});
			validateMediaProps({
				playbackRate: props.playbackRate,
				preservePitch: props.preservePitch,
				volume: props.volume
			}, "Html5Audio");
			if (environment.isRendering) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AudioForRendering, {
				onDuration,
				...props,
				ref,
				onNativeError: onError,
				_remotionInternalNeedsDurationCalculation: Boolean(loop)
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AudioForPreview, {
				_remotionInternalNativeLoopPassed: props._remotionInternalNativeLoopPassed ?? false,
				_remotionInternalStack: _remotionInternalStack ?? null,
				shouldPreMountAudioTags: audioTagsContext !== null && audioTagsContext.numberOfAudioTags > 0,
				...props,
				ref,
				onNativeError: onError,
				onDuration,
				pauseWhenBuffering: shouldPauseWhenBuffering,
				_remotionInternalNeedsDurationCalculation: Boolean(loop),
				showInTimeline: showInTimeline ?? true
			});
		};
		var Html5Audio = (0, react.forwardRef)(AudioRefForwardingFunction);
		addSequenceStackTraces(Html5Audio);
		var Audio = Html5Audio;
		var resolveSolidPixelDensity = (pixelDensity) => {
			if (pixelDensity === void 0) return 1;
			if (typeof pixelDensity !== "number" || !Number.isFinite(pixelDensity) || pixelDensity <= 0) throw new Error(`<Solid>: \`pixelDensity\` must be a positive finite number. Received: ${String(pixelDensity)}.`);
			return pixelDensity;
		};
		var solidSchema = {
			...baseSchema,
			color: {
				type: "color",
				default: "transparent",
				description: "Color"
			},
			width: {
				type: "number",
				min: 1,
				step: 1,
				default: 1920,
				description: "Width",
				hiddenFromList: false
			},
			height: {
				type: "number",
				min: 1,
				step: 1,
				default: 1080,
				description: "Height",
				hiddenFromList: false
			},
			pixelDensity: {
				type: "number",
				min: 1,
				max: 3,
				step: .1,
				default: 1,
				description: "Pixel density",
				hiddenFromList: false
			},
			...transformSchema$1,
			...backgroundSchema$1,
			...borderSchema$1,
			...borderRadiusSchema$1,
			...cropSchema
		};
		var SolidInner = ({ color, width, height, effects = [], className, style, pixelDensity, overrideId, reference }) => {
			const { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
			const resolvedPixelDensity = resolveSolidPixelDensity(pixelDensity);
			const canvasWidth = Math.ceil(width * resolvedPixelDensity);
			const canvasHeight = Math.ceil(height * resolvedPixelDensity);
			const [outputCanvas, setOutputCanvas] = (0, react.useState)(null);
			const memoizedEffects = useMemoizedEffects({
				effects,
				overrideId: overrideId ?? null
			});
			const sourceCanvas = (0, react.useMemo)(() => {
				if (typeof document === "undefined") return null;
				const canvas = document.createElement("canvas");
				canvas.width = 1;
				canvas.height = 1;
				return canvas;
			}, []);
			const chainState = useEffectChainState();
			const canvasRef = (0, react.useCallback)((canvas) => {
				setOutputCanvas(canvas);
				if (typeof reference === "function") reference(canvas);
				else if (reference) reference.current = canvas;
			}, [reference]);
			(0, react.useEffect)(() => {
				if (!outputCanvas || !sourceCanvas) return;
				const handle = delayRender2("Solid effect chain");
				if (!chainState) {
					continueRender2(handle);
					return () => {
						continueRender2(handle);
					};
				}
				const ctx = sourceCanvas.getContext("2d", { colorSpace: "srgb" });
				if (!ctx) {
					cancelRender2(/* @__PURE__ */ new Error("Failed to acquire 2D context for <Solid> source"));
					return;
				}
				ctx.clearRect(0, 0, 1, 1);
				if (color !== void 0) {
					ctx.fillStyle = color;
					ctx.fillRect(0, 0, 1, 1);
				}
				runEffectChain({
					state: chainState.get(canvasWidth, canvasHeight),
					source: sourceCanvas,
					effects: memoizedEffects,
					output: outputCanvas,
					width: canvasWidth,
					height: canvasHeight
				}).then((completed) => {
					if (completed) continueRender2(handle);
				}).catch((err) => {
					cancelRender2(err);
				});
				return () => {
					continueRender2(handle);
				};
			}, [
				color,
				outputCanvas,
				sourceCanvas,
				chainState,
				canvasWidth,
				canvasHeight,
				delayRender2,
				continueRender2,
				cancelRender2,
				memoizedEffects
			]);
			const canvasStyle = (0, react.useMemo)(() => {
				return {
					width,
					height,
					...style ?? {}
				};
			}, [
				height,
				style,
				width
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				width: canvasWidth,
				height: canvasHeight,
				className,
				style: canvasStyle
			});
		};
		var Solid = withInteractivitySchema({
			Component: (0, react.forwardRef)(({ effects = [], controls, color, height, width, className, durationInFrames, style, name, from, trimBefore, freeze, hidden, showInTimeline, pixelDensity, cropLeft, cropRight, cropTop, cropBottom, ...props2 }, ref) => {
				const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
				const actualRef = (0, react.useRef)(null);
				(0, react.useImperativeHandle)(ref, () => {
					return actualRef.current;
				}, []);
				const croppedStyle = useCropStyle({
					cropLeft,
					cropRight,
					cropTop,
					cropBottom,
					style: style ?? null,
					componentName: "<Solid />"
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
					layout: "none",
					from,
					trimBefore,
					freeze,
					hidden,
					showInTimeline,
					controls,
					_remotionInternalEffects: memoizedEffectDefinitions,
					durationInFrames,
					name: name ?? "<Solid>",
					outlineRef: actualRef,
					_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/solid",
					...props2,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SolidInner, {
						reference: actualRef,
						overrideId: controls?.overrideId ?? null,
						color,
						height,
						width,
						className,
						style: croppedStyle ?? void 0,
						effects,
						pixelDensity
					})
				});
			}),
			componentName: "<Solid>",
			componentIdentity: "dev.remotion.remotion.Solid",
			schema: solidSchema,
			supportsEffects: true
		});
		Solid.displayName = "Solid";
		addSequenceStackTraces(Solid);
		var transferredOffscreenCanvases = /* @__PURE__ */ new WeakMap();
		var getTransferredOffscreenCanvas = (canvas) => {
			const existing = transferredOffscreenCanvases.get(canvas);
			if (existing) return existing;
			const offscreen = canvas.transferControlToOffscreen();
			transferredOffscreenCanvases.set(canvas, offscreen);
			return offscreen;
		};
		var cachedSupport = null;
		var isHtmlInCanvasSupported = () => {
			if (cachedSupport !== null) return cachedSupport;
			if (typeof document === "undefined") return false;
			const canvas = document.createElement("canvas");
			cachedSupport = typeof canvas.getContext("2d")?.drawElementImage === "function" && typeof canvas.requestPaint === "function" && typeof canvas.captureElementImage === "function" && "transferControlToOffscreen" in HTMLCanvasElement.prototype;
			return cachedSupport;
		};
		var HTML_IN_CANVAS_UNSUPPORTED_MESSAGE = "HTML in Canvas is not supported. Two common causes: Chrome is older than version 148 (update Chrome), or the HTML-in-Canvas flag is disabled at chrome://flags/#canvas-draw-element (enable it and restart Chrome).";
		function assertHtmlInCanvasDimensions(width, height) {
			if (typeof width !== "number" || typeof height !== "number") throw new Error(`HtmlInCanvas: \`width\` and \`height\` must be numbers. Received width=${String(width)}, height=${String(height)}.`);
			if (!Number.isInteger(width) || width <= 0) throw new Error(`HtmlInCanvas: \`width\` must be a positive integer. Received: ${String(width)}.`);
			if (!Number.isInteger(height) || height <= 0) throw new Error(`HtmlInCanvas: \`height\` must be a positive integer. Received: ${String(height)}.`);
		}
		function resolveHtmlInCanvasPixelDensity(pixelDensity) {
			if (pixelDensity === void 0) return 1;
			if (typeof pixelDensity !== "number" || !Number.isFinite(pixelDensity) || pixelDensity <= 0) throw new Error(`HtmlInCanvas: \`pixelDensity\` must be a positive finite number. Received: ${String(pixelDensity)}.`);
			return pixelDensity;
		}
		var isMissingPaintRecordError = (error2) => {
			return error2 instanceof DOMException && error2.name === "InvalidStateError";
		};
		var missingPaintRecordMessage = "HtmlInCanvas: Expected the element to be inside the viewport during rendering, but Chrome had no cached paint record for it.";
		var resizePaintTarget = ({ target, width, height }) => {
			if (target.width !== width) target.width = width;
			if (target.height !== height) target.height = height;
		};
		var defaultOnPaint = ({ canvas, element, elementImage }) => {
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Failed to acquire 2D context for <HtmlInCanvas> canvas");
			ctx.reset();
			const transform = ctx.drawElementImage(elementImage, 0, 0);
			element.style.transform = transform.toString();
		};
		var HtmlInCanvasAncestorContext = (0, react.createContext)(false);
		var HtmlInCanvasContent = (0, react.forwardRef)(({ width, height, effects, children, onPaint, onInit, pixelDensity, controls, style }, ref) => {
			const isInsideAncestorHtmlInCanvas = (0, react.useContext)(HtmlInCanvasAncestorContext);
			assertHtmlInCanvasDimensions(width, height);
			if (isInsideAncestorHtmlInCanvas) throw new Error("<HtmlInCanvas> components cannot be nested. Chrome does not reliably render nested HTML-in-canvas subtrees. Consider merging the effects into one <HtmlInCanvas> if you can.");
			const resolvedPixelDensity = resolveHtmlInCanvasPixelDensity(pixelDensity);
			const canvasWidth = Math.ceil(width * resolvedPixelDensity);
			const canvasHeight = Math.ceil(height * resolvedPixelDensity);
			const { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
			const { isClientSideRendering, isRendering } = useRemotionEnvironment();
			const canRetryMissingPaintRecord = !isRendering || isClientSideRendering;
			const usesDirectLayoutCanvas = onPaint === void 0 && onInit === void 0;
			if (!isHtmlInCanvasSupported()) cancelRender2(new Error(HTML_IN_CANVAS_UNSUPPORTED_MESSAGE));
			const canvas2dRef = (0, react.useRef)(null);
			const paintTargetRef = (0, react.useRef)(null);
			const divRef = (0, react.useRef)(null);
			const canvasSizeKey = `${width}x${height}@${resolvedPixelDensity}-${usesDirectLayoutCanvas ? "direct" : "offscreen"}`;
			const setLayoutCanvasRef = (0, react.useCallback)((node) => {
				canvas2dRef.current = node;
				if (typeof ref === "function") ref(node);
				else if (ref) ref.current = node;
			}, [ref]);
			const chainState = useEffectChainState();
			const memoizedEffects = useMemoizedEffects({
				effects,
				overrideId: controls?.overrideId ?? null
			});
			const effectsRef = (0, react.useRef)(memoizedEffects);
			effectsRef.current = memoizedEffects;
			const onPaintRef = (0, react.useRef)(onPaint);
			onPaintRef.current = onPaint;
			const onInitRef = (0, react.useRef)(onInit);
			onInitRef.current = onInit;
			const initializedRef = (0, react.useRef)(false);
			const onInitCleanupRef = (0, react.useRef)(null);
			const unmountedRef = (0, react.useRef)(false);
			const onPaintCb = (0, react.useCallback)(async () => {
				const element = divRef.current;
				if (!element) throw new Error("Canvas or scene element not found");
				const paintTarget = paintTargetRef.current;
				if (!paintTarget) throw new Error("HtmlInCanvas: paint target is not ready because the canvas is remounting");
				resizePaintTarget({
					target: paintTarget,
					width: canvasWidth,
					height: canvasHeight
				});
				try {
					const placeholderCanvas = canvas2dRef.current;
					if (!placeholderCanvas) throw new Error("Canvas not found");
					const handle = delayRender2("onPaint");
					if (!initializedRef.current) {
						const currentOnInit = onInitRef.current;
						if (!currentOnInit) initializedRef.current = true;
						else {
							let initImage;
							try {
								initImage = placeholderCanvas.captureElementImage(element);
							} catch (error2) {
								if (isMissingPaintRecordError(error2) && canRetryMissingPaintRecord) {
									continueRender2(handle);
									return;
								}
								if (isMissingPaintRecordError(error2)) throw new Error(missingPaintRecordMessage);
								throw error2;
							}
							initializedRef.current = true;
							try {
								if (paintTarget instanceof HTMLCanvasElement) throw new Error("HtmlInCanvas: onInit requires an OffscreenCanvas paint target");
								const cleanup = await currentOnInit({
									canvas: paintTarget,
									element,
									elementImage: initImage,
									pixelDensity: resolvedPixelDensity
								});
								if (typeof cleanup !== "function") throw new Error("HtmlInCanvas: when `onInit` is provided, it must return a cleanup function, or a Promise that resolves to one.");
								if (unmountedRef.current) cleanup();
								else onInitCleanupRef.current = cleanup;
							} finally {
								initImage.close();
							}
						}
					}
					let elImage;
					try {
						elImage = placeholderCanvas.captureElementImage(element);
					} catch (error2) {
						if (isMissingPaintRecordError(error2) && canRetryMissingPaintRecord) {
							continueRender2(handle);
							return;
						}
						if (isMissingPaintRecordError(error2)) throw new Error(missingPaintRecordMessage);
						throw error2;
					}
					try {
						const currentOnPaint = onPaintRef.current;
						if (currentOnPaint) {
							if (paintTarget instanceof HTMLCanvasElement) throw new Error("HtmlInCanvas: onPaint requires an OffscreenCanvas paint target");
							const paintResult = currentOnPaint({
								canvas: paintTarget,
								element,
								elementImage: elImage,
								pixelDensity: resolvedPixelDensity
							});
							if (paintResult) await paintResult;
						} else defaultOnPaint({
							canvas: paintTarget,
							element,
							elementImage: elImage,
							pixelDensity: resolvedPixelDensity
						});
						await runEffectChain({
							state: chainState.get(canvasWidth, canvasHeight),
							source: paintTarget,
							effects: effectsRef.current,
							output: paintTarget,
							width: canvasWidth,
							height: canvasHeight
						});
					} finally {
						elImage.close();
					}
					continueRender2(handle);
				} catch (error2) {
					cancelRender2(error2);
				}
			}, [
				canvasHeight,
				canvasWidth,
				chainState,
				continueRender2,
				cancelRender2,
				delayRender2,
				resolvedPixelDensity,
				canRetryMissingPaintRecord
			]);
			(0, react.useLayoutEffect)(() => {
				const placeholder = canvas2dRef.current;
				if (!placeholder) throw new Error("Canvas not found");
				placeholder.layoutSubtree = true;
				const paintTarget = usesDirectLayoutCanvas ? placeholder : getTransferredOffscreenCanvas(placeholder);
				paintTargetRef.current = paintTarget;
				resizePaintTarget({
					target: paintTarget,
					width: canvasWidth,
					height: canvasHeight
				});
				initializedRef.current = false;
				unmountedRef.current = false;
				placeholder.addEventListener("paint", onPaintCb);
				return () => {
					placeholder.removeEventListener("paint", onPaintCb);
					paintTargetRef.current = null;
					initializedRef.current = false;
					unmountedRef.current = true;
					onInitCleanupRef.current?.();
					onInitCleanupRef.current = null;
				};
			}, [
				onPaintCb,
				cancelRender2,
				canvasWidth,
				canvasHeight,
				usesDirectLayoutCanvas
			]);
			const onPaintChangedRef = (0, react.useRef)(false);
			(0, react.useLayoutEffect)(() => {
				if (!onPaintChangedRef.current) {
					onPaintChangedRef.current = true;
					return;
				}
				const canvas = canvas2dRef.current;
				if (!canvas) return;
				canvas.requestPaint?.();
			}, [onPaint, memoizedEffects]);
			(0, react.useLayoutEffect)(() => {
				const canvas = canvas2dRef.current;
				if (!canvas) return;
				const handle = delayRender2("waiting for first paint after canvas resize");
				canvas.addEventListener("paint", () => {
					continueRender2(handle);
				}, { once: true });
				return () => {
					continueRender2(handle);
				};
			}, [
				width,
				height,
				continueRender2,
				delayRender2,
				canvasSizeKey
			]);
			const innerStyle = (0, react.useMemo)(() => {
				return {
					width,
					height
				};
			}, [width, height]);
			const canvasStyle = (0, react.useMemo)(() => {
				return {
					width,
					height,
					...style ?? {}
				};
			}, [
				height,
				style,
				width
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HtmlInCanvasAncestorContext.Provider, {
				value: true,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
					ref: setLayoutCanvasRef,
					width: canvasWidth,
					height: canvasHeight,
					style: canvasStyle,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: divRef,
						style: innerStyle,
						children
					})
				}, canvasSizeKey)
			});
		});
		HtmlInCanvasContent.displayName = "HtmlInCanvasContent";
		var HtmlInCanvasInner = (0, react.forwardRef)(({ width, height, effects = [], children, onPaint, onInit, pixelDensity, controls, style, cropLeft, cropRight, cropTop, cropBottom, durationInFrames, name, ...sequenceProps }, ref) => {
			const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
			const actualRef = (0, react.useRef)(null);
			const setCanvasRef = (0, react.useCallback)((node) => {
				actualRef.current = node;
				if (typeof ref === "function") ref(node);
				else if (ref) ref.current = node;
			}, [ref]);
			const croppedStyle = useCropStyle({
				cropLeft,
				cropRight,
				cropTop,
				cropBottom,
				style: style ?? null,
				componentName: "<HtmlInCanvas />"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				durationInFrames,
				name: name ?? "<HtmlInCanvas>",
				_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/remotion/html-in-canvas",
				controls,
				_remotionInternalEffects: memoizedEffectDefinitions,
				outlineRef: actualRef,
				layout: "none",
				...sequenceProps,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HtmlInCanvasContent, {
					ref: setCanvasRef,
					width,
					height,
					effects,
					onPaint,
					onInit,
					pixelDensity,
					controls,
					style: croppedStyle ?? void 0,
					children
				})
			});
		});
		HtmlInCanvasInner.displayName = "HtmlInCanvas";
		var HtmlInCanvasWrapped = withInteractivitySchema({
			Component: HtmlInCanvasInner,
			componentName: "<HtmlInCanvas>",
			componentIdentity: "dev.remotion.remotion.HtmlInCanvas",
			schema: {
				...baseSchema,
				pixelDensity: {
					type: "number",
					min: 1,
					max: 3,
					step: .1,
					default: 1,
					description: "Pixel density",
					hiddenFromList: false
				},
				...transformSchema$1,
				...backgroundSchema$1,
				...borderSchema$1,
				...borderRadiusSchema$1,
				...cropSchema
			},
			supportsEffects: true
		});
		var HtmlInCanvas = Object.assign(HtmlInCanvasWrapped, { isSupported: isHtmlInCanvasSupported });
		HtmlInCanvas.displayName = "HtmlInCanvas";
		addSequenceStackTraces(HtmlInCanvas);
		function truncateSrcForLabel(src) {
			if (typeof src !== "string") return String(src);
			if (src.length > 100 && (src.startsWith("data:") || src.startsWith("blob:"))) return src.slice(0, 60) + "...[" + src.length + " chars total]";
			return src;
		}
		var canvasImageSchema = {
			src: {
				type: "asset",
				assetType: "image",
				default: void 0,
				description: "Source",
				keyframable: false
			},
			...baseSchema,
			...cropSchema,
			...premountSchema,
			fit: {
				type: "enum",
				default: "fill",
				description: "Fit",
				variants: {
					fill: {},
					contain: {},
					cover: {}
				}
			},
			...transformSchema$1,
			...backgroundSchema$1,
			...borderSchema$1,
			...borderRadiusSchema$1
		};
		var makeAbortError = () => {
			if (typeof DOMException !== "undefined") return new DOMException("Image loading was aborted", "AbortError");
			const error2 = /* @__PURE__ */ new Error("Image loading was aborted");
			error2.name = "AbortError";
			return error2;
		};
		var loadImage = ({ src, signal, crossOrigin }) => {
			return new Promise((resolve, reject) => {
				const image = new Image();
				let settled = false;
				function cleanup() {
					image.onload = null;
					image.onerror = null;
				}
				function settle(callback) {
					if (settled) return;
					settled = true;
					cleanup();
					callback();
				}
				function onAbort() {
					settle(() => reject(makeAbortError()));
				}
				image.onload = () => {
					Promise.resolve(image.decode?.()).catch(() => {}).then(() => {
						const imageWidth = image.naturalWidth || image.width;
						const imageHeight = image.naturalHeight || image.height;
						if (imageWidth <= 0 || imageHeight <= 0) {
							settle(() => reject(/* @__PURE__ */ new Error(`Could not determine dimensions for <CanvasImage> with src="${truncateSrcForLabel(src)}"`)));
							return;
						}
						settle(() => resolve({
							element: image,
							width: imageWidth,
							height: imageHeight
						}));
					});
				};
				image.onerror = () => {
					settle(() => reject(/* @__PURE__ */ new Error(`Could not load <CanvasImage> with src="${truncateSrcForLabel(src)}"`)));
				};
				signal.addEventListener("abort", onAbort, { once: true });
				if (signal.aborted) {
					onAbort();
					return;
				}
				image.crossOrigin = crossOrigin ?? "anonymous";
				image.src = src;
			});
		};
		function exponentialBackoff(errorCount) {
			return 1e3 * 2 ** (errorCount - 1);
		}
		var waitForNextFrame = ({ onFrame }) => {
			if (typeof requestAnimationFrame === "undefined") {
				onFrame();
				return () => {};
			}
			const frame = requestAnimationFrame(onFrame);
			return () => cancelAnimationFrame(frame);
		};
		var CanvasImageContent = (0, react.forwardRef)(({ src, crossOrigin, width, height, fit = "fill", effects, controls, onError, className, style, id, pauseWhenLoading, maxRetries = 2, delayRenderRetries, delayRenderTimeoutInMilliseconds, refForOutline, ...canvasProps }, ref) => {
			const { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
			const { delayPlayback } = useBufferState();
			const [outputCanvas, setOutputCanvas] = (0, react.useState)(null);
			const [loadedImage, setLoadedImage] = (0, react.useState)(null);
			const actualSrc = usePreload(src);
			const chainState = useEffectChainState();
			const memoizedEffects = useMemoizedEffects({
				effects,
				overrideId: controls?.overrideId ?? null
			});
			const sequenceContext = (0, react.useContext)(SequenceContext);
			const pendingLoadDelayRef = (0, react.useRef)(null);
			const [isLoadPending, setIsLoadPending] = (0, react.useState)(false);
			const isPremounting = Boolean(sequenceContext?.premounting);
			const isPostmounting = Boolean(sequenceContext?.postmounting);
			const continuePendingLoadDelay = (0, react.useCallback)(({ markAsReady }) => {
				const pending = pendingLoadDelayRef.current;
				if (!pending || pending.continued) return;
				pending.continued = true;
				if (markAsReady) setIsLoadPending(false);
				continueRender2(pending.handle);
				pendingLoadDelayRef.current = null;
			}, [continueRender2]);
			const sourceCanvas = (0, react.useMemo)(() => {
				if (typeof document === "undefined") return null;
				return document.createElement("canvas");
			}, []);
			const canvasRef = (0, react.useCallback)((canvas) => {
				setOutputCanvas(canvas);
				if (refForOutline) refForOutline.current = canvas;
				if (typeof ref === "function") ref(canvas);
				else if (ref) ref.current = canvas;
			}, [ref, refForOutline]);
			(0, react.useLayoutEffect)(() => {
				if (!pauseWhenLoading || !isLoadPending || isPremounting || isPostmounting) return;
				return delayPlayback().unblock;
			}, [
				delayPlayback,
				isLoadPending,
				isPostmounting,
				isPremounting,
				pauseWhenLoading
			]);
			(0, react.useLayoutEffect)(() => {
				const handle = delayRender2(`Rendering <CanvasImage> with src="${truncateSrcForLabel(actualSrc)}"`, {
					retries: delayRenderRetries ?? void 0,
					timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
				});
				const controller = new AbortController();
				let cancelled = false;
				let errorCount = 0;
				let timeoutId = null;
				setLoadedImage(null);
				setIsLoadPending(true);
				pendingLoadDelayRef.current = {
					handle,
					continued: false
				};
				const attemptLoad = () => {
					loadImage({
						src: actualSrc,
						signal: controller.signal,
						crossOrigin
					}).then((image) => {
						if (cancelled) return;
						setLoadedImage(image);
					}).catch((err) => {
						if (err.name === "AbortError") {
							continuePendingLoadDelay({ markAsReady: false });
							return;
						}
						errorCount++;
						if (errorCount <= maxRetries) {
							const backoff = exponentialBackoff(errorCount);
							console.warn(`Could not load <CanvasImage> with src="${truncateSrcForLabel(actualSrc)}", retrying in ${backoff}ms`);
							timeoutId = setTimeout(() => {
								if (!cancelled) attemptLoad();
							}, backoff);
						} else if (onError) {
							onError(err);
							continuePendingLoadDelay({ markAsReady: true });
						} else cancelRender2(err);
					});
				};
				attemptLoad();
				return () => {
					cancelled = true;
					if (timeoutId !== null) clearTimeout(timeoutId);
					controller.abort();
					continuePendingLoadDelay({ markAsReady: false });
				};
			}, [
				actualSrc,
				cancelRender2,
				continuePendingLoadDelay,
				crossOrigin,
				delayRender2,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				maxRetries,
				onError
			]);
			(0, react.useLayoutEffect)(() => {
				if (!loadedImage || !outputCanvas || !sourceCanvas) return;
				const handle = delayRender2(`Applying effects to <CanvasImage> with src="${truncateSrcForLabel(actualSrc)}"`);
				let cancelled = false;
				let continued = false;
				let cancelWaitForNextFrame = () => {};
				const continueRenderOnce = () => {
					if (continued) return;
					continued = true;
					continueRender2(handle);
				};
				const canvasWidth = width ?? loadedImage.width;
				const canvasHeight = height ?? loadedImage.height;
				const sourceContext = sourceCanvas.getContext("2d", { colorSpace: "srgb" });
				if (!sourceContext) {
					cancelRender2(/* @__PURE__ */ new Error("Could not get 2D context for <CanvasImage> source canvas"));
					continueRenderOnce();
					return () => {
						continueRenderOnce();
					};
				}
				sourceCanvas.width = canvasWidth;
				sourceCanvas.height = canvasHeight;
				outputCanvas.width = canvasWidth;
				outputCanvas.height = canvasHeight;
				sourceContext.clearRect(0, 0, canvasWidth, canvasHeight);
				sourceContext.drawImage(loadedImage.element, ...calculateImageFit(fit, {
					width: loadedImage.width,
					height: loadedImage.height
				}, {
					width: canvasWidth,
					height: canvasHeight
				}));
				runEffectChain({
					state: chainState.get(canvasWidth, canvasHeight),
					source: sourceCanvas,
					effects: memoizedEffects,
					output: outputCanvas,
					width: canvasWidth,
					height: canvasHeight
				}).then((completed) => {
					if (completed && !cancelled) cancelWaitForNextFrame = waitForNextFrame({ onFrame: () => {
						if (cancelled) return;
						continueRenderOnce();
						continuePendingLoadDelay({ markAsReady: true });
					} });
				}).catch((err) => {
					if (cancelled) return;
					if (onError) {
						onError(err);
						continueRenderOnce();
						continuePendingLoadDelay({ markAsReady: true });
					} else cancelRender2(err);
				});
				return () => {
					cancelled = true;
					cancelWaitForNextFrame();
					continueRenderOnce();
				};
			}, [
				actualSrc,
				cancelRender2,
				chainState,
				continueRender2,
				continuePendingLoadDelay,
				delayRender2,
				fit,
				height,
				loadedImage,
				memoizedEffects,
				onError,
				outputCanvas,
				sourceCanvas,
				width
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
				...canvasProps,
				ref: canvasRef,
				width,
				height,
				className,
				style,
				id
			});
		});
		CanvasImageContent.displayName = "CanvasImageContent";
		var CanvasImage = withInteractivitySchema({
			Component: (0, react.forwardRef)(({ src, crossOrigin, width, height, fit, effects = [], className, style, id, onError, pauseWhenLoading, maxRetries, delayRenderRetries, delayRenderTimeoutInMilliseconds, durationInFrames, from, trimBefore, freeze, premountFor, postmountFor, styleWhilePremounted, styleWhilePostmounted, hidden, name, showInTimeline, cropLeft, cropRight, cropTop, cropBottom, controls, _remotionInternalDocumentationLink, _remotionInternalCropComponentName, outlineRef, ...canvasProps }, ref) => {
				if (!src) throw new Error("No \"src\" prop was passed to <CanvasImage>.");
				const isMedia = (0, react.useMemo)(() => ({
					type: "image",
					src
				}), [src]);
				const memoizedEffectDefinitions = useMemoizedEffectDefinitions(effects);
				const actualRef = (0, react.useRef)(null);
				(0, react.useImperativeHandle)(ref, () => {
					return actualRef.current;
				}, []);
				const { effectivePostmountFor, effectivePremountFor, freezeFrame, isPremountingOrPostmounting, postmountingActive, premountingActive, premountingStyle } = usePremounting({
					from: from ?? 0,
					durationInFrames: durationInFrames ?? Infinity,
					premountFor: premountFor ?? null,
					postmountFor: postmountFor ?? null,
					style: style ?? null,
					styleWhilePremounted: styleWhilePremounted ?? null,
					styleWhilePostmounted: styleWhilePostmounted ?? null,
					hideWhilePremounted: "display-none"
				});
				const croppedStyle = useCropStyle({
					cropLeft,
					cropRight,
					cropTop,
					cropBottom,
					style: premountingStyle,
					componentName: _remotionInternalCropComponentName ?? "<CanvasImage />"
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Freeze, {
					frame: freezeFrame,
					active: isPremountingOrPostmounting,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
						layout: "none",
						from: from ?? 0,
						trimBefore,
						durationInFrames: durationInFrames ?? Infinity,
						freeze,
						hidden,
						showInTimeline: showInTimeline ?? true,
						name: name ?? "<CanvasImage>",
						_remotionInternalDocumentationLink: _remotionInternalDocumentationLink ?? "https://www.remotion.dev/docs/canvasimage",
						controls,
						_remotionInternalEffects: memoizedEffectDefinitions,
						_remotionInternalIsMedia: isMedia,
						_remotionInternalPremountDisplay: effectivePremountFor || null,
						_remotionInternalPostmountDisplay: effectivePostmountFor || null,
						_remotionInternalIsPremounting: premountingActive,
						_remotionInternalIsPostmounting: postmountingActive,
						outlineRef: outlineRef ?? actualRef,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanvasImageContent, {
							ref: actualRef,
							src,
							crossOrigin,
							width,
							height,
							fit,
							effects,
							controls,
							className,
							style: croppedStyle ?? void 0,
							id,
							onError,
							pauseWhenLoading,
							maxRetries,
							delayRenderRetries,
							delayRenderTimeoutInMilliseconds,
							refForOutline: outlineRef ?? null,
							...canvasProps
						})
					})
				});
			}),
			componentName: "<CanvasImage>",
			componentIdentity: "dev.remotion.remotion.CanvasImage",
			schema: canvasImageSchema,
			supportsEffects: true
		});
		CanvasImage.displayName = "CanvasImage";
		addSequenceStackTraces(CanvasImage);
		var IFrameRefForwarding = ({ onLoad, onError, delayRenderRetries, delayRenderTimeoutInMilliseconds, ...props2 }, ref) => {
			const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
			const [handle] = (0, react.useState)(() => delayRender2(`Loading <IFrame> with source ${props2.src}`, {
				retries: delayRenderRetries ?? void 0,
				timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
			}));
			const didLoad = (0, react.useCallback)((e) => {
				continueRender2(handle);
				onLoad?.(e);
			}, [
				handle,
				onLoad,
				continueRender2
			]);
			const didGetError = (0, react.useCallback)((e) => {
				continueRender2(handle);
				if (onError) onError(e);
				else console.error("Error loading iframe:", e, "Handle the event using the onError() prop to make this message disappear.");
			}, [
				handle,
				onError,
				continueRender2
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("iframe", {
				referrerPolicy: "strict-origin-when-cross-origin",
				...props2,
				ref,
				onError: didGetError,
				onLoad: didLoad
			});
		};
		(0, react.forwardRef)(IFrameRefForwarding);
		function exponentialBackoff2(errorCount) {
			return 1e3 * 2 ** (errorCount - 1);
		}
		var ImgContent = ({ onError, onImageError, maxRetries = 2, src, pauseWhenLoading, delayRenderRetries, delayRenderTimeoutInMilliseconds, onImageFrame, crossOrigin, decoding, ref, refForOutline, ...props2 }) => {
			const imageRef = (0, react.useRef)(null);
			const errors = (0, react.useRef)({});
			const { delayPlayback } = useBufferState();
			const sequenceContext = (0, react.useContext)(SequenceContext);
			const [isLoading, setIsLoading] = (0, react.useState)(false);
			const imageCallbackRef = (0, react.useCallback)((img) => {
				imageRef.current = img;
				refForOutline.current = img;
				if (typeof ref === "function") ref(img);
				else if (ref) ref.current = img;
			}, [ref, refForOutline]);
			const actualSrc = usePreload(src);
			const retryIn = (0, react.useCallback)((timeout) => {
				if (!imageRef.current) return;
				const currentSrc = imageRef.current.src;
				setTimeout(() => {
					if (!imageRef.current) return;
					const newSrc = imageRef.current?.src;
					if (newSrc !== currentSrc) return;
					imageRef.current.removeAttribute("src");
					imageRef.current.setAttribute("src", newSrc);
				}, timeout);
			}, []);
			const { delayRender: delayRender2, continueRender: continueRender2, cancelRender: cancelRender2 } = useDelayRender();
			const isPremounting = Boolean(sequenceContext?.premounting);
			const isPostmounting = Boolean(sequenceContext?.postmounting);
			const didGetError = (0, react.useCallback)((e) => {
				if (!errors.current) return;
				errors.current[imageRef.current?.src] = (errors.current[imageRef.current?.src] ?? 0) + 1;
				if ((onError || onImageError) && (errors.current[imageRef.current?.src] ?? 0) > maxRetries) {
					onError?.(e);
					onImageError?.(/* @__PURE__ */ new Error("Error loading image with src: " + truncateSrcForLabel(imageRef.current?.src)));
					return;
				}
				if ((errors.current[imageRef.current?.src] ?? 0) <= maxRetries) {
					const backoff = exponentialBackoff2(errors.current[imageRef.current?.src] ?? 0);
					console.warn(`Could not load image with source ${truncateSrcForLabel(imageRef.current?.src)}, retrying again in ${backoff}ms`);
					retryIn(backoff);
					return;
				}
				try {
					cancelRender2("Error loading image with src: " + truncateSrcForLabel(imageRef.current?.src));
				} catch {}
			}, [
				cancelRender2,
				maxRetries,
				onError,
				onImageError,
				retryIn
			]);
			if (typeof window !== "undefined") {
				(0, react.useLayoutEffect)(() => {
					if (!pauseWhenLoading || !isLoading || isPremounting || isPostmounting) return;
					return delayPlayback().unblock;
				}, [
					delayPlayback,
					isLoading,
					isPostmounting,
					isPremounting,
					pauseWhenLoading
				]);
				(0, react.useLayoutEffect)(() => {
					if (window.process?.env?.NODE_ENV === "test") {
						if (imageRef.current) imageRef.current.src = actualSrc;
						return;
					}
					const { current } = imageRef;
					if (!current) return;
					setIsLoading(true);
					const newHandle = delayRender2("Loading <Img> with src=" + truncateSrcForLabel(actualSrc), {
						retries: delayRenderRetries ?? void 0,
						timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
					});
					let unmounted = false;
					const onComplete = () => {
						if (unmounted) {
							continueRender2(newHandle);
							return;
						}
						if ((errors.current[imageRef.current?.src] ?? 0) > 0) {
							delete errors.current[imageRef.current?.src];
							console.info(`Retry successful - ${truncateSrcForLabel(imageRef.current?.src)} is now loaded`);
						}
						if (current) onImageFrame?.(current);
						setIsLoading(false);
						continueRender2(newHandle);
					};
					if (!imageRef.current) {
						onComplete();
						return;
					}
					current.src = actualSrc;
					current.decode().then(onComplete).catch((err) => {
						console.warn(err);
						if (current.complete && current.naturalWidth > 0 && current.naturalHeight > 0) onComplete();
						else current.addEventListener("load", onComplete);
					});
					return () => {
						unmounted = true;
						current.removeEventListener("load", onComplete);
						continueRender2(newHandle);
					};
				}, [
					actualSrc,
					delayRenderRetries,
					delayRenderTimeoutInMilliseconds,
					onImageFrame,
					continueRender2,
					delayRender2
				]);
			}
			const { isClientSideRendering, isRendering } = useRemotionEnvironment();
			const crossOriginValue = getCrossOriginValue({
				crossOrigin,
				requestsVideoFrame: false,
				isClientSideRendering
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
				...props2,
				ref: imageCallbackRef,
				crossOrigin: crossOriginValue,
				onError: didGetError,
				decoding: isRendering ? "sync" : decoding
			});
		};
		var NativeImgInner = ({ hidden, name, showInTimeline, src, from, trimBefore, durationInFrames, freeze, premountFor, postmountFor, style, styleWhilePremounted, styleWhilePostmounted, cropLeft, cropRight, cropTop, cropBottom, controls, outlineRef: refForOutline, ...props2 }) => {
			if (!src) throw new Error("No \"src\" prop was passed to <Img>.");
			const isMedia = (0, react.useMemo)(() => ({
				type: "image",
				src
			}), [src]);
			const { effectivePostmountFor, effectivePremountFor, freezeFrame, isPremountingOrPostmounting, postmountingActive, premountingActive, premountingStyle } = usePremounting({
				from: from ?? 0,
				durationInFrames: durationInFrames ?? Infinity,
				premountFor: premountFor ?? null,
				postmountFor: postmountFor ?? null,
				style: style ?? null,
				styleWhilePremounted: styleWhilePremounted ?? null,
				styleWhilePostmounted: styleWhilePostmounted ?? null,
				hideWhilePremounted: "display-none"
			});
			const croppedStyle = useCropStyle({
				cropLeft,
				cropRight,
				cropTop,
				cropBottom,
				style: premountingStyle,
				componentName: "<Img />"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Freeze, {
				frame: freezeFrame,
				active: isPremountingOrPostmounting,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
					layout: "none",
					from: from ?? 0,
					trimBefore,
					durationInFrames: durationInFrames ?? Infinity,
					freeze,
					_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/img",
					_remotionInternalIsMedia: isMedia,
					_remotionInternalPremountDisplay: effectivePremountFor || null,
					_remotionInternalPostmountDisplay: effectivePostmountFor || null,
					_remotionInternalIsPremounting: premountingActive,
					_remotionInternalIsPostmounting: postmountingActive,
					name: name ?? "<Img>",
					controls,
					showInTimeline: showInTimeline ?? true,
					hidden,
					outlineRef: refForOutline,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImgContent, {
						src,
						refForOutline,
						style: croppedStyle ?? void 0,
						...props2
					})
				})
			});
		};
		var CanvasImageWithPrivateProps = CanvasImage;
		var imgSchema = {
			src: {
				type: "asset",
				assetType: "image",
				default: void 0,
				description: "Source",
				keyframable: false
			},
			...baseSchema,
			...cropSchema,
			...premountSchema,
			...transformSchema$1,
			...backgroundSchema$1,
			...borderSchema$1,
			...borderRadiusSchema$1
		};
		var imgCanvasFallbackIncompatibleProps = /* @__PURE__ */ new Set([
			"alt",
			"decoding",
			"fetchPriority",
			"loading",
			"onError",
			"onImageFrame",
			"onLoad",
			"sizes",
			"srcSet",
			"useMap"
		]);
		var getIncompatiblePropNames = (props2) => Object.keys(props2).filter((key) => props2[key] !== void 0 && imgCanvasFallbackIncompatibleProps.has(key));
		var formatPropList = (props2) => {
			return props2.map((prop) => `"${prop}"`).join(", ");
		};
		var validateCanvasImageFallbackProps = ({ props: props2, ref, width, height }) => {
			if (typeof width === "string" || typeof height === "string") throw new Error("The \"width\" and \"height\" props must be numbers on <Img> when effects are passed, because <Img> renders a <CanvasImage>. Use numeric props or CSS dimensions in \"style\".");
			const conflictingProps = getIncompatiblePropNames(props2);
			if (ref !== null && ref !== void 0) conflictingProps.unshift("ref");
			if (conflictingProps.length === 0) return;
			throw new Error(`The ${formatPropList(conflictingProps)} prop${conflictingProps.length === 1 ? "" : "s"} cannot be used on <Img> when effects are passed, because <Img> renders a <canvas> instead of a native <img>. Remove ${conflictingProps.length === 1 ? "this prop" : "these props"}.`);
		};
		var getFitFromObjectFit = (style) => {
			const objectFit = style?.objectFit;
			if (objectFit === "fill" || objectFit === "contain" || objectFit === "cover") return objectFit;
		};
		var ImgInner = ({ effects = [], ref, hidden, name, showInTimeline, src, from, trimBefore, durationInFrames, freeze, premountFor, postmountFor, styleWhilePremounted, styleWhilePostmounted, controls, width, height, className, style, cropLeft, cropRight, cropTop, cropBottom, id, pauseWhenLoading, maxRetries, delayRenderRetries, delayRenderTimeoutInMilliseconds, onImageError, ...props2 }) => {
			const refForOutline = (0, react.useRef)(null);
			const shouldPauseWhenLoading = resolveV5Default(pauseWhenLoading);
			if (effects.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NativeImgInner, {
				...props2,
				ref,
				hidden,
				name,
				showInTimeline,
				src,
				from,
				trimBefore,
				durationInFrames,
				freeze,
				premountFor,
				postmountFor,
				styleWhilePremounted,
				styleWhilePostmounted,
				controls,
				width,
				height,
				className,
				style,
				cropLeft,
				cropRight,
				cropTop,
				cropBottom,
				id,
				pauseWhenLoading: shouldPauseWhenLoading,
				maxRetries,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				onImageError,
				outlineRef: refForOutline
			});
			if (!src) throw new Error("No \"src\" prop was passed to <Img>.");
			validateCanvasImageFallbackProps({
				props: props2,
				ref,
				width,
				height
			});
			const canvasWidth = typeof width === "number" ? width : void 0;
			const canvasHeight = typeof height === "number" ? height : void 0;
			const canvasProps = props2;
			const canvasFit = getFitFromObjectFit(style) ?? "fill";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanvasImageWithPrivateProps, {
				src,
				width: canvasWidth,
				height: canvasHeight,
				fit: canvasFit,
				effects,
				className,
				style,
				cropLeft,
				cropRight,
				cropTop,
				cropBottom,
				id,
				onError: onImageError,
				pauseWhenLoading: shouldPauseWhenLoading,
				maxRetries,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				from,
				trimBefore,
				durationInFrames,
				freeze,
				premountFor,
				postmountFor,
				styleWhilePremounted,
				styleWhilePostmounted,
				hidden,
				name: name ?? "<Img>",
				showInTimeline,
				_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/img",
				_remotionInternalCropComponentName: "<Img />",
				controls,
				outlineRef: refForOutline,
				...canvasProps
			});
		};
		var Img = withInteractivitySchema({
			Component: ImgInner,
			componentName: "<Img>",
			componentIdentity: "dev.remotion.remotion.Img",
			schema: imgSchema,
			supportsEffects: true
		});
		addSequenceStackTraces(Img);
		var sourcePathToIdentityPrefix = (packageName) => {
			if (packageName === "remotion") return "dev.remotion.remotion";
			if (packageName.startsWith("@remotion/")) return `dev.remotion.${packageName.slice(10).replace(/-([a-z])/g, (_, char) => char.toUpperCase())}`;
			throw new Error(`Unsupported Remotion package name: ${packageName}`);
		};
		var makeRemotionComponentIdentity = ({ packageName, componentName }) => {
			return `${sourcePathToIdentityPrefix(packageName)}.${componentName}`;
		};
		var interactiveElementSchema = {
			...baseSchema,
			...transformSchema$1,
			...cropSchema
		};
		var interactiveBorderElementSchema = {
			...interactiveElementSchema,
			...backgroundSchema$1,
			...borderSchema$1,
			...borderRadiusSchema$1
		};
		var interactiveTextElementSchema = {
			...interactiveBorderElementSchema,
			...textSchema,
			...textContentSchema
		};
		var interactiveSvgTextElementSchema = {
			...interactiveElementSchema,
			...svgPaintSchema,
			...textSchema,
			...textContentSchema
		};
		var interactiveSvgElementSchema = {
			...interactiveElementSchema,
			...svgPaintSchema
		};
		var interactiveSvgStrokeElementSchema = {
			...interactiveElementSchema,
			...svgStrokeSchema
		};
		var interactiveSvgRootElementSchema = {
			...interactiveBorderElementSchema,
			...svgPaintSchema
		};
		var setRef2 = (ref, value) => {
			if (typeof ref === "function") ref(value);
			else if (ref) ref.current = value;
		};
		var withSchema = (options) => {
			const Wrapped = withInteractivitySchema(options);
			addSequenceStackTraces(Wrapped);
			return Wrapped;
		};
		var makeInteractiveElement = (tag, displayName, schema) => {
			const Inner = (0, react.forwardRef)((propsWithControls, ref) => {
				const { durationInFrames, from, trimBefore, freeze, hidden, name, showInTimeline, controls, cropLeft, cropRight, cropTop, cropBottom, style, ...props2 } = propsWithControls;
				const croppedStyle = useCropStyle({
					cropLeft,
					cropRight,
					cropTop,
					cropBottom,
					style: style ?? null,
					componentName: displayName
				});
				const refForOutline = (0, react.useRef)(null);
				const callbackRef = (0, react.useCallback)((element) => {
					refForOutline.current = element;
					setRef2(ref, element);
				}, [ref]);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
					layout: "none",
					from: from ?? 0,
					trimBefore,
					durationInFrames: durationInFrames ?? Infinity,
					freeze,
					hidden,
					name: name ?? displayName,
					showInTimeline: showInTimeline ?? true,
					controls,
					_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/interactive",
					outlineRef: refForOutline,
					children: react.default.createElement(tag, {
						...props2,
						style: croppedStyle ?? void 0,
						ref: callbackRef
					})
				});
			});
			Inner.displayName = displayName;
			const Wrapped = withSchema({
				Component: Inner,
				componentName: displayName,
				componentIdentity: makeRemotionComponentIdentity({
					packageName: "remotion",
					componentName: displayName.slice(1, -1)
				}),
				schema,
				supportsEffects: false
			});
			Wrapped.displayName = displayName;
			return Wrapped;
		};
		var makeInteractiveTextElement = (tag, displayName) => {
			return makeInteractiveElement(tag, displayName, interactiveTextElementSchema);
		};
		var makeInteractiveSvgElement = (tag, displayName) => {
			return makeInteractiveElement(tag, displayName, interactiveSvgElementSchema);
		};
		var makeInteractiveSvgStrokeElement = (tag, displayName) => {
			return makeInteractiveElement(tag, displayName, interactiveSvgStrokeElementSchema);
		};
		var Interactive = {
			baseSchema,
			captionsSchema,
			transformSchema: transformSchema$1,
			textSchema,
			backgroundSchema: backgroundSchema$1,
			borderSchema: borderSchema$1,
			borderRadiusSchema: borderRadiusSchema$1,
			cropSchema,
			svgPaintSchema,
			svgStrokeSchema,
			premountSchema,
			sequenceSchema: sequenceSchema$1,
			withSchema,
			_internalMakeRemotionComponentIdentity: makeRemotionComponentIdentity,
			A: makeInteractiveTextElement("a", "<Interactive.A>"),
			Article: makeInteractiveTextElement("article", "<Interactive.Article>"),
			Aside: makeInteractiveTextElement("aside", "<Interactive.Aside>"),
			Button: makeInteractiveTextElement("button", "<Interactive.Button>"),
			Circle: makeInteractiveSvgElement("circle", "<Interactive.Circle>"),
			Code: makeInteractiveTextElement("code", "<Interactive.Code>"),
			Div: makeInteractiveTextElement("div", "<Interactive.Div>"),
			Ellipse: makeInteractiveSvgElement("ellipse", "<Interactive.Ellipse>"),
			Em: makeInteractiveTextElement("em", "<Interactive.Em>"),
			Footer: makeInteractiveTextElement("footer", "<Interactive.Footer>"),
			G: makeInteractiveSvgElement("g", "<Interactive.G>"),
			H1: makeInteractiveTextElement("h1", "<Interactive.H1>"),
			H2: makeInteractiveTextElement("h2", "<Interactive.H2>"),
			H3: makeInteractiveTextElement("h3", "<Interactive.H3>"),
			H4: makeInteractiveTextElement("h4", "<Interactive.H4>"),
			H5: makeInteractiveTextElement("h5", "<Interactive.H5>"),
			H6: makeInteractiveTextElement("h6", "<Interactive.H6>"),
			Header: makeInteractiveTextElement("header", "<Interactive.Header>"),
			Label: makeInteractiveTextElement("label", "<Interactive.Label>"),
			Li: makeInteractiveTextElement("li", "<Interactive.Li>"),
			Line: makeInteractiveSvgStrokeElement("line", "<Interactive.Line>"),
			Main: makeInteractiveTextElement("main", "<Interactive.Main>"),
			Nav: makeInteractiveTextElement("nav", "<Interactive.Nav>"),
			Ol: makeInteractiveTextElement("ol", "<Interactive.Ol>"),
			P: makeInteractiveTextElement("p", "<Interactive.P>"),
			Path: makeInteractiveSvgElement("path", "<Interactive.Path>"),
			Pre: makeInteractiveTextElement("pre", "<Interactive.Pre>"),
			Rect: makeInteractiveSvgElement("rect", "<Interactive.Rect>"),
			Section: makeInteractiveTextElement("section", "<Interactive.Section>"),
			Small: makeInteractiveTextElement("small", "<Interactive.Small>"),
			Span: makeInteractiveTextElement("span", "<Interactive.Span>"),
			Strong: makeInteractiveTextElement("strong", "<Interactive.Strong>"),
			Svg: makeInteractiveElement("svg", "<Interactive.Svg>", interactiveSvgRootElementSchema),
			Text: makeInteractiveElement("text", "<Interactive.Text>", interactiveSvgTextElementSchema),
			Ul: makeInteractiveTextElement("ul", "<Interactive.Ul>")
		};
		var getAnimatedImageDurationInSeconds = async ({ resolvedSrc, signal, requestInit, contentType }) => {
			const { decoder, selectedTrack } = await createImageDecoder({
				resolvedSrc,
				signal,
				requestInit,
				contentType
			});
			try {
				const { image } = await decoder.decode({
					frameIndex: selectedTrack.frameCount - 1,
					completeFramesOnly: true
				});
				try {
					if (image.duration === null) throw new Error("Could not determine animated image duration");
					return (image.timestamp + image.duration) / 1e6;
				} finally {
					image.close();
				}
			} finally {
				decoder.close();
			}
		};
		var compositionsRef = react.default.createRef();
		var useIsomorphicLayoutEffect2 = typeof window === "undefined" ? react.useEffect : react.useLayoutEffect;
		var CompositionManagerProvider = ({ children, onlyRenderComposition, currentCompositionMetadata, initialCompositions, initialCanvasContent }) => {
			const { isStudio } = useRemotionEnvironment();
			const [compositionManagerId] = (0, react.useState)(() => String(Math.random()));
			const committedOrderRef = (0, react.useRef)(null);
			const committedOrderIdsRef = (0, react.useRef)(null);
			const internalOrderRef = (0, react.useRef)(new Map(initialCompositions.map((composition, index) => [getCompositionAndFolderOrderKey({
				type: "composition",
				id: composition.id
			}), index])));
			const nextInternalOrderRef = (0, react.useRef)(initialCompositions.length);
			const [folders, setFolders] = (0, react.useState)([]);
			const [canvasContent, setCanvasContent] = (0, react.useState)(initialCanvasContent);
			const [currentAssetMetadata, setCurrentAssetMetadata] = (0, react.useState)(null);
			const [compositions, setCompositions] = (0, react.useState)(() => initialCompositions.map((composition, order) => ({
				...composition,
				order
			})));
			const currentcompositionsRef = (0, react.useRef)(compositions);
			const updateCompositions = (0, react.useCallback)((updateComps) => {
				setCompositions((comps) => {
					const updated = updateComps(comps);
					currentcompositionsRef.current = updated;
					return updated;
				});
			}, []);
			const registerComposition = (0, react.useCallback)((comp) => {
				const orderKey = getCompositionAndFolderOrderKey({
					type: "composition",
					id: comp.id
				});
				const internalOrder = nextInternalOrderRef.current++;
				internalOrderRef.current.set(orderKey, internalOrder);
				updateCompositions((comps) => {
					if (comps.find((c2) => c2.id === comp.id)) throw new Error(`Multiple composition with id ${comp.id} are registered.`);
					return [...comps, {
						...comp,
						order: committedOrderRef.current?.get(orderKey) ?? internalOrder
					}];
				});
			}, [updateCompositions]);
			const unregisterComposition = (0, react.useCallback)((id) => {
				internalOrderRef.current.delete(getCompositionAndFolderOrderKey({
					type: "composition",
					id
				}));
				setCompositions((comps) => {
					return comps.filter((c2) => c2.id !== id);
				});
			}, []);
			const registerFolder = (0, react.useCallback)((name, parent, stack) => {
				const orderKey = getCompositionAndFolderOrderKey({
					type: "folder",
					id: getFolderOrderId({
						name,
						parent
					})
				});
				const internalOrder = nextInternalOrderRef.current++;
				internalOrderRef.current.set(orderKey, internalOrder);
				setFolders((prevFolders) => {
					return [...prevFolders, {
						name,
						parent,
						order: committedOrderRef.current?.get(orderKey) ?? internalOrder,
						stack
					}];
				});
			}, []);
			const unregisterFolder = (0, react.useCallback)((name, parent) => {
				internalOrderRef.current.delete(getCompositionAndFolderOrderKey({
					type: "folder",
					id: getFolderOrderId({
						name,
						parent
					})
				}));
				setFolders((prevFolders) => {
					return prevFolders.filter((p) => !(p.name === name && p.parent === parent));
				});
			}, []);
			useIsomorphicLayoutEffect2(() => {
				if (!isStudio) return;
				let unmounted = false;
				const onCommitOrder = (event) => {
					const { detail } = event;
					const managerOrder = detail.compositionManagers.find((item) => item.managerId === compositionManagerId);
					if (!managerOrder) return;
					const orderIds = managerOrder.compositionAndFolderOrder.map(getCompositionAndFolderOrderKey);
					const previousOrder = committedOrderIdsRef.current;
					if (previousOrder !== null && previousOrder.length === orderIds.length && previousOrder.every((id, index) => id === orderIds[index])) return;
					const order = new Map(orderIds.map((id, index) => [id, index]));
					committedOrderIdsRef.current = orderIds;
					committedOrderRef.current = order;
					queueMicrotask(() => {
						if (unmounted) return;
						updateCompositions((currentCompositions) => {
							let changed = false;
							const nextCompositions = currentCompositions.map((composition) => {
								const nextOrder = order.get(getCompositionAndFolderOrderKey({
									type: "composition",
									id: composition.id
								})) ?? internalOrderRef.current.get(getCompositionAndFolderOrderKey({
									type: "composition",
									id: composition.id
								})) ?? composition.order;
								if (nextOrder === composition.order) return composition;
								changed = true;
								return {
									...composition,
									order: nextOrder
								};
							});
							return changed ? nextCompositions : currentCompositions;
						});
						setFolders((currentFolders) => {
							let changed = false;
							const nextFolders = currentFolders.map((folder) => {
								const nextOrder = order.get(getCompositionAndFolderOrderKey({
									type: "folder",
									id: getFolderOrderId(folder)
								})) ?? internalOrderRef.current.get(getCompositionAndFolderOrderKey({
									type: "folder",
									id: getFolderOrderId(folder)
								})) ?? folder.order;
								if (nextOrder === folder.order) return folder;
								changed = true;
								return {
									...folder,
									order: nextOrder
								};
							});
							return changed ? nextFolders : currentFolders;
						});
					});
				};
				window.addEventListener(COMMIT_ORDER_EVENT, onCommitOrder);
				return () => {
					unmounted = true;
					window.removeEventListener(COMMIT_ORDER_EVENT, onCommitOrder);
				};
			}, [
				compositionManagerId,
				isStudio,
				updateCompositions
			]);
			(0, react.useImperativeHandle)(compositionsRef, () => {
				return { getCompositions: () => currentcompositionsRef.current };
			}, []);
			const compositionManagerSetters = (0, react.useMemo)(() => {
				return {
					registerComposition,
					unregisterComposition,
					registerFolder,
					unregisterFolder,
					setCanvasContent,
					setCurrentAssetMetadata,
					onlyRenderComposition
				};
			}, [
				registerComposition,
				registerFolder,
				unregisterComposition,
				unregisterFolder,
				onlyRenderComposition
			]);
			const compositionManagerContextValue = (0, react.useMemo)(() => {
				return {
					compositions,
					folders,
					currentCompositionMetadata,
					currentAssetMetadata,
					canvasContent
				};
			}, [
				compositions,
				folders,
				currentCompositionMetadata,
				currentAssetMetadata,
				canvasContent
			]);
			const providers = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionManager.Provider, {
				value: compositionManagerContextValue,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionSetters.Provider, {
					value: compositionManagerSetters,
					children
				})
			});
			return isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionManagerOrderMarker, {
				managerId: compositionManagerId,
				children: providers
			}) : providers;
		};
		var exports_default_css = {};
		__export(exports_default_css, {
			makeDefaultPreviewCSS: () => makeDefaultPreviewCSS,
			injectCSS: () => injectCSS,
			OBJECTFIT_CONTAIN_CLASS_NAME: () => OBJECTFIT_CONTAIN_CLASS_NAME
		});
		var injected$1 = {};
		var injectCSS = (css) => {
			if (typeof document === "undefined") return () => {};
			if (injected$1[css]) return () => {};
			const head = document.head || document.getElementsByTagName("head")[0];
			const style = document.createElement("style");
			style.appendChild(document.createTextNode(css));
			head.prepend(style);
			injected$1[css] = style;
			return () => {
				const styleElement = injected$1[css];
				if (styleElement) {
					if (styleElement.parentNode) styleElement.parentNode.removeChild(styleElement);
					delete injected$1[css];
				}
			};
		};
		var OBJECTFIT_CONTAIN_CLASS_NAME = "__remotion_objectfitcontain";
		var makeDefaultPreviewCSS = (scope, backgroundColor) => {
			if (!scope) return `
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
	    background-color: ${backgroundColor};
    }
    .${OBJECTFIT_CONTAIN_CLASS_NAME} {
      object-fit: contain;
    }
    `;
			return `
    ${scope} * {
      box-sizing: border-box;
    }
    ${scope} *:-webkit-full-screen {
      width: 100%;
      height: 100%;
    }
    ${scope} .${OBJECTFIT_CONTAIN_CLASS_NAME} {
      object-fit: contain;
    }
  `;
		};
		var REMOTION_STUDIO_CONTAINER_ELEMENT = "__remotion-studio-container";
		var getPreviewDomElement = () => {
			return document.getElementById(REMOTION_STUDIO_CONTAINER_ELEMENT);
		};
		var MaxMediaCacheSizeContext = react.default.createContext(null);
		var disposeResource = (resource) => {
			if (resource.disposed) return;
			resource.disposed = true;
			resource.values.clear();
			resource.dispose();
		};
		var makeMediaResourceManager = () => {
			const resources = /* @__PURE__ */ new Map();
			let disposed = false;
			return {
				acquire: ({ key, create }) => {
					if (disposed) throw new Error("Media resource manager has already been disposed");
					let entry = resources.get(key);
					if (!entry) {
						const created = create();
						entry = {
							resource: created.resource,
							dispose: created.dispose,
							refCount: 0,
							disposeGeneration: 0,
							disposed: false,
							values: /* @__PURE__ */ new Map()
						};
						resources.set(key, entry);
					}
					entry.refCount++;
					entry.disposeGeneration++;
					let released = false;
					return {
						resource: entry.resource,
						getOrCreateValue: (valueKey, createValue) => {
							if (entry.values.has(valueKey)) return entry.values.get(valueKey);
							const value = createValue();
							entry.values.set(valueKey, value);
							return value;
						},
						release: () => {
							if (released) return;
							released = true;
							entry.refCount--;
							if (entry.refCount !== 0) return;
							const disposeGeneration = ++entry.disposeGeneration;
							queueMicrotask(() => {
								if (entry.refCount !== 0 || entry.disposeGeneration !== disposeGeneration) return;
								if (resources.get(key) === entry) resources.delete(key);
								disposeResource(entry);
							});
						}
					};
				},
				invalidate: (key) => {
					const entry = resources.get(key);
					if (!entry) return;
					resources.delete(key);
					entry.disposeGeneration++;
					if (entry.refCount === 0) disposeResource(entry);
				},
				dispose: () => {
					if (disposed) return;
					disposed = true;
					const entries = Array.from(resources.values());
					resources.clear();
					let firstError = null;
					for (const entry of entries) try {
						disposeResource(entry);
					} catch (error2) {
						firstError ?? (firstError = error2);
					}
					if (firstError !== null) throw firstError;
				}
			};
		};
		var getMediabunnyInputResourceKey = ({ src, credentials, requestInitFingerprint, revision }) => JSON.stringify([
			"mediabunny-input",
			src,
			credentials,
			requestInitFingerprint,
			revision
		]);
		var MEDIABUNNY_DURATION_VALUE_KEY = "mediabunny-duration";
		var globalMediaResourceManager = makeMediaResourceManager();
		var Root = null;
		var listeners = [];
		var getRoot = () => {
			return Root;
		};
		var waitForRoot = (fn) => {
			if (Root) {
				fn(Root);
				return () => {};
			}
			listeners.push(fn);
			return () => {
				listeners = listeners.filter((l) => l !== fn);
			};
		};
		var RemotionRootContexts = ({ children, numberOfAudioTags, logLevel, audioLatencyHint, previewSampleRate, videoEnabled, audioEnabled, frameState, _experimentalKeepAudioContextAlive }) => {
			const logging = (0, react.useMemo)(() => {
				return {
					logLevel,
					mountTime: Date.now()
				};
			}, [logLevel]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LogLevelContext.Provider, {
				value: logging,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TimelineContextProvider, {
					frameState,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaEnabledProvider, {
						videoEnabled,
						audioEnabled,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EditorPropsProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PrefetchProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceManagerProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DurationsContextProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BufferingProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SharedAudioContextProvider, {
							audioLatencyHint,
							audioEnabled,
							previewSampleRate,
							_experimentalKeepAudioContextAlive,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SharedAudioTagsContextProvider, {
								numberOfAudioTags,
								children
							})
						}) }) }) }) }) })
					})
				})
			});
		};
		var makeRenderResourceManager = () => {
			const resources = /* @__PURE__ */ new Map();
			let disposed = false;
			return {
				getOrCreateResource: ({ key, create }) => {
					if (disposed) throw new Error("Render resource manager has already been disposed");
					const existing = resources.get(key);
					if (existing) return existing.resource;
					const created = create();
					resources.set(key, created);
					return created.resource;
				},
				dispose: () => {
					if (disposed) return;
					disposed = true;
					const resourcesToDispose = Array.from(resources.values());
					resources.clear();
					let firstError = null;
					for (const resource of resourcesToDispose) try {
						resource.dispose();
					} catch (error2) {
						firstError ?? (firstError = error2);
					}
					if (firstError !== null) throw firstError;
				}
			};
		};
		var RenderResourceManagerContext = react.default.createContext(null);
		var validCodecs$1 = [
			"h264",
			"h265",
			"vp8",
			"vp9",
			"av1",
			"mp3",
			"aac",
			"wav",
			"prores",
			"h264-mkv",
			"h264-ts",
			"gif"
		];
		function validateCodec$1(defaultCodec, location, name) {
			if (typeof defaultCodec === "undefined") return;
			if (typeof defaultCodec !== "string") throw new TypeError(`The "${name}" prop ${location} must be a string, but you passed a value of type ${typeof defaultCodec}.`);
			if (!validCodecs$1.includes(defaultCodec)) throw new Error(`The "${name}" prop ${location} must be one of ${validCodecs$1.join(", ")}, but you passed ${defaultCodec}.`);
		}
		var validateCalculated = ({ calculated, compositionId, compositionFps, compositionHeight, compositionWidth, compositionDurationInFrames }) => {
			const calculateMetadataErrorLocation = `calculated by calculateMetadata() for the composition "${compositionId}"`;
			const defaultErrorLocation = `of the "<Composition />" component with the id "${compositionId}"`;
			const width = calculated?.width ?? compositionWidth ?? void 0;
			validateDimension$2(width, "width", calculated?.width ? calculateMetadataErrorLocation : defaultErrorLocation);
			const height = calculated?.height ?? compositionHeight ?? void 0;
			validateDimension$2(height, "height", calculated?.height ? calculateMetadataErrorLocation : defaultErrorLocation);
			const fps = calculated?.fps ?? compositionFps ?? null;
			validateFps$2(fps, calculated?.fps ? calculateMetadataErrorLocation : defaultErrorLocation, false);
			const durationInFrames = calculated?.durationInFrames ?? compositionDurationInFrames ?? null;
			validateDurationInFrames$2(durationInFrames, {
				allowFloats: false,
				component: `of the "<Composition />" component with the id "${compositionId}"`
			});
			const defaultCodec = calculated?.defaultCodec;
			validateCodec$1(defaultCodec, calculateMetadataErrorLocation, "defaultCodec");
			return {
				width,
				height,
				fps,
				durationInFrames,
				defaultCodec,
				defaultOutName: calculated?.defaultOutName,
				defaultVideoImageFormat: calculated?.defaultVideoImageFormat,
				defaultPixelFormat: calculated?.defaultPixelFormat,
				defaultProResProfile: calculated?.defaultProResProfile,
				defaultSampleRate: calculated?.defaultSampleRate
			};
		};
		var makeVideoConfigWithMetadata = ({ calculated, compositionDurationInFrames, compositionFps, compositionHeight, compositionId, compositionWidth, defaultProps, originalProps }) => {
			const data = validateCalculated({
				calculated,
				compositionDurationInFrames,
				compositionFps,
				compositionHeight,
				compositionWidth,
				compositionId
			});
			return {
				metadataSource: {
					durationInFrames: calculated?.durationInFrames === void 0 ? "composition" : "calculate-metadata",
					fps: calculated?.fps === void 0 ? "composition" : "calculate-metadata",
					height: calculated?.height === void 0 ? "composition" : "calculate-metadata",
					width: calculated?.width === void 0 ? "composition" : "calculate-metadata"
				},
				videoConfig: {
					...data,
					id: compositionId,
					defaultProps: serializeThenDeserializeInStudio(defaultProps ?? {}),
					props: serializeThenDeserializeInStudio(calculated?.props ?? originalProps),
					defaultCodec: data.defaultCodec ?? null,
					defaultOutName: data.defaultOutName ?? null,
					defaultVideoImageFormat: data.defaultVideoImageFormat ?? null,
					defaultPixelFormat: data.defaultPixelFormat ?? null,
					defaultProResProfile: data.defaultProResProfile ?? null,
					defaultSampleRate: data.defaultSampleRate ?? null
				}
			};
		};
		var resolveVideoConfigWithMetadata = ({ calculateMetadata, signal, defaultProps, inputProps: originalProps, compositionId, compositionDurationInFrames, compositionFps, compositionHeight, compositionWidth }) => {
			const calculatedProm = calculateMetadata ? calculateMetadata({
				defaultProps,
				props: originalProps,
				abortSignal: signal,
				compositionId,
				isRendering: getRemotionEnvironment().isRendering
			}) : null;
			if (calculatedProm !== null && typeof calculatedProm === "object" && "then" in calculatedProm) return calculatedProm.then((c2) => {
				return makeVideoConfigWithMetadata({
					calculated: c2,
					compositionDurationInFrames,
					compositionFps,
					compositionHeight,
					compositionWidth,
					compositionId,
					defaultProps,
					originalProps
				});
			});
			return makeVideoConfigWithMetadata({
				calculated: calculatedProm,
				compositionDurationInFrames,
				compositionFps,
				compositionHeight,
				compositionWidth,
				compositionId,
				defaultProps,
				originalProps
			});
		};
		var resolveVideoConfig = (params) => {
			const resolved = resolveVideoConfigWithMetadata(params);
			if (typeof resolved === "object" && "then" in resolved) return resolved.then(({ videoConfig }) => videoConfig);
			return resolved.videoConfig;
		};
		var resolveVideoConfigWithMetadataOrCatch = (params) => {
			try {
				return {
					type: "success",
					result: resolveVideoConfigWithMetadata(params)
				};
			} catch (err) {
				return {
					type: "error",
					error: err
				};
			}
		};
		var resolveVideoConfigOrCatch = (params) => {
			try {
				return {
					type: "success",
					result: resolveVideoConfig(params)
				};
			} catch (err) {
				return {
					type: "error",
					error: err
				};
			}
		};
		var SequenceStackTracesUpdateContext = react.default.createContext(() => {});
		var getEnvVariables = () => {
			if (getRemotionEnvironment().isRendering) {
				const param = window.remotion_envVariables;
				if (!param) return {};
				return {
					...JSON.parse(param),
					NODE_ENV: "production"
				};
			}
			return { NODE_ENV: "production" };
		};
		var setupEnvVariables = () => {
			const env = getEnvVariables();
			if (!window.process) window.process = {};
			if (!window.process.env) window.process.env = {};
			Object.keys(env).forEach((key) => {
				window.process.env[key] = env[key];
			});
		};
		var PixelDensityContext = react.default.createContext(null);
		var getOffthreadVideoSource$1 = ({ src, transparent, currentTime, toneMapped }) => {
			return `http://localhost:${window.remotion_proxyPort}/proxy?src=${encodeURIComponent(getAbsoluteSrc$1(src))}&time=${encodeURIComponent(Math.max(0, currentTime))}&transparent=${String(transparent)}&toneMapped=${String(toneMapped)}`;
		};
		var OffthreadVideoForRendering = ({ onError, volume: volumeProp, playbackRate, src, muted, allowAmplificationDuringRender, transparent, toneMapped, toneFrequency, name, loopVolumeCurveBehavior, delayRenderRetries, delayRenderTimeoutInMilliseconds, onVideoFrame, crossOrigin, audioStreamIndex, preservePitch: _preservePitch, ...props2 }) => {
			const absoluteFrame = useTimelinePosition();
			const frame = useCurrentFrame();
			const volumePropsFrame = useFrameForVolumeProp(loopVolumeCurveBehavior);
			const videoConfig = useUnsafeVideoConfig();
			const sequenceContext = (0, react.useContext)(SequenceContext);
			const mediaStartsAt = useMediaStartsAt();
			const { registerRenderAsset, unregisterRenderAsset } = (0, react.useContext)(RenderAssetManager);
			if (!src) throw new TypeError("No `src` was passed to <OffthreadVideo>.");
			const id = (0, react.useMemo)(() => `offthreadvideo-${random(src)}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.relativeFrom}-${sequenceContext?.durationInFrames}`, [
				src,
				sequenceContext?.cumulatedFrom,
				sequenceContext?.relativeFrom,
				sequenceContext?.durationInFrames
			]);
			const volume = evaluateVolume({
				volume: volumeProp,
				frame: volumePropsFrame,
				mediaVolume: 1
			});
			warnAboutTooHighVolume(volume);
			const { shouldUseAudio } = useMediaAudioState({
				muted,
				volume,
				audioEnabled: useAudioEnabled()
			});
			if (!videoConfig) throw new Error("No video config found");
			(0, react.useEffect)(() => {
				if (!src) throw new Error("No src passed");
				if (!shouldUseAudio) return;
				registerRenderAsset({
					type: "video",
					src: getAbsoluteSrc$1(src),
					id,
					frame: absoluteFrame,
					volume,
					mediaFrame: frame,
					playbackRate,
					toneFrequency,
					audioStartFrame: Math.max(0, -(sequenceContext?.cumulatedNegativeFrom ?? 0)),
					audioStreamIndex
				});
				return () => unregisterRenderAsset(id);
			}, [
				shouldUseAudio,
				src,
				registerRenderAsset,
				id,
				unregisterRenderAsset,
				volume,
				frame,
				absoluteFrame,
				playbackRate,
				toneFrequency,
				sequenceContext?.cumulatedNegativeFrom,
				audioStreamIndex
			]);
			const currentTime = (0, react.useMemo)(() => {
				return getExpectedMediaFrameUncorrected$1({
					frame,
					playbackRate: playbackRate || 1,
					startFrom: -mediaStartsAt
				}) / videoConfig.fps;
			}, [
				frame,
				mediaStartsAt,
				playbackRate,
				videoConfig.fps
			]);
			const actualSrc = (0, react.useMemo)(() => {
				return getOffthreadVideoSource$1({
					src,
					currentTime,
					transparent,
					toneMapped
				});
			}, [
				toneMapped,
				currentTime,
				src,
				transparent
			]);
			const [imageSrc, setImageSrc] = (0, react.useState)(null);
			const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
			(0, react.useLayoutEffect)(() => {
				if (!window.remotion_videoEnabled) return;
				const cleanup = [];
				setImageSrc(null);
				const controller = new AbortController();
				const newHandle = delayRender2(`Fetching ${actualSrc} from server`, {
					retries: delayRenderRetries ?? void 0,
					timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
				});
				const execute = async () => {
					try {
						const res = await fetch(actualSrc, {
							signal: controller.signal,
							cache: "no-store"
						});
						if (res.status !== 200) {
							if (res.status === 500) {
								const json = await res.json();
								if (json.error) {
									const cleanedUpErrorMessage = json.error.replace(/^Error: /, "");
									throw new Error(cleanedUpErrorMessage);
								}
							}
							throw new Error(`Server returned status ${res.status} while fetching ${actualSrc}`);
						}
						const blob = await res.blob();
						const url = URL.createObjectURL(blob);
						cleanup.push(() => URL.revokeObjectURL(url));
						setImageSrc({
							src: url,
							handle: newHandle
						});
					} catch (err) {
						if (err.message.includes("aborted")) {
							continueRender2(newHandle);
							return;
						}
						if (controller.signal.aborted) {
							continueRender2(newHandle);
							return;
						}
						if (err.message.includes("Failed to fetch")) err = new Error(`Failed to fetch ${actualSrc}. This could be caused by Chrome rejecting the request because the disk space is low. Consider increasing the disk size of your environment.`, { cause: err });
						if (onError) onError(err);
						else cancelRender(err);
					}
				};
				execute();
				cleanup.push(() => {
					if (controller.signal.aborted) return;
					controller.abort();
				});
				return () => {
					cleanup.forEach((c2) => c2());
				};
			}, [
				actualSrc,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				onError,
				continueRender2,
				delayRender2
			]);
			const onErr = (0, react.useCallback)(() => {
				if (onError) onError?.(/* @__PURE__ */ new Error("Failed to load image with src " + imageSrc));
				else cancelRender("Failed to load image with src " + imageSrc);
			}, [imageSrc, onError]);
			const className = (0, react.useMemo)(() => {
				return [OBJECTFIT_CONTAIN_CLASS_NAME, props2.className].filter(truthy$1).join(" ");
			}, [props2.className]);
			const onImageFrame = (0, react.useCallback)((img) => {
				if (onVideoFrame) onVideoFrame(img);
			}, [onVideoFrame]);
			if (!imageSrc || !window.remotion_videoEnabled) return null;
			continueRender2(imageSrc.handle);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Img, {
				src: imageSrc.src,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				onImageFrame,
				...props2,
				onError: onErr,
				className
			});
		};
		var useEmitVideoFrame = ({ ref, onVideoFrame }) => {
			(0, react.useEffect)(() => {
				const { current } = ref;
				if (!current) return;
				if (!onVideoFrame) return;
				let handle = 0;
				const callback = (_now, metadata) => {
					if (!ref.current) return;
					onVideoFrame(ref.current, _now, metadata);
					handle = ref.current.requestVideoFrameCallback(callback);
				};
				onVideoFrame(current);
				if (!current.requestVideoFrameCallback) return;
				handle = current.requestVideoFrameCallback(callback);
				return () => {
					if (handle) current.cancelVideoFrameCallback(handle);
				};
			}, [onVideoFrame, ref]);
		};
		var MediaPlaybackError = class extends Error {
			constructor({ message, src }) {
				super(message);
				_defineProperty(this, "src", void 0);
				this.name = "MediaPlaybackError";
				this.src = src;
			}
		};
		var VideoForDevelopmentRefForwardingFunction = (props2, ref) => {
			const context = (0, react.useContext)(SharedAudioContext);
			if (!context) throw new Error("SharedAudioContext not found");
			const videoRef = (0, react.useRef)(null);
			const sharedSource = (0, react.useMemo)(() => {
				if (!context.audioContext) return null;
				return makeSharedElementSourceNode({
					audioContext: context.audioContext,
					ref: videoRef
				});
			}, [context.audioContext]);
			(react.default.useInsertionEffect ?? react.default.useLayoutEffect)(() => {
				return () => {
					requestAnimationFrame(() => {
						sharedSource?.cleanup();
					});
				};
			}, [sharedSource]);
			const { volume, muted, playbackRate, preservePitch, onlyWarnForMediaSeekingError, src, onDuration, acceptableTimeShift, acceptableTimeShiftInSeconds, toneFrequency, name, _remotionInternalNativeLoopPassed, _remotionInternalStack, style, pauseWhenBuffering, showInTimeline, loopVolumeCurveBehavior, onError, onAutoPlayError, onVideoFrame, crossOrigin, delayRenderRetries, delayRenderTimeoutInMilliseconds, allowAmplificationDuringRender, useWebAudioApi, audioStreamIndex, ...nativeProps } = props2;
			const volumePropFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
			const { fps, durationInFrames } = useVideoConfig();
			const parentSequence = (0, react.useContext)(SequenceContext);
			const { isStudio } = useRemotionEnvironment();
			const logLevel = useLogLevel();
			const mountTime = useMountTime();
			const [timelineId] = (0, react.useState)(() => String(Math.random()));
			if (typeof acceptableTimeShift !== "undefined") throw new Error("acceptableTimeShift has been removed. Use acceptableTimeShiftInSeconds instead.");
			const [mediaVolume] = useMediaVolumeState();
			const userPreferredVolume = evaluateVolume({
				frame: volumePropFrame,
				volume,
				mediaVolume
			});
			const { isMutedForTimeline, isMutedForPlayback } = useMediaAudioState({
				muted: muted ?? false,
				volume: userPreferredVolume,
				audioEnabled: true
			});
			warnAboutTooHighVolume(userPreferredVolume);
			const getStack = (0, react.useCallback)(() => {
				return _remotionInternalStack ?? null;
			}, [_remotionInternalStack]);
			useMediaInTimeline({
				volume,
				mediaVolume,
				mediaType: "video",
				src,
				playbackRate: props2.playbackRate ?? 1,
				displayName: name ?? null,
				id: timelineId,
				getStack,
				showInTimeline,
				premountDisplay: parentSequence?.premountDisplay ?? null,
				postmountDisplay: parentSequence?.postmountDisplay ?? null,
				loopDisplay: void 0,
				documentationLink: onlyWarnForMediaSeekingError ? "https://www.remotion.dev/docs/offthreadvideo" : "https://www.remotion.dev/docs/html5-video",
				refForOutline: videoRef,
				muted: isMutedForTimeline
			});
			useMediaPlayback({
				mediaRef: videoRef,
				src,
				mediaType: "video",
				playbackRate: props2.playbackRate ?? 1,
				preservePitch,
				onlyWarnForMediaSeekingError,
				acceptableTimeshift: acceptableTimeShiftInSeconds ?? null,
				isPremounting: Boolean(parentSequence?.premounting),
				isPostmounting: Boolean(parentSequence?.postmounting),
				pauseWhenBuffering,
				onAutoPlayError: onAutoPlayError ?? null
			});
			useMediaTag({
				id: timelineId,
				isPostmounting: Boolean(parentSequence?.postmounting),
				isPremounting: Boolean(parentSequence?.premounting),
				mediaRef: videoRef,
				mediaType: "video",
				onAutoPlayError: onAutoPlayError ?? null
			});
			useVolume({
				logLevel,
				mediaRef: videoRef,
				volume: userPreferredVolume,
				source: sharedSource,
				shouldUseWebAudioApi: useWebAudioApi ?? false
			});
			const actualFrom = parentSequence ? parentSequence.relativeFrom : 0;
			const duration = parentSequence ? Math.min(parentSequence.durationInFrames, durationInFrames) : durationInFrames;
			const actualSrc = useAppendVideoFragment({
				actualSrc: usePreload(src),
				actualFrom,
				duration,
				fps
			});
			(0, react.useImperativeHandle)(ref, () => {
				return videoRef.current;
			}, []);
			(0, react.useState)(() => playbackLogging({
				logLevel,
				message: `Mounting video with source = ${actualSrc}, v=${VERSION}, user agent=${typeof navigator === "undefined" ? "server" : navigator.userAgent}`,
				tag: "video",
				mountTime
			}));
			(0, react.useEffect)(() => {
				const { current } = videoRef;
				if (!current) return;
				const errorHandler = () => {
					if (current.error) {
						console.error("Error occurred in video", current?.error);
						if (onError) {
							const err = new MediaPlaybackError({
								message: `Code ${current.error.code}: ${current.error.message}`,
								src
							});
							onError(err);
							return;
						}
						throw new MediaPlaybackError({
							message: `The browser threw an error while playing the video ${src}: Code ${current.error.code} - ${current?.error?.message}. See https://remotion.dev/docs/media-playback-error for help. Pass an onError() prop to handle the error.`,
							src
						});
					} else {
						if (onError) {
							const err = new MediaPlaybackError({
								message: `The browser threw an error while playing the video ${src}`,
								src
							});
							onError(err);
							return;
						}
						throw new MediaPlaybackError({
							message: "The browser threw an error while playing the video",
							src
						});
					}
				};
				current.addEventListener("error", errorHandler, { once: true });
				return () => {
					current.removeEventListener("error", errorHandler);
				};
			}, [onError, src]);
			const currentOnDurationCallback = (0, react.useRef)(onDuration);
			currentOnDurationCallback.current = onDuration;
			useEmitVideoFrame({
				ref: videoRef,
				onVideoFrame
			});
			(0, react.useEffect)(() => {
				const { current } = videoRef;
				if (!current) return;
				if (current.duration) {
					currentOnDurationCallback.current?.(src, current.duration);
					return;
				}
				const onLoadedMetadata = () => {
					currentOnDurationCallback.current?.(src, current.duration);
				};
				current.addEventListener("loadedmetadata", onLoadedMetadata);
				return () => {
					current.removeEventListener("loadedmetadata", onLoadedMetadata);
				};
			}, [src]);
			(0, react.useEffect)(() => {
				const { current } = videoRef;
				if (!current) return;
				if (isIosSafari()) current.preload = "metadata";
				else current.preload = "auto";
			}, []);
			const actualStyle = (0, react.useMemo)(() => {
				return { ...style };
			}, [style]);
			const crossOriginValue = getCrossOriginValue({
				crossOrigin,
				requestsVideoFrame: Boolean(onVideoFrame),
				isClientSideRendering: false
			});
			const video = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
				...nativeProps,
				ref: videoRef,
				muted: isMutedForPlayback,
				playsInline: true,
				src: actualSrc,
				loop: _remotionInternalNativeLoopPassed,
				style: actualStyle,
				disableRemotePlayback: true,
				crossOrigin: crossOriginValue,
				controls: false
			});
			return isStudio ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceOrderMarker, {
				sequenceId: timelineId,
				children: video
			}) : video;
		};
		var VideoForPreview = (0, react.forwardRef)(VideoForDevelopmentRefForwardingFunction);
		var InnerOffthreadVideo = (props2) => {
			const { startFrom, endAt, trimBefore, trimAfter, name, pauseWhenBuffering, _remotionInternalStack, showInTimeline, ...otherProps } = props2;
			const environment = useRemotionEnvironment();
			const shouldPauseWhenBuffering = resolveV5Default(pauseWhenBuffering);
			if (environment.isClientSideRendering) throw new Error("<OffthreadVideo> is not supported in @remotion/web-renderer. Use <Video> from @remotion/media instead. See https://remotion.dev/docs/client-side-rendering/limitations");
			const onDuration = (0, react.useCallback)(() => {}, []);
			if (typeof props2.src !== "string") throw new TypeError(`The \`<OffthreadVideo>\` tag requires a string for \`src\`, but got ${JSON.stringify(props2.src)} instead.`);
			validateMediaTrimProps({
				startFrom,
				endAt,
				trimBefore,
				trimAfter
			});
			const { trimBeforeValue, trimAfterValue } = resolveTrimProps({
				startFrom,
				endAt,
				trimBefore,
				trimAfter
			});
			if (typeof trimBeforeValue !== "undefined" || typeof trimAfterValue !== "undefined") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				layout: "none",
				from: 0 - (trimBeforeValue ?? 0),
				showInTimeline: false,
				durationInFrames: trimAfterValue,
				name,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InnerOffthreadVideo, {
					pauseWhenBuffering: shouldPauseWhenBuffering,
					...otherProps,
					trimAfter: void 0,
					name: void 0,
					showInTimeline,
					trimBefore: void 0,
					_remotionInternalStack: void 0,
					startFrom: void 0,
					endAt: void 0
				})
			});
			validateMediaProps(props2, "Video");
			if (environment.isRendering) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OffthreadVideoForRendering, {
				pauseWhenBuffering: shouldPauseWhenBuffering,
				...otherProps,
				trimAfter: void 0,
				name: void 0,
				showInTimeline,
				trimBefore: void 0,
				_remotionInternalStack: void 0,
				startFrom: void 0,
				endAt: void 0
			});
			const { transparent, toneMapped, onAutoPlayError, onVideoFrame, crossOrigin, delayRenderRetries, delayRenderTimeoutInMilliseconds, ...propsForPreview } = otherProps;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoForPreview, {
				_remotionInternalStack: _remotionInternalStack ?? null,
				onDuration,
				onlyWarnForMediaSeekingError: true,
				pauseWhenBuffering: shouldPauseWhenBuffering,
				showInTimeline: showInTimeline ?? true,
				onAutoPlayError: onAutoPlayError ?? void 0,
				onVideoFrame: onVideoFrame ?? null,
				crossOrigin,
				...propsForPreview,
				_remotionInternalNativeLoopPassed: false
			});
		};
		var OffthreadVideo = ({ src, acceptableTimeShiftInSeconds, allowAmplificationDuringRender, audioStreamIndex, crossOrigin, delayRenderRetries, delayRenderTimeoutInMilliseconds, loopVolumeCurveBehavior, muted, name, onAutoPlayError, onError, onVideoFrame, pauseWhenBuffering, playbackRate, preservePitch, showInTimeline, style, toneFrequency, toneMapped, transparent, trimAfter, trimBefore, useWebAudioApi, volume, _remotionInternalNativeLoopPassed, endAt, _remotionInternalStack, startFrom, imageFormat, ...props2 }) => {
			if (imageFormat) throw new TypeError(`The \`<OffthreadVideo>\` tag does no longer accept \`imageFormat\`. Use the \`transparent\` prop if you want to render a transparent video.`);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InnerOffthreadVideo, {
				acceptableTimeShiftInSeconds,
				allowAmplificationDuringRender: allowAmplificationDuringRender ?? true,
				audioStreamIndex: audioStreamIndex ?? 0,
				crossOrigin,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				loopVolumeCurveBehavior: loopVolumeCurveBehavior ?? "repeat",
				muted: muted ?? false,
				name,
				onAutoPlayError: onAutoPlayError ?? null,
				onError,
				onVideoFrame,
				pauseWhenBuffering: resolveV5Default(pauseWhenBuffering),
				playbackRate: playbackRate ?? 1,
				preservePitch,
				toneFrequency: toneFrequency ?? 1,
				showInTimeline: showInTimeline ?? true,
				src,
				_remotionInternalStack,
				startFrom,
				_remotionInternalNativeLoopPassed: _remotionInternalNativeLoopPassed ?? false,
				endAt,
				style,
				toneMapped: toneMapped ?? true,
				transparent: transparent ?? false,
				trimAfter,
				trimBefore,
				useWebAudioApi: useWebAudioApi ?? false,
				volume,
				...props2
			});
		};
		addSequenceStackTraces(OffthreadVideo);
		var WATCH_REMOTION_STATIC_FILES = "remotion_staticFilesChanged";
		function useRemotionContexts() {
			const compositionManagerCtx = react.default.useContext(CompositionManager);
			const timelineContext = react.default.useContext(TimelineContext);
			const setTimelineContext = react.default.useContext(SetTimelineContext);
			const sequenceContext = react.default.useContext(SequenceContext);
			const canUseRemotionHooksContext = react.default.useContext(CanUseRemotionHooks);
			const preloadContext = react.default.useContext(PreloadContext);
			const resolveCompositionContext = react.default.useContext(ResolveCompositionContext);
			const renderAssetManagerContext = react.default.useContext(RenderAssetManager);
			const sequenceManagerContext = react.default.useContext(SequenceManager);
			const sequenceManagerRefContext = react.default.useContext(SequenceManagerRefContext);
			const visualModePropStatusesRefContext = react.default.useContext(VisualModePropStatusesRefContext);
			const bufferManagerContext = react.default.useContext(BufferingContextReact);
			const logLevelContext = react.default.useContext(LogLevelContext);
			return (0, react.useMemo)(() => ({
				compositionManagerCtx,
				timelineContext,
				setTimelineContext,
				sequenceContext,
				canUseRemotionHooksContext,
				preloadContext,
				resolveCompositionContext,
				renderAssetManagerContext,
				sequenceManagerContext,
				sequenceManagerRefContext,
				visualModePropStatusesRefContext,
				bufferManagerContext,
				logLevelContext
			}), [
				compositionManagerCtx,
				sequenceContext,
				setTimelineContext,
				timelineContext,
				canUseRemotionHooksContext,
				preloadContext,
				resolveCompositionContext,
				renderAssetManagerContext,
				sequenceManagerContext,
				sequenceManagerRefContext,
				visualModePropStatusesRefContext,
				bufferManagerContext,
				logLevelContext
			]);
		}
		var RemotionContextProvider = (props2) => {
			const { children, contexts } = props2;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LogLevelContext.Provider, {
				value: contexts.logLevelContext,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanUseRemotionHooks.Provider, {
					value: contexts.canUseRemotionHooksContext,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PreloadContext.Provider, {
						value: contexts.preloadContext,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionManager.Provider, {
							value: contexts.compositionManagerCtx,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceManagerRefContext.Provider, {
								value: contexts.sequenceManagerRefContext,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceManager.Provider, {
									value: contexts.sequenceManagerContext,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VisualModePropStatusesRefContext.Provider, {
										value: contexts.visualModePropStatusesRefContext,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenderAssetManager.Provider, {
											value: contexts.renderAssetManagerContext,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResolveCompositionContext.Provider, {
												value: contexts.resolveCompositionContext,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TimelineContext.Provider, {
													value: contexts.timelineContext,
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SetTimelineContext.Provider, {
														value: contexts.setTimelineContext,
														children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceContext.Provider, {
															value: contexts.sequenceContext,
															children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BufferingContextReact.Provider, {
																value: contexts.bufferManagerContext,
																children
															})
														})
													})
												})
											})
										})
									})
								})
							})
						})
					})
				})
			});
		};
		var Internals = {
			AbsoluteFillElement,
			MaxMediaCacheSizeContext,
			getMediabunnyInputResourceKey,
			globalMediaResourceManager,
			makeMediaResourceManager,
			MEDIABUNNY_DURATION_VALUE_KEY,
			makeRenderResourceManager,
			RenderResourceManagerContext,
			createRuntimeValueStore,
			useUnsafeVideoConfig,
			useFrameForVolumeProp,
			useTimelinePosition,
			useAbsoluteTimelinePosition,
			useIsInsideFreeze,
			useMediaAudioState,
			evaluateVolume,
			getAbsoluteSrc: getAbsoluteSrc$1,
			getAnimatedImageDurationInSeconds,
			getAssetDisplayName,
			Timeline: exports_timeline_position_state,
			validateMediaTrimProps,
			validateMediaProps,
			resolveTrimProps,
			VideoForPreview,
			CompositionManager,
			CompositionSetters,
			VisualModePropStatusesContext,
			VisualModePropStatusesRefContext,
			VisualModeDragOverridesContext,
			VisualModeSettersContext,
			SequenceManager,
			SequenceManagerProvider,
			SequenceManagerRefContext,
			SequenceRegistrationContext,
			CommitOrderInternals,
			SequenceStackTracesUpdateContext,
			baseSchema,
			sequenceSchema: sequenceSchema$1,
			SequenceWithoutSchema,
			sequenceStyleSchema,
			sequenceVisualStyleSchema,
			sequencePremountSchema: sequencePremountSchema$1,
			sequenceCropSchema,
			textSchema,
			transformSchema: transformSchema$1,
			premountSchema,
			flattenActiveSchema,
			getFlatSchemaWithAllKeys,
			RemotionRootContexts,
			CompositionManagerProvider,
			useVideo,
			getRoot,
			useMediaVolumeState,
			usePlayerMutedState,
			useMediaInTimeline,
			useLazyComponent,
			truthy: truthy$1,
			SequenceContext,
			PremountContext,
			usePremounting,
			useRemotionContexts,
			RemotionContextProvider,
			CSSUtils: exports_default_css,
			setupEnvVariables,
			MediaVolumeContext,
			SetMediaVolumeContext,
			getRemotionEnvironment,
			SharedAudioContext,
			SharedAudioContextProvider,
			SharedAudioTagsContext,
			SharedAudioTagsContextProvider,
			invalidCompositionErrorMessage,
			invalidFolderNameErrorMessage,
			calculateMediaDuration,
			isCompositionIdValid,
			isFolderNameValid,
			getPreviewDomElement,
			compositionsRef,
			portalNode,
			setPortalNodeCurrentScale,
			waitForRoot,
			SetTimelineContext,
			CanUseRemotionHooksProvider,
			CanUseRemotionHooks,
			DisableInteractivityProvider,
			PrefetchProvider,
			DurationsContextProvider,
			IsPlayerContextProvider,
			useIsPlayer,
			EditorPropsProvider,
			EditorPropsContext,
			usePreload,
			resolveVideoConfig,
			resolveVideoConfigOrCatch,
			resolveVideoConfigWithMetadataOrCatch,
			ResolveCompositionContext,
			useResolvedVideoConfig,
			resolveCompositionsRef,
			REMOTION_STUDIO_CONTAINER_ELEMENT,
			RenderAssetManager,
			persistCurrentFrame,
			usePlaybackRate,
			useTimelineContext,
			useTimelineSetFrame,
			isIosSafari,
			WATCH_REMOTION_STATIC_FILES,
			addSequenceStackTraces,
			useMediaStartsAt,
			BufferingProvider,
			BufferingContextReact,
			getComponentsToAddStacksTo,
			getSequenceComponent,
			getSingleChildComponent,
			getStackForControls,
			REMOTION_INTERNAL_STACK_PROP,
			setComponentIdentityResolver,
			CurrentScaleContext,
			PixelDensityContext,
			PreviewSizeContext,
			calculateScale,
			validateRenderAsset,
			Log,
			LogLevelContext,
			useLogLevel,
			playbackLogging,
			timeValueRef,
			compositionSelectorRef: (0, react.createRef)(),
			RemotionEnvironmentContext,
			warnAboutTooHighVolume,
			AudioForPreview,
			OBJECTFIT_CONTAIN_CLASS_NAME,
			InnerOffthreadVideo,
			useBasicMediaInTimeline,
			getInputPropsOverride,
			setInputPropsOverride,
			useVideoEnabled,
			useAudioEnabled,
			useBuffering,
			TimelinePosition: exports_timeline_position_state,
			DelayRenderContextType,
			TimelineContext,
			usePlaying,
			PlaybackRateContext,
			AbsoluteTimeContext,
			RenderAssetManagerProvider,
			getEffectiveVisualModeValue,
			CompositionRenderErrorContext,
			useEffectChainState,
			createEffectChainState,
			cleanupEffectChainState,
			runEffectChain,
			useMemoizedEffects,
			useMemoizedEffectDefinitions,
			createEffect,
			createWebGLContextError,
			createWebGL2ContextError,
			computeEffectiveSchemaValuesDotNotation,
			interpolateKeyframedStatus,
			makeStaticDragOverride,
			makeKeyframedDragOverride,
			resolveDragOverrideValue,
			getStaticDragOverrideValue,
			OverrideIdsToNodePathsGettersContext,
			OverrideIdsToNodePathsSettersContext,
			findPropsToDelete: findPropsToDelete$1,
			makeSequencePropsSubscriptionKey,
			getPropStatusesCtx,
			getEffectPropStatusesCtx,
			hiddenField,
			durationInFramesField,
			freezeField,
			fromField,
			resolveSequenceCrop,
			useCropStyle
		};
		Object.assign(Internals, { useSyncExternalStore: useSyncExternalStore2 });
		var flattenChildren = (children) => {
			return react.default.Children.toArray(children).reduce((flatChildren, child) => {
				if (child.type === react.default.Fragment) return flatChildren.concat(flattenChildren(child.props.children));
				flatChildren.push(child);
				return flatChildren;
			}, []);
		};
		var seriesSequenceSchema = {
			durationInFrames: Interactive.baseSchema.durationInFrames,
			name: Interactive.sequenceSchema.name,
			hidden: Interactive.sequenceSchema.hidden,
			showInTimeline: Interactive.sequenceSchema.showInTimeline,
			freeze: Interactive.baseSchema.freeze,
			trimBefore: Interactive.sequenceSchema.trimBefore,
			layout: Interactive.sequenceSchema.layout
		};
		var SeriesSequenceInner = (0, react.forwardRef)(({ offset = 0, className = "", _remotionInternalRender = null, ...props2 }, ref) => {
			useRequireToBeInsideSeries();
			if (_remotionInternalRender) return _remotionInternalRender({
				...props2,
				offset,
				className: className || void 0
			}, ref);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IsNotInsideSeriesProvider, { children: props2.children });
		});
		var SeriesSequence = Interactive.withSchema({
			Component: SeriesSequenceInner,
			componentName: "<Series.Sequence>",
			componentIdentity: "dev.remotion.remotion.Series.Sequence",
			schema: seriesSequenceSchema,
			supportsEffects: false
		});
		var SequenceWithoutSchemaWithRef = SequenceWithoutSchema;
		var validateSeriesSequenceProps = ({ durationInFrames, offset: offsetProp, index, childrenLength }) => {
			const debugInfo = `index = ${index}, duration = ${durationInFrames}`;
			if (index !== childrenLength - 1 || durationInFrames !== Infinity) validateDurationInFrames$2(durationInFrames, {
				component: `of a <Series.Sequence /> component`,
				allowFloats: true
			});
			const offset = offsetProp ?? 0;
			if (Number.isNaN(offset)) throw new TypeError(`The "offset" property of a <Series.Sequence /> must not be NaN, but got NaN (${debugInfo}).`);
			if (!Number.isFinite(offset)) throw new TypeError(`The "offset" property of a <Series.Sequence /> must be finite, but got ${offset} (${debugInfo}).`);
			if (offset % 1 !== 0) throw new TypeError(`The "offset" property of a <Series.Sequence /> must be finite, but got ${offset} (${debugInfo}).`);
			return offset;
		};
		var SeriesInner = (props2) => {
			const childrenValue = (0, react.useMemo)(() => {
				const flattenedChildren = flattenChildren(props2.children);
				const renderChildren = (i, startFrame) => {
					if (i === flattenedChildren.length) return null;
					const castedChild = flattenedChildren[i];
					if (typeof castedChild === "string") {
						if (castedChild.trim() === "") return renderChildren(i + 1, startFrame);
						throw new TypeError(`The <Series /> component only accepts a list of <Series.Sequence /> components as its children, but you passed a string "${castedChild}"`);
					}
					if (castedChild.type !== SeriesSequence) throw new TypeError(`The <Series /> component only accepts a list of <Series.Sequence /> components as its children, but got ${castedChild} instead`);
					const castedElement = castedChild;
					validateSeriesSequenceProps({
						durationInFrames: castedElement.props.durationInFrames,
						offset: castedElement.props.offset,
						index: i,
						childrenLength: flattenedChildren.length
					});
					return react.default.cloneElement(castedElement, { _remotionInternalRender: (resolvedProps, ref) => {
						const durationInFramesProp = resolvedProps.durationInFrames;
						const { durationInFrames: _durationInFrames, children: sequenceChildren, offset: offsetProp, controls, from: _from, name, ...passedProps } = resolvedProps;
						const offset = validateSeriesSequenceProps({
							durationInFrames: durationInFramesProp,
							offset: offsetProp,
							index: i,
							childrenLength: flattenedChildren.length
						});
						const currentStartFrame = startFrame + offset;
						const nextStartFrame = startFrame + durationInFramesProp + offset;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SequenceWithoutSchemaWithRef, {
							ref,
							name: name || "<Series.Sequence>",
							_remotionInternalDocumentationLink: name ? void 0 : "https://www.remotion.dev/docs/series",
							controls: controls ?? void 0,
							from: currentStartFrame,
							durationInFrames: durationInFramesProp,
							...passedProps,
							_remotionInternalSingleChildComponent: getSingleChildComponent(sequenceChildren),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IsNotInsideSeriesProvider, { children: sequenceChildren })
						}), renderChildren(i + 1, nextStartFrame)] });
					} });
				};
				return renderChildren(0, 0);
			}, [props2.children]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				layout: "none",
				name: "<Series>",
				_remotionInternalDocumentationLink: "https://www.remotion.dev/docs/series",
				...props2,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IsInsideSeriesContainer, { children: childrenValue })
			});
		};
		var Series = Object.assign(withInteractivitySchema({
			Component: SeriesInner,
			componentName: "<Series>",
			componentIdentity: "dev.remotion.remotion.Series",
			schema: sequenceSchemaDefaultLayoutNone,
			supportsEffects: false
		}), { Sequence: SeriesSequence });
		addSequenceStackTraces(Series);
		var Still = (props2) => {
			const newProps = {
				...props2,
				durationInFrames: 1,
				fps: 1
			};
			return react.default.createElement(Composition, newProps);
		};
		addSequenceStackTraces(Still);
		var roundTo6Commas = (num) => {
			return Math.round(num * 1e5) / 1e5;
		};
		var seekToTime = ({ element, desiredTime, logLevel, mountTime }) => {
			if (isApproximatelyTheSame(element.currentTime, desiredTime)) return {
				wait: Promise.resolve(desiredTime),
				cancel: () => {}
			};
			seek({
				logLevel,
				mediaRef: element,
				time: desiredTime,
				why: "Seeking during rendering",
				mountTime
			});
			let cancel;
			let cancelSeeked = null;
			const prom = new Promise((resolve) => {
				cancel = element.requestVideoFrameCallback((now, metadata) => {
					const displayIn = metadata.expectedDisplayTime - now;
					if (displayIn <= 0) {
						resolve(metadata.mediaTime);
						return;
					}
					setTimeout(() => {
						resolve(metadata.mediaTime);
					}, displayIn + 150);
				});
			});
			const waitForSeekedEvent = new Promise((resolve) => {
				const onDone = () => {
					resolve();
				};
				element.addEventListener("seeked", onDone, { once: true });
				cancelSeeked = () => {
					element.removeEventListener("seeked", onDone);
				};
			});
			return {
				wait: Promise.all([prom, waitForSeekedEvent]).then(([time]) => time),
				cancel: () => {
					cancelSeeked?.();
					element.cancelVideoFrameCallback(cancel);
				}
			};
		};
		var seekToTimeMultipleUntilRight = ({ element, desiredTime, fps, logLevel, mountTime }) => {
			const threshold = 1 / fps / 2;
			let currentCancel = () => {};
			if (Number.isFinite(element.duration) && element.currentTime >= element.duration && desiredTime >= element.duration) return {
				prom: Promise.resolve(),
				cancel: () => {}
			};
			return {
				prom: new Promise((resolve, reject) => {
					const firstSeek = seekToTime({
						element,
						desiredTime: desiredTime + threshold,
						logLevel,
						mountTime
					});
					firstSeek.wait.then((seekedTo) => {
						if (Math.abs(desiredTime - seekedTo) <= threshold) return resolve();
						const newSeek = seekToTime({
							element,
							desiredTime: seekedTo + threshold * (desiredTime > seekedTo ? 1 : -1),
							logLevel,
							mountTime
						});
						currentCancel = newSeek.cancel;
						newSeek.wait.then((newTime) => {
							if (roundTo6Commas(Math.abs(desiredTime - newTime)) <= roundTo6Commas(threshold)) return resolve();
							const thirdSeek = seekToTime({
								element,
								desiredTime: desiredTime + threshold,
								logLevel,
								mountTime
							});
							currentCancel = thirdSeek.cancel;
							return thirdSeek.wait.then(() => {
								resolve();
							}).catch((err) => {
								reject(err);
							});
						}).catch((err) => {
							reject(err);
						});
					});
					currentCancel = firstSeek.cancel;
				}),
				cancel: () => {
					currentCancel();
				}
			};
		};
		var VideoForRenderingForwardFunction = ({ onError, volume: volumeProp, allowAmplificationDuringRender, playbackRate, onDuration, toneFrequency, name, acceptableTimeShiftInSeconds, delayRenderRetries, delayRenderTimeoutInMilliseconds, loopVolumeCurveBehavior, audioStreamIndex, onVideoFrame, preservePitch: _preservePitch, ...props2 }, ref) => {
			const absoluteFrame = useTimelinePosition();
			const frame = useCurrentFrame();
			const volumePropsFrame = useFrameForVolumeProp(loopVolumeCurveBehavior ?? "repeat");
			const videoConfig = useUnsafeVideoConfig();
			const videoRef = (0, react.useRef)(null);
			const sequenceContext = (0, react.useContext)(SequenceContext);
			const mediaStartsAt = useMediaStartsAt();
			const environment = useRemotionEnvironment();
			const logLevel = useLogLevel();
			const mountTime = useMountTime();
			const { delayRender: delayRender2, continueRender: continueRender2 } = useDelayRender();
			const { registerRenderAsset, unregisterRenderAsset } = (0, react.useContext)(RenderAssetManager);
			const id = (0, react.useMemo)(() => `video-${random(props2.src ?? "")}-${sequenceContext?.cumulatedFrom}-${sequenceContext?.relativeFrom}-${sequenceContext?.durationInFrames}`, [
				props2.src,
				sequenceContext?.cumulatedFrom,
				sequenceContext?.relativeFrom,
				sequenceContext?.durationInFrames
			]);
			const volume = evaluateVolume({
				volume: volumeProp,
				frame: volumePropsFrame,
				mediaVolume: 1
			});
			warnAboutTooHighVolume(volume);
			const audioEnabled = useAudioEnabled();
			const { shouldUseAudio } = useMediaAudioState({
				muted: props2.muted ?? false,
				volume,
				audioEnabled
			});
			if (!videoConfig) throw new Error("No video config found");
			(0, react.useEffect)(() => {
				if (!props2.src) throw new Error("No src passed");
				if (!shouldUseAudio) return;
				registerRenderAsset({
					type: "video",
					src: getAbsoluteSrc$1(props2.src),
					id,
					frame: absoluteFrame,
					volume,
					mediaFrame: frame,
					playbackRate: playbackRate ?? 1,
					toneFrequency: toneFrequency ?? 1,
					audioStartFrame: Math.max(0, -(sequenceContext?.cumulatedNegativeFrom ?? 0)),
					audioStreamIndex: audioStreamIndex ?? 0
				});
				return () => unregisterRenderAsset(id);
			}, [
				shouldUseAudio,
				props2.src,
				registerRenderAsset,
				id,
				unregisterRenderAsset,
				volume,
				frame,
				absoluteFrame,
				playbackRate,
				toneFrequency,
				sequenceContext?.cumulatedNegativeFrom,
				audioStreamIndex
			]);
			(0, react.useImperativeHandle)(ref, () => {
				return videoRef.current;
			}, []);
			useEmitVideoFrame({
				ref: videoRef,
				onVideoFrame
			});
			(0, react.useEffect)(() => {
				if (!window.remotion_videoEnabled) return;
				const { current } = videoRef;
				if (!current) return;
				const currentTime = getMediaTime({
					frame,
					playbackRate: playbackRate || 1,
					startFrom: -mediaStartsAt,
					fps: videoConfig.fps
				});
				const handle = delayRender2(`Rendering <Html5Video /> with src="${props2.src}" at time ${currentTime}`, {
					retries: delayRenderRetries ?? void 0,
					timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
				});
				if (window.process?.env?.NODE_ENV === "test") {
					continueRender2(handle);
					return;
				}
				if (isApproximatelyTheSame(current.currentTime, currentTime)) {
					if (current.readyState >= 2) {
						continueRender2(handle);
						return;
					}
					const loadedDataHandler = () => {
						continueRender2(handle);
					};
					current.addEventListener("loadeddata", loadedDataHandler, { once: true });
					return () => {
						current.removeEventListener("loadeddata", loadedDataHandler);
					};
				}
				const endedHandler = () => {
					continueRender2(handle);
				};
				const seek2 = seekToTimeMultipleUntilRight({
					element: current,
					desiredTime: currentTime,
					fps: videoConfig.fps,
					logLevel,
					mountTime
				});
				seek2.prom.then(() => {
					continueRender2(handle);
				});
				current.addEventListener("ended", endedHandler, { once: true });
				const errorHandler = () => {
					if (current?.error) {
						console.error("Error occurred in video", current?.error);
						if (onError) return;
						throw new MediaPlaybackError({
							message: `The browser threw an error while playing the video ${props2.src}: Code ${current.error.code} - ${current?.error?.message}. See https://remotion.dev/docs/media-playback-error for help. Pass an onError() prop to handle the error.`,
							src: props2.src
						});
					} else throw new MediaPlaybackError({
						message: "The browser threw an error",
						src: props2.src
					});
				};
				current.addEventListener("error", errorHandler, { once: true });
				return () => {
					seek2.cancel();
					current.removeEventListener("ended", endedHandler);
					current.removeEventListener("error", errorHandler);
					continueRender2(handle);
				};
			}, [
				volumePropsFrame,
				props2.src,
				playbackRate,
				videoConfig.fps,
				frame,
				mediaStartsAt,
				onError,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				logLevel,
				mountTime,
				continueRender2,
				delayRender2
			]);
			const { src } = props2;
			if (environment.isRendering) (0, react.useLayoutEffect)(() => {
				if (window.process?.env?.NODE_ENV === "test") return;
				const newHandle = delayRender2("Loading <Html5Video> duration with src=" + src, {
					retries: delayRenderRetries ?? void 0,
					timeoutInMilliseconds: delayRenderTimeoutInMilliseconds ?? void 0
				});
				const { current } = videoRef;
				const didLoad = () => {
					if (current?.duration) onDuration(src, current.duration);
					continueRender2(newHandle);
				};
				if (current?.duration) {
					onDuration(src, current.duration);
					continueRender2(newHandle);
				} else current?.addEventListener("loadedmetadata", didLoad, { once: true });
				return () => {
					current?.removeEventListener("loadedmetadata", didLoad);
					continueRender2(newHandle);
				};
			}, [
				src,
				onDuration,
				delayRenderRetries,
				delayRenderTimeoutInMilliseconds,
				continueRender2,
				delayRender2
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
				ref: videoRef,
				disableRemotePlayback: true,
				...props2
			});
		};
		var VideoForRendering = (0, react.forwardRef)(VideoForRenderingForwardFunction);
		var VideoForwardingFunction = (props2, ref) => {
			const { startFrom, endAt, trimBefore, trimAfter, name, pauseWhenBuffering, _remotionInternalStack, _remotionInternalNativeLoopPassed, showInTimeline, onAutoPlayError, onVideoFrame, ...otherProps } = props2;
			const { loop, ...propsOtherThanLoop } = props2;
			const { fps } = useVideoConfig();
			const environment = useRemotionEnvironment();
			const shouldPauseWhenBuffering = resolveV5Default(pauseWhenBuffering);
			if (environment.isClientSideRendering) throw new Error("<Html5Video> is not supported in @remotion/web-renderer. Use <Video> from @remotion/media instead. See https://remotion.dev/docs/client-side-rendering/limitations");
			const { durations, setDurations } = (0, react.useContext)(DurationsContext);
			if (typeof ref === "string") throw new Error("string refs are not supported");
			if (typeof props2.src !== "string") throw new TypeError(`The \`<Html5Video>\` tag requires a string for \`src\`, but got ${JSON.stringify(props2.src)} instead.`);
			const preloadedSrc = usePreload(props2.src);
			const onDuration = (0, react.useCallback)((src, durationInSeconds) => {
				setDurations({
					type: "got-duration",
					durationInSeconds,
					src
				});
			}, [setDurations]);
			const durationFetched = durations[getAbsoluteSrc$1(preloadedSrc)] ?? durations[getAbsoluteSrc$1(props2.src)];
			validateMediaTrimProps({
				startFrom,
				endAt,
				trimBefore,
				trimAfter
			});
			const { trimBeforeValue, trimAfterValue } = resolveTrimProps({
				startFrom,
				endAt,
				trimBefore,
				trimAfter
			});
			if (loop && durationFetched !== void 0) {
				if (!Number.isFinite(durationFetched)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Html5Video, {
					...propsOtherThanLoop,
					ref,
					_remotionInternalStack,
					_remotionInternalNativeLoopPassed: true
				});
				const mediaDuration = durationFetched * fps;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Loop, {
					durationInFrames: calculateMediaDuration({
						trimAfter: trimAfterValue,
						mediaDurationInFrames: mediaDuration,
						playbackRate: props2.playbackRate ?? 1,
						trimBefore: trimBeforeValue
					}),
					layout: "none",
					name,
					showInTimeline: false,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Html5Video, {
						...propsOtherThanLoop,
						ref,
						_remotionInternalStack,
						_remotionInternalNativeLoopPassed: true
					})
				});
			}
			if (typeof trimBeforeValue !== "undefined" || typeof trimAfterValue !== "undefined") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				layout: "none",
				from: 0 - (trimBeforeValue ?? 0),
				showInTimeline: false,
				durationInFrames: trimAfterValue === void 0 ? void 0 : trimAfterValue / (props2.playbackRate ?? 1),
				name,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Html5Video, {
					pauseWhenBuffering: shouldPauseWhenBuffering,
					onVideoFrame,
					...otherProps,
					ref,
					_remotionInternalStack
				})
			});
			validateMediaProps({
				playbackRate: props2.playbackRate,
				preservePitch: props2.preservePitch,
				volume: props2.volume
			}, "Html5Video");
			if (environment.isRendering) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoForRendering, {
				onDuration,
				onVideoFrame: onVideoFrame ?? null,
				...otherProps,
				ref
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoForPreview, {
				onlyWarnForMediaSeekingError: false,
				...otherProps,
				ref,
				onVideoFrame: onVideoFrame ?? null,
				pauseWhenBuffering: shouldPauseWhenBuffering,
				onDuration,
				_remotionInternalStack: _remotionInternalStack ?? null,
				_remotionInternalNativeLoopPassed: _remotionInternalNativeLoopPassed ?? false,
				showInTimeline: showInTimeline ?? true,
				onAutoPlayError: onAutoPlayError ?? void 0
			});
		};
		var Html5Video = (0, react.forwardRef)(VideoForwardingFunction);
		addSequenceStackTraces(Html5Video);
		checkMultipleRemotionVersions();
		var Config = new Proxy({}, { get(_, prop) {
			if (prop === "Bundling" || prop === "Rendering" || prop === "Log" || prop === "Puppeteer" || prop === "Output") return Config;
			return () => {
				console.warn("⚠️  The CLI configuration has been extracted from Remotion Core.");
				console.warn("Update the import from the config file:");
				console.warn();
				console.warn("- Delete:");
				console.warn("import {Config} from \"remotion\";");
				console.warn("+ Replace:");
				console.warn("import {Config} from \"@remotion/cli/config\";");
				console.warn();
				console.warn("For more information, see https://www.remotion.dev/docs/4-0-migration.");
				process.exit(1);
			};
		} });
		Sequence.displayName = "Sequence";
		addSequenceStackTraces(Sequence);
		setSequenceComponent(Sequence);
		addSequenceStackTraces(Composition);
		addSequenceStackTraces(Folder);
		//#endregion
		//#region ../../node_modules/remotion/dist/esm/no-react.mjs
		var NEWTON_ITERATIONS = 4;
		var NEWTON_MIN_SLOPE = .001;
		var SUBDIVISION_PRECISION = 1e-7;
		var SUBDIVISION_MAX_ITERATIONS = 10;
		var kSplineTableSize = 11;
		var kSampleStepSize = 1 / (kSplineTableSize - 1);
		var float32ArraySupported = typeof Float32Array === "function";
		function a(aA1, aA2) {
			return 1 - 3 * aA2 + 3 * aA1;
		}
		function b(aA1, aA2) {
			return 3 * aA2 - 6 * aA1;
		}
		function c(aA1) {
			return 3 * aA1;
		}
		function calcBezier(aT, aA1, aA2) {
			return ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
		}
		function getSlope(aT, aA1, aA2) {
			return 3 * a(aA1, aA2) * aT * aT + 2 * b(aA1, aA2) * aT + c(aA1);
		}
		function binarySubdivide({ aX, _aA, _aB, mX1, mX2 }) {
			let currentX;
			let currentT;
			let i = 0;
			let aA = _aA;
			let aB = _aB;
			do {
				currentT = aA + (aB - aA) / 2;
				currentX = calcBezier(currentT, mX1, mX2) - aX;
				if (currentX > 0) aB = currentT;
				else aA = currentT;
			} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
			return currentT;
		}
		function newtonRaphsonIterate(aX, _aGuessT, mX1, mX2) {
			let aGuessT = _aGuessT;
			for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
				const currentSlope = getSlope(aGuessT, mX1, mX2);
				if (currentSlope === 0) return aGuessT;
				const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
				aGuessT -= currentX / currentSlope;
			}
			return aGuessT;
		}
		function bezier(mX1, mY1, mX2, mY2) {
			if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) throw new Error("bezier x values must be in [0, 1] range");
			const sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
			if (mX1 !== mY1 || mX2 !== mY2) for (let i = 0; i < kSplineTableSize; ++i) sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
			function getTForX(aX) {
				let intervalStart = 0;
				let currentSample = 1;
				const lastSample = kSplineTableSize - 1;
				for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) intervalStart += kSampleStepSize;
				--currentSample;
				const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
				const guessForT = intervalStart + dist * kSampleStepSize;
				const initialSlope = getSlope(guessForT, mX1, mX2);
				if (initialSlope >= NEWTON_MIN_SLOPE) return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
				if (initialSlope === 0) return guessForT;
				return binarySubdivide({
					aX,
					_aA: intervalStart,
					_aB: intervalStart + kSampleStepSize,
					mX1,
					mX2
				});
			}
			return function(x) {
				const clampedX = Math.min(1, Math.max(0, x));
				if (mX1 === mY1 && mX2 === mY2) return clampedX;
				if (clampedX === 0) return 0;
				if (clampedX === 1) return 1;
				return calcBezier(getTForX(clampedX), mY1, mY2);
			};
		}
		var validateFrame = ({ allowFloats, durationInFrames, frame }) => {
			if (typeof frame === "undefined") throw new TypeError(`Argument missing for parameter "frame"`);
			if (typeof frame !== "number") throw new TypeError(`Argument passed for "frame" is not a number: ${frame}`);
			if (!Number.isFinite(frame)) throw new RangeError(`Frame ${frame} is not finite`);
			if (frame % 1 !== 0 && !allowFloats) throw new RangeError(`Argument for frame must be an integer, but got ${frame}`);
			if (frame < 0 && frame < -durationInFrames) throw new RangeError(`Cannot use frame ${frame}: Duration of composition is ${durationInFrames}, therefore the lowest frame that can be rendered is ${-durationInFrames}`);
			if (frame > durationInFrames - 1) throw new RangeError(`Cannot use frame ${frame}: Duration of composition is ${durationInFrames}, therefore the highest frame that can be rendered is ${durationInFrames - 1}`);
		};
		function validateFps$1(fps, location, isGif) {
			if (typeof fps !== "number") throw new Error(`"fps" must be a number, but you passed a value of type ${typeof fps} ${location}`);
			if (!Number.isFinite(fps)) throw new Error(`"fps" must be a finite, but you passed ${fps} ${location}`);
			if (isNaN(fps)) throw new Error(`"fps" must not be NaN, but got ${fps} ${location}`);
			if (fps <= 0) throw new TypeError(`"fps" must be positive, but got ${fps} ${location}`);
			if (isGif && fps > 50) throw new TypeError(`The FPS for a GIF cannot be higher than 50. Use the --every-nth-frame option to lower the FPS: https://remotion.dev/docs/render-as-gif`);
		}
		var validateSpringDuration = (dur) => {
			if (typeof dur === "undefined") return;
			if (typeof dur !== "number") throw new TypeError(`A "duration" of a spring must be a "number" but is "${typeof dur}"`);
			if (Number.isNaN(dur)) throw new TypeError("A \"duration\" of a spring is NaN, which it must not be");
			if (!Number.isFinite(dur)) throw new TypeError("A \"duration\" of a spring must be finite, but is " + dur);
			if (dur <= 0) throw new TypeError("A \"duration\" of a spring must be positive, but is " + dur);
		};
		var defaultSpringConfig = {
			damping: 10,
			mass: 1,
			stiffness: 100,
			overshootClamping: false
		};
		var advanceCache = {};
		function advance({ animation, now, config }) {
			const { toValue, lastTimestamp, current, velocity } = animation;
			const deltaTime = Math.min(now - lastTimestamp, 64);
			if (config.damping <= 0) throw new Error("Spring damping must be greater than 0, otherwise the spring() animation will never end, causing an infinite loop.");
			const c2 = config.damping;
			const m = config.mass;
			const k = config.stiffness;
			const cacheKey = [
				toValue,
				lastTimestamp,
				current,
				velocity,
				c2,
				m,
				k,
				now
			].join("-");
			if (advanceCache[cacheKey]) return advanceCache[cacheKey];
			const v0 = -velocity;
			const x0 = toValue - current;
			const zeta = c2 / (2 * Math.sqrt(k * m));
			const omega0 = Math.sqrt(k / m);
			const omega1 = omega0 * Math.sqrt(1 - zeta ** 2);
			const t = deltaTime / 1e3;
			const sin1 = Math.sin(omega1 * t);
			const cos1 = Math.cos(omega1 * t);
			const underDampedEnvelope = Math.exp(-zeta * omega0 * t);
			const underDampedFrag1 = underDampedEnvelope * (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
			const underDampedPosition = toValue - underDampedFrag1;
			const underDampedVelocity = zeta * omega0 * underDampedFrag1 - underDampedEnvelope * (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1);
			const criticallyDampedEnvelope = Math.exp(-omega0 * t);
			const criticallyDampedPosition = toValue - criticallyDampedEnvelope * (x0 + (v0 + omega0 * x0) * t);
			const criticallyDampedVelocity = criticallyDampedEnvelope * (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0);
			const animationNode = {
				toValue,
				prevPosition: current,
				lastTimestamp: now,
				current: zeta < 1 ? underDampedPosition : criticallyDampedPosition,
				velocity: zeta < 1 ? underDampedVelocity : criticallyDampedVelocity
			};
			advanceCache[cacheKey] = animationNode;
			return animationNode;
		}
		var calculationCache = {};
		function springCalculation({ frame, fps, config = {} }) {
			const from = 0;
			const to = 1;
			const cacheKey = [
				frame,
				fps,
				config.damping,
				config.mass,
				config.overshootClamping,
				config.stiffness
			].join("-");
			if (calculationCache[cacheKey]) return calculationCache[cacheKey];
			let animation = {
				lastTimestamp: 0,
				current: from,
				toValue: to,
				velocity: 0,
				prevPosition: 0
			};
			const frameClamped = Math.max(0, frame);
			const unevenRest = frameClamped % 1;
			for (let f = 0; f <= Math.floor(frameClamped); f++) {
				const time = f / fps * 1e3;
				animation = advance({
					animation,
					now: time,
					config: {
						...defaultSpringConfig,
						...config
					}
				});
			}
			if (unevenRest > 0) animation = advance({
				animation,
				now: frameClamped / fps * 1e3,
				config: {
					...defaultSpringConfig,
					...config
				}
			});
			calculationCache[cacheKey] = animation;
			return animation;
		}
		var cache = /* @__PURE__ */ new Map();
		function measureSpring({ fps, config = {}, threshold = .005 }) {
			if (typeof threshold !== "number") throw new TypeError(`threshold must be a number, got ${threshold} of type ${typeof threshold}`);
			if (threshold === 0) return Infinity;
			if (threshold === 1) return 0;
			if (isNaN(threshold)) throw new TypeError("Threshold is NaN");
			if (!Number.isFinite(threshold)) throw new TypeError("Threshold is not finite");
			if (threshold < 0) throw new TypeError("Threshold is below 0");
			const cacheKey = [
				fps,
				config.damping,
				config.mass,
				config.overshootClamping,
				config.stiffness,
				threshold
			].join("-");
			if (cache.has(cacheKey)) return cache.get(cacheKey);
			validateFps$1(fps, "to the measureSpring() function", false);
			let frame = 0;
			let finishedFrame = 0;
			const calc = () => {
				return springCalculation({
					fps,
					frame,
					config
				});
			};
			let animation = calc();
			const calcDifference = () => {
				return Math.abs(animation.current - animation.toValue);
			};
			let difference = calcDifference();
			while (difference >= threshold) {
				frame++;
				animation = calc();
				difference = calcDifference();
			}
			finishedFrame = frame;
			for (let i = 0; i < 20; i++) {
				frame++;
				animation = calc();
				difference = calcDifference();
				if (difference >= threshold) {
					i = 0;
					finishedFrame = frame + 1;
				}
			}
			cache.set(cacheKey, finishedFrame);
			return finishedFrame;
		}
		function spring({ frame: passedFrame, fps, config = {}, from = 0, to = 1, durationInFrames: passedDurationInFrames, durationRestThreshold, delay = 0, reverse = false }) {
			validateSpringDuration(passedDurationInFrames);
			validateFrame({
				frame: passedFrame,
				durationInFrames: Infinity,
				allowFloats: true
			});
			validateFps$1(fps, "to spring()", false);
			const needsToCalculateNaturalDuration = reverse || typeof passedDurationInFrames !== "undefined";
			const naturalDuration = needsToCalculateNaturalDuration ? measureSpring({
				fps,
				config,
				threshold: durationRestThreshold
			}) : void 0;
			const naturalDurationGetter = needsToCalculateNaturalDuration ? { get: () => naturalDuration } : { get: () => {
				throw new Error("did not calculate natural duration, this is an error with Remotion. Please report");
			} };
			const delayProcessed = (reverse ? (passedDurationInFrames ?? naturalDurationGetter.get()) - passedFrame : passedFrame) + (reverse ? delay : -delay);
			const durationProcessed = passedDurationInFrames === void 0 ? delayProcessed : delayProcessed / (passedDurationInFrames / naturalDurationGetter.get());
			if (passedDurationInFrames && delayProcessed > passedDurationInFrames) return to;
			const spr = springCalculation({
				fps,
				frame: durationProcessed,
				config
			});
			const inner = config.overshootClamping ? to >= from ? Math.min(spr.current, to) : Math.max(spr.current, to) : spr.current;
			return from === 0 && to === 1 ? inner : interpolate(inner, [0, 1], [from, to]);
		}
		var clampUnit = (t) => Math.min(1, Math.max(0, t));
		var springEasingDurationInFrames = 30;
		var Easing = class Easing {
			static step0(n) {
				return n > 0 ? 1 : 0;
			}
			static step1(n) {
				return n >= 1 ? 1 : 0;
			}
			static linear(t) {
				return t;
			}
			static ease(t) {
				return Easing.bezier(.42, 0, 1, 1)(t);
			}
			static quad(t) {
				return t * t;
			}
			static cubic(t) {
				return t * t * t;
			}
			static poly(n) {
				return (t) => t ** n;
			}
			static sin(t) {
				return 1 - Math.cos(t * Math.PI / 2);
			}
			static circle(t) {
				const u = clampUnit(t);
				return 1 - Math.sqrt(1 - u * u);
			}
			static exp(t) {
				return 2 ** (10 * (t - 1));
			}
			static elastic(bounciness = 1) {
				const p = bounciness * Math.PI;
				return (t) => 1 - Math.cos(t * Math.PI / 2) ** 3 * Math.cos(t * p);
			}
			static back(s = 1.70158) {
				return (t) => t * t * ((s + 1) * t - s);
			}
			static spring({ allowTail = false, durationRestThreshold, ...config } = {}) {
				const easing = (t) => {
					if (t <= 0) return 0;
					if (!allowTail && t >= 1) return 1;
					if (allowTail) return spring({
						fps: springEasingDurationInFrames,
						frame: t * measureSpring({
							fps: springEasingDurationInFrames,
							config,
							threshold: durationRestThreshold
						}),
						config
					});
					return spring({
						fps: springEasingDurationInFrames,
						frame: t * springEasingDurationInFrames,
						config,
						durationInFrames: springEasingDurationInFrames,
						durationRestThreshold
					});
				};
				return Object.assign(easing, { remotionShouldExtendRight: allowTail });
			}
			static bounce(t) {
				const u = clampUnit(t);
				if (u < 1 / 2.75) return 7.5625 * u * u;
				if (u < 2 / 2.75) {
					const t2_ = u - 1.5 / 2.75;
					return 7.5625 * t2_ * t2_ + .75;
				}
				if (u < 2.5 / 2.75) {
					const t2_ = u - 2.25 / 2.75;
					return 7.5625 * t2_ * t2_ + .9375;
				}
				const t2 = u - 2.625 / 2.75;
				return 7.5625 * t2 * t2 + .984375;
			}
			static bezier(x1, y1, x2, y2) {
				return bezier(x1, y1, x2, y2);
			}
			static in(easing) {
				return easing;
			}
			static out(easing) {
				return (t) => 1 - easing(1 - t);
			}
			static inOut(easing) {
				return (t) => {
					if (t < .5) return easing(t * 2) / 2;
					return 1 - easing((1 - t) * 2) / 2;
				};
			}
		};
		var normalizeNumber = (value) => {
			return Math.round(value * 1e6) / 1e6;
		};
		var angleUnits = /* @__PURE__ */ new Set([
			"deg",
			"rad",
			"grad",
			"turn"
		]);
		var lengthUnits = /* @__PURE__ */ new Set([
			"%",
			"cap",
			"ch",
			"cm",
			"cqb",
			"cqh",
			"cqi",
			"cqmax",
			"cqmin",
			"cqw",
			"dvh",
			"dvw",
			"em",
			"ex",
			"ic",
			"in",
			"lh",
			"lvh",
			"lvw",
			"mm",
			"pc",
			"pt",
			"px",
			"q",
			"rem",
			"rlh",
			"svh",
			"svw",
			"vb",
			"vh",
			"vi",
			"vmax",
			"vmin",
			"vw"
		]);
		var cssNumberRegex = /^([+-]?(?:\d+\.?\d*|\.\d+))([a-zA-Z%]+)?$/;
		var transformOriginKeywords = /* @__PURE__ */ new Set([
			"left",
			"center",
			"right",
			"top",
			"bottom"
		]);
		var transformOriginKeywordOptions = (keyword) => {
			if (keyword === "left") return [{
				axis: "x",
				value: {
					value: 0,
					unit: "%"
				}
			}];
			if (keyword === "right") return [{
				axis: "x",
				value: {
					value: 100,
					unit: "%"
				}
			}];
			if (keyword === "top") return [{
				axis: "y",
				value: {
					value: 0,
					unit: "%"
				}
			}];
			if (keyword === "bottom") return [{
				axis: "y",
				value: {
					value: 100,
					unit: "%"
				}
			}];
			return [{
				axis: "x",
				value: {
					value: 50,
					unit: "%"
				}
			}, {
				axis: "y",
				value: {
					value: 50,
					unit: "%"
				}
			}];
		};
		var transformOriginCenter = {
			value: 50,
			unit: "%"
		};
		var stringifyNumber = (value) => {
			return String(normalizeNumber(value));
		};
		var UnsupportedStringInterpolationValueError = class extends TypeError {};
		var parseStringInterpolationComponent = (component, value) => {
			const match = cssNumberRegex.exec(component);
			if (match === null) throw new UnsupportedStringInterpolationValueError(`Cannot interpolate "${value}" because "${component}" is not a supported scale, translate, or rotate value`);
			const unit = match[2] ?? null;
			const numberValue = Number(match[1]);
			if (!Number.isFinite(numberValue)) throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not finite`);
			if (unit === null) return {
				kind: "scale",
				value: numberValue,
				unit: null
			};
			if (angleUnits.has(unit)) return {
				kind: "rotate",
				value: numberValue,
				unit
			};
			if (lengthUnits.has(unit)) return {
				kind: "translate",
				value: numberValue,
				unit
			};
			throw new TypeError(`Cannot interpolate "${value}" because "${unit}" is not a supported translate or rotate unit`);
		};
		var parseTransformOriginLengthPercentage = ({ component, value, allowPercentage }) => {
			const match = cssNumberRegex.exec(component);
			if (match === null) throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not a supported transform-origin ${allowPercentage ? "length-percentage" : "z length"}`);
			const unit = match[2] ?? null;
			const numberValue = Number(match[1]);
			if (!Number.isFinite(numberValue)) throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not finite`);
			if (unit === null || !lengthUnits.has(unit) || !allowPercentage && unit === "%") throw new TypeError(`Cannot interpolate "${value}" because "${component}" is not a supported transform-origin ${allowPercentage ? "length-percentage" : "z length"}`);
			return {
				value: numberValue,
				unit
			};
		};
		var parseTransformOriginToken = (component, value) => {
			const lower = component.toLowerCase();
			if (transformOriginKeywords.has(lower)) return {
				type: "keyword",
				keyword: lower
			};
			return {
				type: "length-percentage",
				parsed: parseTransformOriginLengthPercentage({
					component,
					value,
					allowPercentage: true
				})
			};
		};
		var parseTwoTransformOriginKeywords = (first, second, value) => {
			const candidates = [];
			for (const firstOption of transformOriginKeywordOptions(first)) for (const secondOption of transformOriginKeywordOptions(second)) {
				if (firstOption.axis === secondOption.axis) continue;
				candidates.push(firstOption.axis === "x" ? [firstOption.value, secondOption.value] : [secondOption.value, firstOption.value]);
			}
			if (candidates.length === 0) throw new TypeError(`Cannot interpolate "${value}" because "${first} ${second}" is not a valid transform-origin keyword pair`);
			return candidates[0];
		};
		var parseTransformOriginXY = (parts, value) => {
			if (parts.length === 1) {
				const token = parseTransformOriginToken(parts[0], value);
				if (token.type === "length-percentage") return [token.parsed, transformOriginCenter];
				if (token.keyword === "top" || token.keyword === "bottom") return [transformOriginCenter, transformOriginKeywordOptions(token.keyword)[0].value];
				return [transformOriginKeywordOptions(token.keyword)[0].value, transformOriginCenter];
			}
			const first = parseTransformOriginToken(parts[0], value);
			const second = parseTransformOriginToken(parts[1], value);
			if (first.type === "length-percentage" && second.type === "length-percentage") return [first.parsed, second.parsed];
			if (first.type === "keyword" && second.type === "keyword") return parseTwoTransformOriginKeywords(first.keyword, second.keyword, value);
			const keyword = first.type === "keyword" ? first : second.type === "keyword" ? second : null;
			const length = first.type === "length-percentage" ? first.parsed : second.type === "length-percentage" ? second.parsed : null;
			if (keyword === null || length === null) throw new Error("Expected a keyword and a length-percentage value");
			const keywordIsFirst = first.type === "keyword";
			if (keyword.keyword === "left" || keyword.keyword === "right") {
				if (!keywordIsFirst) throw new TypeError(`Cannot interpolate "${value}" because horizontal transform-origin keywords must come before a length-percentage value`);
				return [transformOriginKeywordOptions(keyword.keyword)[0].value, length];
			}
			if (keyword.keyword === "top" || keyword.keyword === "bottom") return [length, transformOriginKeywordOptions(keyword.keyword)[0].value];
			return keywordIsFirst ? [transformOriginCenter, length] : [length, transformOriginCenter];
		};
		var parseTransformOriginValue = (output, parts) => {
			const [x, y] = parseTransformOriginXY(parts.slice(0, 2), output);
			const z = parts[2] === void 0 ? {
				value: 0,
				unit: null
			} : parseTransformOriginLengthPercentage({
				component: parts[2],
				value: output,
				allowPercentage: false
			});
			return {
				kind: "translate",
				values: [
					x.value,
					y.value,
					z.value,
					0
				],
				units: [
					x.unit,
					y.unit,
					z.unit,
					null
				],
				dimensions: parts[2] === void 0 ? 2 : 3,
				axisRotation: false
			};
		};
		var parseAxisRotationValue = (output) => {
			const parts = output.trim().split(/\s+/);
			const keywordAxis = parts.length === 2 ? parts[0].toLowerCase() : null;
			if (keywordAxis === "x" || keywordAxis === "y" || keywordAxis === "z") {
				const keywordAngle = parseStringInterpolationComponent(parts[1], output);
				if (keywordAngle.kind !== "rotate") return null;
				return {
					kind: "rotate",
					values: keywordAxis === "x" ? [
						1,
						0,
						0,
						keywordAngle.value
					] : keywordAxis === "y" ? [
						0,
						1,
						0,
						keywordAngle.value
					] : [
						0,
						0,
						1,
						keywordAngle.value
					],
					units: [
						null,
						null,
						null,
						keywordAngle.unit
					],
					dimensions: 4,
					axisRotation: true
				};
			}
			if (parts.length !== 4) return null;
			const axis = parts.slice(0, 3).map(Number);
			if (!axis.every(Number.isFinite)) return null;
			const vectorAngle = parseStringInterpolationComponent(parts[3], output);
			if (vectorAngle.kind !== "rotate") return null;
			return {
				kind: "rotate",
				values: [
					axis[0],
					axis[1],
					axis[2],
					vectorAngle.value
				],
				units: [
					null,
					null,
					null,
					vectorAngle.unit
				],
				dimensions: 4,
				axisRotation: true
			};
		};
		var parseStringInterpolationValue = (output) => {
			if (typeof output === "number") {
				if (!Number.isFinite(output)) throw new Error(`outputRange must contain only finite numbers, but got [${output}]`);
				return {
					kind: "scale",
					values: [
						output,
						output,
						1,
						0
					],
					units: [
						null,
						null,
						null,
						null
					],
					dimensions: 1,
					axisRotation: false
				};
			}
			const axisRotation = parseAxisRotationValue(output);
			if (axisRotation !== null) return axisRotation;
			const parts = output.trim().split(/\s+/);
			if (parts.length < 1 || parts.length > 3 || parts[0] === "") throw new TypeError(`String outputRange values must contain 1 to 3 components, but got "${output}"`);
			if (parts.some((part) => transformOriginKeywords.has(part.toLowerCase()))) return parseTransformOriginValue(output, parts);
			const parsed = parts.map((part) => parseStringInterpolationComponent(part, output));
			const [{ kind }] = parsed;
			for (const part of parsed) if (part.kind !== kind) throw new TypeError(`Cannot interpolate "${output}" because it mixes ${kind} and ${part.kind} values`);
			if (kind === "scale") {
				const x = parsed[0].value;
				return {
					kind,
					values: [
						x,
						parsed[1]?.value ?? x,
						parsed[2]?.value ?? 1,
						0
					],
					units: [
						null,
						null,
						null,
						null
					],
					dimensions: parsed.length,
					axisRotation: false
				};
			}
			return {
				kind,
				values: [
					parsed[0].value,
					parsed[1]?.value ?? 0,
					parsed[2]?.value ?? 0,
					0
				],
				units: [
					parsed[0].unit,
					parsed[1]?.unit ?? null,
					parsed[2]?.unit ?? null,
					null
				],
				dimensions: parsed.length,
				axisRotation: false
			};
		};
		var serializeStringInterpolationValue = ({ kind, values, units, dimensions, axisRotation }) => {
			if (axisRotation) return `${stringifyNumber(values[0])} ${stringifyNumber(values[1])} ${stringifyNumber(values[2])} ${stringifyNumber(values[3])}${units[3]}`;
			if (kind === "scale") return values.slice(0, dimensions).map((value) => stringifyNumber(value)).join(" ");
			return values.slice(0, dimensions).map((value, index) => `${stringifyNumber(value)}${units[index]}`).join(" ");
		};
		var toSignedArea = (scale) => {
			if (scale === 0) return 0;
			return Math.sign(scale) * scale * scale;
		};
		var fromSignedArea = (area) => {
			if (area === 0) return 0;
			return Math.sign(area) * Math.sqrt(Math.abs(area));
		};
		function interpolateFunction(input, inputRange, outputRange, options) {
			const { extrapolateLeft, extrapolateRight, easing, output } = options;
			let result = input;
			const [inputMin, inputMax] = inputRange;
			const [outputMin, outputMax] = outputRange;
			if (result < inputMin) {
				if (extrapolateLeft === "identity") return result;
				if (extrapolateLeft === "clamp") result = inputMin;
				else if (extrapolateLeft === "wrap") {
					const range = inputMax - inputMin;
					result = ((result - inputMin) % range + range) % range + inputMin;
				} else if (extrapolateLeft === "extend") {}
			}
			if (result > inputMax) {
				if (extrapolateRight === "identity") return result;
				if (extrapolateRight === "clamp") result = inputMax;
				else if (extrapolateRight === "wrap") {
					const range = inputMax - inputMin;
					result = ((result - inputMin) % range + range) % range + inputMin;
				} else if (extrapolateRight === "extend") {}
			}
			if (outputMin === outputMax) return outputMin;
			result = (result - inputMin) / (inputMax - inputMin);
			result = easing(result);
			if (output === "perceptual-scale") {
				const signedAreaMin = toSignedArea(outputMin);
				const signedAreaMax = toSignedArea(outputMax);
				result = fromSignedArea(result * (signedAreaMax - signedAreaMin) + signedAreaMin);
			} else result = result * (outputMax - outputMin) + outputMin;
			return result;
		}
		function findRange(input, inputRange) {
			let i = 1;
			for (; i < inputRange.length - 1; ++i) if (inputRange[i] >= input) break;
			return i - 1;
		}
		var defaultEasing = (num) => num;
		var resolveOutputOption = (output) => {
			return output ?? "linear";
		};
		var shouldExtendRightForEasing = (easing) => {
			return easing.remotionShouldExtendRight === true;
		};
		var resolveEasingForSegment = ({ easing, segmentIndex }) => {
			if (easing === void 0) return defaultEasing;
			if (typeof easing === "function") return easing;
			return easing[segmentIndex];
		};
		var interpolateSegment = ({ input, inputRange, outputRange, easing, extrapolateLeft, extrapolateRight, output }) => {
			return interpolateFunction(input, inputRange, outputRange, {
				easing,
				extrapolateLeft,
				extrapolateRight: input > inputRange[1] && extrapolateRight === "clamp" && shouldExtendRightForEasing(easing) ? "extend" : extrapolateRight,
				output
			});
		};
		var interpolateNumber = ({ input, inputRange, outputRange, options }) => {
			const output = resolveOutputOption(options?.output);
			if (inputRange.length === 1) return outputRange[0];
			const easingOption = options?.easing;
			let extrapolateLeft = "extend";
			if (options?.extrapolateLeft !== void 0) extrapolateLeft = options.extrapolateLeft;
			let extrapolateRight = "extend";
			if (options?.extrapolateRight !== void 0) extrapolateRight = options.extrapolateRight;
			const posterizedInput = options?.posterize === void 0 ? input : Math.floor(input / options.posterize) * options.posterize;
			const range = findRange(posterizedInput, inputRange);
			const easing = resolveEasingForSegment({
				easing: easingOption,
				segmentIndex: range
			});
			let result = interpolateSegment({
				input: posterizedInput,
				inputRange: [inputRange[range], inputRange[range + 1]],
				outputRange: [outputRange[range], outputRange[range + 1]],
				easing,
				extrapolateLeft,
				extrapolateRight,
				output
			});
			for (let segmentIndex = 0; segmentIndex < range; segmentIndex++) {
				const previousEasing = resolveEasingForSegment({
					easing: easingOption,
					segmentIndex
				});
				if (!shouldExtendRightForEasing(previousEasing)) continue;
				const previousSegmentEnd = inputRange[segmentIndex + 1];
				if (posterizedInput <= previousSegmentEnd) continue;
				const continuedSegmentValue = interpolateSegment({
					input: posterizedInput,
					inputRange: [inputRange[segmentIndex], previousSegmentEnd],
					outputRange: [outputRange[segmentIndex], outputRange[segmentIndex + 1]],
					easing: previousEasing,
					extrapolateLeft,
					extrapolateRight: "extend",
					output
				});
				result += continuedSegmentValue - outputRange[segmentIndex + 1];
			}
			return result;
		};
		var interpolateString = ({ input, inputRange, outputRange, options }) => {
			const initiallyParsedOutputRange = outputRange.map(parseStringInterpolationValue);
			const hasAxisRotation = initiallyParsedOutputRange.some((parsed) => parsed.axisRotation);
			const posterizedInput = options?.posterize === void 0 ? input : Math.floor(input / options.posterize) * options.posterize;
			const segmentIndex = inputRange.length === 1 ? 0 : findRange(posterizedInput, inputRange);
			const parsedOutputRange = hasAxisRotation ? initiallyParsedOutputRange.map((parsed, index) => {
				if (parsed.kind !== "rotate") return parsed;
				if (parsed.axisRotation) return parsed;
				if (parsed.dimensions !== 1) throw new TypeError("Cannot interpolate a multi-angle rotate value with an axis rotation");
				const adjacentAxisRotation = parsed.values[0] === 0 ? index === 0 ? initiallyParsedOutputRange.find((candidate) => candidate.axisRotation) : index === initiallyParsedOutputRange.length - 1 ? [...initiallyParsedOutputRange].reverse().find((candidate) => candidate.axisRotation) : index === segmentIndex ? initiallyParsedOutputRange[index + 1] : index === segmentIndex + 1 ? initiallyParsedOutputRange[index - 1] : void 0 : void 0;
				const axis = adjacentAxisRotation?.axisRotation ? adjacentAxisRotation.values : [
					0,
					0,
					1
				];
				return {
					kind: "rotate",
					values: [
						axis[0],
						axis[1],
						axis[2],
						parsed.values[0]
					],
					units: [
						null,
						null,
						null,
						parsed.units[0]
					],
					dimensions: 4,
					axisRotation: true
				};
			}) : initiallyParsedOutputRange;
			const kind = parsedOutputRange[0]?.kind;
			if (kind === void 0) throw new Error("outputRange must have at least 1 element");
			for (const parsed of parsedOutputRange) if (parsed.kind !== kind) throw new TypeError(`Cannot interpolate ${kind} values with ${parsed.kind} values`);
			const dimensions = Math.max(...parsedOutputRange.map((parsed) => parsed.dimensions));
			const units = [
				null,
				null,
				null,
				null
			];
			if (kind !== "scale") for (let axis = 0; axis < dimensions; axis++) {
				if (hasAxisRotation && axis < 3) continue;
				for (const parsed of parsedOutputRange) {
					const unit = parsed.units[axis];
					if (unit === null) continue;
					if (units[axis] === null) {
						units[axis] = unit;
						continue;
					}
					if (units[axis] !== unit) throw new TypeError(`Cannot interpolate ${kind} values with different units on axis ${axis + 1}: ${units[axis]} and ${unit}`);
				}
				if (units[axis] === null) throw new TypeError(`Cannot interpolate ${kind} values because axis ${axis + 1} has no unit`);
			}
			const values = [
				0,
				0,
				0,
				0
			];
			for (let axis = 0; axis < dimensions; axis++) values[axis] = interpolateNumber({
				input,
				inputRange,
				outputRange: parsedOutputRange.map((parsed) => parsed.values[axis]),
				options
			});
			return serializeStringInterpolationValue({
				kind,
				values,
				units,
				dimensions,
				axisRotation: hasAxisRotation
			});
		};
		var interpolateDiscreteString = ({ input, inputRange, outputRange, options }) => {
			if (inputRange.length === 1) return outputRange[0];
			for (let segmentIndex = 0; segmentIndex < inputRange.length - 1; segmentIndex++) if (resolveEasingForSegment({
				easing: options?.easing,
				segmentIndex
			}) !== Easing.step1) throw new TypeError("Non-numeric strings can only be interpolated using Easing.step1");
			const posterizedInput = options?.posterize === void 0 ? input : Math.floor(input / options.posterize) * options.posterize;
			const inputMin = inputRange[0];
			const inputMax = inputRange[inputRange.length - 1];
			let resolvedInput = posterizedInput;
			if (resolvedInput < inputMin) {
				if (options?.extrapolateLeft === "identity") throw new TypeError("extrapolateLeft: \"identity\" is not supported for non-numeric strings");
				if (options?.extrapolateLeft === "wrap") {
					const wrapRange = inputMax - inputMin;
					resolvedInput = ((resolvedInput - inputMin) % wrapRange + wrapRange) % wrapRange + inputMin;
				} else return outputRange[0];
			}
			if (resolvedInput > inputMax) {
				if (options?.extrapolateRight === "identity") throw new TypeError("extrapolateRight: \"identity\" is not supported for non-numeric strings");
				if (options?.extrapolateRight === "wrap") {
					const wrapRange = inputMax - inputMin;
					resolvedInput = ((resolvedInput - inputMin) % wrapRange + wrapRange) % wrapRange + inputMin;
				} else return outputRange[outputRange.length - 1];
			}
			const range = findRange(resolvedInput, inputRange);
			return resolvedInput >= inputRange[range + 1] ? outputRange[range + 1] : outputRange[range];
		};
		var validateTupleOutputRange = (outputRange) => {
			const dimensions = outputRange[0]?.length;
			if (dimensions === void 0) throw new Error("outputRange must have at least 1 element");
			if (dimensions === 0) throw new TypeError("outputRange tuples must contain at least 1 number");
			for (const output of outputRange) {
				if (output.length !== dimensions) throw new TypeError(`outputRange tuples must all have the same length, but got ${dimensions} and ${output.length}`);
				for (const value of output) if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`outputRange tuples must contain only finite numbers, but got [${output.join(",")}]`);
			}
			return dimensions;
		};
		var interpolateTuple = ({ input, inputRange, outputRange, options }) => {
			const dimensions = validateTupleOutputRange(outputRange);
			return new Array(dimensions).fill(true).map((_, axis) => interpolateNumber({
				input,
				inputRange,
				outputRange: outputRange.map((output) => output[axis]),
				options
			}));
		};
		function checkValidInputRange(arr) {
			for (let i = 1; i < arr.length; ++i) if (!(arr[i] > arr[i - 1])) throw new Error(`inputRange must be strictly monotonically increasing but got [${arr.join(",")}]`);
		}
		function checkInfiniteRange(name, arr) {
			if (arr.length < 1) throw new Error(name + " must have at least 1 element");
			for (const element of arr) {
				if (typeof element !== "number") throw new Error(`${name} must contain only numbers`);
				if (!Number.isFinite(element)) throw new Error(`${name} must contain only finite numbers, but got [${arr.join(",")}]`);
			}
		}
		function assertValidInterpolateEasingOption(easing, inputRangeLength) {
			if (easing === void 0) return;
			if (typeof easing === "function") return;
			const expectedLength = inputRangeLength - 1;
			if (easing.length !== expectedLength) throw new Error(`When easing is an array, it must have one entry per segment between keyframes (length inputRange.length - 1 = ${expectedLength}), but got length ${easing.length}`);
			for (let i = 0; i < easing.length; i++) if (typeof easing[i] !== "function") throw new Error(`easing[${i}] must be a function`);
		}
		function assertValidInterpolatePosterizeOption(posterize) {
			if (posterize === void 0) return;
			if (typeof posterize !== "number" || !Number.isFinite(posterize) || posterize <= 0) throw new Error(`posterize must be a positive finite number, but got ${posterize}`);
		}
		function assertValidInterpolateOutputOption(output) {
			if (output === void 0 || output === "linear" || output === "perceptual-scale") return;
			throw new Error(`output must be "linear" or "perceptual-scale", but got ${String(output)}`);
		}
		function interpolate(input, inputRange, outputRange, options) {
			if (typeof input === "undefined") throw new Error("input can not be undefined");
			if (typeof inputRange === "undefined") throw new Error("inputRange can not be undefined");
			if (typeof outputRange === "undefined") throw new Error("outputRange can not be undefined");
			if (inputRange.length !== outputRange.length) throw new Error("inputRange (" + inputRange.length + ") and outputRange (" + outputRange.length + ") must have the same length");
			checkInfiniteRange("inputRange", inputRange);
			checkValidInputRange(inputRange);
			assertValidInterpolateEasingOption(options?.easing, inputRange.length);
			assertValidInterpolatePosterizeOption(options?.posterize);
			assertValidInterpolateOutputOption(options?.output);
			if (typeof input !== "number") throw new TypeError("Cannot interpolate an input which is not a number");
			if (!Array.isArray(outputRange)) throw new Error("outputRange must contain only numbers");
			if (outputRange.some((output) => typeof output === "string")) {
				if (!outputRange.every((output) => typeof output === "string" || typeof output === "number")) throw new TypeError("outputRange must contain only numbers, or supported scale, translate, and rotate strings");
				try {
					return interpolateString({
						input,
						inputRange,
						outputRange,
						options
					});
				} catch (error) {
					if (!outputRange.every((output) => typeof output === "string")) throw error;
					if (!outputRange.some((output) => {
						try {
							parseStringInterpolationValue(output);
							return false;
						} catch (parseError) {
							return parseError instanceof UnsupportedStringInterpolationValueError;
						}
					})) throw error;
					return interpolateDiscreteString({
						input,
						inputRange,
						outputRange,
						options
					});
				}
			}
			if (outputRange.every((output) => Array.isArray(output))) return interpolateTuple({
				input,
				inputRange,
				outputRange,
				options
			});
			if (!outputRange.every((output) => typeof output === "number")) throw new TypeError("outputRange must contain only numbers, numeric tuples, or supported scale, translate, and rotate strings");
			checkInfiniteRange("outputRange", outputRange);
			return interpolateNumber({
				input,
				inputRange,
				outputRange,
				options
			});
		}
		var DELAY_RENDER_CALLSTACK_TOKEN = "The delayRender was called:";
		var DELAY_RENDER_RETRIES_LEFT = "Retries left: ";
		var DELAY_RENDER_RETRY_TOKEN = "- Rendering the frame will be retried.";
		var DELAY_RENDER_CLEAR_TOKEN = "handle was cleared after";
		var findPropsToDelete = ({ schema, key, value }) => {
			const fieldSchema = schema[key];
			if (!fieldSchema) throw new Error("Key " + JSON.stringify(key) + " not found in schema");
			if (typeof value !== "string") throw new Error("Value must be a string, but is " + JSON.stringify(value));
			if (fieldSchema.type !== "enum") throw new Error("Key " + JSON.stringify(key) + " is not an enum");
			if (!fieldSchema.variants[value]) throw new Error("Value for " + JSON.stringify(key) + " must be one of " + Object.keys(fieldSchema.variants).map((v) => JSON.stringify(v)).join(", ") + ", got " + JSON.stringify(value));
			const otherVariants = Object.keys(fieldSchema.variants).filter((v) => v !== value);
			const otherKeys = /* @__PURE__ */ new Set();
			for (const variant of otherVariants) {
				const otherVariant = fieldSchema.variants[variant];
				const keys = Object.keys(otherVariant);
				for (const k of keys) otherKeys.add(k);
			}
			return [...otherKeys];
		};
		var registeredFontFaces = [];
		var fontDataByUrl = /* @__PURE__ */ new Map();
		var fetchFontData = (fontUrl) => {
			const cached = fontDataByUrl.get(fontUrl);
			if (cached) return cached;
			const promise = fetch(fontUrl).then((response) => {
				if (!response.ok) throw new Error(`Failed to load font ${JSON.stringify(fontUrl)}: ${response.status} ${response.statusText}`);
				return response.arrayBuffer();
			}).catch((error) => {
				fontDataByUrl.delete(fontUrl);
				throw error;
			});
			fontDataByUrl.set(fontUrl, promise);
			return promise;
		};
		var registerFontFace = (fontFace) => {
			if (registeredFontFaces.some((registered) => registered.ascentOverride === fontFace.ascentOverride && registered.descentOverride === fontFace.descentOverride && registered.display === fontFace.display && registered.featureSettings === fontFace.featureSettings && registered.fontFamily === fontFace.fontFamily && registered.fontUrl === fontFace.fontUrl && registered.format === fontFace.format && registered.lineGapOverride === fontFace.lineGapOverride && registered.style === fontFace.style && registered.weight === fontFace.weight && registered.stretch === fontFace.stretch && registered.unicodeRange === fontFace.unicodeRange && registered.variant === fontFace.variant)) return;
			registeredFontFaces.push(fontFace);
		};
		var getRegisteredFontFaces = () => {
			return registeredFontFaces.slice();
		};
		var DATE_TOKEN = "remotion-date:";
		var FILE_TOKEN = "remotion-file:";
		var serializeJSONWithSpecialTypes = ({ data, indent, staticBase }) => {
			let customDateUsed = false;
			let customFileUsed = false;
			let mapUsed = false;
			let setUsed = false;
			try {
				return {
					serializedString: JSON.stringify(data, function(key, value) {
						const item = this[key];
						if (item instanceof Date) {
							customDateUsed = true;
							return `${DATE_TOKEN}${item.toISOString()}`;
						}
						if (item instanceof Map) {
							mapUsed = true;
							return value;
						}
						if (item instanceof Set) {
							setUsed = true;
							return value;
						}
						if (typeof item === "string" && staticBase !== null && staticBase !== "" && item.startsWith(staticBase)) {
							customFileUsed = true;
							return `${FILE_TOKEN}${item.replace(staticBase + "/", "")}`;
						}
						return value;
					}, indent),
					customDateUsed,
					customFileUsed,
					mapUsed,
					setUsed
				};
			} catch (err) {
				throw new Error("Could not serialize the passed input props to JSON: " + err.message);
			}
		};
		var resolveFileTokenToUrl = (value) => {
			const encodedName = value.replace(FILE_TOKEN, "");
			let name = encodedName;
			try {
				name = encodedName.split("/").map(decodeURIComponent).join("/");
			} catch {}
			const matchingStaticFile = window.remotion_staticFiles?.find((file) => file.name === name);
			if (matchingStaticFile) return matchingStaticFile.src;
			return `${window.remotion_staticBase}/${encodedName}`;
		};
		var deserializeJSONWithSpecialTypes = (data) => {
			return JSON.parse(data, (_, value) => {
				if (typeof value === "string" && value.startsWith(DATE_TOKEN)) return new Date(value.replace(DATE_TOKEN, ""));
				if (typeof value === "string" && value.startsWith(FILE_TOKEN)) return resolveFileTokenToUrl(value);
				return value;
			});
		};
		var transformSchema = {
			"style.transformOrigin": {
				type: "transform-origin",
				step: 1,
				default: "50% 50%",
				description: "Transform origin"
			},
			"style.translate": {
				type: "translate",
				step: 1,
				default: "0px 0px",
				description: "Offset"
			},
			"style.scale": {
				type: "scale",
				max: 100,
				step: .01,
				default: 1,
				description: "Scale",
				defaultKeyframeOutput: "perceptual-scale"
			},
			"style.rotate": {
				type: "rotation-css",
				step: 1,
				default: "0deg",
				description: "Rotation"
			},
			"style.opacity": {
				type: "number",
				min: 0,
				max: 1,
				step: .01,
				default: 1,
				description: "Opacity",
				hiddenFromList: false
			}
		};
		var borderSchema = {
			"style.borderWidth": {
				type: "number",
				default: void 0,
				min: 0,
				step: 1,
				description: "Border width",
				hiddenFromList: false
			},
			"style.borderStyle": {
				type: "enum",
				default: "none",
				description: "Border style",
				variants: {
					none: {},
					hidden: {},
					solid: {},
					dashed: {},
					dotted: {},
					double: {},
					groove: {},
					ridge: {},
					inset: {},
					outset: {}
				}
			},
			"style.borderColor": {
				type: "color",
				default: void 0,
				description: "Border color"
			}
		};
		var borderRadiusSchema = {
			"style.borderRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Border radius",
				hiddenFromList: false,
				keyframable: true
			},
			"style.borderTopLeftRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Top left radius",
				hiddenFromList: false
			},
			"style.borderTopRightRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Top right radius",
				hiddenFromList: false
			},
			"style.borderBottomRightRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Bottom right radius",
				hiddenFromList: false
			},
			"style.borderBottomLeftRadius": {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				description: "Bottom left radius",
				hiddenFromList: false
			}
		};
		var backgroundSchema = { "style.backgroundColor": {
			type: "color",
			default: "transparent",
			description: "Color"
		} };
		var sequencePremountSchema = {
			premountFor: {
				type: "number",
				default: 0,
				description: "Premount For",
				min: 0,
				step: 1,
				hiddenFromList: false,
				keyframable: false
			},
			postmountFor: {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				hiddenFromList: true,
				keyframable: false
			}
		};
		var sequenceSchema = {
			durationInFrames: {
				type: "number",
				default: void 0,
				min: 1,
				step: 1,
				hiddenFromList: true
			},
			from: {
				type: "number",
				default: 0,
				step: 1,
				hiddenFromList: true
			},
			trimBefore: {
				type: "number",
				default: 0,
				min: 0,
				step: 1,
				hiddenFromList: true
			},
			freeze: {
				type: "number",
				default: null,
				step: 1,
				hiddenFromList: true
			},
			hidden: {
				type: "boolean",
				default: false,
				description: "Hidden"
			},
			name: { type: "hidden" },
			showInTimeline: { type: "hidden" },
			layout: {
				type: "enum",
				default: "absolute-fill",
				description: "Layout",
				variants: {
					"absolute-fill": {
						cropLeft: {
							type: "number",
							default: 0,
							description: "Crop left",
							min: 0,
							max: 1,
							step: .01,
							hiddenFromList: false,
							keyframable: true
						},
						cropRight: {
							type: "number",
							default: 0,
							description: "Crop right",
							min: 0,
							max: 1,
							step: .01,
							hiddenFromList: false,
							keyframable: true
						},
						cropTop: {
							type: "number",
							default: 0,
							description: "Crop top",
							min: 0,
							max: 1,
							step: .01,
							hiddenFromList: false,
							keyframable: true
						},
						cropBottom: {
							type: "number",
							default: 0,
							description: "Crop bottom",
							min: 0,
							max: 1,
							step: .01,
							hiddenFromList: false,
							keyframable: true
						},
						...transformSchema,
						...backgroundSchema,
						...borderSchema,
						...borderRadiusSchema,
						...sequencePremountSchema
					},
					none: {}
				}
			}
		};
		sequenceSchema.layout;
		({ ...sequenceSchema }), { ...sequenceSchema.layout };
		var NUMBER = "[-+]?\\d*\\.?\\d+";
		var PERCENTAGE = NUMBER + "%";
		function call(...args) {
			return "\\(\\s*(" + args.join(")\\s*,\\s*(") + ")\\s*\\)";
		}
		var MODERN_VALUE = "(?:none|[-+]?\\d*\\.?\\d+(?:%|deg|rad|grad|turn)?)";
		function modernColorCall(name) {
			return new RegExp(name + "\\(\\s*(" + MODERN_VALUE + ")\\s+(" + MODERN_VALUE + ")\\s+(" + MODERN_VALUE + ")(?:\\s*\\/\\s*(" + MODERN_VALUE + "))?\\s*\\)");
		}
		function getMatchers() {
			const cachedMatchers = {
				rgb: void 0,
				rgba: void 0,
				hsl: void 0,
				hsla: void 0,
				hex3: void 0,
				hex4: void 0,
				hex5: void 0,
				hex6: void 0,
				hex8: void 0,
				oklch: void 0,
				oklab: void 0,
				lab: void 0,
				lch: void 0,
				hwb: void 0
			};
			if (cachedMatchers.rgb === void 0) {
				cachedMatchers.rgb = new RegExp("rgb" + call(NUMBER, NUMBER, NUMBER));
				cachedMatchers.rgba = new RegExp("rgba" + call(NUMBER, NUMBER, NUMBER, NUMBER));
				cachedMatchers.hsl = new RegExp("hsl" + call(NUMBER, PERCENTAGE, PERCENTAGE));
				cachedMatchers.hsla = new RegExp("hsla" + call(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER));
				cachedMatchers.hex3 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
				cachedMatchers.hex4 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
				cachedMatchers.hex6 = /^#([0-9a-fA-F]{6})$/;
				cachedMatchers.hex8 = /^#([0-9a-fA-F]{8})$/;
				cachedMatchers.oklch = modernColorCall("oklch");
				cachedMatchers.oklab = modernColorCall("oklab");
				cachedMatchers.lab = modernColorCall("lab");
				cachedMatchers.lch = modernColorCall("lch");
				cachedMatchers.hwb = modernColorCall("hwb");
			}
			return cachedMatchers;
		}
		function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}
		function hslToRgb(h, s, l) {
			const q = l < .5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			const r = hue2rgb(p, q, h + 1 / 3);
			const g = hue2rgb(p, q, h);
			const b2 = hue2rgb(p, q, h - 1 / 3);
			return Math.round(r * 255) << 24 | Math.round(g * 255) << 16 | Math.round(b2 * 255) << 8;
		}
		function parse255(str) {
			const int = Number.parseInt(str, 10);
			if (int < 0) return 0;
			if (int > 255) return 255;
			return int;
		}
		function parse360(str) {
			return (Number.parseFloat(str) % 360 + 360) % 360 / 360;
		}
		function parse1(str) {
			const num = Number.parseFloat(str);
			if (num < 0) return 0;
			if (num > 1) return 255;
			return Math.round(num * 255);
		}
		function parsePercentage(str) {
			const int = Number.parseFloat(str);
			if (int < 0) return 0;
			if (int > 100) return 1;
			return int / 100;
		}
		function parseModernComponent(str, percentScale) {
			if (str === "none") return 0;
			if (str.endsWith("%")) return Number.parseFloat(str) / 100 * percentScale;
			return Number.parseFloat(str);
		}
		function parseHueAngle(str) {
			if (str === "none") return 0;
			if (str.endsWith("rad")) return Number.parseFloat(str) * 180 / Math.PI;
			if (str.endsWith("grad")) return Number.parseFloat(str) * .9;
			if (str.endsWith("turn")) return Number.parseFloat(str) * 360;
			return Number.parseFloat(str);
		}
		function parseModernAlpha(str) {
			if (str === void 0 || str === "none") return 1;
			if (str.endsWith("%")) return Math.max(0, Math.min(1, Number.parseFloat(str) / 100));
			return Math.max(0, Math.min(1, Number.parseFloat(str)));
		}
		function linearToSrgb(c2) {
			if (c2 <= .0031308) return 12.92 * c2;
			return 1.055 * c2 ** (1 / 2.4) - .055;
		}
		function clamp01(v) {
			return Math.max(0, Math.min(1, v));
		}
		function rgbFloatToInt(r, g, b2, alpha) {
			const ri = Math.round(clamp01(r) * 255);
			const gi = Math.round(clamp01(g) * 255);
			const bi = Math.round(clamp01(b2) * 255);
			const ai = Math.round(clamp01(alpha) * 255);
			return (ri << 24 | gi << 16 | bi << 8 | ai) >>> 0;
		}
		function oklabToSrgb(L, a2, b2) {
			const l_ = L + .3963377774 * a2 + .2158037573 * b2;
			const m_ = L - .1055613458 * a2 - .0638541728 * b2;
			const s_ = L - .0894841775 * a2 - 1.291485548 * b2;
			const l = l_ * l_ * l_;
			const m = m_ * m_ * m_;
			const s = s_ * s_ * s_;
			const rLin = 4.0767416621 * l - 3.3077115913 * m + .2309699292 * s;
			const gLin = -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s;
			const bLin = -.0041960863 * l - .7034186147 * m + 1.707614701 * s;
			return [
				linearToSrgb(rLin),
				linearToSrgb(gLin),
				linearToSrgb(bLin)
			];
		}
		function labToSrgb(L, a2, b2) {
			const epsilon = 216 / 24389;
			const kappa = 24389 / 27;
			const Xn = .95047;
			const Yn = 1;
			const Zn = 1.08883;
			const fy = (L + 16) / 116;
			const fx = a2 / 500 + fy;
			const fz = fy - b2 / 200;
			const fx3 = fx * fx * fx;
			const fz3 = fz * fz * fz;
			const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa;
			const yr = L > kappa * epsilon ? ((L + 16) / 116) ** 3 : L / kappa;
			const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa;
			const X = xr * Xn;
			const Y = yr * Yn;
			const Z = zr * Zn;
			const rLin = 3.2404542 * X - 1.5371385 * Y - .4985314 * Z;
			const gLin = -.969266 * X + 1.8760108 * Y + .041556 * Z;
			const bLin = .0556434 * X - .2040259 * Y + 1.0572252 * Z;
			return [
				linearToSrgb(rLin),
				linearToSrgb(gLin),
				linearToSrgb(bLin)
			];
		}
		function hwbToSrgb(h, w, bk) {
			if (w + bk >= 1) {
				const gray = w / (w + bk);
				return [
					gray,
					gray,
					gray
				];
			}
			const q = 1;
			const p = 0;
			const r = hue2rgb(p, q, h + 1 / 3);
			const g = hue2rgb(p, q, h);
			const bl = hue2rgb(p, q, h - 1 / 3);
			const factor = 1 - w - bk;
			return [
				r * factor + w,
				g * factor + w,
				bl * factor + w
			];
		}
		var colorNames = {
			transparent: 0,
			aliceblue: 4042850303,
			antiquewhite: 4209760255,
			aqua: 16777215,
			aquamarine: 2147472639,
			azure: 4043309055,
			beige: 4126530815,
			bisque: 4293182719,
			black: 255,
			blanchedalmond: 4293643775,
			blue: 65535,
			blueviolet: 2318131967,
			brown: 2771004159,
			burlywood: 3736635391,
			burntsienna: 3934150143,
			cadetblue: 1604231423,
			chartreuse: 2147418367,
			chocolate: 3530104575,
			coral: 4286533887,
			cornflowerblue: 1687547391,
			cornsilk: 4294499583,
			crimson: 3692313855,
			cyan: 16777215,
			darkblue: 35839,
			darkcyan: 9145343,
			darkgoldenrod: 3095792639,
			darkgray: 2846468607,
			darkgreen: 6553855,
			darkgrey: 2846468607,
			darkkhaki: 3182914559,
			darkmagenta: 2332068863,
			darkolivegreen: 1433087999,
			darkorange: 4287365375,
			darkorchid: 2570243327,
			darkred: 2332033279,
			darksalmon: 3918953215,
			darkseagreen: 2411499519,
			darkslateblue: 1211993087,
			darkslategray: 793726975,
			darkslategrey: 793726975,
			darkturquoise: 13554175,
			darkviolet: 2483082239,
			deeppink: 4279538687,
			deepskyblue: 12582911,
			dimgray: 1768516095,
			dimgrey: 1768516095,
			dodgerblue: 512819199,
			firebrick: 2988581631,
			floralwhite: 4294635775,
			forestgreen: 579543807,
			fuchsia: 4278255615,
			gainsboro: 3705462015,
			ghostwhite: 4177068031,
			gold: 4292280575,
			goldenrod: 3668254975,
			gray: 2155905279,
			green: 8388863,
			greenyellow: 2919182335,
			grey: 2155905279,
			honeydew: 4043305215,
			hotpink: 4285117695,
			indianred: 3445382399,
			indigo: 1258324735,
			ivory: 4294963455,
			khaki: 4041641215,
			lavender: 3873897215,
			lavenderblush: 4293981695,
			lawngreen: 2096890111,
			lemonchiffon: 4294626815,
			lightblue: 2916673279,
			lightcoral: 4034953471,
			lightcyan: 3774873599,
			lightgoldenrodyellow: 4210742015,
			lightgray: 3553874943,
			lightgreen: 2431553791,
			lightgrey: 3553874943,
			lightpink: 4290167295,
			lightsalmon: 4288707327,
			lightseagreen: 548580095,
			lightskyblue: 2278488831,
			lightslategray: 2005441023,
			lightslategrey: 2005441023,
			lightsteelblue: 2965692159,
			lightyellow: 4294959359,
			lime: 16711935,
			limegreen: 852308735,
			linen: 4210091775,
			magenta: 4278255615,
			maroon: 2147483903,
			mediumaquamarine: 1724754687,
			mediumblue: 52735,
			mediumorchid: 3126187007,
			mediumpurple: 2473647103,
			mediumseagreen: 1018393087,
			mediumslateblue: 2070474495,
			mediumspringgreen: 16423679,
			mediumturquoise: 1221709055,
			mediumvioletred: 3340076543,
			midnightblue: 421097727,
			mintcream: 4127193855,
			mistyrose: 4293190143,
			moccasin: 4293178879,
			navajowhite: 4292783615,
			navy: 33023,
			oldlace: 4260751103,
			olive: 2155872511,
			olivedrab: 1804477439,
			orange: 4289003775,
			orangered: 4282712319,
			orchid: 3664828159,
			palegoldenrod: 4008225535,
			palegreen: 2566625535,
			paleturquoise: 2951671551,
			palevioletred: 3681588223,
			papayawhip: 4293907967,
			peachpuff: 4292524543,
			peru: 3448061951,
			pink: 4290825215,
			plum: 3718307327,
			powderblue: 2967529215,
			purple: 2147516671,
			rebeccapurple: 1714657791,
			red: 4278190335,
			rosybrown: 3163525119,
			royalblue: 1097458175,
			saddlebrown: 2336560127,
			salmon: 4202722047,
			sandybrown: 4104413439,
			seagreen: 780883967,
			seashell: 4294307583,
			sienna: 2689740287,
			silver: 3233857791,
			skyblue: 2278484991,
			slateblue: 1784335871,
			slategray: 1887473919,
			slategrey: 1887473919,
			snow: 4294638335,
			springgreen: 16744447,
			steelblue: 1182971135,
			tan: 3535047935,
			teal: 8421631,
			thistle: 3636451583,
			tomato: 4284696575,
			turquoise: 1088475391,
			violet: 4001558271,
			wheat: 4125012991,
			white: 4294967295,
			whitesmoke: 4126537215,
			yellow: 4294902015,
			yellowgreen: 2597139199
		};
		function normalizeColor(color) {
			const matchers = getMatchers();
			let match;
			if (matchers.hex6) {
				if (match = matchers.hex6.exec(color)) return Number.parseInt(match[1] + "ff", 16) >>> 0;
			}
			if (colorNames[color] !== void 0) return colorNames[color];
			if (matchers.rgb) {
				if (match = matchers.rgb.exec(color)) return (parse255(match[1]) << 24 | parse255(match[2]) << 16 | parse255(match[3]) << 8 | 255) >>> 0;
			}
			if (matchers.rgba) {
				if (match = matchers.rgba.exec(color)) return (parse255(match[1]) << 24 | parse255(match[2]) << 16 | parse255(match[3]) << 8 | parse1(match[4])) >>> 0;
			}
			if (matchers.hex3) {
				if (match = matchers.hex3.exec(color)) return Number.parseInt(match[1] + match[1] + match[2] + match[2] + match[3] + match[3] + "ff", 16) >>> 0;
			}
			if (matchers.hex8) {
				if (match = matchers.hex8.exec(color)) return Number.parseInt(match[1], 16) >>> 0;
			}
			if (matchers.hex4) {
				if (match = matchers.hex4.exec(color)) return Number.parseInt(match[1] + match[1] + match[2] + match[2] + match[3] + match[3] + match[4] + match[4], 16) >>> 0;
			}
			if (matchers.hsl) {
				if (match = matchers.hsl.exec(color)) return (hslToRgb(parse360(match[1]), parsePercentage(match[2]), parsePercentage(match[3])) | 255) >>> 0;
			}
			if (matchers.hsla) {
				if (match = matchers.hsla.exec(color)) return (hslToRgb(parse360(match[1]), parsePercentage(match[2]), parsePercentage(match[3])) | parse1(match[4])) >>> 0;
			}
			if (matchers.oklch) {
				if (match = matchers.oklch.exec(color)) {
					const L = parseModernComponent(match[1], 1);
					const C = parseModernComponent(match[2], .4);
					const H = parseHueAngle(match[3]);
					const alpha = parseModernAlpha(match[4]);
					const hRad = H * Math.PI / 180;
					const [r, g, b2] = oklabToSrgb(L, C * Math.cos(hRad), C * Math.sin(hRad));
					return rgbFloatToInt(r, g, b2, alpha);
				}
			}
			if (matchers.oklab) {
				if (match = matchers.oklab.exec(color)) {
					const L = parseModernComponent(match[1], 1);
					const a2 = parseModernComponent(match[2], .4);
					const b2 = parseModernComponent(match[3], .4);
					const alpha = parseModernAlpha(match[4]);
					const [r, g, bl] = oklabToSrgb(L, a2, b2);
					return rgbFloatToInt(r, g, bl, alpha);
				}
			}
			if (matchers.lab) {
				if (match = matchers.lab.exec(color)) {
					const L = parseModernComponent(match[1], 100);
					const a2 = parseModernComponent(match[2], 125);
					const b2 = parseModernComponent(match[3], 125);
					const alpha = parseModernAlpha(match[4]);
					const [r, g, bl] = labToSrgb(L, a2, b2);
					return rgbFloatToInt(r, g, bl, alpha);
				}
			}
			if (matchers.lch) {
				if (match = matchers.lch.exec(color)) {
					const L = parseModernComponent(match[1], 100);
					const C = parseModernComponent(match[2], 150);
					const H = parseHueAngle(match[3]);
					const alpha = parseModernAlpha(match[4]);
					const hRad = H * Math.PI / 180;
					const [r, g, bl] = labToSrgb(L, C * Math.cos(hRad), C * Math.sin(hRad));
					return rgbFloatToInt(r, g, bl, alpha);
				}
			}
			if (matchers.hwb) {
				if (match = matchers.hwb.exec(color)) {
					const H = parseHueAngle(match[1]);
					const W = parseModernComponent(match[2], 1);
					const B = parseModernComponent(match[3], 1);
					const alpha = parseModernAlpha(match[4]);
					const [r, g, bl] = hwbToSrgb(H / 360, W, B);
					return rgbFloatToInt(r, g, bl, alpha);
				}
			}
			throw new Error(`invalid color string ${color} provided`);
		}
		function processColor(color) {
			const normalizedColor = normalizeColor(color);
			return (normalizedColor << 24 | normalizedColor >>> 8) >>> 0;
		}
		var proResProfileOptions = [
			"4444-xq",
			"4444",
			"hq",
			"standard",
			"light",
			"proxy"
		];
		var defaultScaleValue = [
			1,
			1,
			1
		];
		var parseScaleString = (value) => {
			const parts = value.trim().split(/\s+/);
			if (parts.length < 1 || parts.length > 3 || parts[0] === "") return null;
			const parsed = parts.map((part) => Number(part));
			if (!parsed.every((part) => Number.isFinite(part))) return null;
			const x = parsed[0];
			return [
				x,
				parsed[1] ?? x,
				parsed[2] ?? 1
			];
		};
		var parseValidScaleValue = (value) => {
			if (typeof value === "number") return Number.isFinite(value) ? [
				value,
				value,
				1
			] : null;
			if (typeof value === "string") return parseScaleString(value);
			return null;
		};
		var parseScaleValue = (value) => {
			return parseValidScaleValue(value) ?? defaultScaleValue;
		};
		var serializeScaleValue = ([x, y, z]) => {
			const normalizedX = normalizeNumber(x);
			const normalizedY = normalizeNumber(y);
			const normalizedZ = normalizeNumber(z);
			if (normalizedX === normalizedY && normalizedZ === 1) return normalizedX;
			if (normalizedZ === 1) return `${normalizedX} ${normalizedY}`;
			return `${normalizedX} ${normalizedY} ${normalizedZ}`;
		};
		function truthy(value) {
			return Boolean(value);
		}
		var ENABLE_V5_BREAKING_CHANGES = false;
		var validCodecs = [
			"h264",
			"h265",
			"vp8",
			"vp9",
			"av1",
			"mp3",
			"aac",
			"wav",
			"prores",
			"h264-mkv",
			"h264-ts",
			"gif"
		];
		function validateCodec(defaultCodec, location, name) {
			if (typeof defaultCodec === "undefined") return;
			if (typeof defaultCodec !== "string") throw new TypeError(`The "${name}" prop ${location} must be a string, but you passed a value of type ${typeof defaultCodec}.`);
			if (!validCodecs.includes(defaultCodec)) throw new Error(`The "${name}" prop ${location} must be one of ${validCodecs.join(", ")}, but you passed ${defaultCodec}.`);
		}
		var validateDefaultAndInputProps$1 = (defaultProps, name, compositionId) => {
			if (!defaultProps) return;
			if (typeof defaultProps !== "object") throw new Error(`"${name}" must be an object, but you passed a value of type ${typeof defaultProps}`);
			if (Array.isArray(defaultProps)) throw new Error(`"${name}" must be an object, an array was passed ${compositionId ? `for composition "${compositionId}"` : ""}`);
		};
		function validateDimension$1(amount, nameOfProp, location) {
			if (typeof amount !== "number") throw new Error(`The "${nameOfProp}" prop ${location} must be a number, but you passed a value of type ${typeof amount}`);
			if (isNaN(amount)) throw new TypeError(`The "${nameOfProp}" prop ${location} must not be NaN, but is NaN.`);
			if (!Number.isFinite(amount)) throw new TypeError(`The "${nameOfProp}" prop ${location} must be finite, but is ${amount}.`);
			if (amount % 1 !== 0) throw new TypeError(`The "${nameOfProp}" prop ${location} must be an integer, but is ${amount}.`);
			if (amount <= 0) throw new TypeError(`The "${nameOfProp}" prop ${location} must be positive, but got ${amount}.`);
		}
		function validateDurationInFrames$1(durationInFrames, options) {
			const { allowFloats, component } = options;
			if (typeof durationInFrames === "undefined") throw new Error(`The "durationInFrames" prop ${component} is missing.`);
			if (typeof durationInFrames !== "number") throw new Error(`The "durationInFrames" prop ${component} must be a number, but you passed a value of type ${typeof durationInFrames}`);
			if (durationInFrames <= 0) throw new TypeError(`The "durationInFrames" prop ${component} must be positive, but got ${durationInFrames}.`);
			if (!allowFloats && durationInFrames % 1 !== 0) throw new TypeError(`The "durationInFrames" prop ${component} must be an integer, but got ${durationInFrames}.`);
			if (!Number.isFinite(durationInFrames)) throw new TypeError(`The "durationInFrames" prop ${component} must be finite, but got ${durationInFrames}.`);
		}
		var getExpectedMediaFrameUncorrected = ({ frame, playbackRate, startFrom }) => {
			return interpolate(frame, [
				-1,
				startFrom,
				startFrom + 1
			], [
				-1,
				startFrom,
				startFrom + playbackRate
			]);
		};
		var getAbsoluteSrc = (relativeSrc) => {
			if (typeof window === "undefined") return relativeSrc;
			if (relativeSrc.startsWith("http://") || relativeSrc.startsWith("https://") || relativeSrc.startsWith("file://") || relativeSrc.startsWith("blob:") || relativeSrc.startsWith("data:")) return relativeSrc;
			return new URL(relativeSrc, document.baseURI).href;
		};
		var getOffthreadVideoSource = ({ src, transparent, currentTime, toneMapped }) => {
			return `http://localhost:${window.remotion_proxyPort}/proxy?src=${encodeURIComponent(getAbsoluteSrc(src))}&time=${encodeURIComponent(Math.max(0, currentTime))}&transparent=${String(transparent)}&toneMapped=${String(toneMapped)}`;
		};
		var NoReactInternals = {
			processColor,
			truthy,
			validateFps: validateFps$1,
			validateDimension: validateDimension$1,
			validateDurationInFrames: validateDurationInFrames$1,
			validateDefaultAndInputProps: validateDefaultAndInputProps$1,
			validateFrame,
			serializeJSONWithSpecialTypes,
			bundleName: "bundle.js",
			bundleMapName: "bundle.js.map",
			deserializeJSONWithSpecialTypes,
			DELAY_RENDER_CALLSTACK_TOKEN,
			DELAY_RENDER_RETRY_TOKEN,
			DELAY_RENDER_CLEAR_TOKEN,
			DELAY_RENDER_ATTEMPT_TOKEN: DELAY_RENDER_RETRIES_LEFT,
			getOffthreadVideoSource,
			getExpectedMediaFrameUncorrected,
			ENABLE_V5_BREAKING_CHANGES,
			MIN_NODE_VERSION: ENABLE_V5_BREAKING_CHANGES ? 22 : 16,
			MIN_BUN_VERSION: ENABLE_V5_BREAKING_CHANGES ? "1.1.3" : "1.0.3",
			MIN_ESLINT_VERSION: ENABLE_V5_BREAKING_CHANGES ? "8.57.0" : "7.15.0",
			colorNames,
			DATE_TOKEN,
			FILE_TOKEN,
			validateCodec,
			proResProfileOptions,
			findPropsToDelete,
			sequenceSchema,
			parseScaleValue,
			serializeScaleValue,
			getRegisteredFontFaces,
			registerFontFace,
			fetchFontData
		};
		//#endregion
		//#region ../../node_modules/@remotion/player/dist/esm/index.mjs
		if (typeof react.createContext !== "function") throw new Error([
			"Remotion requires React.createContext, but it is \"undefined\".",
			"If you are in a React Server Component, turn it into a client component by adding \"use client\" at the top of the file.",
			"",
			"Before:",
			"  import {Player} from \"@remotion/player\";",
			"",
			"After:",
			"  \"use client\";",
			"  import {Player} from \"@remotion/player\";"
		].join(`
`));
		var ICON_SIZE = 25;
		var fullscreenIconSize = 16;
		var PlayIcon = () => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: ICON_SIZE,
				height: ICON_SIZE,
				viewBox: "0 0 25 25",
				fill: "none",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M8 6.375C7.40904 8.17576 7.06921 10.2486 7.01438 12.3871C6.95955 14.5255 7.19163 16.6547 7.6875 18.5625C9.95364 18.2995 12.116 17.6164 14.009 16.5655C15.902 15.5147 17.4755 14.124 18.6088 12.5C17.5158 10.8949 15.9949 9.51103 14.1585 8.45082C12.3222 7.3906 10.2174 6.68116 8 6.375Z",
					fill: "white",
					stroke: "white",
					strokeWidth: "6.25",
					strokeLinejoin: "round"
				})
			});
		};
		var PauseIcon = () => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 100 100",
				width: ICON_SIZE,
				height: ICON_SIZE,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "25",
					y: "20",
					width: "20",
					height: "60",
					fill: "#fff",
					ry: "5",
					rx: "5"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "55",
					y: "20",
					width: "20",
					height: "60",
					fill: "#fff",
					ry: "5",
					rx: "5"
				})]
			});
		};
		var FullscreenIcon = ({ isFullscreen }) => {
			const strokeWidth = 6;
			const viewSize = 32;
			const out = isFullscreen ? 0 : strokeWidth / 2;
			const middleInset = isFullscreen ? strokeWidth * 1.6 : strokeWidth / 2;
			const inset = isFullscreen ? strokeWidth * 1.6 : 12;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: `0 0 ${viewSize} ${viewSize}`,
				height: fullscreenIconSize,
				width: fullscreenIconSize,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: `
				M ${out} ${inset}
				L ${middleInset} ${middleInset}
				L ${inset} ${out}
				`,
						stroke: "#fff",
						strokeWidth,
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: `
				M ${viewSize - out} ${inset}
				L ${viewSize - middleInset} ${middleInset}
				L ${viewSize - inset} ${out}
				`,
						stroke: "#fff",
						strokeWidth,
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: `
				M ${out} ${viewSize - inset}
				L ${middleInset} ${viewSize - middleInset}
				L ${inset} ${viewSize - out}
				`,
						stroke: "#fff",
						strokeWidth,
						fill: "none"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: `
				M ${viewSize - out} ${viewSize - inset}
				L ${viewSize - middleInset} ${viewSize - middleInset}
				L ${viewSize - inset} ${viewSize - out}
				`,
						stroke: "#fff",
						strokeWidth,
						fill: "none"
					})
				]
			});
		};
		var VolumeOffIcon = () => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: ICON_SIZE,
				height: ICON_SIZE,
				viewBox: "0 0 24 24",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z",
					fill: "#fff"
				})
			});
		};
		var VolumeOnIcon = () => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: ICON_SIZE,
				height: ICON_SIZE,
				viewBox: "0 0 24 24",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85z",
					fill: "#fff"
				})
			});
		};
		var className = "__remotion_buffering_indicator";
		var remotionBufferingAnimation = "__remotion_buffering_animation";
		var playerStyle = {
			width: ICON_SIZE,
			height: ICON_SIZE,
			overflow: "hidden",
			lineHeight: "normal",
			fontSize: "inherit"
		};
		var studioStyle = {
			width: 14,
			height: 14,
			overflow: "hidden",
			lineHeight: "normal",
			fontSize: "inherit"
		};
		var BufferingIndicator = ({ type, color = "white" }) => {
			const style = type === "player" ? playerStyle : studioStyle;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", {
				type: "text/css",
				children: `
				@keyframes ${remotionBufferingAnimation} {
          0% {
            rotate: 0deg;
          }
          100% {
            rotate: 360deg;
          }
        }
        
        .${className} {
            animation: ${remotionBufferingAnimation} 1s linear infinite;
        }        
			`
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					viewBox: type === "player" ? "0 0 22 22" : "0 0 18 18",
					style,
					className,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: type === "player" ? "M 11 4 A 7 7 0 0 1 15.1145 16.66312" : "M 9 2 A 7 7 0 0 1 13.1145 14.66312",
						stroke: color,
						strokeLinecap: "round",
						fill: "none",
						strokeWidth: 3
					})
				})
			})] });
		};
		var calculatePlayerSize = ({ currentSize, width, height, compositionWidth, compositionHeight }) => {
			if (width !== void 0 && height === void 0) return { aspectRatio: [compositionWidth, compositionHeight].join("/") };
			if (height !== void 0 && width === void 0) return { aspectRatio: [compositionWidth, compositionHeight].join("/") };
			if (!currentSize) return {
				width: compositionWidth,
				height: compositionHeight
			};
			return {
				width: compositionWidth,
				height: compositionHeight
			};
		};
		var calculateCanvasTransformation = ({ previewSize, compositionWidth, compositionHeight, canvasSize }) => {
			const scale = Internals.calculateScale({
				canvasSize,
				compositionHeight,
				compositionWidth,
				previewSize
			});
			const correction = 0 - (1 - scale) / 2;
			const xCorrection = correction * compositionWidth;
			const yCorrection = correction * compositionHeight;
			const width = compositionWidth * scale;
			const height = compositionHeight * scale;
			return {
				centerX: canvasSize.width / 2 - width / 2,
				centerY: canvasSize.height / 2 - height / 2,
				xCorrection,
				yCorrection,
				scale
			};
		};
		var calculateOuterStyle = ({ config, style, canvasSize, overflowVisible, layout }) => {
			if (!config) return {};
			return {
				position: "relative",
				overflow: overflowVisible ? "visible" : "hidden",
				...calculatePlayerSize({
					compositionHeight: config.height,
					compositionWidth: config.width,
					currentSize: canvasSize,
					height: style?.height,
					width: style?.width
				}),
				opacity: layout ? 1 : 0,
				...style
			};
		};
		var calculateContainerStyle = ({ config, layout, scale, overflowVisible }) => {
			if (!config) return {};
			if (!layout) return {
				position: "absolute",
				width: config.width,
				height: config.height,
				display: "flex",
				transform: `scale(${scale})`,
				overflow: overflowVisible ? "visible" : "hidden"
			};
			return {
				position: "absolute",
				width: config.width,
				height: config.height,
				display: "flex",
				transform: `scale(${scale})`,
				marginLeft: layout.xCorrection,
				marginTop: layout.yCorrection,
				overflow: overflowVisible ? "visible" : "hidden"
			};
		};
		var calculateOuter = ({ layout, scale, config, overflowVisible }) => {
			if (!config) return {};
			if (!layout) return {
				width: config.width * scale,
				height: config.height * scale,
				display: "flex",
				flexDirection: "column",
				position: "absolute",
				overflow: overflowVisible ? "visible" : "hidden"
			};
			const { centerX, centerY } = layout;
			return {
				width: config.width * scale,
				height: config.height * scale,
				display: "flex",
				flexDirection: "column",
				position: "absolute",
				left: centerX,
				top: centerY,
				overflow: overflowVisible ? "visible" : "hidden"
			};
		};
		var PlayerEventEmitterContext = react.default.createContext(void 0);
		var ThumbnailEmitterContext = react.default.createContext(void 0);
		var PlayerEmitter = class {
			constructor() {
				_defineProperty(this, "listeners", {
					ended: [],
					error: [],
					pause: [],
					play: [],
					ratechange: [],
					scalechange: [],
					seeked: [],
					timeupdate: [],
					frameupdate: [],
					fullscreenchange: [],
					volumechange: [],
					mutechange: [],
					waiting: [],
					resume: []
				});
				_defineProperty(this, "dispatchSeek", (frame) => {
					this.dispatchEvent("seeked", { frame });
				});
				_defineProperty(this, "dispatchVolumeChange", (volume) => {
					this.dispatchEvent("volumechange", { volume });
				});
				_defineProperty(this, "dispatchPause", () => {
					this.dispatchEvent("pause", void 0);
				});
				_defineProperty(this, "dispatchPlay", () => {
					this.dispatchEvent("play", void 0);
				});
				_defineProperty(this, "dispatchEnded", () => {
					this.dispatchEvent("ended", void 0);
				});
				_defineProperty(this, "dispatchRateChange", (playbackRate) => {
					this.dispatchEvent("ratechange", { playbackRate });
				});
				_defineProperty(this, "dispatchScaleChange", (scale) => {
					this.dispatchEvent("scalechange", { scale });
				});
				_defineProperty(this, "dispatchError", (error) => {
					this.dispatchEvent("error", { error });
				});
				_defineProperty(this, "dispatchTimeUpdate", (event) => {
					this.dispatchEvent("timeupdate", event);
				});
				_defineProperty(this, "dispatchFrameUpdate", (event) => {
					this.dispatchEvent("frameupdate", event);
				});
				_defineProperty(this, "dispatchFullscreenChange", (event) => {
					this.dispatchEvent("fullscreenchange", event);
				});
				_defineProperty(this, "dispatchMuteChange", (event) => {
					this.dispatchEvent("mutechange", event);
				});
				_defineProperty(this, "dispatchWaiting", (event) => {
					this.dispatchEvent("waiting", event);
				});
				_defineProperty(this, "dispatchResume", (event) => {
					this.dispatchEvent("resume", event);
				});
			}
			addEventListener(name, callback) {
				this.listeners[name].push(callback);
			}
			removeEventListener(name, callback) {
				this.listeners[name] = this.listeners[name].filter((l) => l !== callback);
			}
			dispatchEvent(dispatchName, context) {
				this.listeners[dispatchName].forEach((callback) => {
					callback({ detail: context });
				});
			}
		};
		var ThumbnailEmitter = class {
			constructor() {
				_defineProperty(this, "listeners", {
					error: [],
					waiting: [],
					resume: []
				});
				_defineProperty(this, "dispatchError", (error) => {
					this.dispatchEvent("error", { error });
				});
				_defineProperty(this, "dispatchWaiting", (event) => {
					this.dispatchEvent("waiting", event);
				});
				_defineProperty(this, "dispatchResume", (event) => {
					this.dispatchEvent("resume", event);
				});
			}
			addEventListener(name, callback) {
				this.listeners[name].push(callback);
			}
			removeEventListener(name, callback) {
				this.listeners[name] = this.listeners[name].filter((l) => l !== callback);
			}
			dispatchEvent(dispatchName, context) {
				this.listeners[dispatchName].forEach((callback) => {
					callback({ detail: context });
				});
			}
		};
		var useBufferStateEmitter = (emitter) => {
			const { subscribeBuffering } = (0, react.useContext)(Internals.SetTimelineContext);
			(0, react.useLayoutEffect)(() => {
				return subscribeBuffering((state) => {
					if (state.buffering) emitter.dispatchWaiting({});
					else emitter.dispatchResume({});
				});
			}, [emitter, subscribeBuffering]);
		};
		var PlayerEmitterProvider = ({ children, currentPlaybackRate }) => {
			const [emitter] = (0, react.useState)(() => new PlayerEmitter());
			(0, react.useEffect)(() => {
				if (currentPlaybackRate) emitter.dispatchRateChange(currentPlaybackRate);
			}, [emitter, currentPlaybackRate]);
			useBufferStateEmitter(emitter);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayerEventEmitterContext.Provider, {
				value: emitter,
				children
			});
		};
		var TimelineSequenceObserverContext = react.default.createContext(null);
		var useHoverState = (ref, hideControlsWhenPointerDoesntMove) => {
			const [hovered, setHovered] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				const { current } = ref;
				if (!current) return;
				let hoverTimeout;
				const addHoverTimeout = () => {
					if (hideControlsWhenPointerDoesntMove) {
						clearTimeout(hoverTimeout);
						hoverTimeout = setTimeout(() => {
							setHovered(false);
						}, hideControlsWhenPointerDoesntMove === true ? 3e3 : hideControlsWhenPointerDoesntMove);
					}
				};
				const onHover = () => {
					setHovered(true);
					addHoverTimeout();
				};
				const onLeave = () => {
					setHovered(false);
					clearTimeout(hoverTimeout);
				};
				const onMove = () => {
					setHovered(true);
					addHoverTimeout();
				};
				current.addEventListener("mouseenter", onHover);
				current.addEventListener("mouseleave", onLeave);
				current.addEventListener("mousemove", onMove);
				return () => {
					current.removeEventListener("mouseenter", onHover);
					current.removeEventListener("mouseleave", onLeave);
					current.removeEventListener("mousemove", onMove);
					clearTimeout(hoverTimeout);
				};
			}, [hideControlsWhenPointerDoesntMove, ref]);
			return hovered;
		};
		var usePlayerMethods = () => {
			const setFrame = Internals.Timeline.useTimelineSetFrame();
			const setTimelinePosition = Internals.Timeline.useTimelineSetFrame();
			const { setPlaying, frameRef, audioAndVideoTags, isPlaying: readIsPlaying, isBuffering } = (0, react.useContext)(Internals.SetTimelineContext);
			const audioContext = (0, react.useContext)(Internals.SharedAudioContext);
			const audioTagsContext = (0, react.useContext)(Internals.SharedAudioTagsContext);
			const environment = useRemotionEnvironment();
			const video = Internals.useVideo();
			const config = Internals.useUnsafeVideoConfig();
			const emitter = (0, react.useContext)(PlayerEventEmitterContext);
			const playStart = (0, react.useRef)(0);
			const fallbackFrame = (0, react.useRef)(null);
			const nextPlayIsAutoPlayAttempt = (0, react.useRef)(false);
			if (!emitter) throw new TypeError("Expected Player event emitter context");
			const getCurrentFrame = (0, react.useCallback)(() => {
				if (!video) return fallbackFrame.current ?? (typeof window === "undefined" ? 0 : window.remotion_initialFrame ?? 0);
				const unclamped = frameRef.current[video.id] ?? (environment.isPlayer ? 0 : Internals.Timeline.getFrameForComposition(video.id));
				return Internals.Timeline.clampFrameToCompositionRange(unclamped, video.durationInFrames);
			}, [
				environment.isPlayer,
				frameRef,
				video
			]);
			const seek = (0, react.useCallback)((newFrame) => {
				const frameToSeekTo = config ? Internals.TimelinePosition.clampFrameToCompositionRange(newFrame, config.durationInFrames) : Math.max(0, newFrame);
				fallbackFrame.current = frameToSeekTo;
				if (video?.id) {
					if (frameRef.current[video.id] !== frameToSeekTo) frameRef.current = {
						...frameRef.current,
						[video.id]: frameToSeekTo
					};
					setTimelinePosition((currentFrames) => currentFrames[video.id] === frameToSeekTo ? currentFrames : {
						...currentFrames,
						[video.id]: frameToSeekTo
					});
				}
				emitter.dispatchSeek(frameToSeekTo);
			}, [
				config,
				emitter,
				frameRef,
				setTimelinePosition,
				video?.id
			]);
			const play = (0, react.useCallback)((e) => {
				const isAutoPlayAttempt = nextPlayIsAutoPlayAttempt.current;
				nextPlayIsAutoPlayAttempt.current = false;
				if (readIsPlaying()) return;
				const lastFrameForPlayback = (config?.durationInFrames ?? 1) - 1;
				if (getCurrentFrame() === lastFrameForPlayback) seek(0);
				if (isAutoPlayAttempt) audioContext?.resumeAsAutoPlay();
				else audioContext?.resume();
				if (audioTagsContext && audioTagsContext.numberOfAudioTags > 0 && e) audioTagsContext.playAllAudios();
				audioAndVideoTags.current.forEach((tag) => tag.play("player play() was called and playing audio from a click"));
				setPlaying(true);
				playStart.current = getCurrentFrame();
				emitter.dispatchPlay();
			}, [
				audioAndVideoTags,
				audioContext,
				audioTagsContext,
				config?.durationInFrames,
				emitter,
				getCurrentFrame,
				readIsPlaying,
				seek,
				setPlaying
			]);
			const playAsAutoPlay = (0, react.useCallback)(() => {
				nextPlayIsAutoPlayAttempt.current = true;
				play();
			}, [play]);
			const pause = (0, react.useCallback)(() => {
				if (readIsPlaying()) {
					setPlaying(false);
					emitter.dispatchPause();
					audioContext?.suspend();
				}
			}, [
				audioContext,
				emitter,
				readIsPlaying,
				setPlaying
			]);
			const pauseAndReturnToPlayStart = (0, react.useCallback)(() => {
				if (readIsPlaying()) {
					setPlaying(false);
					fallbackFrame.current = playStart.current;
					if (config) {
						frameRef.current = {
							...frameRef.current,
							[config.id]: playStart.current
						};
						setTimelinePosition((currentFrames) => ({
							...currentFrames,
							[config.id]: playStart.current
						}));
						emitter.dispatchPause();
					}
				}
			}, [
				config,
				emitter,
				frameRef,
				readIsPlaying,
				setPlaying,
				setTimelinePosition
			]);
			const videoId = video?.id;
			const lastFrame = (config?.durationInFrames ?? 1) - 1;
			const frameBack = (0, react.useCallback)((frames) => {
				if (!videoId) return null;
				if (readIsPlaying()) return;
				const previousFrame = frameRef.current[videoId] ?? window.remotion_initialFrame ?? 0;
				const newFrame = Math.max(0, previousFrame - frames);
				if (previousFrame === newFrame) return;
				frameRef.current = {
					...frameRef.current,
					[videoId]: newFrame
				};
				setFrame((currentFrames) => currentFrames[videoId] === newFrame ? currentFrames : {
					...currentFrames,
					[videoId]: newFrame
				});
			}, [
				frameRef,
				readIsPlaying,
				setFrame,
				videoId
			]);
			const frameForward = (0, react.useCallback)((frames) => {
				if (!videoId) return null;
				if (readIsPlaying()) return;
				const previousFrame = frameRef.current[videoId] ?? window.remotion_initialFrame ?? 0;
				const newFrame = Math.min(lastFrame, previousFrame + frames);
				if (previousFrame === newFrame) return;
				frameRef.current = {
					...frameRef.current,
					[videoId]: newFrame
				};
				setFrame((currentFrames) => currentFrames[videoId] === newFrame ? currentFrames : {
					...currentFrames,
					[videoId]: newFrame
				});
			}, [
				frameRef,
				lastFrame,
				readIsPlaying,
				setFrame,
				videoId
			]);
			const toggle = (0, react.useCallback)((e) => {
				if (readIsPlaying()) pause();
				else play(e);
			}, [
				pause,
				play,
				readIsPlaying
			]);
			return (0, react.useMemo)(() => {
				return {
					frameBack,
					frameForward,
					emitter,
					play,
					playAsAutoPlay,
					pause,
					seek,
					getCurrentFrame,
					isPlaying: readIsPlaying,
					isBuffering,
					pauseAndReturnToPlayStart,
					toggle
				};
			}, [
				emitter,
				frameBack,
				frameForward,
				getCurrentFrame,
				readIsPlaying,
				pause,
				pauseAndReturnToPlayStart,
				play,
				playAsAutoPlay,
				isBuffering,
				seek,
				toggle
			]);
		};
		var useBrowserMediaSession = ({ browserMediaControlsBehavior, videoConfig, playbackRate }) => {
			const playing = Internals.usePlaying();
			const { pause, play, emitter, getCurrentFrame, seek } = usePlayerMethods();
			const hasEverPlayed = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (playing) hasEverPlayed.current = true;
				if (!navigator.mediaSession) return;
				if (browserMediaControlsBehavior.mode === "do-nothing") return;
				if (playing) navigator.mediaSession.playbackState = "playing";
				else if (hasEverPlayed.current) navigator.mediaSession.playbackState = "paused";
			}, [browserMediaControlsBehavior.mode, playing]);
			(0, react.useEffect)(() => {
				if (!navigator.mediaSession) return;
				if (browserMediaControlsBehavior.mode === "do-nothing") return;
				const onTimeUpdate = () => {
					if (!videoConfig) return;
					if (navigator.mediaSession) navigator.mediaSession.setPositionState({
						duration: videoConfig.durationInFrames / videoConfig.fps,
						playbackRate,
						position: getCurrentFrame() / videoConfig.fps
					});
				};
				emitter.addEventListener("timeupdate", onTimeUpdate);
				return () => {
					emitter.removeEventListener("timeupdate", onTimeUpdate);
				};
			}, [
				browserMediaControlsBehavior.mode,
				emitter,
				getCurrentFrame,
				playbackRate,
				videoConfig
			]);
			(0, react.useEffect)(() => {
				if (!navigator.mediaSession) return;
				if (browserMediaControlsBehavior.mode === "do-nothing") return;
				navigator.mediaSession.setActionHandler("play", () => {
					if (browserMediaControlsBehavior.mode === "register-media-session") play();
				});
				navigator.mediaSession.setActionHandler("pause", () => {
					if (browserMediaControlsBehavior.mode === "register-media-session") pause();
				});
				navigator.mediaSession.setActionHandler("seekto", (event) => {
					if (browserMediaControlsBehavior.mode === "register-media-session" && event.seekTime !== void 0 && videoConfig) seek(Math.round(event.seekTime * videoConfig.fps));
				});
				navigator.mediaSession.setActionHandler("seekbackward", () => {
					if (browserMediaControlsBehavior.mode === "register-media-session" && videoConfig) seek(Math.max(0, Math.round((getCurrentFrame() - 10) * videoConfig.fps)));
				});
				navigator.mediaSession.setActionHandler("seekforward", () => {
					if (browserMediaControlsBehavior.mode === "register-media-session" && videoConfig) seek(Math.max(videoConfig.durationInFrames - 1, Math.round((getCurrentFrame() + 10) * videoConfig.fps)));
				});
				navigator.mediaSession.setActionHandler("previoustrack", () => {
					if (browserMediaControlsBehavior.mode === "register-media-session") seek(0);
				});
				return () => {
					navigator.mediaSession.metadata = null;
					navigator.mediaSession.setActionHandler("play", null);
					navigator.mediaSession.setActionHandler("pause", null);
					navigator.mediaSession.setActionHandler("seekto", null);
					navigator.mediaSession.setActionHandler("seekbackward", null);
					navigator.mediaSession.setActionHandler("seekforward", null);
					navigator.mediaSession.setActionHandler("previoustrack", null);
				};
			}, [
				browserMediaControlsBehavior.mode,
				getCurrentFrame,
				pause,
				play,
				seek,
				videoConfig
			]);
		};
		var calculateNextFrame = ({ time, currentFrame: startFrame, playbackSpeed, fps, actualLastFrame, actualFirstFrame, framesAdvanced, shouldLoop }) => {
			const framesToAdvance = (playbackSpeed < 0 ? Math.ceil : Math.floor)(time * playbackSpeed / (1e3 / fps)) - framesAdvanced;
			const nextFrame = framesToAdvance + startFrame;
			const isCurrentFrameOutside = startFrame > actualLastFrame || startFrame < actualFirstFrame;
			const isNextFrameOutside = nextFrame > actualLastFrame || nextFrame < actualFirstFrame;
			const hasEnded = !shouldLoop && isNextFrameOutside && !isCurrentFrameOutside;
			if (playbackSpeed > 0) {
				if (isNextFrameOutside) return {
					nextFrame: actualFirstFrame,
					framesToAdvance,
					hasEnded
				};
				return {
					nextFrame,
					framesToAdvance,
					hasEnded
				};
			}
			if (isNextFrameOutside) return {
				nextFrame: actualLastFrame,
				framesToAdvance,
				hasEnded
			};
			return {
				nextFrame,
				framesToAdvance,
				hasEnded
			};
		};
		var getIsBackgrounded = () => {
			if (typeof document === "undefined") return false;
			return document.visibilityState === "hidden";
		};
		var useIsBackgrounded = () => {
			const isBackgrounded = (0, react.useRef)(getIsBackgrounded());
			(0, react.useEffect)(() => {
				const onVisibilityChange = () => {
					isBackgrounded.current = getIsBackgrounded();
				};
				document.addEventListener("visibilitychange", onVisibilityChange);
				return () => {
					document.removeEventListener("visibilitychange", onVisibilityChange);
				};
			}, []);
			return isBackgrounded;
		};
		var ALLOWED_GLOBAL_TIME_ANCHOR_SHIFT = .1;
		var setGlobalTimeAnchor = ({ audioContext, audioSyncAnchor, absoluteTimeInSeconds, globalPlaybackRate, logLevel, force }) => {
			const newAnchor = audioContext.currentTime - absoluteTimeInSeconds / globalPlaybackRate;
			const shift = newAnchor - audioSyncAnchor.value;
			const { outputLatency } = audioContext;
			const safeOutputLatency = outputLatency === 0 ? .3 : outputLatency;
			const latency = audioContext.baseLatency + safeOutputLatency;
			if (Math.abs(shift) < ALLOWED_GLOBAL_TIME_ANCHOR_SHIFT + latency && !force) return false;
			if (Math.abs(shift) < Number.EPSILON) return false;
			Internals.Log.verbose({
				logLevel,
				tag: "audio-scheduling"
			}, "Anchor " + (force ? "forcibly " : "") + "changed from %s to %s with shift %s", audioSyncAnchor.value, newAnchor, shift);
			audioSyncAnchor.value = newAnchor;
			return true;
		};
		var shouldForceAnchorChange = (newState) => {
			if (newState === "suspended" || newState === "running-to-suspended") return true;
			if (newState === "closed" || newState === "interrupted" || newState === "running" || newState === "suspended-to-running") return false;
			throw new Error(`Unexpected audio context state: ${newState}`);
		};
		var usePlayback = ({ loop, playbackRate, moveToBeginningWhenEnded, inFrame, outFrame, browserMediaControlsBehavior, getCurrentFrame, muted }) => {
			const config = Internals.useUnsafeVideoConfig();
			const frame = Internals.Timeline.useTimelinePosition();
			const playing = Internals.usePlaying();
			const { pause, emitter, isPlaying } = usePlayerMethods();
			const setFrame = Internals.Timeline.useTimelineSetFrame();
			const sharedAudioContext = (0, react.useContext)(Internals.SharedAudioContext);
			const { setPlayerMuted } = (0, react.useContext)(Internals.SetMediaVolumeContext);
			const { isBuffering, subscribeBuffering } = (0, react.useContext)(Internals.SetTimelineContext);
			const logLevel = Internals.useLogLevel();
			const isBackgroundedRef = useIsBackgrounded();
			const lastTimeUpdateTimestamp = (0, react.useRef)(0);
			useBrowserMediaSession({
				browserMediaControlsBehavior,
				playbackRate,
				videoConfig: config
			});
			(0, react.useLayoutEffect)(() => {
				if (!sharedAudioContext) return;
				if (!sharedAudioContext.audioContext) return;
				if (!config) return;
				if (muted) return;
				if (setGlobalTimeAnchor({
					audioContext: sharedAudioContext.audioContext,
					audioSyncAnchor: sharedAudioContext.audioSyncAnchor,
					absoluteTimeInSeconds: frame / config.fps,
					globalPlaybackRate: playbackRate,
					logLevel,
					force: false
				})) sharedAudioContext.audioSyncAnchorEmitter.dispatch("changed");
			}, [
				config,
				frame,
				logLevel,
				playbackRate,
				sharedAudioContext,
				muted
			]);
			(0, react.useLayoutEffect)(() => {
				const audioContext = sharedAudioContext?.audioContext;
				if (!audioContext) return;
				if (!config) return;
				if (muted) return;
				const callback = () => {
					const newState = sharedAudioContext?.getAudioContextState();
					if (newState && shouldForceAnchorChange(newState)) {
						if (setGlobalTimeAnchor({
							audioContext,
							audioSyncAnchor: sharedAudioContext.audioSyncAnchor,
							absoluteTimeInSeconds: getCurrentFrame() / config.fps,
							globalPlaybackRate: playbackRate,
							logLevel,
							force: true
						})) sharedAudioContext.audioSyncAnchorEmitter.dispatch("changed");
					}
				};
				audioContext?.addEventListener("statechange", callback);
				return () => {
					audioContext?.removeEventListener("statechange", callback);
				};
			}, [
				config,
				getCurrentFrame,
				logLevel,
				muted,
				playbackRate,
				sharedAudioContext
			]);
			(0, react.useEffect)(() => {
				if (!config) return;
				if (!playing) {
					sharedAudioContext?.suspend?.();
					return;
				}
				if (sharedAudioContext?._experimentalKeepAudioContextAlive && sharedAudioContext.audioContext && !muted) {
					if (setGlobalTimeAnchor({
						audioContext: sharedAudioContext.audioContext,
						audioSyncAnchor: sharedAudioContext.audioSyncAnchor,
						absoluteTimeInSeconds: getCurrentFrame() / config.fps,
						globalPlaybackRate: playbackRate,
						logLevel,
						force: true
					})) sharedAudioContext.audioSyncAnchorEmitter.dispatch("changed");
				}
				let hasBeenStopped = false;
				let audioContextFailed = false;
				let reqAnimFrameCall = null;
				let startedTime = performance.now();
				let framesAdvanced = 0;
				const cancelQueuedFrame = () => {
					if (reqAnimFrameCall !== null) {
						if (reqAnimFrameCall.type === "raf") cancelAnimationFrame(reqAnimFrameCall.id);
						else clearTimeout(reqAnimFrameCall.id);
					}
				};
				const stop = () => {
					hasBeenStopped = true;
					cancelQueuedFrame();
				};
				const callback = () => {
					if (hasBeenStopped) return;
					if (!isPlaying()) {
						sharedAudioContext?.suspend?.();
						return;
					}
					if (!muted && !audioContextFailed && !isBuffering()) sharedAudioContext?.resume?.();
					const time = performance.now() - startedTime;
					const actualLastFrame = outFrame ?? config.durationInFrames - 1;
					const actualFirstFrame = inFrame ?? 0;
					const { nextFrame, framesToAdvance, hasEnded } = calculateNextFrame({
						time,
						currentFrame: getCurrentFrame(),
						playbackSpeed: playbackRate,
						fps: config.fps,
						actualFirstFrame,
						actualLastFrame,
						framesAdvanced,
						shouldLoop: loop
					});
					framesAdvanced += framesToAdvance;
					if (nextFrame !== getCurrentFrame() && (!hasEnded || moveToBeginningWhenEnded) && !isBuffering()) setFrame((c) => ({
						...c,
						[config.id]: nextFrame
					}));
					if (hasEnded) {
						stop();
						pause();
						emitter.dispatchEnded();
						return;
					}
					queueNextFrame();
				};
				const queueNextFrame = () => {
					if (hasBeenStopped) return;
					const getIsResumingAudioContext = audioContextFailed ? null : sharedAudioContext?.getIsResumingAudioContext?.() ?? null;
					if (getIsResumingAudioContext !== null && !muted) {
						getIsResumingAudioContext.then((result) => {
							if (hasBeenStopped) return;
							if (result === "failed") {
								audioContextFailed = true;
								sharedAudioContext?.suspend();
								setPlayerMuted(true);
							}
							startedTime = performance.now();
							framesAdvanced = 0;
							queueNextFrame();
						});
						return;
					}
					if (isBuffering()) {
						if (!muted && !audioContextFailed) sharedAudioContext?.suspend?.();
						const unsubscribe = subscribeBuffering((state) => {
							if (state.buffering) return;
							unsubscribe();
							if (!muted && !audioContextFailed && sharedAudioContext?._experimentalKeepAudioContextAlive) sharedAudioContext.resume();
							startedTime = performance.now();
							framesAdvanced = 0;
							queueNextFrame();
						});
						return;
					}
					if (isBackgroundedRef.current) {
						reqAnimFrameCall = {
							type: "timeout",
							id: setTimeout(callback, 1e3 / config.fps)
						};
						return;
					}
					reqAnimFrameCall = {
						type: "raf",
						id: requestAnimationFrame(callback)
					};
				};
				queueNextFrame();
				const onVisibilityChange = () => {
					if (document.visibilityState === "visible") return;
					cancelQueuedFrame();
					callback();
				};
				window.addEventListener("visibilitychange", onVisibilityChange);
				return () => {
					window.removeEventListener("visibilitychange", onVisibilityChange);
					stop();
				};
			}, [
				config,
				loop,
				pause,
				playing,
				setFrame,
				emitter,
				playbackRate,
				inFrame,
				outFrame,
				moveToBeginningWhenEnded,
				isBackgroundedRef,
				getCurrentFrame,
				isBuffering,
				isPlaying,
				sharedAudioContext,
				setPlayerMuted,
				subscribeBuffering,
				logLevel,
				muted
			]);
			(0, react.useEffect)(() => {
				const now = performance.now();
				const timeSinceLastUpdate = now - lastTimeUpdateTimestamp.current;
				if (timeSinceLastUpdate >= 250) {
					emitter.dispatchTimeUpdate({ frame });
					lastTimeUpdateTimestamp.current = now;
					return;
				}
				const timeoutId = setTimeout(() => {
					emitter.dispatchTimeUpdate({ frame });
					lastTimeUpdateTimestamp.current = performance.now();
				}, 250 - timeSinceLastUpdate);
				return () => clearTimeout(timeoutId);
			}, [emitter, frame]);
			(0, react.useEffect)(() => {
				emitter.dispatchFrameUpdate({ frame });
			}, [emitter, frame]);
		};
		var elementSizeHooks = [];
		var getElement = (source) => {
			if (!source) return null;
			if ("current" in source) return source.current;
			return source;
		};
		var useElementSize = (source, options) => {
			const [size, setSize] = (0, react.useState)(() => {
				const element = getElement(source);
				if (!element) return null;
				const rect = element.getClientRects();
				if (!rect[0]) return null;
				return {
					width: rect[0].width,
					height: rect[0].height,
					left: rect[0].x,
					top: rect[0].y,
					windowSize: {
						height: window.innerHeight,
						width: window.innerWidth
					}
				};
			});
			const observer = (0, react.useMemo)(() => {
				if (typeof ResizeObserver === "undefined") return null;
				return new ResizeObserver((entries) => {
					const { contentRect, target } = entries[0];
					const newSize = target.getClientRects();
					if (!newSize?.[0]) {
						setSize(null);
						return;
					}
					const probableCssParentScaleX = contentRect.width === 0 ? 1 : newSize[0].width / contentRect.width;
					const probableCssParentScaleY = contentRect.height === 0 ? 1 : newSize[0].height / contentRect.height;
					const width = options.shouldApplyCssTransforms || probableCssParentScaleX === 0 ? newSize[0].width : newSize[0].width * (1 / probableCssParentScaleX);
					const height = options.shouldApplyCssTransforms || probableCssParentScaleY === 0 ? newSize[0].height : newSize[0].height * (1 / probableCssParentScaleY);
					setSize((prevState) => {
						if (prevState && prevState.width === width && prevState.height === height && prevState.left === newSize[0].x && prevState.top === newSize[0].y && prevState.windowSize.height === window.innerHeight && prevState.windowSize.width === window.innerWidth) return prevState;
						return {
							width,
							height,
							left: newSize[0].x,
							top: newSize[0].y,
							windowSize: {
								height: window.innerHeight,
								width: window.innerWidth
							}
						};
					});
				});
			}, [options.shouldApplyCssTransforms]);
			const updateSize = (0, react.useCallback)(() => {
				const element = getElement(source);
				if (!element) return;
				const rect = element.getClientRects();
				if (!rect[0]) {
					setSize(null);
					return;
				}
				setSize((prevState) => {
					if (prevState && prevState.width === rect[0].width && prevState.height === rect[0].height && prevState.left === rect[0].x && prevState.top === rect[0].y && prevState.windowSize.height === window.innerHeight && prevState.windowSize.width === window.innerWidth) return prevState;
					return {
						width: rect[0].width,
						height: rect[0].height,
						left: rect[0].x,
						top: rect[0].y,
						windowSize: {
							height: window.innerHeight,
							width: window.innerWidth
						}
					};
				});
			}, [source]);
			(0, react.useEffect)(() => {
				updateSize();
			}, [updateSize]);
			(0, react.useEffect)(() => {
				if (!observer) return;
				const element = getElement(source);
				if (element) observer.observe(element);
				return () => {
					if (element) observer.unobserve(element);
				};
			}, [observer, source]);
			(0, react.useEffect)(() => {
				if (!options.triggerOnWindowResize) return;
				window.addEventListener("resize", updateSize);
				return () => {
					window.removeEventListener("resize", updateSize);
				};
			}, [options.triggerOnWindowResize, updateSize]);
			(0, react.useEffect)(() => {
				elementSizeHooks.push(updateSize);
				return () => {
					elementSizeHooks = elementSizeHooks.filter((e) => e !== updateSize);
				};
			}, [updateSize]);
			return (0, react.useMemo)(() => {
				if (!size) return null;
				return {
					...size,
					refresh: updateSize
				};
			}, [size, updateSize]);
		};
		var playerCssClassname = (override) => {
			return override ?? "__remotion-player";
		};
		var errorStyle = {
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			flex: 1,
			height: "100%",
			width: "100%"
		};
		var ErrorBoundary = class extends react.default.Component {
			constructor(..._args) {
				super(..._args);
				_defineProperty(this, "state", { hasError: null });
			}
			static getDerivedStateFromError(error) {
				return { hasError: error };
			}
			componentDidCatch(error) {
				this.props.onError(error);
			}
			render() {
				if (this.state.hasError) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: errorStyle,
					children: this.props.errorFallback({ error: this.state.hasError })
				});
				return this.props.children;
			}
		};
		var getHashOfDomain = async () => {
			if (typeof window === "undefined") return null;
			if (typeof window.crypto === "undefined") return null;
			if (typeof window.crypto.subtle === "undefined") return null;
			try {
				const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(window.location.hostname));
				return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
			} catch {
				return null;
			}
		};
		var style = {
			backgroundColor: "red",
			position: "absolute",
			padding: 12,
			fontFamily: "Arial"
		};
		var DOMAIN_BLACKLIST = [
			"28d262b44cc61fa750f1686b16ad0604dabfe193fbc263eec05c89b7ad4c2cd6",
			"4db1b0a94be33165dfefcb3ba03d04c7a2666dd27c496d3dc9fa41858e94925e",
			"fbc48530bbf245da790f63675e84e06bab38c3b114fab07eb350025119922bdc",
			"7baf10a8932757b1b3a22b3fce10a048747ac2f8eaf638603487e3705b07eb83",
			"8a6c21a598d8c667272b5207c051b85997bf5b45d5fb712378be3f27cd72c6a6",
			"a2f7aaac9c50a9255e7fc376110c4e0bfe153722dc66ed3c5d3bf2a135f65518"
		];
		var ran = false;
		var RenderWarningIfBlacklist = () => {
			const [unlicensed, setUnlicensed] = react.default.useState(false);
			(0, react.useEffect)(() => {
				if (ran) return;
				ran = true;
				getHashOfDomain().then((hash) => {
					if (hash && DOMAIN_BLACKLIST.includes(hash)) setUnlicensed(true);
				}).catch(() => {});
			}, []);
			(0, react.useEffect)(() => {
				if (!unlicensed) return;
				const ensureBanner = () => {
					if (!document.querySelector(".warning-banner")) {
						const div = document.createElement("div");
						div.className = "warning-banner";
						Object.assign(div.style, style, {
							zIndex: "9999",
							cssText: `${style.cssText} !important;`
						});
						div.innerHTML = `
	        <a href="https://github.com/remotion-dev/remotion/pull/4589" style="color: white;">
	          Remotion Unlicensed – Contact hi@remotion.dev
	        </a>
	      `;
						document.body.appendChild(div);
					}
				};
				const observer = new MutationObserver(() => ensureBanner());
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				return () => {
					observer.disconnect();
				};
			}, [unlicensed]);
			if (!unlicensed) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style,
				className: "warning-banner",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
					style: { color: "white" },
					href: "https://github.com/remotion-dev/remotion/pull/4589",
					children: "Remotion Unlicensed – Contact hi@remotion.dev"
				})
			});
		};
		var DefaultPlayPauseButton = ({ playing, buffering }) => {
			if (playing && buffering) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BufferingIndicator, { type: "player" });
			if (playing) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PauseIcon, {});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayIcon, {});
		};
		var KNOB_SIZE = 12;
		var BAR_HEIGHT = 5;
		var DefaultVolumeSlider = ({ volume, isVertical, onBlur, inputRef, setVolume }) => {
			const sliderContainer = (0, react.useMemo)(() => {
				const common = {
					paddingLeft: 5,
					height: ICON_SIZE,
					width: VOLUME_SLIDER_WIDTH,
					display: "inline-flex",
					alignItems: "center"
				};
				if (isVertical) return {
					...common,
					position: "absolute",
					transform: `rotate(-90deg) translateX(${VOLUME_SLIDER_WIDTH / 2 + ICON_SIZE / 2}px)`
				};
				return { ...common };
			}, [isVertical]);
			const randomId = typeof react.default.useId === "undefined" ? "volume-slider" : react.default.useId();
			const [randomClass] = (0, react.useState)(() => `__remotion-volume-slider-${random(randomId)}`.replace(".", ""));
			const onVolumeChange = (0, react.useCallback)((e) => {
				setVolume(parseFloat(e.target.value));
			}, [setVolume]);
			const inputStyle = (0, react.useMemo)(() => {
				const commonStyle = {
					WebkitAppearance: "none",
					backgroundColor: "rgba(255, 255, 255, 0.5)",
					borderRadius: BAR_HEIGHT / 2,
					cursor: "pointer",
					height: BAR_HEIGHT,
					width: VOLUME_SLIDER_WIDTH,
					backgroundImage: `linear-gradient(
				to right,
				white ${volume * 100}%, rgba(255, 255, 255, 0) ${volume * 100}%
			)`
				};
				if (isVertical) return {
					...commonStyle,
					bottom: ICON_SIZE + VOLUME_SLIDER_WIDTH / 2
				};
				return commonStyle;
			}, [isVertical, volume]);
			const sliderStyle = `
	.${randomClass}::-webkit-slider-thumb {
		-webkit-appearance: none;
		background-color: white;
		border-radius: ${KNOB_SIZE / 2}px;
		box-shadow: 0 0 2px black;
		height: ${KNOB_SIZE}px;
		width: ${KNOB_SIZE}px;
	}

	.${randomClass}::-moz-range-thumb {
		-webkit-appearance: none;
		background-color: white;
		border-radius: ${KNOB_SIZE / 2}px;
		box-shadow: 0 0 2px black;
		height: ${KNOB_SIZE}px;
		width: ${KNOB_SIZE}px;
	}
`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: sliderContainer,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: sliderStyle } }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					ref: inputRef,
					"aria-label": "Change volume",
					className: randomClass,
					max: 1,
					min: 0,
					onBlur,
					onChange: onVolumeChange,
					step: .01,
					type: "range",
					value: volume,
					style: inputStyle
				})]
			});
		};
		var renderDefaultVolumeSlider = (props) => {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DefaultVolumeSlider, { ...props });
		};
		var VOLUME_SLIDER_WIDTH = 100;
		var MediaVolumeSlider = ({ displayVerticalVolumeSlider, renderMuteButton, renderVolumeSlider }) => {
			const [playerMuted, setPlayerMuted] = Internals.usePlayerMutedState();
			const [mediaVolume, setMediaVolume] = Internals.useMediaVolumeState();
			const [focused, setFocused] = (0, react.useState)(false);
			const parentDivRef = (0, react.useRef)(null);
			const inputRef = (0, react.useRef)(null);
			const hover = useHoverState(parentDivRef, false);
			const onBlur = (0, react.useCallback)(() => {
				setTimeout(() => {
					if (inputRef.current && document.activeElement !== inputRef.current) setFocused(false);
				}, 10);
			}, []);
			const isVolume0 = mediaVolume === 0;
			const onClick = (0, react.useCallback)(() => {
				if (isVolume0) {
					setMediaVolume(1);
					setPlayerMuted(false);
					return;
				}
				setPlayerMuted((mute) => !mute);
			}, [
				isVolume0,
				setPlayerMuted,
				setMediaVolume
			]);
			const parentDivStyle = (0, react.useMemo)(() => {
				return {
					display: "inline-flex",
					background: "none",
					border: "none",
					justifyContent: "center",
					alignItems: "center",
					touchAction: "none",
					...displayVerticalVolumeSlider && { position: "relative" }
				};
			}, [displayVerticalVolumeSlider]);
			const volumeContainer = (0, react.useMemo)(() => {
				return {
					display: "inline",
					width: ICON_SIZE,
					height: ICON_SIZE,
					cursor: "pointer",
					appearance: "none",
					background: "none",
					border: "none",
					padding: 0
				};
			}, []);
			const renderDefaultMuteButton = (0, react.useCallback)(({ muted, volume }) => {
				const isMutedOrZero = muted || volume === 0;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					"aria-label": isMutedOrZero ? "Unmute sound" : "Mute sound",
					title: isMutedOrZero ? "Unmute sound" : "Mute sound",
					onClick,
					onBlur,
					onFocus: () => setFocused(true),
					style: volumeContainer,
					type: "button",
					children: isMutedOrZero ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VolumeOffIcon, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VolumeOnIcon, {})
				});
			}, [
				onBlur,
				onClick,
				volumeContainer
			]);
			const muteButton = (0, react.useMemo)(() => {
				return renderMuteButton ? renderMuteButton({
					muted: playerMuted,
					volume: mediaVolume
				}) : renderDefaultMuteButton({
					muted: playerMuted,
					volume: mediaVolume
				});
			}, [
				playerMuted,
				mediaVolume,
				renderDefaultMuteButton,
				renderMuteButton
			]);
			const volumeSlider = (0, react.useMemo)(() => {
				return (focused || hover) && !playerMuted && !Internals.isIosSafari() ? (renderVolumeSlider ?? renderDefaultVolumeSlider)({
					isVertical: displayVerticalVolumeSlider,
					volume: mediaVolume,
					onBlur: () => setFocused(false),
					inputRef,
					setVolume: setMediaVolume
				}) : null;
			}, [
				displayVerticalVolumeSlider,
				focused,
				hover,
				playerMuted,
				mediaVolume,
				renderVolumeSlider,
				setMediaVolume
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: parentDivRef,
				style: parentDivStyle,
				children: [muteButton, volumeSlider]
			});
		};
		function useComponentVisible(initialIsVisible) {
			const [isComponentVisible, setIsComponentVisible] = (0, react.useState)(initialIsVisible);
			const ref = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const handleClickOutside = (event) => {
					if (ref.current && !ref.current.contains(event.target)) setIsComponentVisible(false);
				};
				document.addEventListener("pointerup", handleClickOutside, true);
				return () => {
					document.removeEventListener("pointerup", handleClickOutside, true);
				};
			}, []);
			return {
				ref,
				isComponentVisible,
				setIsComponentVisible
			};
		}
		var BOTTOM = 35;
		var THRESHOLD = 70;
		var rateDiv = {
			height: 30,
			paddingRight: 15,
			paddingLeft: 12,
			display: "flex",
			flexDirection: "row",
			alignItems: "center"
		};
		var checkmarkContainer = {
			width: 22,
			display: "flex",
			alignItems: "center"
		};
		var checkmarkStyle = {
			width: 14,
			height: 14,
			color: "black"
		};
		var Checkmark = () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
			viewBox: "0 0 512 512",
			style: checkmarkStyle,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				fill: "currentColor",
				d: "M435.848 83.466L172.804 346.51l-96.652-96.652c-4.686-4.686-12.284-4.686-16.971 0l-28.284 28.284c-4.686 4.686-4.686 12.284 0 16.971l133.421 133.421c4.686 4.686 12.284 4.686 16.971 0l299.813-299.813c4.686-4.686 4.686-12.284 0-16.971l-28.284-28.284c-4.686-4.686-12.284-4.686-16.97 0z"
			})
		});
		var formatPlaybackRate = (rate) => {
			const str = rate.toString();
			return str.includes(".") ? str : str + ".0";
		};
		var PlaybackrateOption = ({ rate, onSelect, selectedRate, keyboardSelectedRate }) => {
			const onClick = (0, react.useCallback)((e) => {
				e.stopPropagation();
				e.preventDefault();
				onSelect(rate);
			}, [onSelect, rate]);
			const [hovered, setHovered] = (0, react.useState)(false);
			const onMouseEnter = (0, react.useCallback)(() => {
				setHovered(true);
			}, []);
			const onMouseLeave = (0, react.useCallback)(() => {
				setHovered(false);
			}, []);
			const isFocused = keyboardSelectedRate === rate;
			const actualStyle = (0, react.useMemo)(() => {
				return {
					...rateDiv,
					backgroundColor: hovered || isFocused ? "#eee" : "transparent"
				};
			}, [hovered, isFocused]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				onPointerEnter: onMouseEnter,
				onPointerLeave: onMouseLeave,
				tabIndex: 0,
				style: actualStyle,
				onClick,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: checkmarkContainer,
						children: rate === selectedRate ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Checkmark, {}) : null
					}),
					formatPlaybackRate(rate),
					"x"
				]
			}, rate);
		};
		var PlaybackPopup = ({ setIsComponentVisible, playbackRates, canvasSize }) => {
			const { setPlaybackRate, playbackRate } = Internals.usePlaybackRate();
			const [keyboardSelectedRate, setKeyboardSelectedRate] = (0, react.useState)(playbackRate);
			(0, react.useEffect)(() => {
				const listener = (e) => {
					e.preventDefault();
					if (e.key === "ArrowUp") {
						const currentIndex = playbackRates.findIndex((rate) => rate === keyboardSelectedRate);
						if (currentIndex === 0) return;
						if (currentIndex === -1) setKeyboardSelectedRate(playbackRates[0]);
						else setKeyboardSelectedRate(playbackRates[currentIndex - 1]);
					} else if (e.key === "ArrowDown") {
						const currentIndex = playbackRates.findIndex((rate) => rate === keyboardSelectedRate);
						if (currentIndex === playbackRates.length - 1) return;
						if (currentIndex === -1) setKeyboardSelectedRate(playbackRates[playbackRates.length - 1]);
						else setKeyboardSelectedRate(playbackRates[currentIndex + 1]);
					} else if (e.key === "Enter") {
						setPlaybackRate(keyboardSelectedRate);
						setIsComponentVisible(false);
					}
				};
				window.addEventListener("keydown", listener);
				return () => {
					window.removeEventListener("keydown", listener);
				};
			}, [
				playbackRates,
				keyboardSelectedRate,
				setPlaybackRate,
				setIsComponentVisible
			]);
			const onSelect = (0, react.useCallback)((rate) => {
				setPlaybackRate(rate);
				setIsComponentVisible(false);
			}, [setIsComponentVisible, setPlaybackRate]);
			const playbackPopup = (0, react.useMemo)(() => {
				return {
					position: "absolute",
					right: 0,
					width: 125,
					maxHeight: canvasSize.height - THRESHOLD - BOTTOM,
					bottom: 35,
					background: "#fff",
					borderRadius: 4,
					overflow: "auto",
					color: "black",
					textAlign: "left"
				};
			}, [canvasSize.height]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: playbackPopup,
				children: playbackRates.map((rate) => {
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlaybackrateOption, {
						selectedRate: playbackRate,
						onSelect,
						rate,
						keyboardSelectedRate
					}, rate);
				})
			});
		};
		var label = {
			fontSize: 13,
			fontWeight: "bold",
			color: "white",
			border: "2px solid white",
			borderRadius: 20,
			paddingLeft: 8,
			paddingRight: 8,
			paddingTop: 2,
			paddingBottom: 2
		};
		var playerButtonStyle = {
			appearance: "none",
			backgroundColor: "transparent",
			border: "none",
			cursor: "pointer",
			paddingLeft: 0,
			paddingRight: 0,
			paddingTop: 6,
			paddingBottom: 6,
			height: 37,
			display: "inline-flex",
			marginBottom: 0,
			marginTop: 0,
			alignItems: "center"
		};
		var button = {
			...playerButtonStyle,
			position: "relative"
		};
		var PlaybackrateControl = ({ playbackRates, canvasSize }) => {
			const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
			const { playbackRate } = Internals.usePlaybackRate();
			const onClick = (0, react.useCallback)((e) => {
				e.stopPropagation();
				e.preventDefault();
				setIsComponentVisible((prevIsComponentVisible) => !prevIsComponentVisible);
			}, [setIsComponentVisible]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					"aria-label": "Change playback rate",
					style: button,
					onClick,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: label,
						children: [playbackRate, "x"]
					}), isComponentVisible && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlaybackPopup, {
						canvasSize,
						playbackRates,
						setIsComponentVisible
					})]
				})
			});
		};
		var getFrameFromX = (clientX, durationInFrames, width) => {
			return Math.round(interpolate$1(clientX, [0, width], [0, durationInFrames - 1], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp"
			}));
		};
		var BAR_HEIGHT2 = 5;
		var KNOB_SIZE2 = 12;
		var VERTICAL_PADDING = 4;
		var containerStyle = {
			userSelect: "none",
			WebkitUserSelect: "none",
			paddingTop: VERTICAL_PADDING,
			paddingBottom: VERTICAL_PADDING,
			boxSizing: "border-box",
			cursor: "pointer",
			position: "relative",
			touchAction: "none"
		};
		var barBackground = {
			height: BAR_HEIGHT2,
			backgroundColor: "rgba(255, 255, 255, 0.25)",
			width: "100%",
			borderRadius: BAR_HEIGHT2 / 2
		};
		var findBodyInWhichDivIsLocated = (div) => {
			let current = div;
			while (current.parentElement) current = current.parentElement;
			return current;
		};
		var PlayerSeekBar = ({ durationInFrames, onSeekEnd, onSeekStart, inFrame, outFrame }) => {
			const containerRef = (0, react.useRef)(null);
			const barHovered = useHoverState(containerRef, false);
			const size = useElementSize(containerRef, {
				triggerOnWindowResize: true,
				shouldApplyCssTransforms: true
			});
			const { seek, play, pause, isPlaying } = usePlayerMethods();
			const frame = Internals.Timeline.useTimelinePosition();
			const [dragging, setDragging] = (0, react.useState)({ dragging: false });
			const width = size?.width ?? 0;
			const onPointerDown = (0, react.useCallback)((e) => {
				if (e.button !== 0) return;
				const posLeft = containerRef.current?.getBoundingClientRect().left;
				const _frame = getFrameFromX(e.clientX - posLeft, durationInFrames, width);
				const wasPlaying = isPlaying();
				pause();
				seek(_frame);
				setDragging({
					dragging: true,
					wasPlaying
				});
				onSeekStart();
			}, [
				durationInFrames,
				width,
				isPlaying,
				pause,
				seek,
				onSeekStart
			]);
			const onPointerMove = (0, react.useCallback)((e) => {
				if (!size) throw new Error("Player has no size");
				if (!dragging.dragging) return;
				const posLeft = containerRef.current?.getBoundingClientRect().left;
				const _frame = getFrameFromX(e.clientX - posLeft, durationInFrames, size.width);
				seek(_frame);
			}, [
				dragging.dragging,
				durationInFrames,
				seek,
				size
			]);
			const onPointerUp = (0, react.useCallback)(() => {
				setDragging({ dragging: false });
				if (!dragging.dragging) return;
				if (dragging.wasPlaying) play();
				else pause();
				onSeekEnd();
			}, [
				dragging,
				onSeekEnd,
				pause,
				play
			]);
			(0, react.useEffect)(() => {
				if (!dragging.dragging) return;
				const body = findBodyInWhichDivIsLocated(containerRef.current);
				body.addEventListener("pointermove", onPointerMove);
				body.addEventListener("pointerup", onPointerUp);
				return () => {
					body.removeEventListener("pointermove", onPointerMove);
					body.removeEventListener("pointerup", onPointerUp);
				};
			}, [
				dragging.dragging,
				onPointerMove,
				onPointerUp
			]);
			const knobStyle = (0, react.useMemo)(() => {
				return {
					height: KNOB_SIZE2,
					width: KNOB_SIZE2,
					borderRadius: KNOB_SIZE2 / 2,
					position: "absolute",
					top: VERTICAL_PADDING - KNOB_SIZE2 / 2 + 5 / 2,
					backgroundColor: "white",
					left: Math.max(0, frame / Math.max(1, durationInFrames - 1) * width - KNOB_SIZE2 / 2),
					boxShadow: "0 0 2px black",
					opacity: Number(barHovered || dragging.dragging)
				};
			}, [
				barHovered,
				dragging.dragging,
				durationInFrames,
				frame,
				width
			]);
			const fillStyle = (0, react.useMemo)(() => {
				return {
					height: BAR_HEIGHT2,
					backgroundColor: "rgba(255, 255, 255, 1)",
					width: (frame - (inFrame ?? 0)) / (durationInFrames - 1) * width,
					marginLeft: (inFrame ?? 0) / (durationInFrames - 1) * width,
					borderRadius: BAR_HEIGHT2 / 2
				};
			}, [
				durationInFrames,
				frame,
				inFrame,
				width
			]);
			const active = (0, react.useMemo)(() => {
				return {
					height: BAR_HEIGHT2,
					backgroundColor: "rgba(255, 255, 255, 0.25)",
					width: ((outFrame ?? durationInFrames - 1) - (inFrame ?? 0)) / (durationInFrames - 1) * 100 + "%",
					marginLeft: (inFrame ?? 0) / (durationInFrames - 1) * 100 + "%",
					borderRadius: BAR_HEIGHT2 / 2,
					position: "absolute"
				};
			}, [
				durationInFrames,
				inFrame,
				outFrame
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: containerRef,
				onPointerDown,
				style: containerStyle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: barBackground,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: active }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: fillStyle })]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: knobStyle })]
			});
		};
		var formatTime = (timeInSeconds) => {
			const minutes = Math.floor(timeInSeconds / 60);
			const seconds = Math.floor(timeInSeconds - minutes * 60);
			return `${String(minutes)}:${String(seconds).padStart(2, "0")}`;
		};
		var PlayerTimeLabel = ({ durationInFrames, maxTimeLabelWidth, fps }) => {
			const frame = Internals.Timeline.useTimelinePosition();
			const timeLabel = (0, react.useMemo)(() => {
				return {
					color: "white",
					fontFamily: "sans-serif",
					fontSize: 14,
					maxWidth: maxTimeLabelWidth === null ? void 0 : maxTimeLabelWidth,
					overflow: "hidden",
					textOverflow: "ellipsis"
				};
			}, [maxTimeLabelWidth]);
			const frameToDisplay = frame === durationInFrames - 1 ? frame + 1 : frame;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: timeLabel,
				children: [
					formatTime(frameToDisplay / fps),
					" / ",
					formatTime(durationInFrames / fps)
				]
			});
		};
		var X_SPACER = 10;
		var X_PADDING = 12;
		var useVideoControlsResize = ({ allowFullscreen: allowFullScreen, playerWidth }) => {
			return (0, react.useMemo)(() => {
				const playPauseIconSize = ICON_SIZE;
				const volumeIconSize = ICON_SIZE;
				const _fullscreenIconSize = allowFullScreen ? fullscreenIconSize : 0;
				const elementsSize = volumeIconSize + playPauseIconSize + _fullscreenIconSize + X_PADDING * 2 + X_SPACER * 2;
				const maxTimeLabelWidth = playerWidth - elementsSize;
				const maxTimeLabelWidthWithoutNegativeValue = Math.max(maxTimeLabelWidth, 0);
				const availableTimeLabelWidthIfVolumeOpen = maxTimeLabelWidthWithoutNegativeValue - VOLUME_SLIDER_WIDTH;
				const displayVerticalVolumeSlider = playerWidth < (availableTimeLabelWidthIfVolumeOpen < VOLUME_SLIDER_WIDTH ? maxTimeLabelWidthWithoutNegativeValue : availableTimeLabelWidthIfVolumeOpen) + elementsSize + VOLUME_SLIDER_WIDTH;
				return {
					maxTimeLabelWidth: maxTimeLabelWidthWithoutNegativeValue === 0 ? null : maxTimeLabelWidthWithoutNegativeValue,
					displayVerticalVolumeSlider
				};
			}, [allowFullScreen, playerWidth]);
		};
		var gradientSteps = [
			0,
			.013,
			.049,
			.104,
			.175,
			.259,
			.352,
			.45,
			.55,
			.648,
			.741,
			.825,
			.896,
			.951,
			.987
		];
		var gradientOpacities = [
			0,
			8.1,
			15.5,
			22.5,
			29,
			35.3,
			41.2,
			47.1,
			52.9,
			58.8,
			64.7,
			71,
			77.5,
			84.5,
			91.9
		];
		var globalGradientOpacity = 1 / .7;
		var containerStyle2 = {
			boxSizing: "border-box",
			position: "absolute",
			bottom: 0,
			width: "100%",
			paddingTop: 40,
			paddingBottom: 10,
			backgroundImage: `linear-gradient(to bottom,${gradientSteps.map((g, i) => {
				return `hsla(0, 0%, 0%, ${g}) ${gradientOpacities[i] * globalGradientOpacity}%`;
			}).join(", ")}, hsl(0, 0%, 0%) 100%)`,
			backgroundSize: "auto 145px",
			display: "flex",
			paddingRight: X_PADDING,
			paddingLeft: X_PADDING,
			flexDirection: "column",
			transition: "opacity 0.3s"
		};
		var controlsRow = {
			display: "flex",
			flexDirection: "row",
			width: "100%",
			alignItems: "center",
			justifyContent: "center",
			userSelect: "none",
			WebkitUserSelect: "none"
		};
		var leftPartStyle = {
			display: "flex",
			flexDirection: "row",
			userSelect: "none",
			WebkitUserSelect: "none",
			alignItems: "center"
		};
		var xSpacer = { width: 12 };
		var ySpacer = { height: 8 };
		var flex1 = { flex: 1 };
		var fullscreen = {};
		var Controls = ({ durationInFrames, isFullscreen, fps, showVolumeControls, onFullscreenButtonClick, allowFullscreen, onExitFullscreenButtonClick, spaceKeyToPlayOrPause, onSeekEnd, onSeekStart, inFrame, outFrame, initiallyShowControls, canvasSize, renderPlayPauseButton, renderFullscreenButton, alwaysShowControls, showPlaybackRateControl, containerRef, buffering, hideControlsWhenPointerDoesntMove, onPointerDown, onDoubleClick, renderMuteButton, renderVolumeSlider, playing, toggle, renderCustomControls }) => {
			const playButtonRef = (0, react.useRef)(null);
			const [supportsFullscreen, setSupportsFullscreen] = (0, react.useState)(false);
			const hovered = useHoverState(containerRef, hideControlsWhenPointerDoesntMove);
			const { maxTimeLabelWidth, displayVerticalVolumeSlider } = useVideoControlsResize({
				allowFullscreen,
				playerWidth: canvasSize?.width ?? 0
			});
			const [shouldShowInitially, setInitiallyShowControls] = (0, react.useState)(() => {
				if (typeof initiallyShowControls === "boolean") return initiallyShowControls;
				if (typeof initiallyShowControls === "number") {
					if (initiallyShowControls % 1 !== 0) throw new Error("initiallyShowControls must be an integer or a boolean");
					if (Number.isNaN(initiallyShowControls)) throw new Error("initiallyShowControls must not be NaN");
					if (!Number.isFinite(initiallyShowControls)) throw new Error("initiallyShowControls must be finite");
					if (initiallyShowControls <= 0) throw new Error("initiallyShowControls must be a positive integer");
					return initiallyShowControls;
				}
				throw new TypeError("initiallyShowControls must be a number or a boolean");
			});
			const containerCss = (0, react.useMemo)(() => {
				const shouldShow = hovered || !playing || shouldShowInitially || alwaysShowControls;
				return {
					...containerStyle2,
					opacity: Number(shouldShow)
				};
			}, [
				hovered,
				shouldShowInitially,
				playing,
				alwaysShowControls
			]);
			(0, react.useEffect)(() => {
				if (playButtonRef.current && spaceKeyToPlayOrPause) playButtonRef.current.focus({ preventScroll: true });
			}, [playing, spaceKeyToPlayOrPause]);
			(0, react.useEffect)(() => {
				setSupportsFullscreen((typeof document !== "undefined" && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) ?? false);
			}, []);
			(0, react.useEffect)(() => {
				if (shouldShowInitially === false) return;
				const timeout = setTimeout(() => {
					setInitiallyShowControls(false);
				}, shouldShowInitially === true ? 2e3 : shouldShowInitially);
				return () => {
					clearInterval(timeout);
				};
			}, [shouldShowInitially]);
			const playbackRates = (0, react.useMemo)(() => {
				if (showPlaybackRateControl === true) return [
					.5,
					.8,
					1,
					1.2,
					1.5,
					1.8,
					2,
					2.5,
					3
				];
				if (Array.isArray(showPlaybackRateControl)) {
					for (const rate of showPlaybackRateControl) {
						if (typeof rate !== "number") throw new Error("Every item in showPlaybackRateControl must be a number");
						if (rate <= 0) throw new Error("Every item in showPlaybackRateControl must be positive");
					}
					return showPlaybackRateControl;
				}
				return null;
			}, [showPlaybackRateControl]);
			const customControlsElement = renderCustomControls ? renderCustomControls() : null;
			const ref = (0, react.useRef)(null);
			const flexRef = (0, react.useRef)(null);
			const onPointerDownIfContainer = (0, react.useCallback)((e) => {
				if (e.target === ref.current || e.target === flexRef.current) onPointerDown?.(e);
			}, [onPointerDown]);
			const onDoubleClickIfContainer = (0, react.useCallback)((e) => {
				if (e.target === ref.current || e.target === flexRef.current) onDoubleClick?.(e);
			}, [onDoubleClick]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref,
				style: containerCss,
				onPointerDown: onPointerDownIfContainer,
				onDoubleClick: onDoubleClickIfContainer,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						ref: flexRef,
						style: controlsRow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: leftPartStyle,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										ref: playButtonRef,
										type: "button",
										style: playerButtonStyle,
										onClick: toggle,
										"aria-label": playing ? "Pause video" : "Play video",
										title: playing ? "Pause video" : "Play video",
										children: renderPlayPauseButton === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DefaultPlayPauseButton, {
											buffering,
											playing
										}) : renderPlayPauseButton({
											playing,
											isBuffering: buffering
										}) ?? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DefaultPlayPauseButton, {
											buffering,
											playing
										})
									}),
									showVolumeControls ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: xSpacer }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaVolumeSlider, {
										renderMuteButton,
										renderVolumeSlider,
										displayVerticalVolumeSlider
									})] }) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: xSpacer }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayerTimeLabel, {
										durationInFrames,
										fps,
										maxTimeLabelWidth
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: xSpacer })
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: flex1 }),
							customControlsElement,
							customControlsElement && playbackRates && canvasSize ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: xSpacer }) : null,
							playbackRates && canvasSize && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlaybackrateControl, {
								canvasSize,
								playbackRates
							}),
							playbackRates && supportsFullscreen && allowFullscreen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: xSpacer }) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: fullscreen,
								children: supportsFullscreen && allowFullscreen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": isFullscreen ? "Exit fullscreen" : "Enter Fullscreen",
									title: isFullscreen ? "Exit fullscreen" : "Enter Fullscreen",
									style: playerButtonStyle,
									onClick: isFullscreen ? onExitFullscreenButtonClick : onFullscreenButtonClick,
									children: renderFullscreenButton === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FullscreenIcon, { isFullscreen }) : renderFullscreenButton({ isFullscreen })
								}) : null
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: ySpacer }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayerSeekBar, {
						onSeekEnd,
						onSeekStart,
						durationInFrames,
						inFrame,
						outFrame
					})
				]
			});
		};
		var IS_NODE = typeof document === "undefined";
		var cancellablePromise = (promise) => {
			let isCanceled = false;
			return {
				promise: new Promise((resolve, reject) => {
					promise.then((value) => {
						if (isCanceled) {
							reject({
								isCanceled,
								value
							});
							return;
						}
						resolve(value);
					}).catch((error) => {
						reject({
							isCanceled,
							error
						});
					});
				}),
				cancel: () => {
					isCanceled = true;
				}
			};
		};
		var delay = (n) => new Promise((resolve) => setTimeout(resolve, n));
		var useCancellablePromises = () => {
			const pendingPromises = (0, react.useRef)([]);
			const appendPendingPromise = (0, react.useCallback)((promise) => {
				pendingPromises.current = [...pendingPromises.current, promise];
			}, []);
			const removePendingPromise = (0, react.useCallback)((promise) => {
				pendingPromises.current = pendingPromises.current.filter((p) => p !== promise);
			}, []);
			const clearPendingPromises = (0, react.useCallback)(() => pendingPromises.current.map((p) => p.cancel()), []);
			return (0, react.useMemo)(() => ({
				appendPendingPromise,
				removePendingPromise,
				clearPendingPromises
			}), [
				appendPendingPromise,
				clearPendingPromises,
				removePendingPromise
			]);
		};
		var useClickPreventionOnDoubleClick = (onClick, onDoubleClick, doubleClickToFullscreen) => {
			const api = useCancellablePromises();
			const handleClick = (0, react.useCallback)(async (e) => {
				if (e instanceof PointerEvent ? e.pointerType === "touch" : e.nativeEvent.pointerType === "touch") {
					onClick(e);
					return;
				}
				api.clearPendingPromises();
				const waitForClick = cancellablePromise(delay(200));
				api.appendPendingPromise(waitForClick);
				try {
					await waitForClick.promise;
					api.removePendingPromise(waitForClick);
					onClick(e);
				} catch (errorInfo) {
					const info = errorInfo;
					api.removePendingPromise(waitForClick);
					if (!info.isCanceled) throw info.error;
				}
			}, [api, onClick]);
			const handlePointerDown = (0, react.useCallback)(() => {
				document.addEventListener("pointerup", (newEvt) => {
					handleClick(newEvt);
				}, { once: true });
			}, [handleClick]);
			const handleDoubleClick = (0, react.useCallback)(() => {
				api.clearPendingPromises();
				onDoubleClick();
			}, [api, onDoubleClick]);
			return (0, react.useMemo)(() => {
				if (!doubleClickToFullscreen) return {
					handlePointerDown: onClick,
					handleDoubleClick: () => {}
				};
				return {
					handlePointerDown,
					handleDoubleClick
				};
			}, [
				doubleClickToFullscreen,
				handleDoubleClick,
				handlePointerDown,
				onClick
			]);
		};
		var reactVersion = react.default.version.split(".")[0];
		if (reactVersion === "0") throw new Error(`Version ${reactVersion} of "react" is not supported by Remotion`);
		var doesReactVersionSupportSuspense = parseInt(reactVersion, 10) >= 18;
		var PlayerUI = ({ controls, style: style2, loop, autoPlay, allowFullscreen, inputProps, clickToPlay, showVolumeControls, doubleClickToFullscreen, spaceKeyToPlayOrPause, errorFallback, playbackRate, renderLoading, renderPoster, className: className2, moveToBeginningWhenEnded, showPosterWhenUnplayed, showPosterWhenEnded, showPosterWhenPaused, showPosterWhenBuffering, showPosterWhenBufferingAndPaused, inFrame, outFrame, initiallyShowControls, renderFullscreen: renderFullscreenButton, renderPlayPauseButton, renderMuteButton, renderVolumeSlider, renderCustomControls, alwaysShowControls, showPlaybackRateControl, posterFillMode, bufferStateDelayInMilliseconds, hideControlsWhenPointerDoesntMove, overflowVisible, browserMediaControlsBehavior, overrideInternalClassName, noSuspense }, ref) => {
			const config = Internals.useUnsafeVideoConfig();
			const video = Internals.useVideo();
			const container = (0, react.useRef)(null);
			const canvasSize = useElementSize(container, {
				triggerOnWindowResize: false,
				shouldApplyCssTransforms: false
			});
			const [hasPausedToResume, setHasPausedToResume] = (0, react.useState)(false);
			const [shouldAutoplay, setShouldAutoPlay] = (0, react.useState)(autoPlay);
			const [isFullscreen, setIsFullscreen] = (0, react.useState)(() => false);
			const [seeking, setSeeking] = (0, react.useState)(false);
			const [hasPlayed, setHasPlayed] = (0, react.useState)(false);
			const supportsFullScreen = (0, react.useMemo)(() => {
				if (typeof document === "undefined") return false;
				return Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
			}, []);
			const player = usePlayerMethods();
			const playing = Internals.usePlaying();
			const frame = Internals.Timeline.useTimelinePosition();
			const play = (0, react.useCallback)((e) => {
				if (player.isPlaying()) return;
				setHasPlayed(true);
				player.play(e);
			}, [player]);
			const { playerMuted, mediaVolume } = (0, react.useContext)(Internals.MediaVolumeContext);
			(0, react.useEffect)(() => {
				player.emitter.dispatchVolumeChange(mediaVolume);
			}, [player.emitter, mediaVolume]);
			const isMuted = playerMuted || mediaVolume === 0;
			(0, react.useEffect)(() => {
				player.emitter.dispatchMuteChange({ isMuted });
			}, [player.emitter, isMuted]);
			usePlayback({
				loop,
				playbackRate,
				moveToBeginningWhenEnded,
				inFrame,
				outFrame,
				getCurrentFrame: player.getCurrentFrame,
				browserMediaControlsBehavior,
				muted: isMuted
			});
			(0, react.useEffect)(() => {
				if (hasPausedToResume && !playing) {
					setHasPausedToResume(false);
					play();
				}
			}, [
				hasPausedToResume,
				play,
				playing
			]);
			(0, react.useEffect)(() => {
				const { current } = container;
				if (!current) return;
				const onFullscreenChange = () => {
					const newValue = document.fullscreenElement === current || document.webkitFullscreenElement === current;
					setIsFullscreen(newValue);
				};
				document.addEventListener("fullscreenchange", onFullscreenChange);
				document.addEventListener("webkitfullscreenchange", onFullscreenChange);
				return () => {
					document.removeEventListener("fullscreenchange", onFullscreenChange);
					document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
				};
			}, []);
			const toggle = (0, react.useCallback)((e) => {
				if (player.isPlaying()) player.pause();
				else play(e);
			}, [play, player]);
			const requestFullscreen = (0, react.useCallback)(() => {
				if (!allowFullscreen) throw new Error("allowFullscreen is false");
				if (!supportsFullScreen) throw new Error("Browser doesnt support fullscreen");
				if (!container.current) throw new Error("No player ref found");
				if (container.current.webkitRequestFullScreen) container.current.webkitRequestFullScreen();
				else container.current.requestFullscreen();
			}, [allowFullscreen, supportsFullScreen]);
			const exitFullscreen = (0, react.useCallback)(() => {
				if (document.webkitExitFullscreen) document.webkitExitFullscreen();
				else document.exitFullscreen();
			}, []);
			(0, react.useEffect)(() => {
				const { current } = container;
				if (!current) return;
				const fullscreenChange = () => {
					const element = document.webkitFullscreenElement ?? document.fullscreenElement;
					if (element && element === container.current) player.emitter.dispatchFullscreenChange({ isFullscreen: true });
					else player.emitter.dispatchFullscreenChange({ isFullscreen: false });
				};
				current.addEventListener("webkitfullscreenchange", fullscreenChange);
				current.addEventListener("fullscreenchange", fullscreenChange);
				return () => {
					current.removeEventListener("webkitfullscreenchange", fullscreenChange);
					current.removeEventListener("fullscreenchange", fullscreenChange);
				};
			}, [player.emitter]);
			const durationInFrames = config?.durationInFrames ?? 1;
			const layout = (0, react.useMemo)(() => {
				if (!config || !canvasSize) return null;
				return calculateCanvasTransformation({
					canvasSize,
					compositionHeight: config.height,
					compositionWidth: config.width,
					previewSize: "auto"
				});
			}, [canvasSize, config]);
			const scale = layout?.scale ?? 1;
			const initialScaleIgnored = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (!initialScaleIgnored.current) {
					initialScaleIgnored.current = true;
					return;
				}
				player.emitter.dispatchScaleChange(scale);
			}, [player.emitter, scale]);
			const { setMediaVolume, setPlayerMuted } = (0, react.useContext)(Internals.SetMediaVolumeContext);
			const [showBufferIndicator, setShowBufferState] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let timeout = null;
				let stopped = false;
				const onBuffer = () => {
					stopped = false;
					requestAnimationFrame(() => {
						if (bufferStateDelayInMilliseconds === 0) setShowBufferState(true);
						else timeout = setTimeout(() => {
							if (!stopped) setShowBufferState(true);
						}, bufferStateDelayInMilliseconds);
					});
				};
				const onResume = () => {
					requestAnimationFrame(() => {
						stopped = true;
						setShowBufferState(false);
						if (timeout) clearTimeout(timeout);
					});
				};
				player.emitter.addEventListener("waiting", onBuffer);
				player.emitter.addEventListener("resume", onResume);
				return () => {
					player.emitter.removeEventListener("waiting", onBuffer);
					player.emitter.removeEventListener("resume", onResume);
					setShowBufferState(false);
					if (timeout) clearTimeout(timeout);
					stopped = true;
				};
			}, [bufferStateDelayInMilliseconds, player.emitter]);
			(0, react.useImperativeHandle)(ref, () => {
				const methods = {
					play,
					pause: () => {
						setHasPausedToResume(false);
						player.pause();
					},
					toggle,
					getContainerNode: () => container.current,
					getCurrentFrame: player.getCurrentFrame,
					isPlaying: player.isPlaying,
					seekTo: (f) => {
						const lastFrame = durationInFrames - 1;
						const frameToSeekTo = Math.max(0, Math.min(lastFrame, f));
						if (player.isPlaying()) {
							setHasPausedToResume(frameToSeekTo !== lastFrame || loop);
							player.pause();
						}
						if (frameToSeekTo === lastFrame && !loop) player.emitter.dispatchEnded();
						player.seek(frameToSeekTo);
					},
					isFullscreen: () => {
						const { current } = container;
						if (!current) return false;
						return document.fullscreenElement === current || document.webkitFullscreenElement === current;
					},
					requestFullscreen,
					exitFullscreen,
					getVolume: () => {
						if (playerMuted) return 0;
						return mediaVolume;
					},
					setVolume: (vol) => {
						if (typeof vol !== "number") throw new TypeError(`setVolume() takes a number, got value of type ${typeof vol}`);
						if (isNaN(vol)) throw new TypeError(`setVolume() got a number that is NaN. Volume must be between 0 and 1.`);
						if (vol < 0 || vol > 1) throw new TypeError(`setVolume() got a number that is out of range. Must be between 0 and 1, got ${vol}`);
						setMediaVolume(vol);
					},
					isMuted: () => isMuted,
					mute: () => {
						setPlayerMuted(true);
					},
					unmute: () => {
						setPlayerMuted(false);
					},
					getScale: () => scale,
					pauseAndReturnToPlayStart: () => {
						player.pauseAndReturnToPlayStart();
					}
				};
				return Object.assign(player.emitter, methods);
			}, [
				durationInFrames,
				exitFullscreen,
				loop,
				playerMuted,
				isMuted,
				mediaVolume,
				player,
				play,
				requestFullscreen,
				setPlayerMuted,
				setMediaVolume,
				toggle,
				scale
			]);
			const VideoComponent = video ? video.component : null;
			const outerStyle = (0, react.useMemo)(() => {
				return calculateOuterStyle({
					canvasSize,
					config,
					style: style2,
					overflowVisible,
					layout
				});
			}, [
				canvasSize,
				config,
				layout,
				overflowVisible,
				style2
			]);
			const outer = (0, react.useMemo)(() => {
				return calculateOuter({
					config,
					layout,
					scale,
					overflowVisible
				});
			}, [
				config,
				layout,
				overflowVisible,
				scale
			]);
			const containerStyle3 = (0, react.useMemo)(() => {
				return calculateContainerStyle({
					config,
					layout,
					scale,
					overflowVisible
				});
			}, [
				config,
				layout,
				overflowVisible,
				scale
			]);
			const playerPause = player.pause;
			const playerDispatchError = player.emitter.dispatchError;
			const onError = (0, react.useCallback)((error) => {
				playerPause();
				playerDispatchError(error);
			}, [playerDispatchError, playerPause]);
			const onFullscreenButtonClick = (0, react.useCallback)((e) => {
				e.stopPropagation();
				requestFullscreen();
			}, [requestFullscreen]);
			const onExitFullscreenButtonClick = (0, react.useCallback)((e) => {
				e.stopPropagation();
				exitFullscreen();
			}, [exitFullscreen]);
			const onSingleClick = (0, react.useCallback)((e) => {
				if (e instanceof MouseEvent ? e.button === 2 : e.nativeEvent.button) return;
				toggle(e);
			}, [toggle]);
			const onSeekStart = (0, react.useCallback)(() => {
				setSeeking(true);
			}, []);
			const onSeekEnd = (0, react.useCallback)(() => {
				setSeeking(false);
			}, []);
			const { handlePointerDown, handleDoubleClick } = useClickPreventionOnDoubleClick(onSingleClick, (0, react.useCallback)(() => {
				if (isFullscreen) exitFullscreen();
				else requestFullscreen();
			}, [
				exitFullscreen,
				isFullscreen,
				requestFullscreen
			]), doubleClickToFullscreen && allowFullscreen && supportsFullScreen);
			(0, react.useEffect)(() => {
				if (shouldAutoplay) {
					setHasPlayed(true);
					player.playAsAutoPlay();
					setShouldAutoPlay(false);
				}
			}, [player, shouldAutoplay]);
			const loadingMarkup = (0, react.useMemo)(() => {
				return renderLoading ? renderLoading({
					height: outerStyle.height,
					width: outerStyle.width,
					isBuffering: showBufferIndicator
				}) : null;
			}, [
				outerStyle.height,
				outerStyle.width,
				renderLoading,
				showBufferIndicator
			]);
			const currentScale = (0, react.useMemo)(() => {
				return {
					type: "scale",
					scale
				};
			}, [scale]);
			if (!config) return null;
			const poster = renderPoster ? renderPoster({
				height: posterFillMode === "player-size" ? outerStyle.height : config.height,
				width: posterFillMode === "player-size" ? outerStyle.width : config.width,
				isBuffering: showBufferIndicator
			}) : null;
			if (poster === void 0) throw new TypeError("renderPoster() must return a React element, but undefined was returned");
			const shouldShowPoster = poster && [
				showPosterWhenPaused && !playing && !seeking,
				showPosterWhenEnded && frame === durationInFrames - 1 && !playing,
				showPosterWhenUnplayed && !hasPlayed && !playing,
				showPosterWhenBuffering && showBufferIndicator && playing,
				showPosterWhenBufferingAndPaused && showBufferIndicator && !playing
			].some(Boolean);
			const { left, top, width, height, ...outerWithoutScale } = outer;
			const content = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: outer,
					onPointerDown: clickToPlay ? handlePointerDown : void 0,
					onDoubleClick: doubleClickToFullscreen ? handleDoubleClick : void 0,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: containerStyle3,
						className: playerCssClassname(overrideInternalClassName),
						children: [VideoComponent ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBoundary, {
							onError,
							errorFallback,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.CurrentScaleContext.Provider, {
								value: currentScale,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoComponent, {
									...video?.props ?? {},
									...inputProps ?? {}
								})
							})
						}) : null, shouldShowPoster && posterFillMode === "composition-size" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...outerWithoutScale,
								width: config.width,
								height: config.height
							},
							onPointerDown: clickToPlay ? handlePointerDown : void 0,
							onDoubleClick: doubleClickToFullscreen ? handleDoubleClick : void 0,
							children: poster
						}) : null]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenderWarningIfBlacklist, {})]
				}),
				shouldShowPoster && posterFillMode === "player-size" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: outer,
					onPointerDown: clickToPlay ? handlePointerDown : void 0,
					onDoubleClick: doubleClickToFullscreen ? handleDoubleClick : void 0,
					children: poster
				}) : null,
				controls ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Controls, {
					fps: config.fps,
					playing,
					toggle,
					durationInFrames: config.durationInFrames,
					containerRef: container,
					onFullscreenButtonClick,
					isFullscreen,
					allowFullscreen,
					showVolumeControls,
					onExitFullscreenButtonClick,
					spaceKeyToPlayOrPause,
					onSeekEnd,
					onSeekStart,
					inFrame,
					outFrame,
					initiallyShowControls,
					canvasSize,
					renderFullscreenButton,
					renderPlayPauseButton,
					alwaysShowControls,
					showPlaybackRateControl,
					buffering: showBufferIndicator,
					hideControlsWhenPointerDoesntMove,
					onDoubleClick: doubleClickToFullscreen ? handleDoubleClick : void 0,
					onPointerDown: clickToPlay ? handlePointerDown : void 0,
					renderMuteButton,
					renderVolumeSlider,
					renderCustomControls
				}) : null
			] });
			if (noSuspense || IS_NODE && !doesReactVersionSupportSuspense) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: container,
				style: outerStyle,
				className: className2,
				children: content
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: container,
				style: outerStyle,
				className: className2,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
					fallback: loadingMarkup,
					children: content
				})
			});
		};
		var PlayerUI_default = (0, react.forwardRef)(PlayerUI);
		var DEFAULT_VOLUME_PERSISTENCE_KEY = "remotion.volumePreference";
		var persistVolume = (volume, logLevel, volumePersistenceKey) => {
			if (typeof window === "undefined") return;
			try {
				window.localStorage.setItem(volumePersistenceKey ?? DEFAULT_VOLUME_PERSISTENCE_KEY, String(volume));
			} catch (e) {
				Internals.Log.error({
					logLevel,
					tag: null
				}, "Could not persist volume", e);
			}
		};
		var getPreferredVolume = (volumePersistenceKey) => {
			if (typeof window === "undefined") return 1;
			try {
				const val = window.localStorage.getItem(volumePersistenceKey ?? DEFAULT_VOLUME_PERSISTENCE_KEY);
				return val ? Number(val) : 1;
			} catch {
				return 1;
			}
		};
		var PLAYER_COMP_ID = "player-comp";
		var SharedPlayerContexts = ({ children, timelineContext, playbackRateContext, fps, compositionHeight, compositionWidth, durationInFrames, component, numberOfSharedAudioTags, initiallyMuted, logLevel, audioLatencyHint, sampleRate, volumePersistenceKey, initialVolume, inputProps, audioEnabled, _experimentalKeepAudioContextAlive }) => {
			const persistVolumeToStorage = initialVolume === void 0;
			const compositionManagerContext = (0, react.useMemo)(() => {
				return {
					compositions: [{
						component,
						durationInFrames,
						height: compositionHeight,
						width: compositionWidth,
						fps,
						id: PLAYER_COMP_ID,
						order: null,
						folderName: null,
						parentFolderName: null,
						schema: null,
						calculateMetadata: null,
						stack: null
					}],
					folders: [],
					currentAssetMetadata: null,
					currentCompositionMetadata: {
						defaultCodec: null,
						defaultOutName: null,
						defaultPixelFormat: null,
						defaultProResProfile: null,
						defaultSampleRate: null,
						defaultVideoImageFormat: null,
						durationInFrames,
						fps,
						height: compositionHeight,
						width: compositionWidth,
						props: inputProps
					},
					canvasContent: {
						type: "composition",
						compositionId: "player-comp"
					}
				};
			}, [
				component,
				durationInFrames,
				compositionHeight,
				compositionWidth,
				fps,
				inputProps
			]);
			const [playerMuted, setPlayerMuted] = (0, react.useState)(() => initiallyMuted);
			const [mediaVolume, setMediaVolume] = (0, react.useState)(() => persistVolumeToStorage ? getPreferredVolume(volumePersistenceKey ?? null) : initialVolume);
			const mediaVolumeContextValue = (0, react.useMemo)(() => {
				return {
					playerMuted,
					mediaVolume
				};
			}, [playerMuted, mediaVolume]);
			const audioContextWasCreated = (0, react.useRef)(false);
			const shouldCreateAudioContext = audioContextWasCreated.current || audioEnabled && !playerMuted && mediaVolume > 0;
			audioContextWasCreated.current = shouldCreateAudioContext;
			const setMediaVolumeAndPersist = (0, react.useCallback)((vol) => {
				setMediaVolume(vol);
				if (persistVolumeToStorage) persistVolume(vol, logLevel, volumePersistenceKey ?? null);
			}, [
				persistVolumeToStorage,
				logLevel,
				volumePersistenceKey
			]);
			const setMediaVolumeContextValue = (0, react.useMemo)(() => {
				return {
					setPlayerMuted,
					setMediaVolume: setMediaVolumeAndPersist
				};
			}, [setMediaVolumeAndPersist]);
			const logLevelContext = (0, react.useMemo)(() => {
				return {
					logLevel,
					mountTime: Date.now()
				};
			}, [logLevel]);
			const env = (0, react.useMemo)(() => {
				return {
					isPlayer: true,
					isRendering: false,
					isStudio: false,
					isClientSideRendering: false,
					isReadOnlyStudio: false
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.RemotionEnvironmentContext.Provider, {
				value: env,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.LogLevelContext.Provider, {
					value: logLevelContext,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.CanUseRemotionHooksProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.AbsoluteTimeContext.Provider, {
						value: timelineContext,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.PlaybackRateContext.Provider, {
							value: playbackRateContext,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.TimelineContext.Provider, {
								value: timelineContext,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.CompositionManager.Provider, {
									value: compositionManagerContext,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.PrefetchProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.DurationsContextProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.MediaVolumeContext.Provider, {
										value: mediaVolumeContextValue,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.SetMediaVolumeContext.Provider, {
											value: setMediaVolumeContextValue,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.BufferingProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.SharedAudioContextProvider, {
												audioLatencyHint,
												audioEnabled: shouldCreateAudioContext,
												previewSampleRate: sampleRate,
												_experimentalKeepAudioContextAlive,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.SharedAudioTagsContextProvider, {
													numberOfAudioTags: numberOfSharedAudioTags,
													children
												})
											}) })
										})
									}) }) })
								})
							})
						})
					}) })
				})
			});
		};
		var warningShown = false;
		var acknowledgeRemotionLicenseMessage = (acknowledge, logLevel) => {
			if (acknowledge) return;
			if (warningShown) return;
			warningShown = true;
			Internals.Log.warn({
				logLevel,
				tag: null
			}, "Note: Some companies are required to obtain a license to use Remotion. See: https://remotion.dev/license\nPass the `acknowledgeRemotionLicense` prop to `<Player />` function to make this message disappear.");
		};
		var validateSingleFrame = (frame, variableName) => {
			if (typeof frame === "undefined" || frame === null) return frame ?? null;
			if (typeof frame !== "number") throw new TypeError(`"${variableName}" must be a number, but is ${JSON.stringify(frame)}`);
			if (Number.isNaN(frame)) throw new TypeError(`"${variableName}" must not be NaN, but is ${JSON.stringify(frame)}`);
			if (!Number.isFinite(frame)) throw new TypeError(`"${variableName}" must be finite, but is ${JSON.stringify(frame)}`);
			if (frame % 1 !== 0) throw new TypeError(`"${variableName}" must be an integer, but is ${JSON.stringify(frame)}`);
			return frame;
		};
		var validateInOutFrames = ({ inFrame, durationInFrames, outFrame }) => {
			const validatedInFrame = validateSingleFrame(inFrame, "inFrame");
			const validatedOutFrame = validateSingleFrame(outFrame, "outFrame");
			if (validatedInFrame === null && validatedOutFrame === null) return;
			if (validatedInFrame !== null && validatedInFrame > durationInFrames - 1) throw new Error("inFrame must be less than (durationInFrames - 1), but is " + validatedInFrame);
			if (validatedOutFrame !== null && validatedOutFrame > durationInFrames - 1) throw new Error("outFrame must be less than (durationInFrames - 1), but is " + validatedOutFrame);
			if (validatedInFrame !== null && validatedInFrame < 0) throw new Error("inFrame must be greater than 0, but is " + validatedInFrame);
			if (validatedOutFrame !== null && validatedOutFrame <= 0) throw new Error(`outFrame must be greater than 0, but is ${validatedOutFrame}. If you want to render a single frame, use <Thumbnail /> instead.`);
			if (validatedOutFrame !== null && validatedInFrame !== null && validatedOutFrame <= validatedInFrame) throw new Error("outFrame must be greater than inFrame, but is " + validatedOutFrame + " <= " + validatedInFrame);
		};
		var validateInitialFrame = ({ initialFrame, durationInFrames }) => {
			if (typeof durationInFrames !== "number") throw new Error(`\`durationInFrames\` must be a number, but is ${JSON.stringify(durationInFrames)}`);
			if (typeof initialFrame === "undefined") return;
			if (typeof initialFrame !== "number") throw new Error(`\`initialFrame\` must be a number, but is ${JSON.stringify(initialFrame)}`);
			if (Number.isNaN(initialFrame)) throw new Error(`\`initialFrame\` must be a number, but is NaN`);
			if (!Number.isFinite(initialFrame)) throw new Error(`\`initialFrame\` must be a number, but is Infinity`);
			if (initialFrame % 1 !== 0) throw new Error(`\`initialFrame\` must be an integer, but is ${JSON.stringify(initialFrame)}`);
			if (initialFrame > durationInFrames - 1) throw new Error(`\`initialFrame\` must be less or equal than \`durationInFrames - 1\`, but is ${JSON.stringify(initialFrame)}`);
		};
		var validatePlaybackRate = (playbackRate) => {
			if (playbackRate === void 0) return;
			if (playbackRate > 10) throw new Error(`The highest possible playback rate is 10. You passed: ${playbackRate}`);
			if (playbackRate < -10) throw new Error(`The lowest possible playback rate is -10. You passed: ${playbackRate}`);
			if (playbackRate === 0) throw new Error(`A playback rate of 0 is not supported.`);
		};
		var validateFps = NoReactInternals.validateFps;
		var validateDimension = NoReactInternals.validateDimension;
		var validateDurationInFrames = NoReactInternals.validateDurationInFrames;
		var validateDefaultAndInputProps = NoReactInternals.validateDefaultAndInputProps;
		var componentOrNullIfLazy = (props) => {
			if ("component" in props) return props.component;
			return null;
		};
		var TimelineSequenceObserverComponent = ({ onTimelineSequenceChange }) => {
			const { sequences } = react.default.useContext(Internals.SequenceManager);
			(0, react.useEffect)(() => {
				onTimelineSequenceChange(sequences);
			}, [onTimelineSequenceChange, sequences]);
			return null;
		};
		var PlayerFn = ({ durationInFrames, compositionHeight, compositionWidth, fps, inputProps, style: style2, controls = false, loop = false, autoPlay = false, showVolumeControls = true, allowFullscreen = true, clickToPlay, doubleClickToFullscreen = false, spaceKeyToPlayOrPause = true, moveToBeginningWhenEnded = true, numberOfSharedAudioTags = 5, errorFallback = () => "⚠️", playbackRate = 1, renderLoading, className: className2, showPosterWhenUnplayed, showPosterWhenEnded, showPosterWhenPaused, showPosterWhenBuffering, showPosterWhenBufferingAndPaused, initialFrame, renderPoster, inFrame, outFrame, initiallyShowControls, renderFullscreenButton, renderPlayPauseButton, renderVolumeSlider, renderCustomControls, alwaysShowControls = false, initiallyMuted = false, showPlaybackRateControl = false, posterFillMode = "player-size", bufferStateDelayInMilliseconds, hideControlsWhenPointerDoesntMove = true, overflowVisible = false, renderMuteButton, browserMediaControlsBehavior: passedBrowserMediaControlsBehavior, overrideInternalClassName, logLevel = "info", noSuspense, acknowledgeRemotionLicense, audioLatencyHint = "playback", sampleRate = 48e3, volumePersistenceKey, initialVolume, _experimentalKeepAudioContextAlive = false, ...componentProps }, ref) => {
			if (typeof window !== "undefined") window.remotion_isPlayer = true;
			const onTimelineSequenceChange = react.default.useContext(TimelineSequenceObserverContext);
			if (componentProps.defaultProps !== void 0) throw new Error("The <Player /> component does not accept `defaultProps`, but some were passed. Use `inputProps` instead.");
			const componentForValidation = componentOrNullIfLazy(componentProps);
			if (componentForValidation?.type === Composition) throw new TypeError(`'component' should not be an instance of <Composition/>. Pass the React component directly, and set the duration, fps and dimensions as separate props. See https://www.remotion.dev/docs/player/examples for an example.`);
			if (componentForValidation === Composition) throw new TypeError(`'component' must not be the 'Composition' component. Pass your own React component directly, and set the duration, fps and dimensions as separate props. See https://www.remotion.dev/docs/player/examples for an example.`);
			(0, react.useState)(() => acknowledgeRemotionLicenseMessage(Boolean(acknowledgeRemotionLicense), logLevel));
			const component = Internals.useLazyComponent({
				compProps: componentProps,
				componentName: "Player",
				noSuspense: Boolean(noSuspense)
			});
			validateInitialFrame({
				initialFrame,
				durationInFrames
			});
			const [frame, setFrame] = (0, react.useState)(() => ({ [PLAYER_COMP_ID]: initialFrame ?? 0 }));
			const frameRef = (0, react.useRef)(frame);
			frameRef.current = frame;
			const rootRef = (0, react.useRef)(null);
			const audioAndVideoTags = (0, react.useRef)([]);
			const playingStore = (0, react.useMemo)(() => Internals.createRuntimeValueStore({ playing: false }), []);
			const bufferingStore = (0, react.useMemo)(() => Internals.createRuntimeValueStore({ buffering: false }), []);
			const readIsPlaying = (0, react.useCallback)(() => playingStore.store.getSnapshot().playing, [playingStore]);
			const readIsBuffering = (0, react.useCallback)(() => bufferingStore.store.getSnapshot().buffering, [bufferingStore]);
			const [currentPlaybackRate, setCurrentPlaybackRate] = (0, react.useState)(playbackRate);
			if (typeof compositionHeight !== "number") throw new TypeError(`'compositionHeight' must be a number but got '${typeof compositionHeight}' instead`);
			if (typeof compositionWidth !== "number") throw new TypeError(`'compositionWidth' must be a number but got '${typeof compositionWidth}' instead`);
			validateDimension(compositionHeight, "compositionHeight", "of the <Player /> component");
			validateDimension(compositionWidth, "compositionWidth", "of the <Player /> component");
			validateDurationInFrames(durationInFrames, {
				component: "of the <Player/> component",
				allowFloats: false
			});
			validateFps(fps, "as a prop of the <Player/> component", false);
			validateDefaultAndInputProps(inputProps, "inputProps", null);
			validateInOutFrames({
				durationInFrames,
				inFrame,
				outFrame
			});
			if (typeof controls !== "boolean" && typeof controls !== "undefined") throw new TypeError(`'controls' must be a boolean or undefined but got '${typeof controls}' instead`);
			if (typeof autoPlay !== "boolean" && typeof autoPlay !== "undefined") throw new TypeError(`'autoPlay' must be a boolean or undefined but got '${typeof autoPlay}' instead`);
			if (typeof loop !== "boolean" && typeof loop !== "undefined") throw new TypeError(`'loop' must be a boolean or undefined but got '${typeof loop}' instead`);
			if (typeof doubleClickToFullscreen !== "boolean" && typeof doubleClickToFullscreen !== "undefined") throw new TypeError(`'doubleClickToFullscreen' must be a boolean or undefined but got '${typeof doubleClickToFullscreen}' instead`);
			if (typeof showVolumeControls !== "boolean" && typeof showVolumeControls !== "undefined") throw new TypeError(`'showVolumeControls' must be a boolean or undefined but got '${typeof showVolumeControls}' instead`);
			if (typeof allowFullscreen !== "boolean" && typeof allowFullscreen !== "undefined") throw new TypeError(`'allowFullscreen' must be a boolean or undefined but got '${typeof allowFullscreen}' instead`);
			if (typeof clickToPlay !== "boolean" && typeof clickToPlay !== "undefined") throw new TypeError(`'clickToPlay' must be a boolean or undefined but got '${typeof clickToPlay}' instead`);
			if (typeof spaceKeyToPlayOrPause !== "boolean" && typeof spaceKeyToPlayOrPause !== "undefined") throw new TypeError(`'spaceKeyToPlayOrPause' must be a boolean or undefined but got '${typeof spaceKeyToPlayOrPause}' instead`);
			if (typeof sampleRate !== "number" || !Number.isFinite(sampleRate) || Number.isNaN(sampleRate) || sampleRate <= 0 || sampleRate % 1 !== 0) throw new TypeError(`'sampleRate' must be a positive integer but got '${sampleRate}' instead`);
			if (typeof initialVolume !== "undefined" && typeof initialVolume !== "number") throw new TypeError(`'initialVolume' must be a number or undefined but got '${typeof initialVolume}' instead`);
			if (typeof initialVolume === "number" && (!Number.isFinite(initialVolume) || Number.isNaN(initialVolume) || initialVolume < 0 || initialVolume > 1)) throw new TypeError(`'initialVolume' must be between 0 and 1 but got '${initialVolume}' instead`);
			if (typeof numberOfSharedAudioTags !== "number" || numberOfSharedAudioTags % 1 !== 0 || !Number.isFinite(numberOfSharedAudioTags) || Number.isNaN(numberOfSharedAudioTags) || numberOfSharedAudioTags < 0) throw new TypeError(`'numberOfSharedAudioTags' must be an integer but got '${numberOfSharedAudioTags}' instead`);
			validatePlaybackRate(currentPlaybackRate);
			(0, react.useEffect)(() => {
				setCurrentPlaybackRate(playbackRate);
			}, [playbackRate]);
			(0, react.useImperativeHandle)(ref, () => rootRef.current, []);
			(0, react.useState)(() => {
				Internals.playbackLogging({
					logLevel,
					message: `[player] Mounting <Player>. User agent = ${typeof navigator === "undefined" ? "server" : navigator.userAgent}`,
					tag: "player",
					mountTime: Date.now()
				});
			});
			const timelineContextValue = (0, react.useMemo)(() => {
				return {
					frame,
					isPlaying: readIsPlaying,
					isInsideFreeze: false,
					audioAndVideoTags
				};
			}, [frame, readIsPlaying]);
			const playbackRateContextValue = (0, react.useMemo)(() => {
				return {
					playbackRate: currentPlaybackRate,
					setPlaybackRate: setCurrentPlaybackRate
				};
			}, [currentPlaybackRate]);
			const setTimelineContextValue = (0, react.useMemo)(() => {
				return {
					setFrame,
					setPlaying: (updater) => {
						const current = playingStore.store.getSnapshot().playing;
						const next = typeof updater === "function" ? updater(current) : updater;
						if (current !== next) playingStore.setSnapshot({ playing: next });
					},
					setBuffering: (buffering) => {
						if (readIsBuffering() !== buffering) bufferingStore.setSnapshot({ buffering });
					},
					subscribePlaying: playingStore.store.subscribe,
					subscribeBuffering: bufferingStore.store.subscribe,
					isPlaying: readIsPlaying,
					isBuffering: readIsBuffering,
					frameRef,
					audioAndVideoTags
				};
			}, [
				bufferingStore,
				setFrame,
				frameRef,
				playingStore,
				readIsBuffering,
				readIsPlaying
			]);
			if (typeof window !== "undefined") (0, react.useLayoutEffect)(() => {
				Internals.CSSUtils.injectCSS(Internals.CSSUtils.makeDefaultPreviewCSS(`.${playerCssClassname(overrideInternalClassName)}`, "#fff"));
			}, [overrideInternalClassName]);
			const actualInputProps = (0, react.useMemo)(() => inputProps ?? {}, [inputProps]);
			const browserMediaControlsBehavior = (0, react.useMemo)(() => {
				return passedBrowserMediaControlsBehavior ?? { mode: "prevent-media-session" };
			}, [passedBrowserMediaControlsBehavior]);
			const player = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.IsPlayerContextProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.SetTimelineContext.Provider, {
				value: setTimelineContextValue,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SharedPlayerContexts, {
					timelineContext: timelineContextValue,
					playbackRateContext: playbackRateContextValue,
					component,
					compositionHeight,
					compositionWidth,
					durationInFrames,
					fps,
					numberOfSharedAudioTags,
					initiallyMuted,
					logLevel,
					audioLatencyHint,
					sampleRate,
					_experimentalKeepAudioContextAlive,
					volumePersistenceKey,
					initialVolume,
					inputProps: actualInputProps,
					audioEnabled: true,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayerEmitterProvider, {
						currentPlaybackRate,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayerUI_default, {
							ref: rootRef,
							posterFillMode,
							renderLoading,
							autoPlay: Boolean(autoPlay),
							loop: Boolean(loop),
							controls: Boolean(controls),
							errorFallback,
							style: style2,
							inputProps: actualInputProps,
							allowFullscreen: Boolean(allowFullscreen),
							moveToBeginningWhenEnded: Boolean(moveToBeginningWhenEnded),
							clickToPlay: typeof clickToPlay === "boolean" ? clickToPlay : Boolean(controls),
							showVolumeControls: Boolean(showVolumeControls),
							doubleClickToFullscreen: Boolean(doubleClickToFullscreen),
							spaceKeyToPlayOrPause: Boolean(spaceKeyToPlayOrPause),
							playbackRate: currentPlaybackRate,
							className: className2 ?? void 0,
							showPosterWhenUnplayed: Boolean(showPosterWhenUnplayed),
							showPosterWhenEnded: Boolean(showPosterWhenEnded),
							showPosterWhenPaused: Boolean(showPosterWhenPaused),
							showPosterWhenBuffering: Boolean(showPosterWhenBuffering),
							showPosterWhenBufferingAndPaused: Boolean(showPosterWhenBufferingAndPaused),
							renderPoster,
							inFrame: inFrame ?? null,
							outFrame: outFrame ?? null,
							initiallyShowControls: initiallyShowControls ?? true,
							renderFullscreen: renderFullscreenButton ?? null,
							renderPlayPauseButton: renderPlayPauseButton ?? null,
							renderMuteButton: renderMuteButton ?? null,
							renderVolumeSlider: renderVolumeSlider ?? null,
							renderCustomControls: renderCustomControls ?? null,
							alwaysShowControls,
							showPlaybackRateControl,
							bufferStateDelayInMilliseconds: bufferStateDelayInMilliseconds ?? 300,
							hideControlsWhenPointerDoesntMove,
							overflowVisible,
							browserMediaControlsBehavior,
							overrideInternalClassName: overrideInternalClassName ?? void 0,
							noSuspense: Boolean(noSuspense)
						})
					})
				})
			}) });
			if (!onTimelineSequenceChange) return player;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.SequenceRegistrationContext.Provider, {
				value: true,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Internals.SequenceManagerProvider, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TimelineSequenceObserverComponent, { onTimelineSequenceChange }), player] })
			});
		};
		var Player = (0, react.forwardRef)(PlayerFn);
		var useThumbnail = () => {
			const emitter = (0, react.useContext)(ThumbnailEmitterContext);
			if (!emitter) throw new TypeError("Expected Player event emitter context");
			return (0, react.useMemo)(() => {
				return { emitter };
			}, [emitter]);
		};
		var reactVersion2 = react.default.version.split(".")[0];
		if (reactVersion2 === "0") throw new Error(`Version ${reactVersion2} of "react" is not supported by Remotion`);
		var doesReactVersionSupportSuspense2 = parseInt(reactVersion2, 10) >= 18;
		var ThumbnailUI = ({ style: style2, inputProps, errorFallback, renderLoading, className: className2, overflowVisible, noSuspense, overrideInternalClassName }, ref) => {
			const config = Internals.useUnsafeVideoConfig();
			const video = Internals.useVideo();
			const container = (0, react.useRef)(null);
			const canvasSize = useElementSize(container, {
				triggerOnWindowResize: false,
				shouldApplyCssTransforms: false
			});
			const layout = (0, react.useMemo)(() => {
				if (!config || !canvasSize) return null;
				return calculateCanvasTransformation({
					canvasSize,
					compositionHeight: config.height,
					compositionWidth: config.width,
					previewSize: "auto"
				});
			}, [canvasSize, config]);
			const scale = layout?.scale ?? 1;
			const thumbnail = useThumbnail();
			useBufferStateEmitter(thumbnail.emitter);
			(0, react.useImperativeHandle)(ref, () => {
				return Object.assign(thumbnail.emitter, {
					getContainerNode: () => container.current,
					getScale: () => scale
				});
			}, [scale, thumbnail.emitter]);
			const VideoComponent = video ? video.component : null;
			const outerStyle = (0, react.useMemo)(() => {
				return calculateOuterStyle({
					config,
					style: style2,
					canvasSize,
					overflowVisible,
					layout
				});
			}, [
				canvasSize,
				config,
				layout,
				overflowVisible,
				style2
			]);
			const outer = (0, react.useMemo)(() => {
				return calculateOuter({
					config,
					layout,
					scale,
					overflowVisible
				});
			}, [
				config,
				layout,
				overflowVisible,
				scale
			]);
			const containerStyle3 = (0, react.useMemo)(() => {
				return calculateContainerStyle({
					config,
					layout,
					scale,
					overflowVisible
				});
			}, [
				config,
				layout,
				overflowVisible,
				scale
			]);
			const onError = (0, react.useCallback)((error) => {
				thumbnail.emitter.dispatchError(error);
			}, [thumbnail.emitter]);
			const loadingMarkup = (0, react.useMemo)(() => {
				return renderLoading ? renderLoading({
					height: outerStyle.height,
					width: outerStyle.width,
					isBuffering: false
				}) : null;
			}, [
				outerStyle.height,
				outerStyle.width,
				renderLoading
			]);
			const currentScaleContext = (0, react.useMemo)(() => {
				return {
					type: "scale",
					scale
				};
			}, [scale]);
			if (!config) return null;
			const content = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: outer,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: containerStyle3,
					className: playerCssClassname(overrideInternalClassName),
					children: VideoComponent ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorBoundary, {
						onError,
						errorFallback,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.CurrentScaleContext.Provider, {
							value: currentScaleContext,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoComponent, {
								...video?.props ?? {},
								...inputProps ?? {}
							})
						})
					}) : null
				})
			});
			if (noSuspense || IS_NODE && !doesReactVersionSupportSuspense2) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: container,
				style: outerStyle,
				className: className2,
				children: content
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: container,
				style: outerStyle,
				className: className2,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
					fallback: loadingMarkup,
					children: content
				})
			});
		};
		var ThumbnailUI_default = (0, react.forwardRef)(ThumbnailUI);
		var ThumbnailFn = ({ frameToDisplay, style: style2, inputProps, compositionHeight, compositionWidth, durationInFrames, fps, className: className2, errorFallback = () => "⚠️", renderLoading, overflowVisible = false, overrideInternalClassName, logLevel = "info", noSuspense, ...componentProps }, ref) => {
			if (typeof window !== "undefined") (0, react.useLayoutEffect)(() => {
				window.remotion_isPlayer = true;
			}, []);
			const rootRef = (0, react.useRef)(null);
			const audioAndVideoTags = (0, react.useRef)([]);
			const bufferingStore = (0, react.useMemo)(() => Internals.createRuntimeValueStore({ buffering: false }), []);
			const timelineState = (0, react.useMemo)(() => {
				return {
					isPlaying: () => false,
					isInsideFreeze: false,
					frame: { [PLAYER_COMP_ID]: frameToDisplay },
					audioAndVideoTags
				};
			}, [frameToDisplay]);
			const playbackRateContext = (0, react.useMemo)(() => {
				return {
					playbackRate: 1,
					setPlaybackRate: () => {
						throw new Error("thumbnail");
					}
				};
			}, []);
			const frameRef = (0, react.useRef)(timelineState.frame);
			frameRef.current = timelineState.frame;
			const setTimelineContext = (0, react.useMemo)(() => {
				return {
					setFrame: () => {},
					setPlaying: () => {},
					setBuffering: (buffering) => {
						if (bufferingStore.store.getSnapshot().buffering !== buffering) bufferingStore.setSnapshot({ buffering });
					},
					subscribePlaying: () => () => {},
					subscribeBuffering: bufferingStore.store.subscribe,
					isPlaying: () => false,
					isBuffering: () => bufferingStore.store.getSnapshot().buffering,
					frameRef,
					audioAndVideoTags
				};
			}, [bufferingStore]);
			(0, react.useImperativeHandle)(ref, () => rootRef.current, []);
			const Component = Internals.useLazyComponent({
				compProps: componentProps,
				componentName: "Thumbnail",
				noSuspense: Boolean(noSuspense)
			});
			const [emitter] = (0, react.useState)(() => new ThumbnailEmitter());
			const passedInputProps = (0, react.useMemo)(() => {
				return inputProps ?? {};
			}, [inputProps]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.IsPlayerContextProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Internals.SetTimelineContext.Provider, {
				value: setTimelineContext,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SharedPlayerContexts, {
					timelineContext: timelineState,
					playbackRateContext,
					component: Component,
					compositionHeight,
					compositionWidth,
					durationInFrames,
					fps,
					numberOfSharedAudioTags: 0,
					initiallyMuted: true,
					logLevel,
					audioLatencyHint: "playback",
					sampleRate: 48e3,
					inputProps: passedInputProps,
					audioEnabled: false,
					_experimentalKeepAudioContextAlive: false,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThumbnailEmitterContext.Provider, {
						value: emitter,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThumbnailUI_default, {
							ref: rootRef,
							className: className2,
							errorFallback,
							inputProps: passedInputProps,
							renderLoading,
							style: style2,
							overflowVisible,
							overrideInternalClassName,
							noSuspense: Boolean(noSuspense)
						})
					})
				})
			}) });
		};
		(0, react.forwardRef)(ThumbnailFn);
		//#endregion
		//#region ../../node_modules/zod/lib/index.mjs
		var util;
		(function(util) {
			util.assertEqual = (val) => val;
			function assertIs(_arg) {}
			util.assertIs = assertIs;
			function assertNever(_x) {
				throw new Error();
			}
			util.assertNever = assertNever;
			util.arrayToEnum = (items) => {
				const obj = {};
				for (const item of items) obj[item] = item;
				return obj;
			};
			util.getValidEnumValues = (obj) => {
				const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
				const filtered = {};
				for (const k of validKeys) filtered[k] = obj[k];
				return util.objectValues(filtered);
			};
			util.objectValues = (obj) => {
				return util.objectKeys(obj).map(function(e) {
					return obj[e];
				});
			};
			util.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
				const keys = [];
				for (const key in object) if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
				return keys;
			};
			util.find = (arr, checker) => {
				for (const item of arr) if (checker(item)) return item;
			};
			util.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
			function joinValues(array, separator = " | ") {
				return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
			}
			util.joinValues = joinValues;
			util.jsonStringifyReplacer = (_, value) => {
				if (typeof value === "bigint") return value.toString();
				return value;
			};
		})(util || (util = {}));
		var objectUtil;
		(function(objectUtil) {
			objectUtil.mergeShapes = (first, second) => {
				return {
					...first,
					...second
				};
			};
		})(objectUtil || (objectUtil = {}));
		const ZodParsedType = util.arrayToEnum([
			"string",
			"nan",
			"number",
			"integer",
			"float",
			"boolean",
			"date",
			"bigint",
			"symbol",
			"function",
			"undefined",
			"null",
			"array",
			"object",
			"unknown",
			"promise",
			"void",
			"never",
			"map",
			"set"
		]);
		const getParsedType = (data) => {
			switch (typeof data) {
				case "undefined": return ZodParsedType.undefined;
				case "string": return ZodParsedType.string;
				case "number": return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
				case "boolean": return ZodParsedType.boolean;
				case "function": return ZodParsedType.function;
				case "bigint": return ZodParsedType.bigint;
				case "symbol": return ZodParsedType.symbol;
				case "object":
					if (Array.isArray(data)) return ZodParsedType.array;
					if (data === null) return ZodParsedType.null;
					if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return ZodParsedType.promise;
					if (typeof Map !== "undefined" && data instanceof Map) return ZodParsedType.map;
					if (typeof Set !== "undefined" && data instanceof Set) return ZodParsedType.set;
					if (typeof Date !== "undefined" && data instanceof Date) return ZodParsedType.date;
					return ZodParsedType.object;
				default: return ZodParsedType.unknown;
			}
		};
		const ZodIssueCode = util.arrayToEnum([
			"invalid_type",
			"invalid_literal",
			"custom",
			"invalid_union",
			"invalid_union_discriminator",
			"invalid_enum_value",
			"unrecognized_keys",
			"invalid_arguments",
			"invalid_return_type",
			"invalid_date",
			"invalid_string",
			"too_small",
			"too_big",
			"invalid_intersection_types",
			"not_multiple_of",
			"not_finite"
		]);
		const quotelessJson = (obj) => {
			return JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:");
		};
		var ZodError = class ZodError extends Error {
			constructor(issues) {
				super();
				this.issues = [];
				this.addIssue = (sub) => {
					this.issues = [...this.issues, sub];
				};
				this.addIssues = (subs = []) => {
					this.issues = [...this.issues, ...subs];
				};
				const actualProto = new.target.prototype;
				if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
				else this.__proto__ = actualProto;
				this.name = "ZodError";
				this.issues = issues;
			}
			get errors() {
				return this.issues;
			}
			format(_mapper) {
				const mapper = _mapper || function(issue) {
					return issue.message;
				};
				const fieldErrors = { _errors: [] };
				const processError = (error) => {
					for (const issue of error.issues) if (issue.code === "invalid_union") issue.unionErrors.map(processError);
					else if (issue.code === "invalid_return_type") processError(issue.returnTypeError);
					else if (issue.code === "invalid_arguments") processError(issue.argumentsError);
					else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
					else {
						let curr = fieldErrors;
						let i = 0;
						while (i < issue.path.length) {
							const el = issue.path[i];
							if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
							else {
								curr[el] = curr[el] || { _errors: [] };
								curr[el]._errors.push(mapper(issue));
							}
							curr = curr[el];
							i++;
						}
					}
				};
				processError(this);
				return fieldErrors;
			}
			static assert(value) {
				if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
			}
			toString() {
				return this.message;
			}
			get message() {
				return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
			}
			get isEmpty() {
				return this.issues.length === 0;
			}
			flatten(mapper = (issue) => issue.message) {
				const fieldErrors = {};
				const formErrors = [];
				for (const sub of this.issues) if (sub.path.length > 0) {
					fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
					fieldErrors[sub.path[0]].push(mapper(sub));
				} else formErrors.push(mapper(sub));
				return {
					formErrors,
					fieldErrors
				};
			}
			get formErrors() {
				return this.flatten();
			}
		};
		ZodError.create = (issues) => {
			return new ZodError(issues);
		};
		const errorMap = (issue, _ctx) => {
			let message;
			switch (issue.code) {
				case ZodIssueCode.invalid_type:
					if (issue.received === ZodParsedType.undefined) message = "Required";
					else message = `Expected ${issue.expected}, received ${issue.received}`;
					break;
				case ZodIssueCode.invalid_literal:
					message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
					break;
				case ZodIssueCode.unrecognized_keys:
					message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
					break;
				case ZodIssueCode.invalid_union:
					message = `Invalid input`;
					break;
				case ZodIssueCode.invalid_union_discriminator:
					message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
					break;
				case ZodIssueCode.invalid_enum_value:
					message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
					break;
				case ZodIssueCode.invalid_arguments:
					message = `Invalid function arguments`;
					break;
				case ZodIssueCode.invalid_return_type:
					message = `Invalid function return type`;
					break;
				case ZodIssueCode.invalid_date:
					message = `Invalid date`;
					break;
				case ZodIssueCode.invalid_string:
					if (typeof issue.validation === "object") {
						if ("includes" in issue.validation) {
							message = `Invalid input: must include "${issue.validation.includes}"`;
							if (typeof issue.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
						} else if ("startsWith" in issue.validation) message = `Invalid input: must start with "${issue.validation.startsWith}"`;
						else if ("endsWith" in issue.validation) message = `Invalid input: must end with "${issue.validation.endsWith}"`;
						else util.assertNever(issue.validation);
					} else if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
					else message = "Invalid";
					break;
				case ZodIssueCode.too_small:
					if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
					else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
					else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
					else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
					else message = "Invalid input";
					break;
				case ZodIssueCode.too_big:
					if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
					else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
					else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
					else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
					else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
					else message = "Invalid input";
					break;
				case ZodIssueCode.custom:
					message = `Invalid input`;
					break;
				case ZodIssueCode.invalid_intersection_types:
					message = `Intersection results could not be merged`;
					break;
				case ZodIssueCode.not_multiple_of:
					message = `Number must be a multiple of ${issue.multipleOf}`;
					break;
				case ZodIssueCode.not_finite:
					message = "Number must be finite";
					break;
				default:
					message = _ctx.defaultError;
					util.assertNever(issue);
			}
			return { message };
		};
		let overrideErrorMap = errorMap;
		function setErrorMap(map) {
			overrideErrorMap = map;
		}
		function getErrorMap() {
			return overrideErrorMap;
		}
		const makeIssue = (params) => {
			const { data, path, errorMaps, issueData } = params;
			const fullPath = [...path, ...issueData.path || []];
			const fullIssue = {
				...issueData,
				path: fullPath
			};
			if (issueData.message !== void 0) return {
				...issueData,
				path: fullPath,
				message: issueData.message
			};
			let errorMessage = "";
			const maps = errorMaps.filter((m) => !!m).slice().reverse();
			for (const map of maps) errorMessage = map(fullIssue, {
				data,
				defaultError: errorMessage
			}).message;
			return {
				...issueData,
				path: fullPath,
				message: errorMessage
			};
		};
		const EMPTY_PATH = [];
		function addIssueToContext(ctx, issueData) {
			const overrideMap = getErrorMap();
			const issue = makeIssue({
				issueData,
				data: ctx.data,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					overrideMap,
					overrideMap === errorMap ? void 0 : errorMap
				].filter((x) => !!x)
			});
			ctx.common.issues.push(issue);
		}
		var ParseStatus = class ParseStatus {
			constructor() {
				this.value = "valid";
			}
			dirty() {
				if (this.value === "valid") this.value = "dirty";
			}
			abort() {
				if (this.value !== "aborted") this.value = "aborted";
			}
			static mergeArray(status, results) {
				const arrayValue = [];
				for (const s of results) {
					if (s.status === "aborted") return INVALID;
					if (s.status === "dirty") status.dirty();
					arrayValue.push(s.value);
				}
				return {
					status: status.value,
					value: arrayValue
				};
			}
			static async mergeObjectAsync(status, pairs) {
				const syncPairs = [];
				for (const pair of pairs) {
					const key = await pair.key;
					const value = await pair.value;
					syncPairs.push({
						key,
						value
					});
				}
				return ParseStatus.mergeObjectSync(status, syncPairs);
			}
			static mergeObjectSync(status, pairs) {
				const finalObject = {};
				for (const pair of pairs) {
					const { key, value } = pair;
					if (key.status === "aborted") return INVALID;
					if (value.status === "aborted") return INVALID;
					if (key.status === "dirty") status.dirty();
					if (value.status === "dirty") status.dirty();
					if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
				}
				return {
					status: status.value,
					value: finalObject
				};
			}
		};
		const INVALID = Object.freeze({ status: "aborted" });
		const DIRTY = (value) => ({
			status: "dirty",
			value
		});
		const OK = (value) => ({
			status: "valid",
			value
		});
		const isAborted = (x) => x.status === "aborted";
		const isDirty = (x) => x.status === "dirty";
		const isValid = (x) => x.status === "valid";
		const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
		/******************************************************************************
		Copyright (c) Microsoft Corporation.
		
		Permission to use, copy, modify, and/or distribute this software for any
		purpose with or without fee is hereby granted.
		
		THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
		REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
		AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
		INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
		LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
		OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
		PERFORMANCE OF THIS SOFTWARE.
		***************************************************************************** */
		function __classPrivateFieldGet(receiver, state, kind, f) {
			if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
			if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
			return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
		}
		function __classPrivateFieldSet(receiver, state, value, kind, f) {
			if (kind === "m") throw new TypeError("Private method is not writable");
			if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
			if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
			return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
		}
		var errorUtil;
		(function(errorUtil) {
			errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
			errorUtil.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
		})(errorUtil || (errorUtil = {}));
		var _ZodEnum_cache;
		var _ZodNativeEnum_cache;
		var ParseInputLazyPath = class {
			constructor(parent, value, path, key) {
				this._cachedPath = [];
				this.parent = parent;
				this.data = value;
				this._path = path;
				this._key = key;
			}
			get path() {
				if (!this._cachedPath.length) {
					if (this._key instanceof Array) this._cachedPath.push(...this._path, ...this._key);
					else this._cachedPath.push(...this._path, this._key);
				}
				return this._cachedPath;
			}
		};
		const handleResult = (ctx, result) => {
			if (isValid(result)) return {
				success: true,
				data: result.value
			};
			else {
				if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
				return {
					success: false,
					get error() {
						if (this._error) return this._error;
						const error = new ZodError(ctx.common.issues);
						this._error = error;
						return this._error;
					}
				};
			}
		};
		function processCreateParams(params) {
			if (!params) return {};
			const { errorMap, invalid_type_error, required_error, description } = params;
			if (errorMap && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
			if (errorMap) return {
				errorMap,
				description
			};
			const customMap = (iss, ctx) => {
				var _a, _b;
				const { message } = params;
				if (iss.code === "invalid_enum_value") return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
				if (typeof ctx.data === "undefined") return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
				if (iss.code !== "invalid_type") return { message: ctx.defaultError };
				return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
			};
			return {
				errorMap: customMap,
				description
			};
		}
		var ZodType = class {
			constructor(def) {
				/** Alias of safeParseAsync */
				this.spa = this.safeParseAsync;
				this._def = def;
				this.parse = this.parse.bind(this);
				this.safeParse = this.safeParse.bind(this);
				this.parseAsync = this.parseAsync.bind(this);
				this.safeParseAsync = this.safeParseAsync.bind(this);
				this.spa = this.spa.bind(this);
				this.refine = this.refine.bind(this);
				this.refinement = this.refinement.bind(this);
				this.superRefine = this.superRefine.bind(this);
				this.optional = this.optional.bind(this);
				this.nullable = this.nullable.bind(this);
				this.nullish = this.nullish.bind(this);
				this.array = this.array.bind(this);
				this.promise = this.promise.bind(this);
				this.or = this.or.bind(this);
				this.and = this.and.bind(this);
				this.transform = this.transform.bind(this);
				this.brand = this.brand.bind(this);
				this.default = this.default.bind(this);
				this.catch = this.catch.bind(this);
				this.describe = this.describe.bind(this);
				this.pipe = this.pipe.bind(this);
				this.readonly = this.readonly.bind(this);
				this.isNullable = this.isNullable.bind(this);
				this.isOptional = this.isOptional.bind(this);
			}
			get description() {
				return this._def.description;
			}
			_getType(input) {
				return getParsedType(input.data);
			}
			_getOrReturnCtx(input, ctx) {
				return ctx || {
					common: input.parent.common,
					data: input.data,
					parsedType: getParsedType(input.data),
					schemaErrorMap: this._def.errorMap,
					path: input.path,
					parent: input.parent
				};
			}
			_processInputParams(input) {
				return {
					status: new ParseStatus(),
					ctx: {
						common: input.parent.common,
						data: input.data,
						parsedType: getParsedType(input.data),
						schemaErrorMap: this._def.errorMap,
						path: input.path,
						parent: input.parent
					}
				};
			}
			_parseSync(input) {
				const result = this._parse(input);
				if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
				return result;
			}
			_parseAsync(input) {
				const result = this._parse(input);
				return Promise.resolve(result);
			}
			parse(data, params) {
				const result = this.safeParse(data, params);
				if (result.success) return result.data;
				throw result.error;
			}
			safeParse(data, params) {
				var _a;
				const ctx = {
					common: {
						issues: [],
						async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
						contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
					},
					path: (params === null || params === void 0 ? void 0 : params.path) || [],
					schemaErrorMap: this._def.errorMap,
					parent: null,
					data,
					parsedType: getParsedType(data)
				};
				const result = this._parseSync({
					data,
					path: ctx.path,
					parent: ctx
				});
				return handleResult(ctx, result);
			}
			async parseAsync(data, params) {
				const result = await this.safeParseAsync(data, params);
				if (result.success) return result.data;
				throw result.error;
			}
			async safeParseAsync(data, params) {
				const ctx = {
					common: {
						issues: [],
						contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
						async: true
					},
					path: (params === null || params === void 0 ? void 0 : params.path) || [],
					schemaErrorMap: this._def.errorMap,
					parent: null,
					data,
					parsedType: getParsedType(data)
				};
				const maybeAsyncResult = this._parse({
					data,
					path: ctx.path,
					parent: ctx
				});
				const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
				return handleResult(ctx, result);
			}
			refine(check, message) {
				const getIssueProperties = (val) => {
					if (typeof message === "string" || typeof message === "undefined") return { message };
					else if (typeof message === "function") return message(val);
					else return message;
				};
				return this._refinement((val, ctx) => {
					const result = check(val);
					const setError = () => ctx.addIssue({
						code: ZodIssueCode.custom,
						...getIssueProperties(val)
					});
					if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
						if (!data) {
							setError();
							return false;
						} else return true;
					});
					if (!result) {
						setError();
						return false;
					} else return true;
				});
			}
			refinement(check, refinementData) {
				return this._refinement((val, ctx) => {
					if (!check(val)) {
						ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
						return false;
					} else return true;
				});
			}
			_refinement(refinement) {
				return new ZodEffects({
					schema: this,
					typeName: ZodFirstPartyTypeKind.ZodEffects,
					effect: {
						type: "refinement",
						refinement
					}
				});
			}
			superRefine(refinement) {
				return this._refinement(refinement);
			}
			optional() {
				return ZodOptional.create(this, this._def);
			}
			nullable() {
				return ZodNullable.create(this, this._def);
			}
			nullish() {
				return this.nullable().optional();
			}
			array() {
				return ZodArray.create(this, this._def);
			}
			promise() {
				return ZodPromise.create(this, this._def);
			}
			or(option) {
				return ZodUnion.create([this, option], this._def);
			}
			and(incoming) {
				return ZodIntersection.create(this, incoming, this._def);
			}
			transform(transform) {
				return new ZodEffects({
					...processCreateParams(this._def),
					schema: this,
					typeName: ZodFirstPartyTypeKind.ZodEffects,
					effect: {
						type: "transform",
						transform
					}
				});
			}
			default(def) {
				const defaultValueFunc = typeof def === "function" ? def : () => def;
				return new ZodDefault({
					...processCreateParams(this._def),
					innerType: this,
					defaultValue: defaultValueFunc,
					typeName: ZodFirstPartyTypeKind.ZodDefault
				});
			}
			brand() {
				return new ZodBranded({
					typeName: ZodFirstPartyTypeKind.ZodBranded,
					type: this,
					...processCreateParams(this._def)
				});
			}
			catch(def) {
				const catchValueFunc = typeof def === "function" ? def : () => def;
				return new ZodCatch({
					...processCreateParams(this._def),
					innerType: this,
					catchValue: catchValueFunc,
					typeName: ZodFirstPartyTypeKind.ZodCatch
				});
			}
			describe(description) {
				const This = this.constructor;
				return new This({
					...this._def,
					description
				});
			}
			pipe(target) {
				return ZodPipeline.create(this, target);
			}
			readonly() {
				return ZodReadonly.create(this);
			}
			isOptional() {
				return this.safeParse(void 0).success;
			}
			isNullable() {
				return this.safeParse(null).success;
			}
		};
		const cuidRegex = /^c[^\s-]{8,}$/i;
		const cuid2Regex = /^[0-9a-z]+$/;
		const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
		const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
		const nanoidRegex = /^[a-z0-9_-]{21}$/i;
		const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
		const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
		const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
		let emojiRegex;
		const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
		const ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
		const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
		const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
		const dateRegex = new RegExp(`^${dateRegexSource}$`);
		function timeRegexSource(args) {
			let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
			if (args.precision) regex = `${regex}\\.\\d{${args.precision}}`;
			else if (args.precision == null) regex = `${regex}(\\.\\d+)?`;
			return regex;
		}
		function timeRegex(args) {
			return new RegExp(`^${timeRegexSource(args)}$`);
		}
		function datetimeRegex(args) {
			let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
			const opts = [];
			opts.push(args.local ? `Z?` : `Z`);
			if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
			regex = `${regex}(${opts.join("|")})`;
			return new RegExp(`^${regex}$`);
		}
		function isValidIP(ip, version) {
			if ((version === "v4" || !version) && ipv4Regex.test(ip)) return true;
			if ((version === "v6" || !version) && ipv6Regex.test(ip)) return true;
			return false;
		}
		var ZodString = class ZodString extends ZodType {
			_parse(input) {
				if (this._def.coerce) input.data = String(input.data);
				if (this._getType(input) !== ZodParsedType.string) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.string,
						received: ctx.parsedType
					});
					return INVALID;
				}
				const status = new ParseStatus();
				let ctx = void 0;
				for (const check of this._def.checks) if (check.kind === "min") {
					if (input.data.length < check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_small,
							minimum: check.value,
							type: "string",
							inclusive: true,
							exact: false,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "max") {
					if (input.data.length > check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_big,
							maximum: check.value,
							type: "string",
							inclusive: true,
							exact: false,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "length") {
					const tooBig = input.data.length > check.value;
					const tooSmall = input.data.length < check.value;
					if (tooBig || tooSmall) {
						ctx = this._getOrReturnCtx(input, ctx);
						if (tooBig) addIssueToContext(ctx, {
							code: ZodIssueCode.too_big,
							maximum: check.value,
							type: "string",
							inclusive: true,
							exact: true,
							message: check.message
						});
						else if (tooSmall) addIssueToContext(ctx, {
							code: ZodIssueCode.too_small,
							minimum: check.value,
							type: "string",
							inclusive: true,
							exact: true,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "email") {
					if (!emailRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "email",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "emoji") {
					if (!emojiRegex) emojiRegex = new RegExp(_emojiRegex, "u");
					if (!emojiRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "emoji",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "uuid") {
					if (!uuidRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "uuid",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "nanoid") {
					if (!nanoidRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "nanoid",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "cuid") {
					if (!cuidRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "cuid",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "cuid2") {
					if (!cuid2Regex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "cuid2",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "ulid") {
					if (!ulidRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "ulid",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "url") try {
					new URL(input.data);
				} catch (_a) {
					ctx = this._getOrReturnCtx(input, ctx);
					addIssueToContext(ctx, {
						validation: "url",
						code: ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
				else if (check.kind === "regex") {
					check.regex.lastIndex = 0;
					if (!check.regex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "regex",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "trim") input.data = input.data.trim();
				else if (check.kind === "includes") {
					if (!input.data.includes(check.value, check.position)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.invalid_string,
							validation: {
								includes: check.value,
								position: check.position
							},
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
				else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
				else if (check.kind === "startsWith") {
					if (!input.data.startsWith(check.value)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.invalid_string,
							validation: { startsWith: check.value },
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "endsWith") {
					if (!input.data.endsWith(check.value)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.invalid_string,
							validation: { endsWith: check.value },
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "datetime") {
					if (!datetimeRegex(check).test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.invalid_string,
							validation: "datetime",
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "date") {
					if (!dateRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.invalid_string,
							validation: "date",
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "time") {
					if (!timeRegex(check).test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.invalid_string,
							validation: "time",
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "duration") {
					if (!durationRegex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "duration",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "ip") {
					if (!isValidIP(input.data, check.version)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "ip",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "base64") {
					if (!base64Regex.test(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							validation: "base64",
							code: ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
				} else util.assertNever(check);
				return {
					status: status.value,
					value: input.data
				};
			}
			_regex(regex, validation, message) {
				return this.refinement((data) => regex.test(data), {
					validation,
					code: ZodIssueCode.invalid_string,
					...errorUtil.errToObj(message)
				});
			}
			_addCheck(check) {
				return new ZodString({
					...this._def,
					checks: [...this._def.checks, check]
				});
			}
			email(message) {
				return this._addCheck({
					kind: "email",
					...errorUtil.errToObj(message)
				});
			}
			url(message) {
				return this._addCheck({
					kind: "url",
					...errorUtil.errToObj(message)
				});
			}
			emoji(message) {
				return this._addCheck({
					kind: "emoji",
					...errorUtil.errToObj(message)
				});
			}
			uuid(message) {
				return this._addCheck({
					kind: "uuid",
					...errorUtil.errToObj(message)
				});
			}
			nanoid(message) {
				return this._addCheck({
					kind: "nanoid",
					...errorUtil.errToObj(message)
				});
			}
			cuid(message) {
				return this._addCheck({
					kind: "cuid",
					...errorUtil.errToObj(message)
				});
			}
			cuid2(message) {
				return this._addCheck({
					kind: "cuid2",
					...errorUtil.errToObj(message)
				});
			}
			ulid(message) {
				return this._addCheck({
					kind: "ulid",
					...errorUtil.errToObj(message)
				});
			}
			base64(message) {
				return this._addCheck({
					kind: "base64",
					...errorUtil.errToObj(message)
				});
			}
			ip(options) {
				return this._addCheck({
					kind: "ip",
					...errorUtil.errToObj(options)
				});
			}
			datetime(options) {
				var _a, _b;
				if (typeof options === "string") return this._addCheck({
					kind: "datetime",
					precision: null,
					offset: false,
					local: false,
					message: options
				});
				return this._addCheck({
					kind: "datetime",
					precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
					offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
					local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
					...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
				});
			}
			date(message) {
				return this._addCheck({
					kind: "date",
					message
				});
			}
			time(options) {
				if (typeof options === "string") return this._addCheck({
					kind: "time",
					precision: null,
					message: options
				});
				return this._addCheck({
					kind: "time",
					precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
					...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
				});
			}
			duration(message) {
				return this._addCheck({
					kind: "duration",
					...errorUtil.errToObj(message)
				});
			}
			regex(regex, message) {
				return this._addCheck({
					kind: "regex",
					regex,
					...errorUtil.errToObj(message)
				});
			}
			includes(value, options) {
				return this._addCheck({
					kind: "includes",
					value,
					position: options === null || options === void 0 ? void 0 : options.position,
					...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
				});
			}
			startsWith(value, message) {
				return this._addCheck({
					kind: "startsWith",
					value,
					...errorUtil.errToObj(message)
				});
			}
			endsWith(value, message) {
				return this._addCheck({
					kind: "endsWith",
					value,
					...errorUtil.errToObj(message)
				});
			}
			min(minLength, message) {
				return this._addCheck({
					kind: "min",
					value: minLength,
					...errorUtil.errToObj(message)
				});
			}
			max(maxLength, message) {
				return this._addCheck({
					kind: "max",
					value: maxLength,
					...errorUtil.errToObj(message)
				});
			}
			length(len, message) {
				return this._addCheck({
					kind: "length",
					value: len,
					...errorUtil.errToObj(message)
				});
			}
			/**
			* @deprecated Use z.string().min(1) instead.
			* @see {@link ZodString.min}
			*/
			nonempty(message) {
				return this.min(1, errorUtil.errToObj(message));
			}
			trim() {
				return new ZodString({
					...this._def,
					checks: [...this._def.checks, { kind: "trim" }]
				});
			}
			toLowerCase() {
				return new ZodString({
					...this._def,
					checks: [...this._def.checks, { kind: "toLowerCase" }]
				});
			}
			toUpperCase() {
				return new ZodString({
					...this._def,
					checks: [...this._def.checks, { kind: "toUpperCase" }]
				});
			}
			get isDatetime() {
				return !!this._def.checks.find((ch) => ch.kind === "datetime");
			}
			get isDate() {
				return !!this._def.checks.find((ch) => ch.kind === "date");
			}
			get isTime() {
				return !!this._def.checks.find((ch) => ch.kind === "time");
			}
			get isDuration() {
				return !!this._def.checks.find((ch) => ch.kind === "duration");
			}
			get isEmail() {
				return !!this._def.checks.find((ch) => ch.kind === "email");
			}
			get isURL() {
				return !!this._def.checks.find((ch) => ch.kind === "url");
			}
			get isEmoji() {
				return !!this._def.checks.find((ch) => ch.kind === "emoji");
			}
			get isUUID() {
				return !!this._def.checks.find((ch) => ch.kind === "uuid");
			}
			get isNANOID() {
				return !!this._def.checks.find((ch) => ch.kind === "nanoid");
			}
			get isCUID() {
				return !!this._def.checks.find((ch) => ch.kind === "cuid");
			}
			get isCUID2() {
				return !!this._def.checks.find((ch) => ch.kind === "cuid2");
			}
			get isULID() {
				return !!this._def.checks.find((ch) => ch.kind === "ulid");
			}
			get isIP() {
				return !!this._def.checks.find((ch) => ch.kind === "ip");
			}
			get isBase64() {
				return !!this._def.checks.find((ch) => ch.kind === "base64");
			}
			get minLength() {
				let min = null;
				for (const ch of this._def.checks) if (ch.kind === "min") {
					if (min === null || ch.value > min) min = ch.value;
				}
				return min;
			}
			get maxLength() {
				let max = null;
				for (const ch of this._def.checks) if (ch.kind === "max") {
					if (max === null || ch.value < max) max = ch.value;
				}
				return max;
			}
		};
		ZodString.create = (params) => {
			var _a;
			return new ZodString({
				checks: [],
				typeName: ZodFirstPartyTypeKind.ZodString,
				coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
				...processCreateParams(params)
			});
		};
		function floatSafeRemainder(val, step) {
			const valDecCount = (val.toString().split(".")[1] || "").length;
			const stepDecCount = (step.toString().split(".")[1] || "").length;
			const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
			return parseInt(val.toFixed(decCount).replace(".", "")) % parseInt(step.toFixed(decCount).replace(".", "")) / Math.pow(10, decCount);
		}
		var ZodNumber = class ZodNumber extends ZodType {
			constructor() {
				super(...arguments);
				this.min = this.gte;
				this.max = this.lte;
				this.step = this.multipleOf;
			}
			_parse(input) {
				if (this._def.coerce) input.data = Number(input.data);
				if (this._getType(input) !== ZodParsedType.number) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.number,
						received: ctx.parsedType
					});
					return INVALID;
				}
				let ctx = void 0;
				const status = new ParseStatus();
				for (const check of this._def.checks) if (check.kind === "int") {
					if (!util.isInteger(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.invalid_type,
							expected: "integer",
							received: "float",
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "min") {
					if (check.inclusive ? input.data < check.value : input.data <= check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_small,
							minimum: check.value,
							type: "number",
							inclusive: check.inclusive,
							exact: false,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "max") {
					if (check.inclusive ? input.data > check.value : input.data >= check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_big,
							maximum: check.value,
							type: "number",
							inclusive: check.inclusive,
							exact: false,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "multipleOf") {
					if (floatSafeRemainder(input.data, check.value) !== 0) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.not_multiple_of,
							multipleOf: check.value,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "finite") {
					if (!Number.isFinite(input.data)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.not_finite,
							message: check.message
						});
						status.dirty();
					}
				} else util.assertNever(check);
				return {
					status: status.value,
					value: input.data
				};
			}
			gte(value, message) {
				return this.setLimit("min", value, true, errorUtil.toString(message));
			}
			gt(value, message) {
				return this.setLimit("min", value, false, errorUtil.toString(message));
			}
			lte(value, message) {
				return this.setLimit("max", value, true, errorUtil.toString(message));
			}
			lt(value, message) {
				return this.setLimit("max", value, false, errorUtil.toString(message));
			}
			setLimit(kind, value, inclusive, message) {
				return new ZodNumber({
					...this._def,
					checks: [...this._def.checks, {
						kind,
						value,
						inclusive,
						message: errorUtil.toString(message)
					}]
				});
			}
			_addCheck(check) {
				return new ZodNumber({
					...this._def,
					checks: [...this._def.checks, check]
				});
			}
			int(message) {
				return this._addCheck({
					kind: "int",
					message: errorUtil.toString(message)
				});
			}
			positive(message) {
				return this._addCheck({
					kind: "min",
					value: 0,
					inclusive: false,
					message: errorUtil.toString(message)
				});
			}
			negative(message) {
				return this._addCheck({
					kind: "max",
					value: 0,
					inclusive: false,
					message: errorUtil.toString(message)
				});
			}
			nonpositive(message) {
				return this._addCheck({
					kind: "max",
					value: 0,
					inclusive: true,
					message: errorUtil.toString(message)
				});
			}
			nonnegative(message) {
				return this._addCheck({
					kind: "min",
					value: 0,
					inclusive: true,
					message: errorUtil.toString(message)
				});
			}
			multipleOf(value, message) {
				return this._addCheck({
					kind: "multipleOf",
					value,
					message: errorUtil.toString(message)
				});
			}
			finite(message) {
				return this._addCheck({
					kind: "finite",
					message: errorUtil.toString(message)
				});
			}
			safe(message) {
				return this._addCheck({
					kind: "min",
					inclusive: true,
					value: Number.MIN_SAFE_INTEGER,
					message: errorUtil.toString(message)
				})._addCheck({
					kind: "max",
					inclusive: true,
					value: Number.MAX_SAFE_INTEGER,
					message: errorUtil.toString(message)
				});
			}
			get minValue() {
				let min = null;
				for (const ch of this._def.checks) if (ch.kind === "min") {
					if (min === null || ch.value > min) min = ch.value;
				}
				return min;
			}
			get maxValue() {
				let max = null;
				for (const ch of this._def.checks) if (ch.kind === "max") {
					if (max === null || ch.value < max) max = ch.value;
				}
				return max;
			}
			get isInt() {
				return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
			}
			get isFinite() {
				let max = null, min = null;
				for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
				else if (ch.kind === "min") {
					if (min === null || ch.value > min) min = ch.value;
				} else if (ch.kind === "max") {
					if (max === null || ch.value < max) max = ch.value;
				}
				return Number.isFinite(min) && Number.isFinite(max);
			}
		};
		ZodNumber.create = (params) => {
			return new ZodNumber({
				checks: [],
				typeName: ZodFirstPartyTypeKind.ZodNumber,
				coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
				...processCreateParams(params)
			});
		};
		var ZodBigInt = class ZodBigInt extends ZodType {
			constructor() {
				super(...arguments);
				this.min = this.gte;
				this.max = this.lte;
			}
			_parse(input) {
				if (this._def.coerce) input.data = BigInt(input.data);
				if (this._getType(input) !== ZodParsedType.bigint) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.bigint,
						received: ctx.parsedType
					});
					return INVALID;
				}
				let ctx = void 0;
				const status = new ParseStatus();
				for (const check of this._def.checks) if (check.kind === "min") {
					if (check.inclusive ? input.data < check.value : input.data <= check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_small,
							type: "bigint",
							minimum: check.value,
							inclusive: check.inclusive,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "max") {
					if (check.inclusive ? input.data > check.value : input.data >= check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_big,
							type: "bigint",
							maximum: check.value,
							inclusive: check.inclusive,
							message: check.message
						});
						status.dirty();
					}
				} else if (check.kind === "multipleOf") {
					if (input.data % check.value !== BigInt(0)) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.not_multiple_of,
							multipleOf: check.value,
							message: check.message
						});
						status.dirty();
					}
				} else util.assertNever(check);
				return {
					status: status.value,
					value: input.data
				};
			}
			gte(value, message) {
				return this.setLimit("min", value, true, errorUtil.toString(message));
			}
			gt(value, message) {
				return this.setLimit("min", value, false, errorUtil.toString(message));
			}
			lte(value, message) {
				return this.setLimit("max", value, true, errorUtil.toString(message));
			}
			lt(value, message) {
				return this.setLimit("max", value, false, errorUtil.toString(message));
			}
			setLimit(kind, value, inclusive, message) {
				return new ZodBigInt({
					...this._def,
					checks: [...this._def.checks, {
						kind,
						value,
						inclusive,
						message: errorUtil.toString(message)
					}]
				});
			}
			_addCheck(check) {
				return new ZodBigInt({
					...this._def,
					checks: [...this._def.checks, check]
				});
			}
			positive(message) {
				return this._addCheck({
					kind: "min",
					value: BigInt(0),
					inclusive: false,
					message: errorUtil.toString(message)
				});
			}
			negative(message) {
				return this._addCheck({
					kind: "max",
					value: BigInt(0),
					inclusive: false,
					message: errorUtil.toString(message)
				});
			}
			nonpositive(message) {
				return this._addCheck({
					kind: "max",
					value: BigInt(0),
					inclusive: true,
					message: errorUtil.toString(message)
				});
			}
			nonnegative(message) {
				return this._addCheck({
					kind: "min",
					value: BigInt(0),
					inclusive: true,
					message: errorUtil.toString(message)
				});
			}
			multipleOf(value, message) {
				return this._addCheck({
					kind: "multipleOf",
					value,
					message: errorUtil.toString(message)
				});
			}
			get minValue() {
				let min = null;
				for (const ch of this._def.checks) if (ch.kind === "min") {
					if (min === null || ch.value > min) min = ch.value;
				}
				return min;
			}
			get maxValue() {
				let max = null;
				for (const ch of this._def.checks) if (ch.kind === "max") {
					if (max === null || ch.value < max) max = ch.value;
				}
				return max;
			}
		};
		ZodBigInt.create = (params) => {
			var _a;
			return new ZodBigInt({
				checks: [],
				typeName: ZodFirstPartyTypeKind.ZodBigInt,
				coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
				...processCreateParams(params)
			});
		};
		var ZodBoolean = class extends ZodType {
			_parse(input) {
				if (this._def.coerce) input.data = Boolean(input.data);
				if (this._getType(input) !== ZodParsedType.boolean) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.boolean,
						received: ctx.parsedType
					});
					return INVALID;
				}
				return OK(input.data);
			}
		};
		ZodBoolean.create = (params) => {
			return new ZodBoolean({
				typeName: ZodFirstPartyTypeKind.ZodBoolean,
				coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
				...processCreateParams(params)
			});
		};
		var ZodDate = class ZodDate extends ZodType {
			_parse(input) {
				if (this._def.coerce) input.data = new Date(input.data);
				if (this._getType(input) !== ZodParsedType.date) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.date,
						received: ctx.parsedType
					});
					return INVALID;
				}
				if (isNaN(input.data.getTime())) {
					addIssueToContext(this._getOrReturnCtx(input), { code: ZodIssueCode.invalid_date });
					return INVALID;
				}
				const status = new ParseStatus();
				let ctx = void 0;
				for (const check of this._def.checks) if (check.kind === "min") {
					if (input.data.getTime() < check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_small,
							message: check.message,
							inclusive: true,
							exact: false,
							minimum: check.value,
							type: "date"
						});
						status.dirty();
					}
				} else if (check.kind === "max") {
					if (input.data.getTime() > check.value) {
						ctx = this._getOrReturnCtx(input, ctx);
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_big,
							message: check.message,
							inclusive: true,
							exact: false,
							maximum: check.value,
							type: "date"
						});
						status.dirty();
					}
				} else util.assertNever(check);
				return {
					status: status.value,
					value: new Date(input.data.getTime())
				};
			}
			_addCheck(check) {
				return new ZodDate({
					...this._def,
					checks: [...this._def.checks, check]
				});
			}
			min(minDate, message) {
				return this._addCheck({
					kind: "min",
					value: minDate.getTime(),
					message: errorUtil.toString(message)
				});
			}
			max(maxDate, message) {
				return this._addCheck({
					kind: "max",
					value: maxDate.getTime(),
					message: errorUtil.toString(message)
				});
			}
			get minDate() {
				let min = null;
				for (const ch of this._def.checks) if (ch.kind === "min") {
					if (min === null || ch.value > min) min = ch.value;
				}
				return min != null ? new Date(min) : null;
			}
			get maxDate() {
				let max = null;
				for (const ch of this._def.checks) if (ch.kind === "max") {
					if (max === null || ch.value < max) max = ch.value;
				}
				return max != null ? new Date(max) : null;
			}
		};
		ZodDate.create = (params) => {
			return new ZodDate({
				checks: [],
				coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
				typeName: ZodFirstPartyTypeKind.ZodDate,
				...processCreateParams(params)
			});
		};
		var ZodSymbol = class extends ZodType {
			_parse(input) {
				if (this._getType(input) !== ZodParsedType.symbol) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.symbol,
						received: ctx.parsedType
					});
					return INVALID;
				}
				return OK(input.data);
			}
		};
		ZodSymbol.create = (params) => {
			return new ZodSymbol({
				typeName: ZodFirstPartyTypeKind.ZodSymbol,
				...processCreateParams(params)
			});
		};
		var ZodUndefined = class extends ZodType {
			_parse(input) {
				if (this._getType(input) !== ZodParsedType.undefined) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.undefined,
						received: ctx.parsedType
					});
					return INVALID;
				}
				return OK(input.data);
			}
		};
		ZodUndefined.create = (params) => {
			return new ZodUndefined({
				typeName: ZodFirstPartyTypeKind.ZodUndefined,
				...processCreateParams(params)
			});
		};
		var ZodNull = class extends ZodType {
			_parse(input) {
				if (this._getType(input) !== ZodParsedType.null) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.null,
						received: ctx.parsedType
					});
					return INVALID;
				}
				return OK(input.data);
			}
		};
		ZodNull.create = (params) => {
			return new ZodNull({
				typeName: ZodFirstPartyTypeKind.ZodNull,
				...processCreateParams(params)
			});
		};
		var ZodAny = class extends ZodType {
			constructor() {
				super(...arguments);
				this._any = true;
			}
			_parse(input) {
				return OK(input.data);
			}
		};
		ZodAny.create = (params) => {
			return new ZodAny({
				typeName: ZodFirstPartyTypeKind.ZodAny,
				...processCreateParams(params)
			});
		};
		var ZodUnknown = class extends ZodType {
			constructor() {
				super(...arguments);
				this._unknown = true;
			}
			_parse(input) {
				return OK(input.data);
			}
		};
		ZodUnknown.create = (params) => {
			return new ZodUnknown({
				typeName: ZodFirstPartyTypeKind.ZodUnknown,
				...processCreateParams(params)
			});
		};
		var ZodNever = class extends ZodType {
			_parse(input) {
				const ctx = this._getOrReturnCtx(input);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_type,
					expected: ZodParsedType.never,
					received: ctx.parsedType
				});
				return INVALID;
			}
		};
		ZodNever.create = (params) => {
			return new ZodNever({
				typeName: ZodFirstPartyTypeKind.ZodNever,
				...processCreateParams(params)
			});
		};
		var ZodVoid = class extends ZodType {
			_parse(input) {
				if (this._getType(input) !== ZodParsedType.undefined) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.void,
						received: ctx.parsedType
					});
					return INVALID;
				}
				return OK(input.data);
			}
		};
		ZodVoid.create = (params) => {
			return new ZodVoid({
				typeName: ZodFirstPartyTypeKind.ZodVoid,
				...processCreateParams(params)
			});
		};
		var ZodArray = class ZodArray extends ZodType {
			_parse(input) {
				const { ctx, status } = this._processInputParams(input);
				const def = this._def;
				if (ctx.parsedType !== ZodParsedType.array) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.array,
						received: ctx.parsedType
					});
					return INVALID;
				}
				if (def.exactLength !== null) {
					const tooBig = ctx.data.length > def.exactLength.value;
					const tooSmall = ctx.data.length < def.exactLength.value;
					if (tooBig || tooSmall) {
						addIssueToContext(ctx, {
							code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
							minimum: tooSmall ? def.exactLength.value : void 0,
							maximum: tooBig ? def.exactLength.value : void 0,
							type: "array",
							inclusive: true,
							exact: true,
							message: def.exactLength.message
						});
						status.dirty();
					}
				}
				if (def.minLength !== null) {
					if (ctx.data.length < def.minLength.value) {
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_small,
							minimum: def.minLength.value,
							type: "array",
							inclusive: true,
							exact: false,
							message: def.minLength.message
						});
						status.dirty();
					}
				}
				if (def.maxLength !== null) {
					if (ctx.data.length > def.maxLength.value) {
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_big,
							maximum: def.maxLength.value,
							type: "array",
							inclusive: true,
							exact: false,
							message: def.maxLength.message
						});
						status.dirty();
					}
				}
				if (ctx.common.async) return Promise.all([...ctx.data].map((item, i) => {
					return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
				})).then((result) => {
					return ParseStatus.mergeArray(status, result);
				});
				const result = [...ctx.data].map((item, i) => {
					return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
				});
				return ParseStatus.mergeArray(status, result);
			}
			get element() {
				return this._def.type;
			}
			min(minLength, message) {
				return new ZodArray({
					...this._def,
					minLength: {
						value: minLength,
						message: errorUtil.toString(message)
					}
				});
			}
			max(maxLength, message) {
				return new ZodArray({
					...this._def,
					maxLength: {
						value: maxLength,
						message: errorUtil.toString(message)
					}
				});
			}
			length(len, message) {
				return new ZodArray({
					...this._def,
					exactLength: {
						value: len,
						message: errorUtil.toString(message)
					}
				});
			}
			nonempty(message) {
				return this.min(1, message);
			}
		};
		ZodArray.create = (schema, params) => {
			return new ZodArray({
				type: schema,
				minLength: null,
				maxLength: null,
				exactLength: null,
				typeName: ZodFirstPartyTypeKind.ZodArray,
				...processCreateParams(params)
			});
		};
		function deepPartialify(schema) {
			if (schema instanceof ZodObject) {
				const newShape = {};
				for (const key in schema.shape) {
					const fieldSchema = schema.shape[key];
					newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
				}
				return new ZodObject({
					...schema._def,
					shape: () => newShape
				});
			} else if (schema instanceof ZodArray) return new ZodArray({
				...schema._def,
				type: deepPartialify(schema.element)
			});
			else if (schema instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema.unwrap()));
			else if (schema instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema.unwrap()));
			else if (schema instanceof ZodTuple) return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
			else return schema;
		}
		var ZodObject = class ZodObject extends ZodType {
			constructor() {
				super(...arguments);
				this._cached = null;
				/**
				* @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
				* If you want to pass through unknown properties, use `.passthrough()` instead.
				*/
				this.nonstrict = this.passthrough;
				/**
				* @deprecated Use `.extend` instead
				*  */
				this.augment = this.extend;
			}
			_getCached() {
				if (this._cached !== null) return this._cached;
				const shape = this._def.shape();
				const keys = util.objectKeys(shape);
				return this._cached = {
					shape,
					keys
				};
			}
			_parse(input) {
				if (this._getType(input) !== ZodParsedType.object) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.object,
						received: ctx.parsedType
					});
					return INVALID;
				}
				const { status, ctx } = this._processInputParams(input);
				const { shape, keys: shapeKeys } = this._getCached();
				const extraKeys = [];
				if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
					for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
				}
				const pairs = [];
				for (const key of shapeKeys) {
					const keyValidator = shape[key];
					const value = ctx.data[key];
					pairs.push({
						key: {
							status: "valid",
							value: key
						},
						value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
						alwaysSet: key in ctx.data
					});
				}
				if (this._def.catchall instanceof ZodNever) {
					const unknownKeys = this._def.unknownKeys;
					if (unknownKeys === "passthrough") for (const key of extraKeys) pairs.push({
						key: {
							status: "valid",
							value: key
						},
						value: {
							status: "valid",
							value: ctx.data[key]
						}
					});
					else if (unknownKeys === "strict") {
						if (extraKeys.length > 0) {
							addIssueToContext(ctx, {
								code: ZodIssueCode.unrecognized_keys,
								keys: extraKeys
							});
							status.dirty();
						}
					} else if (unknownKeys === "strip");
					else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
				} else {
					const catchall = this._def.catchall;
					for (const key of extraKeys) {
						const value = ctx.data[key];
						pairs.push({
							key: {
								status: "valid",
								value: key
							},
							value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
							alwaysSet: key in ctx.data
						});
					}
				}
				if (ctx.common.async) return Promise.resolve().then(async () => {
					const syncPairs = [];
					for (const pair of pairs) {
						const key = await pair.key;
						const value = await pair.value;
						syncPairs.push({
							key,
							value,
							alwaysSet: pair.alwaysSet
						});
					}
					return syncPairs;
				}).then((syncPairs) => {
					return ParseStatus.mergeObjectSync(status, syncPairs);
				});
				else return ParseStatus.mergeObjectSync(status, pairs);
			}
			get shape() {
				return this._def.shape();
			}
			strict(message) {
				errorUtil.errToObj;
				return new ZodObject({
					...this._def,
					unknownKeys: "strict",
					...message !== void 0 ? { errorMap: (issue, ctx) => {
						var _a, _b, _c, _d;
						const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
						if (issue.code === "unrecognized_keys") return { message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError };
						return { message: defaultError };
					} } : {}
				});
			}
			strip() {
				return new ZodObject({
					...this._def,
					unknownKeys: "strip"
				});
			}
			passthrough() {
				return new ZodObject({
					...this._def,
					unknownKeys: "passthrough"
				});
			}
			extend(augmentation) {
				return new ZodObject({
					...this._def,
					shape: () => ({
						...this._def.shape(),
						...augmentation
					})
				});
			}
			/**
			* Prior to zod@1.0.12 there was a bug in the
			* inferred type of merged objects. Please
			* upgrade if you are experiencing issues.
			*/
			merge(merging) {
				return new ZodObject({
					unknownKeys: merging._def.unknownKeys,
					catchall: merging._def.catchall,
					shape: () => ({
						...this._def.shape(),
						...merging._def.shape()
					}),
					typeName: ZodFirstPartyTypeKind.ZodObject
				});
			}
			setKey(key, schema) {
				return this.augment({ [key]: schema });
			}
			catchall(index) {
				return new ZodObject({
					...this._def,
					catchall: index
				});
			}
			pick(mask) {
				const shape = {};
				util.objectKeys(mask).forEach((key) => {
					if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
				});
				return new ZodObject({
					...this._def,
					shape: () => shape
				});
			}
			omit(mask) {
				const shape = {};
				util.objectKeys(this.shape).forEach((key) => {
					if (!mask[key]) shape[key] = this.shape[key];
				});
				return new ZodObject({
					...this._def,
					shape: () => shape
				});
			}
			/**
			* @deprecated
			*/
			deepPartial() {
				return deepPartialify(this);
			}
			partial(mask) {
				const newShape = {};
				util.objectKeys(this.shape).forEach((key) => {
					const fieldSchema = this.shape[key];
					if (mask && !mask[key]) newShape[key] = fieldSchema;
					else newShape[key] = fieldSchema.optional();
				});
				return new ZodObject({
					...this._def,
					shape: () => newShape
				});
			}
			required(mask) {
				const newShape = {};
				util.objectKeys(this.shape).forEach((key) => {
					if (mask && !mask[key]) newShape[key] = this.shape[key];
					else {
						let newField = this.shape[key];
						while (newField instanceof ZodOptional) newField = newField._def.innerType;
						newShape[key] = newField;
					}
				});
				return new ZodObject({
					...this._def,
					shape: () => newShape
				});
			}
			keyof() {
				return createZodEnum(util.objectKeys(this.shape));
			}
		};
		ZodObject.create = (shape, params) => {
			return new ZodObject({
				shape: () => shape,
				unknownKeys: "strip",
				catchall: ZodNever.create(),
				typeName: ZodFirstPartyTypeKind.ZodObject,
				...processCreateParams(params)
			});
		};
		ZodObject.strictCreate = (shape, params) => {
			return new ZodObject({
				shape: () => shape,
				unknownKeys: "strict",
				catchall: ZodNever.create(),
				typeName: ZodFirstPartyTypeKind.ZodObject,
				...processCreateParams(params)
			});
		};
		ZodObject.lazycreate = (shape, params) => {
			return new ZodObject({
				shape,
				unknownKeys: "strip",
				catchall: ZodNever.create(),
				typeName: ZodFirstPartyTypeKind.ZodObject,
				...processCreateParams(params)
			});
		};
		var ZodUnion = class extends ZodType {
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				const options = this._def.options;
				function handleResults(results) {
					for (const result of results) if (result.result.status === "valid") return result.result;
					for (const result of results) if (result.result.status === "dirty") {
						ctx.common.issues.push(...result.ctx.common.issues);
						return result.result;
					}
					const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_union,
						unionErrors
					});
					return INVALID;
				}
				if (ctx.common.async) return Promise.all(options.map(async (option) => {
					const childCtx = {
						...ctx,
						common: {
							...ctx.common,
							issues: []
						},
						parent: null
					};
					return {
						result: await option._parseAsync({
							data: ctx.data,
							path: ctx.path,
							parent: childCtx
						}),
						ctx: childCtx
					};
				})).then(handleResults);
				else {
					let dirty = void 0;
					const issues = [];
					for (const option of options) {
						const childCtx = {
							...ctx,
							common: {
								...ctx.common,
								issues: []
							},
							parent: null
						};
						const result = option._parseSync({
							data: ctx.data,
							path: ctx.path,
							parent: childCtx
						});
						if (result.status === "valid") return result;
						else if (result.status === "dirty" && !dirty) dirty = {
							result,
							ctx: childCtx
						};
						if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
					}
					if (dirty) {
						ctx.common.issues.push(...dirty.ctx.common.issues);
						return dirty.result;
					}
					const unionErrors = issues.map((issues) => new ZodError(issues));
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_union,
						unionErrors
					});
					return INVALID;
				}
			}
			get options() {
				return this._def.options;
			}
		};
		ZodUnion.create = (types, params) => {
			return new ZodUnion({
				options: types,
				typeName: ZodFirstPartyTypeKind.ZodUnion,
				...processCreateParams(params)
			});
		};
		const getDiscriminator = (type) => {
			if (type instanceof ZodLazy) return getDiscriminator(type.schema);
			else if (type instanceof ZodEffects) return getDiscriminator(type.innerType());
			else if (type instanceof ZodLiteral) return [type.value];
			else if (type instanceof ZodEnum) return type.options;
			else if (type instanceof ZodNativeEnum) return util.objectValues(type.enum);
			else if (type instanceof ZodDefault) return getDiscriminator(type._def.innerType);
			else if (type instanceof ZodUndefined) return [void 0];
			else if (type instanceof ZodNull) return [null];
			else if (type instanceof ZodOptional) return [void 0, ...getDiscriminator(type.unwrap())];
			else if (type instanceof ZodNullable) return [null, ...getDiscriminator(type.unwrap())];
			else if (type instanceof ZodBranded) return getDiscriminator(type.unwrap());
			else if (type instanceof ZodReadonly) return getDiscriminator(type.unwrap());
			else if (type instanceof ZodCatch) return getDiscriminator(type._def.innerType);
			else return [];
		};
		var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				if (ctx.parsedType !== ZodParsedType.object) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.object,
						received: ctx.parsedType
					});
					return INVALID;
				}
				const discriminator = this.discriminator;
				const discriminatorValue = ctx.data[discriminator];
				const option = this.optionsMap.get(discriminatorValue);
				if (!option) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_union_discriminator,
						options: Array.from(this.optionsMap.keys()),
						path: [discriminator]
					});
					return INVALID;
				}
				if (ctx.common.async) return option._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				else return option._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
			}
			get discriminator() {
				return this._def.discriminator;
			}
			get options() {
				return this._def.options;
			}
			get optionsMap() {
				return this._def.optionsMap;
			}
			/**
			* The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
			* However, it only allows a union of objects, all of which need to share a discriminator property. This property must
			* have a different value for each object in the union.
			* @param discriminator the name of the discriminator property
			* @param types an array of object schemas
			* @param params
			*/
			static create(discriminator, options, params) {
				const optionsMap = /* @__PURE__ */ new Map();
				for (const type of options) {
					const discriminatorValues = getDiscriminator(type.shape[discriminator]);
					if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
					for (const value of discriminatorValues) {
						if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
						optionsMap.set(value, type);
					}
				}
				return new ZodDiscriminatedUnion({
					typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
					discriminator,
					options,
					optionsMap,
					...processCreateParams(params)
				});
			}
		};
		function mergeValues(a, b) {
			const aType = getParsedType(a);
			const bType = getParsedType(b);
			if (a === b) return {
				valid: true,
				data: a
			};
			else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
				const bKeys = util.objectKeys(b);
				const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
				const newObj = {
					...a,
					...b
				};
				for (const key of sharedKeys) {
					const sharedValue = mergeValues(a[key], b[key]);
					if (!sharedValue.valid) return { valid: false };
					newObj[key] = sharedValue.data;
				}
				return {
					valid: true,
					data: newObj
				};
			} else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
				if (a.length !== b.length) return { valid: false };
				const newArray = [];
				for (let index = 0; index < a.length; index++) {
					const itemA = a[index];
					const itemB = b[index];
					const sharedValue = mergeValues(itemA, itemB);
					if (!sharedValue.valid) return { valid: false };
					newArray.push(sharedValue.data);
				}
				return {
					valid: true,
					data: newArray
				};
			} else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) return {
				valid: true,
				data: a
			};
			else return { valid: false };
		}
		var ZodIntersection = class extends ZodType {
			_parse(input) {
				const { status, ctx } = this._processInputParams(input);
				const handleParsed = (parsedLeft, parsedRight) => {
					if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
					const merged = mergeValues(parsedLeft.value, parsedRight.value);
					if (!merged.valid) {
						addIssueToContext(ctx, { code: ZodIssueCode.invalid_intersection_types });
						return INVALID;
					}
					if (isDirty(parsedLeft) || isDirty(parsedRight)) status.dirty();
					return {
						status: status.value,
						value: merged.data
					};
				};
				if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				}), this._def.right._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				})]).then(([left, right]) => handleParsed(left, right));
				else return handleParsed(this._def.left._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				}), this._def.right._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				}));
			}
		};
		ZodIntersection.create = (left, right, params) => {
			return new ZodIntersection({
				left,
				right,
				typeName: ZodFirstPartyTypeKind.ZodIntersection,
				...processCreateParams(params)
			});
		};
		var ZodTuple = class ZodTuple extends ZodType {
			_parse(input) {
				const { status, ctx } = this._processInputParams(input);
				if (ctx.parsedType !== ZodParsedType.array) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.array,
						received: ctx.parsedType
					});
					return INVALID;
				}
				if (ctx.data.length < this._def.items.length) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.too_small,
						minimum: this._def.items.length,
						inclusive: true,
						exact: false,
						type: "array"
					});
					return INVALID;
				}
				if (!this._def.rest && ctx.data.length > this._def.items.length) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.too_big,
						maximum: this._def.items.length,
						inclusive: true,
						exact: false,
						type: "array"
					});
					status.dirty();
				}
				const items = [...ctx.data].map((item, itemIndex) => {
					const schema = this._def.items[itemIndex] || this._def.rest;
					if (!schema) return null;
					return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
				}).filter((x) => !!x);
				if (ctx.common.async) return Promise.all(items).then((results) => {
					return ParseStatus.mergeArray(status, results);
				});
				else return ParseStatus.mergeArray(status, items);
			}
			get items() {
				return this._def.items;
			}
			rest(rest) {
				return new ZodTuple({
					...this._def,
					rest
				});
			}
		};
		ZodTuple.create = (schemas, params) => {
			if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
			return new ZodTuple({
				items: schemas,
				typeName: ZodFirstPartyTypeKind.ZodTuple,
				rest: null,
				...processCreateParams(params)
			});
		};
		var ZodRecord = class ZodRecord extends ZodType {
			get keySchema() {
				return this._def.keyType;
			}
			get valueSchema() {
				return this._def.valueType;
			}
			_parse(input) {
				const { status, ctx } = this._processInputParams(input);
				if (ctx.parsedType !== ZodParsedType.object) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.object,
						received: ctx.parsedType
					});
					return INVALID;
				}
				const pairs = [];
				const keyType = this._def.keyType;
				const valueType = this._def.valueType;
				for (const key in ctx.data) pairs.push({
					key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
					value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
					alwaysSet: key in ctx.data
				});
				if (ctx.common.async) return ParseStatus.mergeObjectAsync(status, pairs);
				else return ParseStatus.mergeObjectSync(status, pairs);
			}
			get element() {
				return this._def.valueType;
			}
			static create(first, second, third) {
				if (second instanceof ZodType) return new ZodRecord({
					keyType: first,
					valueType: second,
					typeName: ZodFirstPartyTypeKind.ZodRecord,
					...processCreateParams(third)
				});
				return new ZodRecord({
					keyType: ZodString.create(),
					valueType: first,
					typeName: ZodFirstPartyTypeKind.ZodRecord,
					...processCreateParams(second)
				});
			}
		};
		var ZodMap = class extends ZodType {
			get keySchema() {
				return this._def.keyType;
			}
			get valueSchema() {
				return this._def.valueType;
			}
			_parse(input) {
				const { status, ctx } = this._processInputParams(input);
				if (ctx.parsedType !== ZodParsedType.map) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.map,
						received: ctx.parsedType
					});
					return INVALID;
				}
				const keyType = this._def.keyType;
				const valueType = this._def.valueType;
				const pairs = [...ctx.data.entries()].map(([key, value], index) => {
					return {
						key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
						value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
					};
				});
				if (ctx.common.async) {
					const finalMap = /* @__PURE__ */ new Map();
					return Promise.resolve().then(async () => {
						for (const pair of pairs) {
							const key = await pair.key;
							const value = await pair.value;
							if (key.status === "aborted" || value.status === "aborted") return INVALID;
							if (key.status === "dirty" || value.status === "dirty") status.dirty();
							finalMap.set(key.value, value.value);
						}
						return {
							status: status.value,
							value: finalMap
						};
					});
				} else {
					const finalMap = /* @__PURE__ */ new Map();
					for (const pair of pairs) {
						const key = pair.key;
						const value = pair.value;
						if (key.status === "aborted" || value.status === "aborted") return INVALID;
						if (key.status === "dirty" || value.status === "dirty") status.dirty();
						finalMap.set(key.value, value.value);
					}
					return {
						status: status.value,
						value: finalMap
					};
				}
			}
		};
		ZodMap.create = (keyType, valueType, params) => {
			return new ZodMap({
				valueType,
				keyType,
				typeName: ZodFirstPartyTypeKind.ZodMap,
				...processCreateParams(params)
			});
		};
		var ZodSet = class ZodSet extends ZodType {
			_parse(input) {
				const { status, ctx } = this._processInputParams(input);
				if (ctx.parsedType !== ZodParsedType.set) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.set,
						received: ctx.parsedType
					});
					return INVALID;
				}
				const def = this._def;
				if (def.minSize !== null) {
					if (ctx.data.size < def.minSize.value) {
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_small,
							minimum: def.minSize.value,
							type: "set",
							inclusive: true,
							exact: false,
							message: def.minSize.message
						});
						status.dirty();
					}
				}
				if (def.maxSize !== null) {
					if (ctx.data.size > def.maxSize.value) {
						addIssueToContext(ctx, {
							code: ZodIssueCode.too_big,
							maximum: def.maxSize.value,
							type: "set",
							inclusive: true,
							exact: false,
							message: def.maxSize.message
						});
						status.dirty();
					}
				}
				const valueType = this._def.valueType;
				function finalizeSet(elements) {
					const parsedSet = /* @__PURE__ */ new Set();
					for (const element of elements) {
						if (element.status === "aborted") return INVALID;
						if (element.status === "dirty") status.dirty();
						parsedSet.add(element.value);
					}
					return {
						status: status.value,
						value: parsedSet
					};
				}
				const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
				if (ctx.common.async) return Promise.all(elements).then((elements) => finalizeSet(elements));
				else return finalizeSet(elements);
			}
			min(minSize, message) {
				return new ZodSet({
					...this._def,
					minSize: {
						value: minSize,
						message: errorUtil.toString(message)
					}
				});
			}
			max(maxSize, message) {
				return new ZodSet({
					...this._def,
					maxSize: {
						value: maxSize,
						message: errorUtil.toString(message)
					}
				});
			}
			size(size, message) {
				return this.min(size, message).max(size, message);
			}
			nonempty(message) {
				return this.min(1, message);
			}
		};
		ZodSet.create = (valueType, params) => {
			return new ZodSet({
				valueType,
				minSize: null,
				maxSize: null,
				typeName: ZodFirstPartyTypeKind.ZodSet,
				...processCreateParams(params)
			});
		};
		var ZodFunction = class ZodFunction extends ZodType {
			constructor() {
				super(...arguments);
				this.validate = this.implement;
			}
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				if (ctx.parsedType !== ZodParsedType.function) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.function,
						received: ctx.parsedType
					});
					return INVALID;
				}
				function makeArgsIssue(args, error) {
					return makeIssue({
						data: args,
						path: ctx.path,
						errorMaps: [
							ctx.common.contextualErrorMap,
							ctx.schemaErrorMap,
							getErrorMap(),
							errorMap
						].filter((x) => !!x),
						issueData: {
							code: ZodIssueCode.invalid_arguments,
							argumentsError: error
						}
					});
				}
				function makeReturnsIssue(returns, error) {
					return makeIssue({
						data: returns,
						path: ctx.path,
						errorMaps: [
							ctx.common.contextualErrorMap,
							ctx.schemaErrorMap,
							getErrorMap(),
							errorMap
						].filter((x) => !!x),
						issueData: {
							code: ZodIssueCode.invalid_return_type,
							returnTypeError: error
						}
					});
				}
				const params = { errorMap: ctx.common.contextualErrorMap };
				const fn = ctx.data;
				if (this._def.returns instanceof ZodPromise) {
					const me = this;
					return OK(async function(...args) {
						const error = new ZodError([]);
						const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
							error.addIssue(makeArgsIssue(args, e));
							throw error;
						});
						const result = await Reflect.apply(fn, this, parsedArgs);
						return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
							error.addIssue(makeReturnsIssue(result, e));
							throw error;
						});
					});
				} else {
					const me = this;
					return OK(function(...args) {
						const parsedArgs = me._def.args.safeParse(args, params);
						if (!parsedArgs.success) throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
						const result = Reflect.apply(fn, this, parsedArgs.data);
						const parsedReturns = me._def.returns.safeParse(result, params);
						if (!parsedReturns.success) throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
						return parsedReturns.data;
					});
				}
			}
			parameters() {
				return this._def.args;
			}
			returnType() {
				return this._def.returns;
			}
			args(...items) {
				return new ZodFunction({
					...this._def,
					args: ZodTuple.create(items).rest(ZodUnknown.create())
				});
			}
			returns(returnType) {
				return new ZodFunction({
					...this._def,
					returns: returnType
				});
			}
			implement(func) {
				return this.parse(func);
			}
			strictImplement(func) {
				return this.parse(func);
			}
			static create(args, returns, params) {
				return new ZodFunction({
					args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
					returns: returns || ZodUnknown.create(),
					typeName: ZodFirstPartyTypeKind.ZodFunction,
					...processCreateParams(params)
				});
			}
		};
		var ZodLazy = class extends ZodType {
			get schema() {
				return this._def.getter();
			}
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				return this._def.getter()._parse({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
			}
		};
		ZodLazy.create = (getter, params) => {
			return new ZodLazy({
				getter,
				typeName: ZodFirstPartyTypeKind.ZodLazy,
				...processCreateParams(params)
			});
		};
		var ZodLiteral = class extends ZodType {
			_parse(input) {
				if (input.data !== this._def.value) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						received: ctx.data,
						code: ZodIssueCode.invalid_literal,
						expected: this._def.value
					});
					return INVALID;
				}
				return {
					status: "valid",
					value: input.data
				};
			}
			get value() {
				return this._def.value;
			}
		};
		ZodLiteral.create = (value, params) => {
			return new ZodLiteral({
				value,
				typeName: ZodFirstPartyTypeKind.ZodLiteral,
				...processCreateParams(params)
			});
		};
		function createZodEnum(values, params) {
			return new ZodEnum({
				values,
				typeName: ZodFirstPartyTypeKind.ZodEnum,
				...processCreateParams(params)
			});
		}
		var ZodEnum = class ZodEnum extends ZodType {
			constructor() {
				super(...arguments);
				_ZodEnum_cache.set(this, void 0);
			}
			_parse(input) {
				if (typeof input.data !== "string") {
					const ctx = this._getOrReturnCtx(input);
					const expectedValues = this._def.values;
					addIssueToContext(ctx, {
						expected: util.joinValues(expectedValues),
						received: ctx.parsedType,
						code: ZodIssueCode.invalid_type
					});
					return INVALID;
				}
				if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
				if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
					const ctx = this._getOrReturnCtx(input);
					const expectedValues = this._def.values;
					addIssueToContext(ctx, {
						received: ctx.data,
						code: ZodIssueCode.invalid_enum_value,
						options: expectedValues
					});
					return INVALID;
				}
				return OK(input.data);
			}
			get options() {
				return this._def.values;
			}
			get enum() {
				const enumValues = {};
				for (const val of this._def.values) enumValues[val] = val;
				return enumValues;
			}
			get Values() {
				const enumValues = {};
				for (const val of this._def.values) enumValues[val] = val;
				return enumValues;
			}
			get Enum() {
				const enumValues = {};
				for (const val of this._def.values) enumValues[val] = val;
				return enumValues;
			}
			extract(values, newDef = this._def) {
				return ZodEnum.create(values, {
					...this._def,
					...newDef
				});
			}
			exclude(values, newDef = this._def) {
				return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
					...this._def,
					...newDef
				});
			}
		};
		_ZodEnum_cache = /* @__PURE__ */ new WeakMap();
		ZodEnum.create = createZodEnum;
		var ZodNativeEnum = class extends ZodType {
			constructor() {
				super(...arguments);
				_ZodNativeEnum_cache.set(this, void 0);
			}
			_parse(input) {
				const nativeEnumValues = util.getValidEnumValues(this._def.values);
				const ctx = this._getOrReturnCtx(input);
				if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
					const expectedValues = util.objectValues(nativeEnumValues);
					addIssueToContext(ctx, {
						expected: util.joinValues(expectedValues),
						received: ctx.parsedType,
						code: ZodIssueCode.invalid_type
					});
					return INVALID;
				}
				if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
				if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
					const expectedValues = util.objectValues(nativeEnumValues);
					addIssueToContext(ctx, {
						received: ctx.data,
						code: ZodIssueCode.invalid_enum_value,
						options: expectedValues
					});
					return INVALID;
				}
				return OK(input.data);
			}
			get enum() {
				return this._def.values;
			}
		};
		_ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
		ZodNativeEnum.create = (values, params) => {
			return new ZodNativeEnum({
				values,
				typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
				...processCreateParams(params)
			});
		};
		var ZodPromise = class extends ZodType {
			unwrap() {
				return this._def.type;
			}
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.promise,
						received: ctx.parsedType
					});
					return INVALID;
				}
				const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
				return OK(promisified.then((data) => {
					return this._def.type.parseAsync(data, {
						path: ctx.path,
						errorMap: ctx.common.contextualErrorMap
					});
				}));
			}
		};
		ZodPromise.create = (schema, params) => {
			return new ZodPromise({
				type: schema,
				typeName: ZodFirstPartyTypeKind.ZodPromise,
				...processCreateParams(params)
			});
		};
		var ZodEffects = class extends ZodType {
			innerType() {
				return this._def.schema;
			}
			sourceType() {
				return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
			}
			_parse(input) {
				const { status, ctx } = this._processInputParams(input);
				const effect = this._def.effect || null;
				const checkCtx = {
					addIssue: (arg) => {
						addIssueToContext(ctx, arg);
						if (arg.fatal) status.abort();
						else status.dirty();
					},
					get path() {
						return ctx.path;
					}
				};
				checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
				if (effect.type === "preprocess") {
					const processed = effect.transform(ctx.data, checkCtx);
					if (ctx.common.async) return Promise.resolve(processed).then(async (processed) => {
						if (status.value === "aborted") return INVALID;
						const result = await this._def.schema._parseAsync({
							data: processed,
							path: ctx.path,
							parent: ctx
						});
						if (result.status === "aborted") return INVALID;
						if (result.status === "dirty") return DIRTY(result.value);
						if (status.value === "dirty") return DIRTY(result.value);
						return result;
					});
					else {
						if (status.value === "aborted") return INVALID;
						const result = this._def.schema._parseSync({
							data: processed,
							path: ctx.path,
							parent: ctx
						});
						if (result.status === "aborted") return INVALID;
						if (result.status === "dirty") return DIRTY(result.value);
						if (status.value === "dirty") return DIRTY(result.value);
						return result;
					}
				}
				if (effect.type === "refinement") {
					const executeRefinement = (acc) => {
						const result = effect.refinement(acc, checkCtx);
						if (ctx.common.async) return Promise.resolve(result);
						if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
						return acc;
					};
					if (ctx.common.async === false) {
						const inner = this._def.schema._parseSync({
							data: ctx.data,
							path: ctx.path,
							parent: ctx
						});
						if (inner.status === "aborted") return INVALID;
						if (inner.status === "dirty") status.dirty();
						executeRefinement(inner.value);
						return {
							status: status.value,
							value: inner.value
						};
					} else return this._def.schema._parseAsync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					}).then((inner) => {
						if (inner.status === "aborted") return INVALID;
						if (inner.status === "dirty") status.dirty();
						return executeRefinement(inner.value).then(() => {
							return {
								status: status.value,
								value: inner.value
							};
						});
					});
				}
				if (effect.type === "transform") {
					if (ctx.common.async === false) {
						const base = this._def.schema._parseSync({
							data: ctx.data,
							path: ctx.path,
							parent: ctx
						});
						if (!isValid(base)) return base;
						const result = effect.transform(base.value, checkCtx);
						if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
						return {
							status: status.value,
							value: result
						};
					} else return this._def.schema._parseAsync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					}).then((base) => {
						if (!isValid(base)) return base;
						return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
							status: status.value,
							value: result
						}));
					});
				}
				util.assertNever(effect);
			}
		};
		ZodEffects.create = (schema, effect, params) => {
			return new ZodEffects({
				schema,
				typeName: ZodFirstPartyTypeKind.ZodEffects,
				effect,
				...processCreateParams(params)
			});
		};
		ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
			return new ZodEffects({
				schema,
				effect: {
					type: "preprocess",
					transform: preprocess
				},
				typeName: ZodFirstPartyTypeKind.ZodEffects,
				...processCreateParams(params)
			});
		};
		var ZodOptional = class extends ZodType {
			_parse(input) {
				if (this._getType(input) === ZodParsedType.undefined) return OK(void 0);
				return this._def.innerType._parse(input);
			}
			unwrap() {
				return this._def.innerType;
			}
		};
		ZodOptional.create = (type, params) => {
			return new ZodOptional({
				innerType: type,
				typeName: ZodFirstPartyTypeKind.ZodOptional,
				...processCreateParams(params)
			});
		};
		var ZodNullable = class extends ZodType {
			_parse(input) {
				if (this._getType(input) === ZodParsedType.null) return OK(null);
				return this._def.innerType._parse(input);
			}
			unwrap() {
				return this._def.innerType;
			}
		};
		ZodNullable.create = (type, params) => {
			return new ZodNullable({
				innerType: type,
				typeName: ZodFirstPartyTypeKind.ZodNullable,
				...processCreateParams(params)
			});
		};
		var ZodDefault = class extends ZodType {
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				let data = ctx.data;
				if (ctx.parsedType === ZodParsedType.undefined) data = this._def.defaultValue();
				return this._def.innerType._parse({
					data,
					path: ctx.path,
					parent: ctx
				});
			}
			removeDefault() {
				return this._def.innerType;
			}
		};
		ZodDefault.create = (type, params) => {
			return new ZodDefault({
				innerType: type,
				typeName: ZodFirstPartyTypeKind.ZodDefault,
				defaultValue: typeof params.default === "function" ? params.default : () => params.default,
				...processCreateParams(params)
			});
		};
		var ZodCatch = class extends ZodType {
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				const newCtx = {
					...ctx,
					common: {
						...ctx.common,
						issues: []
					}
				};
				const result = this._def.innerType._parse({
					data: newCtx.data,
					path: newCtx.path,
					parent: { ...newCtx }
				});
				if (isAsync(result)) return result.then((result) => {
					return {
						status: "valid",
						value: result.status === "valid" ? result.value : this._def.catchValue({
							get error() {
								return new ZodError(newCtx.common.issues);
							},
							input: newCtx.data
						})
					};
				});
				else return {
					status: "valid",
					value: result.status === "valid" ? result.value : this._def.catchValue({
						get error() {
							return new ZodError(newCtx.common.issues);
						},
						input: newCtx.data
					})
				};
			}
			removeCatch() {
				return this._def.innerType;
			}
		};
		ZodCatch.create = (type, params) => {
			return new ZodCatch({
				innerType: type,
				typeName: ZodFirstPartyTypeKind.ZodCatch,
				catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
				...processCreateParams(params)
			});
		};
		var ZodNaN = class extends ZodType {
			_parse(input) {
				if (this._getType(input) !== ZodParsedType.nan) {
					const ctx = this._getOrReturnCtx(input);
					addIssueToContext(ctx, {
						code: ZodIssueCode.invalid_type,
						expected: ZodParsedType.nan,
						received: ctx.parsedType
					});
					return INVALID;
				}
				return {
					status: "valid",
					value: input.data
				};
			}
		};
		ZodNaN.create = (params) => {
			return new ZodNaN({
				typeName: ZodFirstPartyTypeKind.ZodNaN,
				...processCreateParams(params)
			});
		};
		const BRAND = Symbol("zod_brand");
		var ZodBranded = class extends ZodType {
			_parse(input) {
				const { ctx } = this._processInputParams(input);
				const data = ctx.data;
				return this._def.type._parse({
					data,
					path: ctx.path,
					parent: ctx
				});
			}
			unwrap() {
				return this._def.type;
			}
		};
		var ZodPipeline = class ZodPipeline extends ZodType {
			_parse(input) {
				const { status, ctx } = this._processInputParams(input);
				if (ctx.common.async) {
					const handleAsync = async () => {
						const inResult = await this._def.in._parseAsync({
							data: ctx.data,
							path: ctx.path,
							parent: ctx
						});
						if (inResult.status === "aborted") return INVALID;
						if (inResult.status === "dirty") {
							status.dirty();
							return DIRTY(inResult.value);
						} else return this._def.out._parseAsync({
							data: inResult.value,
							path: ctx.path,
							parent: ctx
						});
					};
					return handleAsync();
				} else {
					const inResult = this._def.in._parseSync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					});
					if (inResult.status === "aborted") return INVALID;
					if (inResult.status === "dirty") {
						status.dirty();
						return {
							status: "dirty",
							value: inResult.value
						};
					} else return this._def.out._parseSync({
						data: inResult.value,
						path: ctx.path,
						parent: ctx
					});
				}
			}
			static create(a, b) {
				return new ZodPipeline({
					in: a,
					out: b,
					typeName: ZodFirstPartyTypeKind.ZodPipeline
				});
			}
		};
		var ZodReadonly = class extends ZodType {
			_parse(input) {
				const result = this._def.innerType._parse(input);
				const freeze = (data) => {
					if (isValid(data)) data.value = Object.freeze(data.value);
					return data;
				};
				return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
			}
			unwrap() {
				return this._def.innerType;
			}
		};
		ZodReadonly.create = (type, params) => {
			return new ZodReadonly({
				innerType: type,
				typeName: ZodFirstPartyTypeKind.ZodReadonly,
				...processCreateParams(params)
			});
		};
		function custom(check, params = {}, fatal) {
			if (check) return ZodAny.create().superRefine((data, ctx) => {
				var _a, _b;
				if (!check(data)) {
					const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
					const _fatal = (_b = (_a = p.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
					const p2 = typeof p === "string" ? { message: p } : p;
					ctx.addIssue({
						code: "custom",
						...p2,
						fatal: _fatal
					});
				}
			});
			return ZodAny.create();
		}
		const late = { object: ZodObject.lazycreate };
		var ZodFirstPartyTypeKind;
		(function(ZodFirstPartyTypeKind) {
			ZodFirstPartyTypeKind["ZodString"] = "ZodString";
			ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
			ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
			ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
			ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
			ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
			ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
			ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
			ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
			ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
			ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
			ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
			ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
			ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
			ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
			ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
			ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
			ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
			ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
			ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
			ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
			ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
			ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
			ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
			ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
			ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
			ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
			ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
			ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
			ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
			ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
			ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
			ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
			ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
			ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
			ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
		})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
		const instanceOfType = (cls, params = { message: `Input not instance of ${cls.name}` }) => custom((data) => data instanceof cls, params);
		const stringType = ZodString.create;
		const numberType = ZodNumber.create;
		const nanType = ZodNaN.create;
		const bigIntType = ZodBigInt.create;
		const booleanType = ZodBoolean.create;
		const dateType = ZodDate.create;
		const symbolType = ZodSymbol.create;
		const undefinedType = ZodUndefined.create;
		const nullType = ZodNull.create;
		const anyType = ZodAny.create;
		const unknownType = ZodUnknown.create;
		const neverType = ZodNever.create;
		const voidType = ZodVoid.create;
		const arrayType = ZodArray.create;
		const objectType = ZodObject.create;
		const strictObjectType = ZodObject.strictCreate;
		const unionType = ZodUnion.create;
		const discriminatedUnionType = ZodDiscriminatedUnion.create;
		const intersectionType = ZodIntersection.create;
		const tupleType = ZodTuple.create;
		const recordType = ZodRecord.create;
		const mapType = ZodMap.create;
		const setType = ZodSet.create;
		const functionType = ZodFunction.create;
		const lazyType = ZodLazy.create;
		const literalType = ZodLiteral.create;
		const enumType = ZodEnum.create;
		const nativeEnumType = ZodNativeEnum.create;
		const promiseType = ZodPromise.create;
		const effectsType = ZodEffects.create;
		const optionalType = ZodOptional.create;
		const nullableType = ZodNullable.create;
		const preprocessType = ZodEffects.createWithPreprocess;
		const pipelineType = ZodPipeline.create;
		const ostring = () => stringType().optional();
		const onumber = () => numberType().optional();
		const oboolean = () => booleanType().optional();
		var z = /*#__PURE__*/ Object.freeze({
			__proto__: null,
			defaultErrorMap: errorMap,
			setErrorMap,
			getErrorMap,
			makeIssue,
			EMPTY_PATH,
			addIssueToContext,
			ParseStatus,
			INVALID,
			DIRTY,
			OK,
			isAborted,
			isDirty,
			isValid,
			isAsync,
			get util() {
				return util;
			},
			get objectUtil() {
				return objectUtil;
			},
			ZodParsedType,
			getParsedType,
			ZodType,
			datetimeRegex,
			ZodString,
			ZodNumber,
			ZodBigInt,
			ZodBoolean,
			ZodDate,
			ZodSymbol,
			ZodUndefined,
			ZodNull,
			ZodAny,
			ZodUnknown,
			ZodNever,
			ZodVoid,
			ZodArray,
			ZodObject,
			ZodUnion,
			ZodDiscriminatedUnion,
			ZodIntersection,
			ZodTuple,
			ZodRecord,
			ZodMap,
			ZodSet,
			ZodFunction,
			ZodLazy,
			ZodLiteral,
			ZodEnum,
			ZodNativeEnum,
			ZodPromise,
			ZodEffects,
			ZodTransformer: ZodEffects,
			ZodOptional,
			ZodNullable,
			ZodDefault,
			ZodCatch,
			ZodNaN,
			BRAND,
			ZodBranded,
			ZodPipeline,
			ZodReadonly,
			custom,
			Schema: ZodType,
			ZodSchema: ZodType,
			late,
			get ZodFirstPartyTypeKind() {
				return ZodFirstPartyTypeKind;
			},
			coerce: {
				string: ((arg) => ZodString.create({
					...arg,
					coerce: true
				})),
				number: ((arg) => ZodNumber.create({
					...arg,
					coerce: true
				})),
				boolean: ((arg) => ZodBoolean.create({
					...arg,
					coerce: true
				})),
				bigint: ((arg) => ZodBigInt.create({
					...arg,
					coerce: true
				})),
				date: ((arg) => ZodDate.create({
					...arg,
					coerce: true
				}))
			},
			any: anyType,
			array: arrayType,
			bigint: bigIntType,
			boolean: booleanType,
			date: dateType,
			discriminatedUnion: discriminatedUnionType,
			effect: effectsType,
			"enum": enumType,
			"function": functionType,
			"instanceof": instanceOfType,
			intersection: intersectionType,
			lazy: lazyType,
			literal: literalType,
			map: mapType,
			nan: nanType,
			nativeEnum: nativeEnumType,
			never: neverType,
			"null": nullType,
			nullable: nullableType,
			number: numberType,
			object: objectType,
			oboolean,
			onumber,
			optional: optionalType,
			ostring,
			pipeline: pipelineType,
			preprocess: preprocessType,
			promise: promiseType,
			record: recordType,
			set: setType,
			strictObject: strictObjectType,
			string: stringType,
			symbol: symbolType,
			transformer: effectsType,
			tuple: tupleType,
			"undefined": undefinedType,
			union: unionType,
			unknown: unknownType,
			"void": voidType,
			NEVER: INVALID,
			ZodIssueCode,
			quotelessJson,
			ZodError
		});
		//#endregion
		//#region ../engine/src/schema.ts
		const transitionSchema = z.enum(["none", "fade"]).default("none");
		const easingSchema = z.enum([
			"linear",
			"in",
			"out",
			"inOut",
			"bounce",
			"elastic"
		]);
		const keyframeSchema = z.object({
			t: z.number().min(0),
			v: z.number(),
			e: easingSchema.optional()
		});
		const animationsSchema = z.object({
			x: z.array(keyframeSchema).optional(),
			y: z.array(keyframeSchema).optional(),
			scale: z.array(keyframeSchema).optional(),
			opacity: z.array(keyframeSchema).optional(),
			rotation: z.array(keyframeSchema).optional(),
			volume: z.array(keyframeSchema).optional()
		});
		const filterSchema = z.object({
			brightness: z.number().min(0).max(3).optional(),
			contrast: z.number().min(0).max(3).optional(),
			saturate: z.number().min(0).max(3).optional(),
			blur: z.number().min(0).max(20).optional(),
			grayscale: z.number().min(0).max(1).optional(),
			sepia: z.number().min(0).max(1).optional(),
			hueRotate: z.number().min(0).max(360).optional()
		});
		const clipSchema = z.object({
			id: z.string(),
			type: z.enum(["video", "image"]),
			src: z.string(),
			inPoint: z.number().min(0),
			clipDuration: z.number().positive(),
			transition: transitionSchema,
			volume: z.number().min(0).max(1).default(1),
			atSeconds: z.number().min(0).optional(),
			box: z.object({
				x: z.number().min(0).max(1),
				y: z.number().min(0).max(1),
				w: z.number().min(.01).max(1),
				h: z.number().min(.01).max(1)
			}).optional(),
			speed: z.number().min(.1).max(10).default(1),
			filter: filterSchema.optional(),
			animations: animationsSchema.optional()
		});
		const videoTrackSchema = z.object({
			id: z.string(),
			name: z.string().optional(),
			clips: z.array(clipSchema).default([])
		});
		const audioClipSchema = z.object({
			id: z.string(),
			src: z.string(),
			inPoint: z.number().min(0).default(0),
			duration: z.number().positive(),
			volume: z.number().min(0).max(1).default(1),
			atSeconds: z.number().min(0).default(0),
			speed: z.number().min(.1).max(10).default(1),
			animations: animationsSchema.optional()
		});
		const audioTrackV2Schema = z.object({
			id: z.string(),
			name: z.string().optional(),
			volume: z.number().min(0).max(1).default(1),
			muted: z.boolean().default(false),
			clips: z.array(audioClipSchema).default([])
		});
		const legacyAudioSchema = z.object({
			src: z.string(),
			volume: z.number().min(0).max(1).default(1),
			startAtSeconds: z.number().min(0).default(0)
		});
		const overlaySchema = z.object({
			text: z.string(),
			startSeconds: z.number().min(0),
			endSeconds: z.number().min(0),
			position: z.enum([
				"top",
				"center",
				"bottom"
			]).default("bottom"),
			fontSize: z.number().positive().default(64),
			color: z.string().default("#ffffff"),
			fontFamily: z.string().optional(),
			fontWeight: z.number().int().min(100).max(900).optional(),
			animations: animationsSchema.optional()
		});
		const metaSchema = z.object({
			fps: z.number().positive(),
			width: z.number().int().positive(),
			height: z.number().int().positive()
		});
		z.object({
			meta: metaSchema,
			videoTracks: z.array(videoTrackSchema).optional(),
			audioTracks: z.array(audioTrackV2Schema).optional(),
			clips: z.array(clipSchema).optional(),
			audio: legacyAudioSchema.nullable().optional(),
			overlays: z.array(overlaySchema).default([])
		});
		z.object({
			meta: metaSchema,
			version: z.literal(2).default(2),
			videoTracks: z.array(videoTrackSchema).min(1),
			audioTracks: z.array(audioTrackV2Schema),
			overlays: z.array(overlaySchema)
		});
		const SEC$1 = (fps, s) => Math.round(s * fps);
		const DEFAULT_BOX = {
			x: .66,
			y: .66,
			w: .3,
			h: .3
		};
		const clipBox = (c) => c.box ?? DEFAULT_BOX;
		const timelineDurationInFrames = (t) => {
			const fps = t.meta.fps;
			let frames = t.videoTracks[0]?.clips.reduce((acc, c) => acc + SEC$1(fps, c.clipDuration), 0) ?? 0;
			for (const tr of t.videoTracks.slice(1)) for (const c of tr.clips) frames = Math.max(frames, SEC$1(fps, (c.atSeconds ?? 0) + c.clipDuration));
			for (const tr of t.audioTracks) {
				if (tr.muted) continue;
				for (const c of tr.clips) frames = Math.max(frames, SEC$1(fps, c.atSeconds + c.duration));
			}
			for (const ov of t.overlays) frames = Math.max(frames, SEC$1(fps, ov.endSeconds));
			return Math.max(1, frames);
		};
		//#endregion
		//#region ../engine/src/presets.ts
		const kf = (t, v, e) => ({
			t,
			v,
			...e ? { e } : {}
		});
		const ANIMATION_PRESETS = {
			fadeIn: {
				label: "淡入",
				group: "入场",
				expand: (d) => ({ opacity: [kf(0, 0, "out"), kf(Math.min(.8, d * .3), 1)] })
			},
			slideInLeft: {
				label: "左滑入",
				group: "入场",
				expand: (d) => ({
					x: [kf(0, -.5, "out"), kf(Math.min(.7, d * .25), 0)],
					opacity: [kf(0, 0), kf(Math.min(.4, d * .15), 1)]
				})
			},
			slideInRight: {
				label: "右滑入",
				group: "入场",
				expand: (d) => ({
					x: [kf(0, .5, "out"), kf(Math.min(.7, d * .25), 0)],
					opacity: [kf(0, 0), kf(Math.min(.4, d * .15), 1)]
				})
			},
			slideInUp: {
				label: "上滑入",
				group: "入场",
				expand: (d) => ({
					y: [kf(0, .5, "out"), kf(Math.min(.7, d * .25), 0)],
					opacity: [kf(0, 0), kf(Math.min(.4, d * .15), 1)]
				})
			},
			zoomIn: {
				label: "放大入场",
				group: "入场",
				expand: (d) => ({
					scale: [kf(0, .3, "out"), kf(Math.min(.8, d * .3), 1)],
					opacity: [kf(0, 0), kf(Math.min(.4, d * .15), 1)]
				})
			},
			bounceIn: {
				label: "弹跳入场",
				group: "入场",
				expand: (d) => ({
					scale: [kf(0, .2, "bounce"), kf(Math.min(.9, d * .35), 1)],
					opacity: [kf(0, 0), kf(Math.min(.3, d * .1), 1)]
				})
			},
			spinIn: {
				label: "旋转入场",
				group: "入场",
				expand: (d) => ({
					rotation: [kf(0, -180, "out"), kf(Math.min(.9, d * .3), 0)],
					scale: [kf(0, .4, "out"), kf(Math.min(.9, d * .3), 1)],
					opacity: [kf(0, 0), kf(Math.min(.4, d * .15), 1)]
				})
			},
			fadeOut: {
				label: "淡出",
				group: "出场",
				expand: (d) => ({ opacity: [kf(Math.max(0, d - Math.min(.8, d * .3)), 1, "in"), kf(d, 0)] })
			},
			slideOutLeft: {
				label: "左滑出",
				group: "出场",
				expand: (d) => ({
					x: [kf(Math.max(0, d - Math.min(.7, d * .25)), 0, "in"), kf(d, -.5)],
					opacity: [kf(Math.max(0, d - Math.min(.4, d * .15)), 1), kf(d, 0)]
				})
			},
			slideOutRight: {
				label: "右滑出",
				group: "出场",
				expand: (d) => ({
					x: [kf(Math.max(0, d - Math.min(.7, d * .25)), 0, "in"), kf(d, .5)],
					opacity: [kf(Math.max(0, d - Math.min(.4, d * .15)), 1), kf(d, 0)]
				})
			},
			zoomOut: {
				label: "缩小出场",
				group: "出场",
				expand: (d) => ({
					scale: [kf(Math.max(0, d - Math.min(.8, d * .3)), 1, "in"), kf(d, .3)],
					opacity: [kf(Math.max(0, d - Math.min(.4, d * .15)), 1), kf(d, 0)]
				})
			},
			kenBurns: {
				label: "镜头缓推",
				group: "组合",
				expand: (d) => ({
					scale: [kf(0, 1, "inOut"), kf(d, 1.15)],
					x: [kf(0, 0, "inOut"), kf(d, .02)]
				})
			},
			kenBurnsOut: {
				label: "镜头缓拉",
				group: "组合",
				expand: (d) => ({
					scale: [kf(0, 1.15, "inOut"), kf(d, 1)],
					y: [kf(0, .02, "inOut"), kf(d, 0)]
				})
			},
			pop: {
				label: "弹跳强调",
				group: "组合",
				expand: (d) => ({ scale: [kf(0, .9, "elastic"), kf(Math.min(.7, d * .25), 1)] })
			},
			tilt: {
				label: "摇摆",
				group: "组合",
				expand: (d) => ({ rotation: [
					kf(0, -3, "inOut"),
					kf(d / 4, 3, "inOut"),
					kf(d / 2, -3, "inOut"),
					kf(d * 3 / 4, 3, "inOut"),
					kf(d, -3)
				] })
			},
			pulse: {
				label: "脉冲",
				group: "循环",
				expand: (d) => {
					const kfs = [];
					for (let i = 0; i * 1 <= d; i++) kfs.push(kf(i, i % 2 ? 1.06 : 1, "inOut"));
					if (kfs[kfs.length - 1].t < d) kfs.push(kf(d, kfs.length % 2 ? 1.06 : 1));
					return { scale: kfs };
				}
			},
			wobble: {
				label: "抖动",
				group: "循环",
				expand: (d) => {
					const kfs = [];
					for (let i = 0; i * .5 <= d; i++) kfs.push(kf(i * .5, i % 2 ? .008 : -.008, "linear"));
					return { x: kfs };
				}
			},
			float: {
				label: "漂浮",
				group: "循环",
				expand: (d) => {
					const kfs = [];
					for (let i = 0; i * 2 <= d; i++) kfs.push(kf(i * 2, i % 2 ? -.015 : .015, "inOut"));
					if (kfs[kfs.length - 1].t < d) kfs.push(kf(d, kfs.length % 2 ? -.015 : .015));
					return { y: kfs };
				}
			}
		};
		const expandAnimationPreset = (name, dur) => {
			const p = ANIMATION_PRESETS[name];
			return p ? p.expand(Math.max(.1, dur)) : void 0;
		};
		//#endregion
		//#region ../engine/src/fonts.ts
		const FONTS = [
			{
				id: "sans",
				label: "思源黑体",
				family: "Djian Noto Sans SC",
				file: "notosanssc.woff2",
				weights: "100 900"
			},
			{
				id: "serif",
				label: "思源宋体",
				family: "Djian Noto Serif SC",
				file: "notoserifsc.woff2",
				weights: "100 900"
			},
			{
				id: "kuaile",
				label: "快乐体",
				family: "Djian ZCOOL KuaiLe",
				file: "zcoolkuaile.woff2",
				weights: "400"
			},
			{
				id: "qingke",
				label: "黄油体",
				family: "Djian ZCOOL QingKe",
				file: "zcoolqingke.woff2",
				weights: "400"
			},
			{
				id: "mashan",
				label: "毛笔楷",
				family: "Djian Ma Shan Zheng",
				file: "mashanzheng.woff2",
				weights: "400"
			}
		];
		const fontById = (id) => FONTS.find((f) => f.id === id);
		const FALLBACK_STACK = "\"Noto Sans CJK SC\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
		const fontsBaseUrl = () => {
			return (typeof process !== "undefined" ? process.env.DJIAN_FONTS_BASE : void 0) || "http://127.0.0.1:5180/fonts";
		};
		function fontFaceCss() {
			const base = fontsBaseUrl();
			return FONTS.map((f) => `@font-face{font-family:"${f.family}";src:url("${base}/${f.file}") format("woff2");font-weight:${f.weights};font-display:block;}`).join("\n");
		}
		const overlayFontFamily = (id) => {
			const f = fontById(id);
			return f ? `"${f.family}", ${FALLBACK_STACK}` : FALLBACK_STACK;
		};
		let styleInjected = false;
		const injectFontFaceStyle = () => {
			if (styleInjected || typeof document === "undefined") return;
			styleInjected = true;
			const style = document.createElement("style");
			style.textContent = fontFaceCss();
			document.head.appendChild(style);
		};
		//#endregion
		//#region src/client/PreviewVideo.tsx
		const SEC = (fps, s) => Math.round(s * fps);
		const positionStyle = {
			top: { top: 60 },
			center: {
				top: "50%",
				transform: "translateY(-50%)"
			},
			bottom: { bottom: 80 }
		};
		const FadeIn = ({ fade, children }) => {
			const frame = useCurrentFrame();
			const opacity = fade ? Math.min(1, frame / 12) : 1;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AbsoluteFill, {
				style: { opacity },
				children
			});
		};
		const ClipSegment = ({ clip }) => {
			const { fps } = useVideoConfig();
			const fade = clip.transition === "fade";
			const inner = clip.type === "image" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Img, {
				src: clip.src,
				style: {
					width: "100%",
					height: "100%",
					objectFit: "cover"
				}
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OffthreadVideo, {
				src: clip.src,
				startFrom: SEC(fps, clip.inPoint),
				volume: clip.volume,
				style: {
					width: "100%",
					height: "100%",
					objectFit: "cover"
				}
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FadeIn, {
				fade,
				children: inner
			});
		};
		const PipSegment = ({ clip }) => {
			const { fps } = useVideoConfig();
			const box = clipBox(clip);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				from: SEC(fps, clip.atSeconds ?? 0),
				durationInFrames: SEC(fps, clip.clipDuration),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: {
						position: "absolute",
						left: `${box.x * 100}%`,
						top: `${box.y * 100}%`,
						width: `${box.w * 100}%`,
						height: `${box.h * 100}%`,
						overflow: "hidden",
						boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
						borderRadius: 6
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClipSegment, { clip })
				})
			});
		};
		const AudioSegment = ({ clip, trackVolume, muted }) => {
			const { fps } = useVideoConfig();
			if (muted) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
				from: SEC(fps, clip.atSeconds),
				durationInFrames: SEC(fps, clip.duration),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Audio, {
					src: clip.src,
					startFrom: SEC(fps, clip.inPoint),
					volume: trackVolume * clip.volume
				})
			});
		};
		const PreviewVideo = ({ timeline }) => {
			const { fps } = useVideoConfig();
			const [mainTrack, ...overlayTracks] = timeline.videoTracks;
			react.default.useEffect(() => {
				injectFontFaceStyle();
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(AbsoluteFill, {
				style: { backgroundColor: "#000" },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Series, { children: mainTrack.clips.map((clip) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Series.Sequence, {
						durationInFrames: SEC(fps, clip.clipDuration),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClipSegment, { clip })
					}, clip.id)) }),
					overlayTracks.map((tr) => tr.clips.map((clip) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PipSegment, { clip }, clip.id))),
					timeline.audioTracks.map((tr) => tr.clips.map((clip) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AudioSegment, {
						clip,
						trackVolume: tr.volume,
						muted: tr.muted
					}, clip.id))),
					timeline.overlays.map((ov, i) => {
						const from = SEC(fps, ov.startSeconds);
						const duration = Math.max(1, SEC(fps, ov.endSeconds - ov.startSeconds));
						return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sequence, {
							from,
							durationInFrames: duration,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AbsoluteFill, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									position: "absolute",
									...positionStyle[ov.position],
									width: "100%",
									textAlign: "center",
									fontSize: ov.fontSize,
									color: ov.color,
									fontFamily: overlayFontFamily(ov.fontFamily),
									...ov.fontWeight ? { fontWeight: ov.fontWeight } : {},
									textShadow: "0 2px 8px rgba(0,0,0,0.85)"
								},
								children: ov.text
							}) })
						}, i);
					})
				]
			});
		};
		//#endregion
		//#region src/client/bus.ts
		const playerBus = { ref: null };
		const seekToSeconds = (seconds, fps) => {
			playerBus.ref?.seekTo(Math.round(seconds * fps));
		};
		//#endregion
		//#region src/client/api.ts
		const API_BASE = typeof window !== "undefined" && window.location ? `${window.location.protocol}//${window.location.hostname}:5180` : "http://127.0.0.1:5180";
		const assetUrl = (src) => /^(?:[a-z]+:)?\/\//i.test(src) ? src : `${API_BASE}/${src.replace(/^\/+/, "")}`;
		async function getTimeline(sessionId, peek = false) {
			const q = sessionId ? `?session=${encodeURIComponent(sessionId)}${peek ? "&peek=1" : ""}` : "";
			const r = await fetch(`${API_BASE}/api/internal/timeline${q}`);
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return r.json();
		}
		async function putTimeline(t, sessionId) {
			const r = await fetch(`${API_BASE}/api/internal/timeline`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(sessionId ? {
					timeline: t,
					sessionId
				} : t)
			});
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
		}
		async function getExportStatus() {
			return (await fetch(`${API_BASE}/api/export/status`)).json();
		}
		const exportDownloadUrl = `${API_BASE}/api/export/download`;
		async function startExportWith(timeline, opts) {
			const r = await fetch(`${API_BASE}/api/export`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					timeline,
					scale: opts.scale ?? 1,
					quality: opts.quality ?? "standard"
				})
			});
			if (r.status !== 202) {
				const d = await r.json().catch(() => ({}));
				throw new Error(d.error ?? `HTTP ${r.status}`);
			}
		}
		async function sessionProject(sessionId) {
			const r = await fetch(`${API_BASE}/api/session-project`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sessionId })
			});
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return (await r.json()).project ?? null;
		}
		async function listFonts() {
			const r = await fetch(`${API_BASE}/api/fonts`);
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return (await r.json()).fonts ?? [];
		}
		async function listAssets() {
			const r = await fetch(`${API_BASE}/api/assets`);
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return (await r.json()).assets ?? [];
		}
		async function uploadAsset(file) {
			const r = await fetch(`${API_BASE}/api/assets?name=${encodeURIComponent(file.name)}`, {
				method: "POST",
				headers: { "Content-Type": "application/octet-stream" },
				body: file
			});
			const d = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
			return d;
		}
		async function deleteAsset(name) {
			const r = await fetch(`${API_BASE}/api/assets/${encodeURIComponent(name)}`, { method: "DELETE" });
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
		}
		const assetThumbUrl = (name) => `${API_BASE}/api/assets/${encodeURIComponent(name)}/thumb`;
		//#endregion
		//#region src/client/useHistory.ts
		function useHistory(timeline, mutate) {
			const undoStack = (0, react.useRef)([]);
			const redoStack = (0, react.useRef)([]);
			const [, force] = (0, react.useState)(0);
			return {
				commit: (0, react.useCallback)((fn) => {
					if (!timeline) return;
					undoStack.current.push(timeline);
					if (undoStack.current.length > 50) undoStack.current.shift();
					redoStack.current = [];
					mutate(fn);
					force((x) => x + 1);
				}, [timeline, mutate]),
				undo: (0, react.useCallback)(() => {
					const prev = undoStack.current.pop();
					if (!prev || !timeline) return;
					redoStack.current.push(timeline);
					mutate(() => prev);
					force((x) => x + 1);
				}, [timeline, mutate]),
				redo: (0, react.useCallback)(() => {
					const next = redoStack.current.pop();
					if (!next || !timeline) return;
					undoStack.current.push(timeline);
					mutate(() => next);
					force((x) => x + 1);
				}, [timeline, mutate]),
				clear: (0, react.useCallback)(() => {
					undoStack.current = [];
					redoStack.current = [];
					force((x) => x + 1);
				}, []),
				snapshot: (0, react.useCallback)(() => {
					if (!timeline) return;
					undoStack.current.push(timeline);
					if (undoStack.current.length > 50) undoStack.current.shift();
					redoStack.current = [];
					force((x) => x + 1);
				}, [timeline]),
				canUndo: undoStack.current.length > 0,
				canRedo: redoStack.current.length > 0
			};
		}
		//#endregion
		//#region src/client/ProjectBar.tsx
		const ProjectBar = ({ sessionId }) => {
			const [project, setProject] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!sessionId) return;
				let stop = false;
				sessionProject(sessionId).then((p) => {
					if (!stop) setProject(p);
				}).catch(() => {});
				return () => {
					stop = true;
				};
			}, [sessionId]);
			if (!project) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "djp-projbar",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "djp-proj-icon",
						"aria-hidden": true,
						children: "▣"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "djp-proj-name",
						title: project.id,
						children: project.name
					}),
					project.meta && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "djp-proj-badge",
						children: [
							project.meta.width,
							"×",
							project.meta.height,
							" · ",
							project.meta.fps,
							"fps"
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "djp-proj-tag",
						children: "本会话项目"
					})
				]
			});
		};
		//#endregion
		//#region src/client/CanvasDialog.tsx
		const CANVAS_PRESETS = [
			{
				key: "1080p",
				label: "1080p 横屏",
				meta: {
					width: 1920,
					height: 1080,
					fps: 30
				}
			},
			{
				key: "720p",
				label: "720p 横屏",
				meta: {
					width: 1280,
					height: 720,
					fps: 30
				}
			},
			{
				key: "vertical",
				label: "竖屏 9:16",
				meta: {
					width: 1080,
					height: 1920,
					fps: 30
				}
			},
			{
				key: "square",
				label: "方形 1:1",
				meta: {
					width: 1080,
					height: 1080,
					fps: 30
				}
			},
			{
				key: "4k",
				label: "4K 横屏",
				meta: {
					width: 3840,
					height: 2160,
					fps: 30
				}
			}
		];
		const CanvasDialog = ({ t, onApply, onClose }) => {
			const [width, setWidth] = (0, react.useState)(t.meta.width);
			const [height, setHeight] = (0, react.useState)(t.meta.height);
			const [fps, setFps] = (0, react.useState)(t.meta.fps);
			const applyPreset = (key) => {
				const p = CANVAS_PRESETS.find((x) => x.key === key);
				if (!p) return;
				setWidth(p.meta.width);
				setHeight(p.meta.height);
				setFps(p.meta.fps);
			};
			const valid = Number.isFinite(width) && Number.isFinite(height) && Number.isFinite(fps) && width >= 16 && height >= 16 && fps >= 1 && fps <= 120;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "djp-mask",
				onClick: onClose,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "djp-dialog",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-dialog-title",
							children: "画布设置"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-preset-grid",
							children: CANVAS_PRESETS.map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								className: `djp-preset ${width === p.meta.width && height === p.meta.height && fps === p.meta.fps ? "djp-on" : ""}`,
								onClick: () => applyPreset(p.key),
								children: [p.label, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
									p.meta.width,
									"×",
									p.meta.height,
									"@",
									p.meta.fps
								] })]
							}, p.key))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "djp-fields",
							style: { marginTop: 10 },
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "djp-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "宽" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										value: width,
										min: 16,
										step: 2,
										onChange: (e) => setWidth(Number(e.target.value))
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "djp-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "高" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										value: height,
										min: 16,
										step: 2,
										onChange: (e) => setHeight(Number(e.target.value))
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "djp-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "fps" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										value: fps,
										min: 1,
										max: 120,
										onChange: (e) => setFps(Number(e.target.value))
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "djp-dialog-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-btn",
								onClick: onClose,
								children: "取消"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-export",
								disabled: !valid,
								onClick: () => {
									onApply({
										width,
										height,
										fps
									});
									onClose();
								},
								children: "应用"
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-hint",
							style: { marginTop: 8 },
							children: "只影响之后：改画布不会改动已有片段内容；宽高会被对齐到偶数。"
						})
					]
				})
			});
		};
		//#endregion
		//#region src/client/AssetsSection.tsx
		const fmtSize$1 = (n) => n >= 1048576 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`;
		const fmtDur = (d) => d == null ? "" : `${d.toFixed(1)}s`;
		const AssetsSection = ({ onAddClip, onSetBgm }) => {
			const [assets, setAssets] = (0, react.useState)([]);
			const [collapsed, setCollapsed] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const fileRef = (0, react.useRef)(null);
			const refresh = async () => {
				try {
					setAssets(await listAssets());
					setError("");
				} catch {}
			};
			(0, react.useEffect)(() => {
				refresh();
				const timer = window.setInterval(() => void refresh(), 5e3);
				return () => window.clearInterval(timer);
			}, []);
			const onFiles = async (files) => {
				if (!files?.length || busy) return;
				setBusy(true);
				setError("");
				try {
					for (const f of Array.from(files)) await uploadAsset(f);
					await refresh();
				} catch (e) {
					setError(e instanceof Error ? e.message : String(e));
				} finally {
					setBusy(false);
					if (fileRef.current) fileRef.current.value = "";
				}
			};
			const onDelete = async (name) => {
				if (!window.confirm(`删除素材「${name}」？时间线里引用它的片段会失效。`)) return;
				try {
					await deleteAsset(name);
					await refresh();
				} catch (e) {
					setError(e instanceof Error ? e.message : String(e));
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "djp-section",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djp-section-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: {
								cursor: "pointer",
								userSelect: "none"
							},
							onClick: () => setCollapsed((v) => !v),
							title: collapsed ? "展开" : "收起",
							children: [
								collapsed ? "▸" : "▾",
								" 素材库（",
								assets.length,
								"）"
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: {
								display: "flex",
								gap: 6
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								multiple: true,
								accept: "video/*,image/*,audio/*",
								style: { display: "none" },
								onChange: (e) => void onFiles(e.target.files)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-btn",
								disabled: busy,
								onClick: () => fileRef.current?.click(),
								title: "上传视频/图片/音频到当前项目素材文件夹",
								children: busy ? "上传中…" : "上传"
							})]
						})]
					}),
					error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djp-hint",
						style: { color: "var(--dsw-alias-state-error-primary)" },
						children: error
					}),
					!collapsed && (assets.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djp-hint",
						children: "空素材库——点「上传」把素材放进当前项目"
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djp-assets",
						children: assets.map((a) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "djp-asset",
							title: `${a.name} · ${fmtSize$1(a.size)}${a.duration ? ` · ${fmtDur(a.duration)}` : ""}`,
							children: [
								a.thumb ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									className: "djp-asset-thumb",
									src: assetThumbUrl(a.name),
									alt: a.name,
									loading: "lazy"
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "djp-asset-thumb djp-asset-audio",
									children: "♪"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "djp-asset-name",
									children: a.name
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "djp-asset-acts",
									children: [a.type !== "audio" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										title: "加为片段",
										onClick: () => onAddClip(a),
										children: "＋片段"
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										title: "设为配乐",
										onClick: () => onSetBgm(a.name),
										children: "♪配乐"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										title: "删除素材",
										onClick: () => void onDelete(a.name),
										children: "✕"
									})]
								})
							]
						}, a.name))
					}))
				]
			});
		};
		//#endregion
		//#region src/client/ExportControl.tsx
		const fmtSize = (n) => n >= 1048576 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
		const ExportControl = ({ t }) => {
			const [exp, setExp] = (0, react.useState)({ phase: "idle" });
			const [open, setOpen] = (0, react.useState)(false);
			const [scale, setScale] = (0, react.useState)(1);
			const [quality, setQuality] = (0, react.useState)("standard");
			const pollRef = (0, react.useRef)(null);
			const stopPolling = () => {
				if (pollRef.current !== null) {
					window.clearInterval(pollRef.current);
					pollRef.current = null;
				}
			};
			(0, react.useEffect)(() => stopPolling, []);
			const start = async () => {
				setOpen(false);
				setExp({
					phase: "rendering",
					percent: 0
				});
				try {
					await startExportWith(t, {
						scale,
						quality
					});
					stopPolling();
					pollRef.current = window.setInterval(async () => {
						try {
							const s = await getExportStatus();
							if (s.status === "rendering") setExp({
								phase: "rendering",
								percent: s.progress?.percent ?? 0
							});
							else if (s.status === "done") {
								stopPolling();
								setExp({
									phase: "done",
									fileName: s.result.fileName,
									sizeBytes: s.result.sizeBytes
								});
							} else if (s.status === "error") {
								stopPolling();
								setExp({
									phase: "error",
									message: s.error ?? "渲染失败"
								});
							}
						} catch {}
					}, 1e3);
				} catch (e) {
					setExp({
						phase: "error",
						message: e instanceof Error ? e.message : String(e)
					});
				}
			};
			if (exp.phase === "rendering") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				className: "djp-export",
				disabled: true,
				children: [
					"导出中 ",
					exp.percent,
					"%"
				]
			});
			if (exp.phase === "done") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
				className: "djp-export",
				href: exportDownloadUrl,
				download: exp.fileName,
				title: `${exp.fileName} · ${fmtSize(exp.sizeBytes)}`,
				onClick: () => window.setTimeout(() => setExp({ phase: "idle" }), 4e3),
				children: "下载 mp4"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "djp-expwrap",
				children: [
					exp.phase === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "djp-export djp-error",
						onClick: () => setOpen(true),
						title: exp.message,
						children: "失败重试"
					}),
					exp.phase !== "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "djp-export",
						onClick: () => setOpen((v) => !v),
						children: "导出"
					}),
					open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djp-pop djp-exppop",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "djp-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "分辨率" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									className: "djp-select",
									value: scale,
									onChange: (e) => setScale(Number(e.target.value)),
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
											value: 1,
											children: [
												"原始（",
												t.meta.width,
												"×",
												t.meta.height,
												"）"
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
											value: .5,
											children: [
												"50%（",
												Math.round(t.meta.width * .5 / 2) * 2,
												"×",
												Math.round(t.meta.height * .5 / 2) * 2,
												"）"
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
											value: 2,
											children: [
												"200%（",
												t.meta.width * 2,
												"×",
												t.meta.height * 2,
												"）"
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "djp-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "质量" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									className: "djp-select",
									value: quality,
									onChange: (e) => setQuality(e.target.value),
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "draft",
											children: "草稿（快、小）"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "standard",
											children: "标准"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "high",
											children: "高（慢、大）"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-export",
								style: { alignSelf: "flex-end" },
								onClick: () => void start(),
								children: "开始导出"
							})
						]
					})
				]
			});
		};
		//#endregion
		//#region src/client/HistoryDialog.tsx
		const HistoryDialog = ({ onClose, onRestored }) => {
			const [snaps, setSnaps] = (0, react.useState)([]);
			const [busy, setBusy] = (0, react.useState)(null);
			const [err, setErr] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				fetch(`${API_BASE}/api/history`).then((r) => r.json()).then((d) => setSnaps(d.snapshots ?? [])).catch(() => setErr("历史列表加载失败"));
			}, []);
			const restore = async (id) => {
				setBusy(id);
				setErr("");
				try {
					const r = await fetch(`${API_BASE}/api/history/${encodeURIComponent(id)}`, { method: "POST" });
					const d = await r.json().catch(() => ({}));
					if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
					onRestored();
					onClose();
				} catch (e) {
					setErr(e instanceof Error ? e.message : String(e));
				} finally {
					setBusy(null);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "djp-mask",
				onClick: onClose,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "djp-dialog",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-dialog-title",
							children: "版本历史"
						}),
						err && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-error",
							children: err
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "djp-hist-list",
							children: [snaps.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "djp-hint",
								children: "还没有快照——AI 每次修改时间线都会自动存档。"
							}), snaps.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "djp-hist-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "djp-hist-meta",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "djp-hist-time",
										children: new Date(s.at).toLocaleTimeString()
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "djp-hist-label",
										title: s.label,
										children: s.label || "(无标注)"
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "djp-btn",
									disabled: busy !== null,
									onClick: () => restore(s.id),
									children: busy === s.id ? "恢复中…" : "恢复"
								})]
							}, s.id))]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-dialog-actions",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-btn",
								onClick: onClose,
								children: "关闭"
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-hint",
							style: { marginTop: 8 },
							children: "最多保留 40 份；恢复前当前状态也会自动存一份，可来回切换。"
						})
					]
				})
			});
		};
		//#endregion
		//#region src/client/Panel.tsx
		const fmtSec = (s) => `${s.toFixed(1)}s`;
		function useTimelineSync(sessionId, rootRef) {
			const [timeline, setTimeline] = (0, react.useState)(null);
			const serverJson = (0, react.useRef)("");
			const dirty = (0, react.useRef)(false);
			const pushTimer = (0, react.useRef)(null);
			const pendingPush = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				let stop = false;
				let timer = 0;
				const isVisible = () => {
					if (typeof document !== "undefined" && document.hidden) return false;
					const el = rootRef?.current;
					if (el && el.offsetParent === null && el.getClientRects().length === 0) return false;
					return true;
				};
				const tick = async () => {
					if (!dirty.current) try {
						const t = await getTimeline(sessionId, !isVisible());
						const j = JSON.stringify(t);
						if (!stop && j !== serverJson.current) {
							serverJson.current = j;
							setTimeline(t);
						}
					} catch {}
					if (!stop) timer = window.setTimeout(tick, 2e3);
				};
				tick();
				const onVis = () => {
					if (!document.hidden) tick();
				};
				document.addEventListener("visibilitychange", onVis);
				return () => {
					stop = true;
					window.clearTimeout(timer);
					document.removeEventListener("visibilitychange", onVis);
				};
			}, [sessionId]);
			return {
				timeline,
				mutate: (0, react.useCallback)((fn) => {
					setTimeline((cur) => {
						if (!cur) return cur;
						const next = fn(cur);
						dirty.current = true;
						pendingPush.current = next;
						if (pushTimer.current) window.clearTimeout(pushTimer.current);
						pushTimer.current = window.setTimeout(() => {
							const t = pendingPush.current;
							if (!t) return;
							putTimeline(t, sessionId).then(() => {
								serverJson.current = JSON.stringify(t);
							}).catch(() => {}).finally(() => {
								dirty.current = false;
							});
						}, 600);
						return next;
					});
				}, [sessionId]),
				reload: (0, react.useCallback)(async () => {
					try {
						const t = await getTimeline(sessionId);
						serverJson.current = JSON.stringify(t);
						dirty.current = false;
						setTimeline(t);
					} catch {}
				}, [sessionId])
			};
		}
		const clipId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
		const ops = (mutate) => ({
			addClip: () => mutate((t) => ({
				...t,
				videoTracks: t.videoTracks.map((tr, i) => i === 0 ? {
					...tr,
					clips: [...tr.clips, {
						id: clipId(),
						type: "video",
						src: tr.clips[tr.clips.length - 1]?.src ?? "a.mp4",
						inPoint: 0,
						clipDuration: 3,
						transition: "none",
						volume: 1
					}]
				} : tr)
			})),
			addPip: () => mutate((t) => {
				const src = t.videoTracks[0]?.clips[t.videoTracks[0].clips.length - 1]?.src ?? "a.mp4";
				const clip = {
					id: clipId(),
					type: "video",
					src,
					inPoint: 0,
					clipDuration: 3,
					transition: "none",
					volume: 1,
					atSeconds: 0
				};
				if (t.videoTracks[1]) return {
					...t,
					videoTracks: t.videoTracks.map((tr, i) => i === 1 ? {
						...tr,
						clips: [...tr.clips, clip]
					} : tr)
				};
				return {
					...t,
					videoTracks: [...t.videoTracks, {
						id: "v2",
						name: "画中画",
						clips: [clip]
					}]
				};
			}),
			addAudio: (src, duration = 10) => mutate((t) => {
				const clip = {
					id: clipId(),
					src,
					inPoint: 0,
					duration,
					volume: 1,
					atSeconds: 0
				};
				if (t.audioTracks[0]) return {
					...t,
					audioTracks: t.audioTracks.map((tr, i) => i === 0 ? {
						...tr,
						clips: [...tr.clips, clip]
					} : tr)
				};
				return {
					...t,
					audioTracks: [{
						id: "a1",
						name: "音频",
						volume: 1,
						muted: false,
						clips: [clip]
					}]
				};
			}),
			removeClip: (id) => mutate((t) => ({
				...t,
				videoTracks: t.videoTracks.map((tr) => ({
					...tr,
					clips: tr.clips.filter((c) => c.id !== id)
				})).filter((tr, i) => i === 0 || tr.clips.length > 0)
			})),
			removeAudioClip: (id) => mutate((t) => ({
				...t,
				audioTracks: t.audioTracks.map((tr) => ({
					...tr,
					clips: tr.clips.filter((c) => c.id !== id)
				})).filter((tr) => tr.clips.length > 0)
			})),
			updateClip: (id, patch) => mutate((t) => ({
				...t,
				videoTracks: t.videoTracks.map((tr) => ({
					...tr,
					clips: tr.clips.map((c) => c.id === id ? {
						...c,
						...patch
					} : c)
				}))
			})),
			updateAudioTrack: (id, patch) => mutate((t) => ({
				...t,
				audioTracks: t.audioTracks.map((tr) => tr.id === id ? {
					...tr,
					...patch
				} : tr)
			})),
			updateAudioClip: (id, patch) => mutate((t) => ({
				...t,
				audioTracks: t.audioTracks.map((tr) => ({
					...tr,
					clips: tr.clips.map((c) => c.id === id ? {
						...c,
						...patch
					} : c)
				}))
			})),
			splitClip: (id, atSeconds) => mutate((t) => {
				for (let ti = 0; ti < t.videoTracks.length; ti++) {
					const tr = t.videoTracks[ti];
					const idx = tr.clips.findIndex((c) => c.id === id);
					if (idx === -1) continue;
					const clip = tr.clips[idx];
					let start = 0;
					if (ti === 0) for (let i = 0; i < idx; i++) start += tr.clips[i].clipDuration;
					else start = clip.atSeconds ?? 0;
					const off = atSeconds - start;
					if (!(off > .05) || off >= clip.clipDuration - .05) return t;
					const left = {
						...clip,
						clipDuration: off
					};
					const right = {
						...clip,
						id: clipId(),
						inPoint: clip.inPoint + off,
						clipDuration: clip.clipDuration - off
					};
					if (clip.atSeconds !== void 0) right.atSeconds = clip.atSeconds + off;
					const clips = [...tr.clips];
					clips.splice(idx, 1, left, right);
					return {
						...t,
						videoTracks: t.videoTracks.map((x, i) => i === ti ? {
							...x,
							clips
						} : x)
					};
				}
				for (let ti = 0; ti < t.audioTracks.length; ti++) {
					const tr = t.audioTracks[ti];
					const idx = tr.clips.findIndex((c) => c.id === id);
					if (idx === -1) continue;
					const clip = tr.clips[idx];
					const off = atSeconds - clip.atSeconds;
					if (!(off > .05) || off >= clip.duration - .05) return t;
					const left = {
						...clip,
						duration: off
					};
					const right = {
						...clip,
						id: clipId(),
						inPoint: clip.inPoint + off,
						duration: clip.duration - off,
						atSeconds: clip.atSeconds + off
					};
					const clips = [...tr.clips];
					clips.splice(idx, 1, left, right);
					return {
						...t,
						audioTracks: t.audioTracks.map((x, i) => i === ti ? {
							...x,
							clips
						} : x)
					};
				}
				return t;
			}),
			reorderClips: (order) => mutate((t) => {
				const tr0 = t.videoTracks[0];
				const map = new Map(tr0.clips.map((c) => [c.id, c]));
				const next = order.map((id) => map.get(id)).filter((c) => Boolean(c));
				const main = {
					...tr0,
					clips: [...next, ...tr0.clips.filter((c) => !order.includes(c.id))]
				};
				return {
					...t,
					videoTracks: [main, ...t.videoTracks.slice(1)]
				};
			}),
			addOverlay: () => mutate((t) => ({
				...t,
				overlays: [...t.overlays, {
					text: "新字幕",
					startSeconds: 0,
					endSeconds: 3,
					position: "bottom",
					fontSize: 48,
					color: "#ffffff"
				}]
			})),
			removeOverlay: (index) => mutate((t) => ({
				...t,
				overlays: t.overlays.filter((_, i) => i !== index)
			})),
			updateOverlay: (index, patch) => mutate((t) => ({
				...t,
				overlays: t.overlays.map((o, i) => i === index ? {
					...o,
					...patch
				} : o)
			}))
		});
		const NumberField = ({ label, value, step = .5, min = 0, onCommit }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
			className: "djp-field",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				type: "number",
				defaultValue: value,
				step,
				min,
				onBlur: (e) => {
					const v = Number(e.target.value);
					if (Number.isFinite(v) && v >= min && v !== value) onCommit(v);
				},
				onKeyDown: (e) => {
					if (e.key === "Enter") e.target.blur();
				}
			}, value)]
		});
		const FILTER_PRESETS = [
			{
				label: "提亮",
				filter: { brightness: 1.15 }
			},
			{
				label: "黑白",
				filter: { grayscale: 1 }
			},
			{
				label: "复古",
				filter: { sepia: .6 }
			},
			{
				label: "暖调",
				filter: {
					sepia: .3,
					saturate: 1.2
				}
			},
			{
				label: "冷调",
				filter: {
					hueRotate: 200,
					saturate: 1.1
				}
			},
			{
				label: "高饱和",
				filter: { saturate: 1.6 }
			},
			{
				label: "高对比",
				filter: { contrast: 1.3 }
			},
			{
				label: "柔焦",
				filter: { blur: 4 }
			}
		];
		const ANIM_GROUPS = [
			"入场",
			"出场",
			"组合",
			"循环"
		];
		const AnimSelect = ({ duration, anims, onCommit }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
			className: "djp-select",
			value: "",
			title: anims ? "动画（已生效，可换或清除）" : "动画",
			onChange: (e) => {
				const key = e.target.value;
				if (key === "__clear") {
					onCommit({});
					return;
				}
				const expanded = expandAnimationPreset(key, duration ?? 1);
				if (expanded) onCommit(expanded);
				e.target.value = "";
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
					value: "",
					children: "✨ 动画…"
				}),
				anims && Object.keys(anims).length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
					value: "__clear",
					children: "✕ 清除动画"
				}),
				ANIM_GROUPS.map((g) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("optgroup", {
					label: g,
					children: Object.entries(ANIMATION_PRESETS).filter(([, p]) => p.group === g).map(([key, p]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: key,
						children: p.label
					}, key))
				}, g))
			]
		});
		const FilterSelect = ({ value, onCommit }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
			className: "djp-select",
			value: value ? JSON.stringify(value) : "",
			onChange: (e) => {
				const v = e.target.value;
				if (!v) {
					onCommit(void 0);
					return;
				}
				const p = FILTER_PRESETS.find((x) => JSON.stringify(x.filter) === v);
				if (p) onCommit(p.filter);
			},
			title: "滤镜",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
				value: "",
				children: "无滤镜"
			}), FILTER_PRESETS.map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
				value: JSON.stringify(p.filter),
				children: p.label
			}, p.label))]
		});
		const playheadEls = /* @__PURE__ */ new Set();
		const Playhead = () => {
			const ref = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const el = ref.current;
				if (!el) return;
				playheadEls.add(el);
				return () => {
					playheadEls.delete(el);
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref,
				className: "djp-playhead",
				style: { left: "0%" }
			});
		};
		const rulerTicks = (total) => {
			const step = total > 30 ? 5 : total > 12 ? 2 : 1;
			const out = [];
			for (let s = 0; s <= total; s += step) out.push(Math.round(s * 100) / 100);
			return out;
		};
		const TrackStrip = ({ t, o, playheadRef, onSeekClip }) => {
			const total = Math.max(.1, timelineDurationInFrames(t) / t.meta.fps);
			const dragRef = (0, react.useRef)(null);
			const justDragged = (0, react.useRef)(false);
			const [, forceRender] = (0, react.useState)(0);
			const ctxRef = (0, react.useRef)({
				t,
				o,
				total
			});
			ctxRef.current = {
				t,
				o,
				total
			};
			(0, react.useEffect)(() => {
				let raf = 0;
				const tick = () => {
					const p = playerBus.ref;
					if (p) {
						const sec = p.getCurrentFrame() / ctxRef.current.t.meta.fps;
						playheadRef.current = sec;
						const tt = ctxRef.current.total;
						const left = `${Math.min(sec, tt) / tt * 100}%`;
						for (const el of playheadEls) el.style.left = left;
					}
					raf = requestAnimationFrame(tick);
				};
				raf = requestAnimationFrame(tick);
				return () => cancelAnimationFrame(raf);
			}, [playheadRef]);
			(0, react.useEffect)(() => {
				const snapV = (cur, v) => {
					const SNAP = .12;
					const tt = ctxRef.current.t;
					const pts = [0, playheadRef.current];
					if (cur.lane === "main") {
						let a = 0;
						for (const c of tt.videoTracks[0]?.clips ?? []) {
							if (c.id !== cur.id) pts.push(a, a + c.clipDuration);
							a += c.clipDuration;
						}
					} else if (cur.lane === "pip") {
						for (const tr of tt.videoTracks.slice(1)) for (const c of tr.clips) if (c.id !== cur.id) pts.push(c.atSeconds ?? 0, (c.atSeconds ?? 0) + c.clipDuration);
					} else for (const tr of tt.audioTracks) for (const c of tr.clips) if (c.id !== cur.id) pts.push(c.atSeconds, c.atSeconds + c.duration);
					let best = v;
					let bd = SNAP;
					for (const p of pts) {
						const dd = Math.abs(p - v);
						if (dd < bd) {
							bd = dd;
							best = p;
						}
					}
					return Math.round(best * 100) / 100;
				};
				const onMove = (e) => {
					const cur = dragRef.current;
					if (!cur) return;
					const dsec = (e.clientX - cur.startX) * cur.secPerPx;
					if (cur.kind === "move") cur.previewAt = Math.max(0, snapV(cur, cur.origAt + dsec));
					else if (cur.kind === "trimL") {
						let at = snapV(cur, cur.origAt + dsec);
						at = Math.min(Math.max(0, at), cur.origAt + cur.origDur - .1);
						cur.previewAt = at;
						cur.previewDur = cur.origDur - (at - cur.origAt);
					} else cur.previewDur = Math.max(cur.origAt + .1, snapV(cur, cur.origAt + cur.origDur + dsec)) - cur.origAt;
					forceRender((x) => x + 1);
				};
				const onUp = () => {
					const cur = dragRef.current;
					dragRef.current = null;
					if (cur) {
						if (Math.abs(cur.previewAt - cur.origAt) > .001 || Math.abs(cur.previewDur - cur.origDur) > .001) {
							justDragged.current = true;
							window.setTimeout(() => {
								justDragged.current = false;
							}, 0);
						}
						const { o: oo } = ctxRef.current;
						const at = cur.previewAt;
						const dur = Math.max(.1, cur.previewDur);
						if (cur.kind === "move") {
							if (cur.lane === "pip") oo.updateClip(cur.id, { atSeconds: at });
							else oo.updateAudioClip(cur.id, { atSeconds: at });
						} else if (cur.lane === "main") {
							const patch = { clipDuration: dur };
							if (cur.kind === "trimL" && cur.origIn !== void 0) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt));
							oo.updateClip(cur.id, patch);
						} else if (cur.lane === "pip") {
							const patch = { clipDuration: dur };
							if (cur.kind === "trimL") {
								patch.atSeconds = at;
								if (cur.origIn !== void 0) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt));
							}
							oo.updateClip(cur.id, patch);
						} else {
							const patch = { duration: dur };
							if (cur.kind === "trimL") {
								patch.atSeconds = at;
								if (cur.origIn !== void 0) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt));
							}
							oo.updateAudioClip(cur.id, patch);
						}
					}
					forceRender((x) => x + 1);
				};
				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp);
				window.addEventListener("pointercancel", onUp);
				return () => {
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
					window.removeEventListener("pointercancel", onUp);
				};
			}, [playheadRef]);
			const beginDrag = (e, init) => {
				e.stopPropagation();
				e.preventDefault();
				const laneEl = e.currentTarget.closest(".djp-trow-lane");
				if (!laneEl) return;
				const rect = laneEl.getBoundingClientRect();
				dragRef.current = {
					...init,
					startX: e.clientX,
					secPerPx: total / Math.max(1, rect.width),
					previewAt: init.origAt,
					previewDur: init.origDur
				};
				forceRender((x) => x + 1);
			};
			const onSeek = (e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
				seekToSeconds(frac * total, t.meta.fps);
			};
			const drag = dragRef.current;
			const pct = (v) => `${Math.max(0, v) / total * 100}%`;
			const main = t.videoTracks[0];
			const overlays = t.videoTracks.slice(1);
			const Row = ({ name, children }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "djp-trow",
				onClick: onSeek,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "djp-trow-name",
					children: name
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "djp-track djp-trow-lane",
					children: [children, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Playhead, {})]
				})]
			});
			let acc = 0;
			const mainBlocks = (main?.clips ?? []).map((c) => {
				const isD = drag?.lane === "main" && drag.id === c.id;
				const dur = drag && isD ? Math.max(.1, drag.previewDur) : c.clipDuration;
				const start = acc;
				acc += dur;
				return {
					clip: c,
					start,
					dur,
					isD
				};
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "djp-tstrip",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djp-trow",
						onClick: onSeek,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "djp-trow-name" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "djp-ruler",
							children: [rulerTicks(total).map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "djp-tick",
								style: { left: pct(s) },
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: fmtSec(s) })
							}, s)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Playhead, {})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Row, {
						name: "视频",
						children: [mainBlocks.map(({ clip, start, dur, isD }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: `djp-track-block ${clip.transition === "fade" ? "djp-fade" : ""} ${isD ? "djp-dragging" : ""}`,
							style: drag && isD ? {
								position: "absolute",
								left: pct(start),
								width: pct(dur)
							} : { width: pct(dur) },
							title: `${clip.src} · ${fmtSec(start)}–${fmtSec(start + dur)}`,
							onClick: (e) => {
								e.stopPropagation();
								if (justDragged.current) return;
								onSeekClip(start, "main");
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "djp-track-label",
									children: clip.src
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "djp-handle djp-hl",
									title: "裁剪头部",
									onPointerDown: (e) => beginDrag(e, {
										kind: "trimL",
										lane: "main",
										id: clip.id,
										origAt: start,
										origDur: clip.clipDuration,
										origIn: clip.inPoint
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "djp-handle djp-hr",
									title: "裁剪尾部",
									onPointerDown: (e) => beginDrag(e, {
										kind: "trimR",
										lane: "main",
										id: clip.id,
										origAt: start,
										origDur: clip.clipDuration,
										origIn: clip.inPoint
									})
								})
							]
						}, clip.id)), (main?.clips.length ?? 0) === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "djp-trow-empty",
							children: "空"
						})]
					}),
					overlays.map((tr) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Row, {
						name: tr.name ?? "画中画",
						children: tr.clips.map((c) => {
							const isD = drag?.lane === "pip" && drag.id === c.id;
							const at = drag && isD ? drag.previewAt : c.atSeconds ?? 0;
							const dur = drag && isD ? drag.previewDur : c.clipDuration;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: `djp-track-block djp-pip-block ${isD ? "djp-dragging" : ""}`,
								style: {
									position: "absolute",
									left: pct(at),
									width: pct(dur)
								},
								title: `${c.src} · ${fmtSec(at)}–${fmtSec(at + dur)}`,
								onPointerDown: (e) => beginDrag(e, {
									kind: "move",
									lane: "pip",
									id: c.id,
									origAt: c.atSeconds ?? 0,
									origDur: c.clipDuration,
									origIn: c.inPoint
								}),
								onClick: (e) => {
									e.stopPropagation();
									if (justDragged.current) return;
									onSeekClip(c.atSeconds ?? 0, "pip");
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "djp-track-label",
										children: c.src
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-handle djp-hl",
										title: "裁剪头部",
										onPointerDown: (e) => beginDrag(e, {
											kind: "trimL",
											lane: "pip",
											id: c.id,
											origAt: c.atSeconds ?? 0,
											origDur: c.clipDuration,
											origIn: c.inPoint
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-handle djp-hr",
										title: "裁剪尾部",
										onPointerDown: (e) => beginDrag(e, {
											kind: "trimR",
											lane: "pip",
											id: c.id,
											origAt: c.atSeconds ?? 0,
											origDur: c.clipDuration,
											origIn: c.inPoint
										})
									})
								]
							}, c.id);
						})
					}, tr.id)),
					t.audioTracks.map((tr) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Row, {
						name: `♪ ${tr.name ?? "音频"}`,
						children: tr.clips.map((c) => {
							const isD = drag?.lane === "audio" && drag.id === c.id;
							const at = drag && isD ? drag.previewAt : c.atSeconds;
							const dur = drag && isD ? drag.previewDur : c.duration;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: `djp-track-block djp-audio-block ${isD ? "djp-dragging" : ""}`,
								style: {
									position: "absolute",
									left: pct(at),
									width: pct(dur)
								},
								title: `${c.src} · ${fmtSec(at)}–${fmtSec(at + dur)}`,
								onPointerDown: (e) => beginDrag(e, {
									kind: "move",
									lane: "audio",
									id: c.id,
									origAt: c.atSeconds,
									origDur: c.duration,
									origIn: c.inPoint
								}),
								onClick: (e) => {
									e.stopPropagation();
									if (justDragged.current) return;
									onSeekClip(c.atSeconds, "audio");
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "djp-track-label",
										children: ["♪ ", c.src]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-handle djp-hl",
										title: "裁剪头部",
										onPointerDown: (e) => beginDrag(e, {
											kind: "trimL",
											lane: "audio",
											id: c.id,
											origAt: c.atSeconds,
											origDur: c.duration,
											origIn: c.inPoint
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-handle djp-hr",
										title: "裁剪尾部",
										onPointerDown: (e) => beginDrag(e, {
											kind: "trimR",
											lane: "audio",
											id: c.id,
											origAt: c.atSeconds,
											origDur: c.duration,
											origIn: c.inPoint
										})
									})
								]
							}, c.id);
						})
					}, tr.id))
				]
			});
		};
		const Panel = ({ sessionId }) => {
			const rootRef = (0, react.useRef)(null);
			const { timeline, mutate, reload } = useTimelineSync(sessionId, rootRef);
			const hist = useHistory(timeline, mutate);
			const prevSession = (0, react.useRef)(sessionId);
			(0, react.useEffect)(() => {
				if (sessionId !== prevSession.current) {
					prevSession.current = sessionId;
					hist.clear();
					reload();
				}
			}, [sessionId]);
			const o = ops(hist.commit);
			const [canvasOpen, setCanvasOpen] = (0, react.useState)(false);
			const [histOpen, setHistOpen] = (0, react.useState)(false);
			const [tab, setTab] = (0, react.useState)("clips");
			const [fonts, setFonts] = (0, react.useState)([]);
			const audioFileRef = (0, react.useRef)(null);
			const playheadRef = (0, react.useRef)(0);
			(0, react.useEffect)(() => {
				let stop = false;
				listFonts().then((f) => {
					if (!stop) setFonts(f);
				}).catch(() => {});
				return () => {
					stop = true;
				};
			}, []);
			const splitRef = (0, react.useRef)(() => {});
			(0, react.useEffect)(() => {
				const onKey = (e) => {
					const el = e.target;
					if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
					if (e.ctrlKey || e.metaKey) {
						const k = e.key.toLowerCase();
						if (k === "z" && !e.shiftKey) {
							e.preventDefault();
							hist.undo();
						} else if (k === "z" && e.shiftKey || k === "y") {
							e.preventDefault();
							hist.redo();
						}
						return;
					}
					if (e.key === " ") {
						e.preventDefault();
						playerBus.ref?.toggle();
					} else if (e.key === "s" || e.key === "S") {
						e.preventDefault();
						splitRef.current();
					} else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
						e.preventDefault();
						const dir = e.key === "ArrowLeft" ? -1 : 1;
						seekToSeconds(Math.max(0, playheadRef.current + dir * (e.shiftKey ? .1 : 1)), timeline?.meta.fps ?? 30);
					}
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [
				hist.undo,
				hist.redo,
				timeline?.meta.fps
			]);
			if (!timeline) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "djp-root",
				ref: rootRef,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "djp-empty",
					children: "连接剪辑引擎中…（5180）"
				})
			});
			const t = timeline;
			const durationInFrames = Math.max(1, timelineDurationInFrames(t));
			const totalSec = durationInFrames / t.meta.fps;
			const mainClips = t.videoTracks[0]?.clips ?? [];
			const pipClips = t.videoTracks.slice(1).flatMap((tr) => tr.clips);
			const audioClips = t.audioTracks.flatMap((tr) => tr.clips);
			const hasContent = mainClips.length + pipClips.length + audioClips.length > 0;
			const BOX_PRESETS = [
				{
					label: "右下",
					box: {
						x: .66,
						y: .66,
						w: .3,
						h: .3
					}
				},
				{
					label: "左下",
					box: {
						x: .03,
						y: .66,
						w: .3,
						h: .3
					}
				},
				{
					label: "右上",
					box: {
						x: .66,
						y: .04,
						w: .3,
						h: .3
					}
				},
				{
					label: "左上",
					box: {
						x: .03,
						y: .04,
						w: .3,
						h: .3
					}
				},
				{
					label: "居中",
					box: {
						x: .35,
						y: .35,
						w: .3,
						h: .3
					}
				},
				{
					label: "全屏",
					box: {
						x: 0,
						y: 0,
						w: 1,
						h: 1
					}
				}
			];
			const splitMainAtPlayhead = () => {
				const at = Math.round(playheadRef.current * 100) / 100;
				for (const tr0 of [t.videoTracks[0]]) {
					if (!tr0) return;
					let acc = 0;
					for (const c of tr0.clips) {
						if (at > acc + .05 && at < acc + c.clipDuration - .05) {
							o.splitClip(c.id, at);
							return;
						}
						acc += c.clipDuration;
					}
				}
			};
			splitRef.current = splitMainAtPlayhead;
			const previewTimeline = {
				...t,
				videoTracks: t.videoTracks.map((tr) => ({
					...tr,
					clips: tr.clips.map((c) => ({
						...c,
						src: assetUrl(c.src)
					}))
				})),
				audioTracks: t.audioTracks.map((tr) => ({
					...tr,
					clips: tr.clips.map((c) => ({
						...c,
						src: assetUrl(c.src)
					}))
				}))
			};
			const addAssetClip = (a) => hist.commit((cur) => ({
				...cur,
				videoTracks: cur.videoTracks.map((tr, i) => i === 0 ? {
					...tr,
					clips: [...tr.clips, {
						id: clipId(),
						type: a.type === "image" ? "image" : "video",
						src: a.name,
						inPoint: 0,
						clipDuration: a.type === "image" ? 3 : a.duration ?? 3,
						transition: "none",
						volume: 1
					}]
				} : tr)
			}));
			const setBgm = (name) => hist.commit((cur) => {
				const clip = {
					id: clipId(),
					src: name,
					inPoint: 0,
					duration: 10,
					volume: 1,
					atSeconds: 0
				};
				if (cur.audioTracks[0]) return {
					...cur,
					audioTracks: cur.audioTracks.map((tr, i) => i === 0 ? {
						...tr,
						clips: [...tr.clips, clip]
					} : tr)
				};
				return {
					...cur,
					audioTracks: [{
						id: "a1",
						name: "配乐",
						volume: 1,
						muted: false,
						clips: [clip]
					}]
				};
			});
			const onDragOver = (e) => {
				if (e.dataTransfer.types.includes("text/clip-index")) {
					e.preventDefault();
					e.dataTransfer.dropEffect = "move";
				}
			};
			const onDrop = (e) => {
				const from = Number(e.dataTransfer.getData("text/clip-index"));
				if (!Number.isInteger(from)) return;
				e.preventDefault();
				const target = e.target.closest(".djp-card");
				const to = target ? Number(target.dataset.index) : (t.videoTracks[0]?.clips.length ?? 1) - 1;
				if (!Number.isInteger(to) || from === to) return;
				const order = (t.videoTracks[0]?.clips ?? []).map((c) => c.id);
				const [moved] = order.splice(from, 1);
				order.splice(to, 0, moved);
				o.reorderClips(order);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "djp-root",
				ref: rootRef,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProjectBar, { sessionId }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djp-head",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "djp-title",
								children: "剪辑"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-iconbtn",
								title: "撤销（Ctrl+Z）",
								disabled: !hist.canUndo,
								onClick: hist.undo,
								children: "↺"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-iconbtn",
								title: "重做（Ctrl+Shift+Z）",
								disabled: !hist.canRedo,
								onClick: hist.redo,
								children: "↻"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "djp-meta",
								children: [
									t.meta.width,
									"×",
									t.meta.height,
									" · ",
									t.meta.fps,
									"fps · ",
									totalSec.toFixed(1),
									"s · ",
									mainClips.length,
									" 段",
									pipClips.length ? ` · 画中画×${pipClips.length}` : "",
									audioClips.length ? ` · 音频×${audioClips.length}` : "",
									" · ",
									t.overlays.length,
									" 字幕"
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-btn",
								title: "版本历史（AI 修改自动存档，可恢复）",
								onClick: () => setHistOpen(true),
								children: "历史"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "djp-btn",
								title: "画布设置",
								onClick: () => setCanvasOpen(true),
								children: "画布"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ExportControl, { t })
						]
					}),
					!hasContent ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djp-empty",
						children: "还没有片段——让 AI 加素材，从素材库加，或点下方「片段 +」"
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djp-stage",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Player, {
							ref: (r) => {
								playerBus.ref = r;
							},
							component: PreviewVideo,
							inputProps: { timeline: previewTimeline },
							durationInFrames,
							fps: t.meta.fps,
							compositionWidth: t.meta.width,
							compositionHeight: t.meta.height,
							controls: true,
							acknowledgeRemotionLicense: true,
							style: {
								width: "100%",
								aspectRatio: `${t.meta.width} / ${t.meta.height}`
							}
						}, `${t.meta.fps}-${t.meta.width}-${t.meta.height}`)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "djp-tabs",
						children: [
							["assets", "素材"],
							["clips", `片段${mainClips.length ? ` ${mainClips.length}` : ""}`],
							["pip", `画中画${pipClips.length ? ` ${pipClips.length}` : ""}`],
							["audio", `音频${audioClips.length ? ` ${audioClips.length}` : ""}`],
							["subs", `字幕${t.overlays.length ? ` ${t.overlays.length}` : ""}`]
						].map(([key, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: `djp-tab ${tab === key ? "djp-on" : ""}`,
							onClick: () => setTab(key),
							children: label
						}, key))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djp-tabwrap",
						children: [
							tab === "assets" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AssetsSection, {
								onAddClip: addAssetClip,
								onSetBgm: setBgm
							}),
							tab === "clips" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "djp-section",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djp-section-head",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "片段（主轨道）" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: {
												display: "flex",
												gap: 6
											},
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: "djp-btn",
													title: "在播放头处分割主轨片段",
													onClick: splitMainAtPlayhead,
													children: "✂ 分割"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: "djp-btn",
													title: "加画中画叠加轨",
													onClick: o.addPip,
													children: "画中画"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: "djp-add",
													title: "添加片段",
													onClick: o.addClip,
													children: "+"
												})
											]
										})]
									}),
									mainClips.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-hint",
										children: "主轨道空"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										onDragOver,
										onDrop,
										style: {
											display: "flex",
											flexDirection: "column",
											gap: 6
										},
										children: mainClips.map((c, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "djp-card",
											"data-index": i,
											draggable: true,
											onDragStart: (e) => {
												e.dataTransfer.setData("text/clip-index", String(i));
												e.dataTransfer.effectAllowed = "move";
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "djp-card-head",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "djp-drag",
														title: "拖拽排序",
														children: "⋮⋮"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: "djp-card-title",
														children: [
															"#",
															i + 1,
															" ",
															c.src
														]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
														className: "djp-select",
														value: c.transition,
														onChange: (e) => o.updateClip(c.id, { transition: e.target.value }),
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
															value: "none",
															children: "无转场"
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
															value: "fade",
															children: "淡入"
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														className: "djp-del",
														title: "删除片段",
														onClick: () => o.removeClip(c.id),
														children: "✕"
													})
												]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "djp-fields",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
														label: "起点",
														value: c.inPoint,
														onCommit: (v) => o.updateClip(c.id, { inPoint: v })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
														label: "时长",
														value: c.clipDuration,
														min: .1,
														onCommit: (v) => o.updateClip(c.id, { clipDuration: v })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
														label: "音量",
														value: c.volume,
														step: .1,
														onCommit: (v) => o.updateClip(c.id, { volume: Math.min(1, v) })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
														label: "速度",
														value: c.speed ?? 1,
														step: .25,
														min: .1,
														onCommit: (v) => o.updateClip(c.id, { speed: Math.min(10, Math.max(.1, v)) })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FilterSelect, {
														value: c.filter,
														onCommit: (f) => o.updateClip(c.id, { filter: f })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AnimSelect, {
														duration: c.clipDuration,
														anims: c.animations,
														onCommit: (anims) => o.updateClip(c.id, { animations: anims })
													})
												]
											})]
										}, c.id))
									})
								]
							}),
							tab === "pip" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "djp-section",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-section-head",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "画中画" })
									}),
									pipClips.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-hint",
										children: "无叠加片段——「片段」区点「画中画」或让 AI 加"
									}),
									pipClips.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djp-card djp-overlay-row",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "djp-card-title",
												style: { maxWidth: 90 },
												children: c.src
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												className: "djp-select",
												value: c.box ? JSON.stringify(c.box) : "",
												onChange: (e) => {
													const v = e.target.value;
													if (!v) {
														o.updateClip(c.id, { box: void 0 });
														return;
													}
													const p = BOX_PRESETS.find((x) => JSON.stringify(x.box) === v);
													if (p) o.updateClip(c.id, { box: p.box });
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "",
													children: "默认（右下 30%）"
												}), BOX_PRESETS.map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: JSON.stringify(p.box),
													children: p.label
												}, p.label))]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
												label: "从",
												value: c.atSeconds ?? 0,
												onCommit: (v) => o.updateClip(c.id, { atSeconds: Math.max(0, v) })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
												label: "时长",
												value: c.clipDuration,
												min: .1,
												onCommit: (v) => o.updateClip(c.id, { clipDuration: v })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
												label: "速度",
												value: c.speed ?? 1,
												step: .25,
												min: .1,
												onCommit: (v) => o.updateClip(c.id, { speed: Math.min(10, Math.max(.1, v)) })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FilterSelect, {
												value: c.filter,
												onCommit: (f) => o.updateClip(c.id, { filter: f })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AnimSelect, {
												duration: c.clipDuration,
												anims: c.animations,
												onCommit: (anims) => o.updateClip(c.id, { animations: anims })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												className: "djp-btn",
												title: "在播放头处分割",
												onClick: () => o.splitClip(c.id, Math.round(playheadRef.current * 100) / 100),
												children: "✂"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												className: "djp-del",
												title: "删除画中画",
												onClick: () => o.removeClip(c.id),
												children: "✕"
											})
										]
									}, c.id))
								]
							}),
							tab === "audio" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "djp-section",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djp-section-head",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "音频" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: {
												display: "flex",
												gap: 6,
												alignItems: "center"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												ref: audioFileRef,
												type: "file",
												accept: "audio/*,video/*",
												style: { display: "none" },
												onChange: async (e) => {
													const f = e.target.files?.[0];
													if (!f) return;
													try {
														const up = await uploadAsset(f);
														o.addAudio(up.name, up.duration ?? 10);
													} catch {}
													if (audioFileRef.current) audioFileRef.current.value = "";
												}
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												className: "djp-btn",
												title: "上传音频并加入音频轨",
												onClick: () => audioFileRef.current?.click(),
												children: "上传"
											})]
										})]
									}),
									t.audioTracks.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-hint",
										children: "无音频轨——素材库「♪配乐」、上方「上传」或让 AI 加"
									}),
									t.audioTracks.map((tr) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djp-card",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "djp-card-head",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "djp-card-title",
													children: ["♪ ", tr.name ?? "音频"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: `djp-btn ${tr.muted ? "djp-error" : ""}`,
													title: tr.muted ? "取消静音" : "静音",
													onClick: () => o.updateAudioTrack(tr.id, { muted: !tr.muted }),
													children: tr.muted ? "🔇" : "🔊"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													className: "djp-field",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "轨音量" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
														type: "range",
														min: 0,
														max: 1,
														step: .05,
														value: tr.volume,
														onChange: (e) => o.updateAudioTrack(tr.id, { volume: Number(e.target.value) }),
														style: { width: 70 }
													})]
												})
											]
										}), tr.clips.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "djp-fields",
											style: { alignItems: "center" },
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "djp-card-title",
													style: { maxWidth: 80 },
													children: c.src
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
													label: "从",
													value: c.atSeconds,
													onCommit: (v) => o.updateAudioClip(c.id, { atSeconds: Math.max(0, v) })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
													label: "时长",
													value: c.duration,
													min: .1,
													onCommit: (v) => o.updateAudioClip(c.id, { duration: v })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
													label: "音量",
													value: c.volume,
													step: .1,
													onCommit: (v) => o.updateAudioClip(c.id, { volume: Math.min(1, Math.max(0, v)) })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
													label: "速度",
													value: c.speed ?? 1,
													step: .25,
													min: .1,
													onCommit: (v) => o.updateAudioClip(c.id, { speed: Math.min(10, Math.max(.1, v)) })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: "djp-btn",
													title: "在播放头处分割",
													onClick: () => o.splitClip(c.id, Math.round(playheadRef.current * 100) / 100),
													children: "✂"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: "djp-del",
													title: "删除音频片段",
													onClick: () => o.removeAudioClip(c.id),
													children: "✕"
												})
											]
										}, c.id))]
									}, tr.id))
								]
							}),
							tab === "subs" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "djp-section",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djp-section-head",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "字幕" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											className: "djp-add",
											title: "添加字幕",
											onClick: o.addOverlay,
											children: "+"
										})]
									}),
									t.overlays.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "djp-hint",
										children: "无字幕——「+」加一条，或让 AI 配字幕"
									}),
									t.overlays.map((ov, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "djp-card djp-sub-card",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "djp-card-head",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "djp-idx",
													children: ["#", i + 1]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													className: "djp-sub-text",
													type: "text",
													defaultValue: ov.text,
													onBlur: (e) => {
														if (e.target.value !== ov.text) o.updateOverlay(i, { text: e.target.value });
													},
													onKeyDown: (e) => {
														if (e.key === "Enter") e.target.blur();
													}
												}, ov.text + i),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: "djp-del",
													title: "删除字幕",
													onClick: () => o.removeOverlay(i),
													children: "✕"
												})
											]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "djp-fields",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
													label: "从",
													value: ov.startSeconds,
													onCommit: (v) => o.updateOverlay(i, { startSeconds: v })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
													label: "到",
													value: ov.endSeconds,
													min: .1,
													onCommit: (v) => o.updateOverlay(i, { endSeconds: v })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
													label: "字号",
													value: ov.fontSize,
													min: 8,
													onCommit: (v) => o.updateOverlay(i, { fontSize: v })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
													className: "djp-select",
													value: ov.position,
													onChange: (e) => o.updateOverlay(i, { position: e.target.value }),
													title: "位置",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
															value: "top",
															children: "顶部"
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
															value: "center",
															children: "居中"
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
															value: "bottom",
															children: "底部"
														})
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
													className: "djp-select djp-fontsel",
													value: ov.fontFamily ?? "",
													onChange: (e) => o.updateOverlay(i, { fontFamily: e.target.value || void 0 }),
													title: "字体（清除 = 系统默认）",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "",
														children: "系统字体"
													}), fonts.map((f) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: f.id,
														children: f.label
													}, f.id))]
												}),
												fonts.find((f) => f.id === (ov.fontFamily ?? ""))?.variable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
													className: "djp-select",
													value: ov.fontWeight ?? 400,
													onChange: (e) => o.updateOverlay(i, { fontWeight: Number(e.target.value) }),
													title: "字重",
													children: [
														300,
														400,
														500,
														700,
														900
													].map((w) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: w,
														children: w
													}, w))
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
													className: "djp-color",
													title: "颜色",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
														type: "color",
														value: /^#[0-9a-fA-F]{6}$/.test(ov.color) ? ov.color : "#ffffff",
														onChange: (e) => o.updateOverlay(i, { color: e.target.value })
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AnimSelect, {
													duration: Math.max(.1, ov.endSeconds - ov.startSeconds),
													anims: ov.animations,
													onCommit: (anims) => o.updateOverlay(i, { animations: anims })
												})
											]
										})]
									}, i))
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "djp-tdock",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrackStrip, {
							t,
							o,
							playheadRef,
							onSeekClip: (start, lane) => {
								seekToSeconds(start, t.meta.fps);
								if (lane === "main") setTab("clips");
								else if (lane === "pip") setTab("pip");
								else if (lane === "audio") setTab("audio");
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "djp-hint",
							children: "AI 在对话里剪辑（MCP 工具落 5180 事实源）后，这里 2 秒内自动同步。"
						})]
					}),
					canvasOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanvasDialog, {
						t,
						onApply: (meta) => hist.commit((cur) => ({
							...cur,
							meta: {
								...cur.meta,
								...meta
							}
						})),
						onClose: () => setCanvasOpen(false)
					}),
					histOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HistoryDialog, {
						onClose: () => setHistOpen(false),
						onRestored: () => {
							hist.clear();
							reload();
						}
					})
				]
			});
		};
		//#endregion
		//#region src/client/styles.ts
		let injected = false;
		function injectStyles() {
			if (injected || typeof document === "undefined") return;
			injected = true;
			const el = document.createElement("style");
			el.dataset.djianTimeline = "1";
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
		//#endregion
		//#region src/client/index.tsx
		const FilmGlyph = ({ size = 16, className }) => react.default.createElement("svg", {
			width: size,
			height: size,
			viewBox: "0 0 16 16",
			fill: "none",
			className
		}, react.default.createElement("rect", {
			x: 1.5,
			y: 3,
			width: 13,
			height: 10,
			rx: 2,
			stroke: "currentColor",
			strokeWidth: 1.3
		}), react.default.createElement("path", {
			d: "M5.5 3v10M10.5 3v10M1.5 6.2h4M1.5 9.8h4M10.5 6.2h4M10.5 9.8h4",
			stroke: "currentColor",
			strokeWidth: 1.1
		}));
		const inject = ["slots", "sidebarRightTabs"];
		function apply(ctx) {
			injectStyles();
			ctx.effect(() => ctx.sidebarRightTabs.register({
				id: "djian.timeline",
				kind: "djian.timeline",
				priority: "builtin",
				title: () => "剪辑面板",
				guide: [{
					order: 10,
					title: () => "剪辑面板",
					description: () => "预览 · 片段 · 字幕 · 导出",
					icon: FilmGlyph
				}]
			}), "djian-timeline: tab type");
			ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
				name: "sidebar.right.pane.tab",
				key: "djian.timeline",
				inject: (sessionId) => ({ sessionId })
			}, Panel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
