import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { shiftAnimations } from "../../engine/src/schema";
import type { Timeline, Clip, Overlay, AudioClip } from "../../engine/src/schema";import { demoSessions, nextId, emptyTimeline, fmtSec, type Session, type ChatMessage, type NewProjectConfig } from "./data";

// ---------- 全局状态：会话列表 + 当前会话（消息 + 时间线） ----------
// 核心约定：所有剪辑操作（用户手动 or AI 下发）都向当前会话注入 system 消息，
// 让对话区成为「AI 操作 + 用户手动操作」的统一时间线日志。
// v2 多轨：clips 原语作用于 videoTracks[0]（主轨道）；画中画/音频轨有独立原语。

interface Store {
  sessions: Session[];
  activeId: string;
  active: Session;
  aiPending: boolean;
  setActive: (id: string) => void;
  createProject: (config: NewProjectConfig) => void;
  sendUserMessage: (text: string) => void;
  // 剪辑操作（都会注入系统消息）
  addClip: () => void;
  addPip: () => void;
  addAudio: (src: string, duration: number) => void;
  updateAudioTrack: (trackId: string, patch: { volume?: number; muted?: boolean }) => void;
  removeClip: (clipId: string, by?: string) => void;
  splitClip: (clipId: string, atSeconds: number, by?: string) => void;
  updateClip: (clipId: string, patch: Partial<Clip> & Partial<AudioClip>, by?: string) => void;
  reorderClips: (order: string[], by?: string) => void;
  addOverlay: () => void;
  removeOverlay: (index: number, by?: string) => void;
  updateOverlay: (index: number, patch: Partial<Overlay>, by?: string) => void;
}

const StoreContext = createContext<Store | null>(null);

export const useStore = (): Store => {
  const s = useContext(StoreContext);
  if (!s) throw new Error("StoreProvider 缺失");
  return s;
};

