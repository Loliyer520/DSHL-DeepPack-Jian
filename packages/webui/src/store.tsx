import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Timeline, Clip, Overlay, AudioClip } from "../../engine/src/schema";import { demoSessions, nextId, emptyTimeline, fmtSec, type Session, type ChatMessage } from "./data";

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
  newSession: () => void;
  sendUserMessage: (text: string) => void;
  // 剪辑操作（都会注入系统消息）
  addClip: () => void;
  addPip: () => void;
  addAudio: (src: string, duration: number) => void;
  updateAudioTrack: (trackId: string, patch: { volume?: number; muted?: boolean }) => void;
  removeClip: (clipId: string, by?: string) => void;
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
        const clip: AudioClip = { id: nextId("ac"), src, inPoint: 0, duration, volume: 1, atSeconds };
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
    [addClipBy, addPipBy, addAudioBy, removeClipBy, updateClipBy, reorderClipsBy, addOverlayBy, removeOverlayBy, updateOverlayBy, setTimeline, injectSystem],
  );

  const value = useMemo<Store>(
    () => ({
      sessions,
      activeId,
      active,
      aiPending,
      setActive: setActiveId,
      newSession: () => {
        const id = nextId("s");
        const session: Session = {
          id,
          title: "新会话",
          updatedAt: Date.now(),
          messages: [{ id: nextId("m"), role: "system", title: "系统", text: "会话已创建", time: Date.now() }],
          timeline: emptyTimeline(),
        };
        setSessions((prev) => [session, ...prev]);
        setActiveId(id);
      },
      sendUserMessage: (text) => {
        const now = Date.now();
        mutateActive((s) => ({
          ...s,
          title: s.title === "新会话" ? text.slice(0, 18) : s.title,
          messages: [...s.messages, { id: nextId("m"), role: "user", text, time: now }],
        }));
        // 真实 AI 后端：POST /api/chat，模型返回 reply + 结构化剪辑 ops
        setAiPending(true);
        const snapshot = sessions.find((s) => s.id === activeId) ?? sessions[0];
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: activeId,
            timeline: snapshot.timeline,
            history: snapshot.messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
          }),
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
      updateClip: (clipId, patch) => updateClipBy("手动剪辑", clipId, patch),
      reorderClips: (order, by = "手动剪辑") => reorderClipsBy(by, order),
      addOverlay: () => addOverlayBy("手动剪辑"),
      removeOverlay: (index) => removeOverlayBy("手动剪辑", index),
      updateOverlay: (index, patch) => updateOverlayBy("手动剪辑", index, patch),
    }),
    [sessions, activeId, active, aiPending, mutateActive, applyOps, addClipBy, addPipBy, addAudioBy, removeClipBy, updateClipBy, reorderClipsBy, addOverlayBy, removeOverlayBy, updateOverlayBy],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