// AI 下发的剪辑操作（与 server/index.mjs 的协议一致）
interface AiOp {
  op: string;
  id?: string;
  index?: number;
  order?: string[];
  src?: string;
  type?: string;
  inPoint?: number;
  clipDuration?: number;
  duration?: number;
  atSeconds?: number;
  transition?: "none" | "fade";
  volume?: number;
  trackVolume?: number;
  track?: string;
  box?: { x: number; y: number; w: number; h: number };
  patch?: Partial<Clip> & Partial<Overlay> & { volume?: number; muted?: boolean; fps?: number; width?: number; height?: number };
  text?: string;
  startSeconds?: number;
  endSeconds?: number;
  position?: "top" | "center" | "bottom";
  fontSize?: number;
  color?: string;
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>(demoSessions);
  const [activeId, setActiveId] = useState<string>(demoSessions[0].id);
  const [aiPending, setAiPending] = useState(false);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  const mutateActive = useCallback(
    (fn: (s: Session) => Session) => {
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...fn(s), updatedAt: Date.now() } : s)));
    },
    [activeId],
  );

  const injectSystem = useCallback(
    (title: string, text: string) => {
      const msg: ChatMessage = { id: nextId("m"), role: "system", title, text, time: Date.now() };
      mutateActive((s) => ({ ...s, messages: [...s.messages, msg] }));
    },
    [mutateActive],
  );

  const setTimeline = useCallback(
    (fn: (t: Timeline) => Timeline) => {
      mutateActive((s) => ({ ...s, timeline: fn(s.timeline) }));
    },
    [mutateActive],
  );

  // ---- 会话=项目对齐（服务端 ~/.djian/projects/<id> 是落盘事实源） ----
  // webui 会话 ↔ 服务端项目一一绑定：新建/升级时落盘，激活时对齐服务端 current，
  // 这样 AI ops 落盘、导出渲染、素材解析都发生在当前会话自己的项目里。
  const currentRef = useRef<string>(""); // 已对齐的服务端 current，防重复 POST
  const touchedRef = useRef(false); // 启动恢复完成前用户是否已动手

  const pushCurrent = useCallback((serverId: string): Promise<void> => {
    if (currentRef.current === serverId) return Promise.resolve();
    currentRef.current = serverId;
    return fetch("/api/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: serverId }),
    })
      .then(() => undefined)
      .catch(() => {
        currentRef.current = ""; // 失败不记位，下次操作再试
      });
  }, []);

  // 无 serverId 的会话（demo/纯前端模式）首次真用时升级为服务端项目
  const ensureServerProject = useCallback(
    (s: Session): Promise<string | null> => {
      if (s.serverId) return pushCurrent(s.serverId).then(() => s.serverId ?? null);
      return fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.title, meta: s.timeline.meta }),
      })
        .then(async (r) => (r.ok ? ((await r.json()) as { id?: string }) : null))
        .then((d) => {
          const pid = d?.id;
          if (!pid) return null;
          setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, serverId: pid } : x)));
          return pushCurrent(pid).then(() => pid);
        })
        .catch(() => null);
    },
    [pushCurrent],
  );

  // 启动恢复：服务端有项目则以项目为会话列表（一会话=一项目），失败/空保持 demo
  useEffect(() => {
    let dead = false;
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unreachable"))))
      .then(async (d: { projects?: { id: string; name: string; createdAt: string | null }[] }) => {
        const projects = [...(d.projects ?? [])].reverse(); // 服务端按 createdAt 升序，抽屉要新项目在前
        const restored = (await Promise.all(
          projects.map(async (p): Promise<Session | null> => {
            try {
              const r = await fetch(`/api/projects/${p.id}/timeline`);
              if (!r.ok) return null;
              const td = await r.json();
              if (!td?.timeline) return null;
              return {
                id: p.id,
                serverId: p.id,
                title: p.name,
                updatedAt: (p.createdAt && Date.parse(p.createdAt)) || Date.now(),
                messages: [
                  { id: nextId("m"), role: "system", title: "系统", text: `已从服务端载入项目「${p.name}」`, time: Date.now() },
                ],
                timeline: td.timeline as Timeline,
              };
            } catch {
              return null; // 单个项目拉不到就跳过
            }
          }),
        )).filter((s): s is Session => Boolean(s));
        if (dead || restored.length === 0) return;
        if (touchedRef.current) {
          setSessions((prev) => [...restored, ...prev]); // 用户已先动手：追加不打断
        } else {
          setSessions(restored);
          setActiveId(restored[0].id);
        }
      })
      .catch(() => {
        /* 无服务端（纯静态/dev）：保持 demo 会话 */
      });
    return () => {
      dead = true;
    };
  }, []);

  // ---- 共享剪辑原语（by = "手动剪辑" | "AI 剪辑"） ----

  const addClipBy = useCallback(
    (by: string, partial?: Partial<Clip>) => {
      setTimeline((t) => {
        const clip: Clip = {
          id: nextId("c"),
          type: "video",
          src: t.videoTracks[0]?.clips[t.videoTracks[0].clips.length - 1]?.src ?? "a.mp4",
          inPoint: 0,
          clipDuration: 3,
          transition: "none",
          volume: 1,
          ...partial,
          speed: partial?.speed ?? 1,
        };
        return {
          ...t,
          videoTracks: t.videoTracks.map((tr, i) => (i === 0 ? { ...tr, clips: [...tr.clips, clip] } : tr)),
        };
      });
      injectSystem(by, `添加片段 ${partial?.src ?? "a.mp4"} · 起点 ${fmtSec(partial?.inPoint ?? 0)} · 时长 ${fmtSec(partial?.clipDuration ?? 3)}`);
    },
    [setTimeline, injectSystem],
  );

  // 画中画：进第一条叠加轨（没有就建），绝对时间摆放
  const addPipBy = useCallback(
    (by: string, partial?: Partial<Clip>) => {
      setTimeline((t) => {
        const clip: Clip = {
          id: nextId("c"),
          type: "video",
          src: t.videoTracks[0]?.clips[t.videoTracks[0].clips.length - 1]?.src ?? "a.mp4",
          inPoint: 0,
          clipDuration: 3,
          transition: "none",
          volume: 1,
          atSeconds: 0,
          ...partial,
          speed: partial?.speed ?? 1,
        };
        if (t.videoTracks[1]) {
          return {
            ...t,
            videoTracks: t.videoTracks.map((tr, i) => (i === 1 ? { ...tr, clips: [...tr.clips, clip] } : tr)),
          };
        }
        return { ...t, videoTracks: [...t.videoTracks, { id: "v2", name: "画中画", clips: [clip] }] };
      });
      injectSystem(by, `添加画中画 ${partial?.src ?? "a.mp4"} · 从 ${fmtSec(partial?.atSeconds ?? 0)} 起`);
    },
    [setTimeline, injectSystem],
  );

  // 音频 clip：同名轨复用，否则新建
  const addAudioBy = useCallback(
    (by: string, src: string, duration: number, atSeconds = 0, track = "音频") => {
      setTimeline((t) => {
        const clip: AudioClip = { id: nextId("ac"), src, inPoint: 0, duration, volume: 1, atSeconds, speed: 1 };
        if (t.audioTracks[0]) {
          return {
            ...t,
            audioTracks: t.audioTracks.map((tr, i) => (i === 0 ? { ...tr, clips: [...tr.clips, clip] } : tr)),
          };
        }
        return { ...t, audioTracks: [{ id: "a1", name: track, volume: 1, muted: false, clips: [clip] }] };
      });
      injectSystem(by, `添加音频 ${src} · 从 ${fmtSec(atSeconds)} 起 · 时长 ${fmtSec(duration)}`);
    },
    [setTimeline, injectSystem],
  );

  const removeClipBy = useCallback(
    (by: string, clipId: string) => {
      setTimeline((t) => ({
        ...t,
        videoTracks: t.videoTracks
          .map((tr) => ({ ...tr, clips: tr.clips.filter((c) => c.id !== clipId) }))
          .filter((tr, i) => i === 0 || tr.clips.length > 0),
        audioTracks: t.audioTracks
          .map((tr) => ({ ...tr, clips: tr.clips.filter((c) => c.id !== clipId) }))
          .filter((tr) => tr.clips.length > 0),
      }));
      injectSystem(by, `删除片段 ${clipId}`);
    },
    [setTimeline, injectSystem],
  );

  // 分割：与 5180 服务端 splitClip op 同语义（全局切点，主轨串行换算局部偏移）
  const splitClipBy = useCallback(
    (by: string, clipId: string, atSeconds: number) => {
      setTimeline((t) => {
        for (let ti = 0; ti < t.videoTracks.length; ti++) {
          const tr = t.videoTracks[ti];
          const idx = tr.clips.findIndex((c) => c.id === clipId);
          if (idx === -1) continue;
          const clip = tr.clips[idx];
          let start = 0;
          if (ti === 0) for (let i = 0; i < idx; i++) start += tr.clips[i].clipDuration;
          else start = clip.atSeconds ?? 0;
          const off = atSeconds - start;
          if (!(off > 0.05) || off >= clip.clipDuration - 0.05) return t;
          const left = { ...clip, clipDuration: off };
          const right: Clip = { ...clip, id: nextId("c"), inPoint: clip.inPoint + off * (clip.speed ?? 1), clipDuration: clip.clipDuration - off, animations: shiftAnimations(clip.animations, off) };
          if (clip.atSeconds !== undefined) right.atSeconds = clip.atSeconds + off;
          const clips = [...tr.clips];
          clips.splice(idx, 1, left, right);
          return { ...t, videoTracks: t.videoTracks.map((x, i) => (i === ti ? { ...x, clips } : x)) };
        }
        for (let ti = 0; ti < t.audioTracks.length; ti++) {
          const tr = t.audioTracks[ti];
          const idx = tr.clips.findIndex((c) => c.id === clipId);
          if (idx === -1) continue;
          const clip = tr.clips[idx];
          const off = atSeconds - clip.atSeconds;
          if (!(off > 0.05) || off >= clip.duration - 0.05) return t;
          const left = { ...clip, duration: off };
          const right: AudioClip = { ...clip, id: nextId("ac"), inPoint: clip.inPoint + off * (clip.speed ?? 1), duration: clip.duration - off, atSeconds: clip.atSeconds + off, animations: shiftAnimations(clip.animations, off) };
          const clips = [...tr.clips];
          clips.splice(idx, 1, left, right);
          return { ...t, audioTracks: t.audioTracks.map((x, i) => (i === ti ? { ...x, clips } : x)) };
        }
        return t;
      });
      injectSystem(by, `分割片段 ${clipId} @ ${fmtSec(atSeconds)}`);
    },
    [setTimeline, injectSystem],
  );

  const updateClipBy = useCallback(
    (by: string, clipId: string, patch: Partial<Clip> & Partial<AudioClip>) => {
      setTimeline((t) => ({
        ...t,
        videoTracks: t.videoTracks.map((tr) => ({
          ...tr,
          clips: tr.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
        })),
        audioTracks: t.audioTracks.map((tr) => ({
          ...tr,
          clips: tr.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
        })),
      }));
      const desc = Object.entries(patch)
        .map(([k, v]) => {
          const name: Record<string, string> = {
            inPoint: "起点",
            clipDuration: "时长",
            duration: "时长",
            transition: "转场",
            volume: "音量",
            src: "素材",
            atSeconds: "起始",
          };
          const val =
            k === "inPoint" || k === "clipDuration" || k === "duration" || k === "atSeconds" ? fmtSec(Number(v)) : String(v);
          return `${name[k] ?? k} → ${val}`;
        })
        .join("，");
      injectSystem(by, `调整片段 ${clipId} · ${desc}`);
    },
    [setTimeline, injectSystem],
  );

  const reorderClipsBy = useCallback(
    (by: string, order: string[]) => {
      setTimeline((t) => {
        const tr0 = t.videoTracks[0];
        if (!tr0) return t;
        const map = new Map(tr0.clips.map((c) => [c.id, c]));
        const next = order.map((id) => map.get(id)).filter((c): c is Clip => Boolean(c));
        const missing = tr0.clips.filter((c) => !order.includes(c.id));
        const main = { ...tr0, clips: [...next, ...missing] };
        return { ...t, videoTracks: [main, ...t.videoTracks.slice(1)] };
      });
      injectSystem(by, `调整片段顺序 → ${order.join(", ")}`);
    },
    [setTimeline, injectSystem],
  );

  const addOverlayBy = useCallback(
    (by: string, partial?: Partial<Overlay>) => {
      const ov: Overlay = {
        text: "新字幕",
        startSeconds: 0,
        endSeconds: 3,
        position: "bottom",
        fontSize: 48,
        color: "#ffffff",
        ...partial,
      };
      setTimeline((t) => ({ ...t, overlays: [...t.overlays, ov] }));
      injectSystem(by, `添加字幕「${ov.text}」（${fmtSec(ov.startSeconds)}–${fmtSec(ov.endSeconds)}）`);
    },
    [setTimeline, injectSystem],
  );

  const removeOverlayBy = useCallback(
    (by: string, index: number) => {
      setTimeline((t) => ({ ...t, overlays: t.overlays.filter((_, i) => i !== index) }));
      injectSystem(by, `删除第 ${index + 1} 条字幕`);
    },
    [setTimeline, injectSystem],
  );

  const updateOverlayBy = useCallback(
    (by: string, index: number, patch: Partial<Overlay>) => {
      setTimeline((t) => ({
        ...t,
        overlays: t.overlays.map((o, i) => (i === index ? { ...o, ...patch } : o)),
      }));
      if (patch.text !== undefined) injectSystem(by, `第 ${index + 1} 条字幕改为「${patch.text}」`);
    },
    [setTimeline, injectSystem],
  );

  // ---- AI ops 执行（走同一套原语，系统消息标 "AI 剪辑"） ----

  const applyOps = useCallback(
    (ops: AiOp[]) => {
      for (const op of ops) {
        switch (op.op) {
          case "addClip": {
            // track: "pip"/"overlay" 走画中画；缺省主轨道
            const isPip = typeof op.track === "string" && /^(pip|overlay)$/i.test(op.track);
            const common = {
              src: op.src ?? "a.mp4",
              inPoint: num(op.inPoint, 0),
              clipDuration: Math.max(0.1, num(op.clipDuration, 3)),
              transition: op.transition === "fade" ? ("fade" as const) : ("none" as const),
              volume: Math.min(1, Math.max(0, num(op.volume, 1))),
              ...(op.box ? { box: op.box } : {}),
            };
            if (isPip) addPipBy("AI 剪辑", { ...common, atSeconds: Math.max(0, num(op.atSeconds, 0)), type: op.type === "image" ? "image" : "video" });
            else addClipBy("AI 剪辑", { ...common, type: op.type === "image" ? "image" : "video" });
            break;
          }
          case "addAudio":
            if (op.src) addAudioBy("AI 剪辑", op.src, Math.max(0.1, num(op.duration, 3)), Math.max(0, num(op.atSeconds, 0)), typeof op.track === "string" ? op.track : "音频");
            break;
          case "removeClip":
          case "removeAudio":
            if (op.id) removeClipBy("AI 剪辑", op.id);
            break;
          case "splitClip":
            if (op.id && typeof op.atSeconds === "number") splitClipBy("AI 剪辑", op.id, op.atSeconds);
            break;
          case "updateClip":
            if (op.id && op.patch) updateClipBy("AI 剪辑", op.id, op.patch);
            break;
          case "updateAudioTrack":
            // 轨级音量/静音：映射到该轨全部 clip 的音量缩放（简化；muted 记入消息）
            if (op.id && op.patch) {
              setTimeline((t) => ({
                ...t,
                audioTracks: t.audioTracks.map((tr) =>
                  tr.id === op.id || tr.name === op.id
                    ? {
                        ...tr,
                        volume: op.patch!.volume !== undefined ? Math.min(1, Math.max(0, op.patch!.volume!)) : tr.volume,
                        muted: op.patch!.muted !== undefined ? Boolean(op.patch!.muted) : tr.muted,
                      }
                    : tr,
                ),
              }));
              injectSystem("AI 剪辑", `调整音频轨 ${op.id} · ${JSON.stringify(op.patch)}`);
            }
            break;
          case "setMeta":
            if (op.patch) {
              setTimeline((t) => ({
                ...t,
                meta: {
                  ...t.meta,
                  ...(op.patch!.fps !== undefined ? { fps: op.patch!.fps! } : {}),
                  ...(op.patch!.width !== undefined ? { width: Math.round(op.patch!.width!) } : {}),
                  ...(op.patch!.height !== undefined ? { height: Math.round(op.patch!.height!) } : {}),
                },
              }));
              injectSystem("AI 剪辑", `调整画布 · ${JSON.stringify(op.patch)}`);
            }
            break;
          case "reorderClips":
            if (Array.isArray(op.order) && op.order.length) reorderClipsBy("AI 剪辑", op.order);
            break;
          case "addOverlay":
            addOverlayBy("AI 剪辑", {
              text: op.text ?? "字幕",
              startSeconds: num(op.startSeconds, 0),
              endSeconds: num(op.endSeconds, 3),
              position: op.position ?? "bottom",
              fontSize: num(op.fontSize, 48),
              color: op.color ?? "#ffffff",
            });
            break;
          case "removeOverlay":
            if (typeof op.index === "number") removeOverlayBy("AI 剪辑", op.index);
            break;
          case "updateOverlay":
            if (typeof op.index === "number" && op.patch) updateOverlayBy("AI 剪辑", op.index, op.patch);
            break;
          default:
            injectSystem("AI 剪辑", `忽略未知操作：${op.op}`);
        }
      }
    },
    [addClipBy, addPipBy, addAudioBy, removeClipBy, splitClipBy, updateClipBy, reorderClipsBy, addOverlayBy, removeOverlayBy, updateOverlayBy, setTimeline, injectSystem],
  );

  const value = useMemo<Store>(
    () => ({
      sessions,
      activeId,
      active,
      aiPending,
      setActive: (id) => {
        touchedRef.current = true;
        setActiveId(id);
        const s = sessions.find((x) => x.id === id);
        if (s?.serverId) void pushCurrent(s.serverId); // 服务端 current 跟随激活会话
      },
      createProject: (config) => {
        touchedRef.current = true;
        const id = nextId("s");
        const session: Session = {
          id,
          title: config.title,
          updatedAt: Date.now(),
          messages: [
            {
              id: nextId("m"),
              role: "system",
              title: "系统",
              text: `项目「${config.title}」已创建 · ${config.width}×${config.height} · ${config.fps}fps`,
              time: Date.now(),
            },
          ],
          timeline: emptyTimeline({ fps: config.fps, width: config.width, height: config.height }),
        };
        setSessions((prev) => [session, ...prev]);
        setActiveId(id);
        // 服务端落盘同名项目并对齐 current（失败=纯前端模式，会话只留内存）
        fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: config.title, meta: { fps: config.fps, width: config.width, height: config.height } }),
        })
          .then(async (r) => (r.ok ? ((await r.json()) as { id?: string }) : null))
          .then((d) => {
            if (!d?.id) return;
            setSessions((prev) => prev.map((x) => (x.id === id ? { ...x, serverId: d.id } : x)));
            return pushCurrent(d.id);
          })
          .catch(() => {});
      },
      sendUserMessage: (text) => {
        const now = Date.now();
        touchedRef.current = true;
        mutateActive((s) => ({
          ...s,
          title: s.title === "未命名项目" ? text.slice(0, 18) : s.title,
          messages: [...s.messages, { id: nextId("m"), role: "user", text, time: now }],
        }));
        // 真实 AI 后端：POST /api/chat，模型返回 reply + 结构化剪辑 ops
        setAiPending(true);
        const snapshot = sessions.find((s) => s.id === activeId) ?? sessions[0];
        const renameTo = snapshot.title === "未命名项目" ? text.slice(0, 18) : null;
        // 先把会话对到自己的服务端项目（demo 首聊自动升级），再进 AI——
        // 保证 ops 落盘、素材解析发生在本会话的项目里，而不是全局 current
        void ensureServerProject(snapshot)
          .then((pid) => {
            if (pid && renameTo) {
              fetch(`/api/projects/${pid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: renameTo }),
              }).catch(() => {});
            }
            return fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: text,
                sessionId: activeId,
                timeline: snapshot.timeline,
                history: snapshot.messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
              }),
            });
          })
          .then(async (res) => {
            if (res.status === 501) throw new Error("AI 未配置（501）");
            if (!res.ok) {
              const e = await res.json().catch(() => ({}));
              throw new Error(e.error || `HTTP ${res.status}`);
            }
            return res.json();
          })
          .then(({ reply, ops }) => {
            mutateActive((s) => ({
              ...s,
              messages: [...s.messages, { id: nextId("m"), role: "assistant", text: String(reply), time: Date.now() }],
            }));
            applyOps(ops ?? []);
          })
          .catch((e) => {
            mutateActive((s) => ({
              ...s,
              messages: [
                ...s.messages,
                {
                  id: nextId("m"),
                  role: "assistant",
                  text: `AI 调用失败：${e.message}。可以先在右侧剪辑面板手动操作。`,
                  time: Date.now(),
                },
              ],
            }));
          })
          .finally(() => setAiPending(false));
      },
      addClip: () => addClipBy("手动剪辑"),
      addPip: () => addPipBy("手动剪辑"),
      addAudio: (src, duration) => addAudioBy("手动剪辑", src, duration),
      updateAudioTrack: (trackId, patch) => {
        setTimeline((t) => ({
          ...t,
          audioTracks: t.audioTracks.map((tr) =>
            tr.id === trackId
              ? {
                  ...tr,
                  volume: patch.volume !== undefined ? Math.min(1, Math.max(0, patch.volume)) : tr.volume,
                  muted: patch.muted !== undefined ? patch.muted : tr.muted,
                }
              : tr,
          ),
        }));
        injectSystem("手动剪辑", `调整音频轨 ${trackId} · ${JSON.stringify(patch)}`);
      },
      removeClip: (clipId) => removeClipBy("手动剪辑", clipId),
      splitClip: (clipId, atSeconds) => splitClipBy("手动剪辑", clipId, atSeconds),
      updateClip: (clipId, patch) => updateClipBy("手动剪辑", clipId, patch),
      reorderClips: (order, by = "手动剪辑") => reorderClipsBy(by, order),
      addOverlay: () => addOverlayBy("手动剪辑"),
      removeOverlay: (index) => removeOverlayBy("手动剪辑", index),
      updateOverlay: (index, patch) => updateOverlayBy("手动剪辑", index, patch),
    }),
    [sessions, activeId, active, aiPending, mutateActive, applyOps, ensureServerProject, pushCurrent, addClipBy, addPipBy, addAudioBy, removeClipBy, splitClipBy, updateClipBy, reorderClipsBy, addOverlayBy, removeOverlayBy, updateOverlayBy],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
