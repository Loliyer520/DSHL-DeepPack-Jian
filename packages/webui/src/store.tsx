import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Timeline, Clip, Overlay } from "../../engine/src/schema";
import { demoSessions, nextId, fmtSec, type Session, type ChatMessage } from "./data";

// ---------- 全局状态：会话列表 + 当前会话（消息 + 时间线） ----------
// 核心约定：用户在剪辑面板的每一步操作，都会向当前会话注入一条 system 消息，
// 让对话区成为「AI 操作 + 用户手动操作」的统一时间线日志。

interface Store {
  sessions: Session[];
  activeId: string;
  active: Session;
  setActive: (id: string) => void;
  newSession: () => void;
  sendUserMessage: (text: string) => void;
  // 剪辑操作（都会注入系统消息）
  addClip: () => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, patch: Partial<Clip>) => void;
  addOverlay: () => void;
  removeOverlay: (index: number) => void;
  updateOverlay: (index: number, patch: Partial<Overlay>) => void;
}

const StoreContext = createContext<Store | null>(null);

export const useStore = (): Store => {
  const s = useContext(StoreContext);
  if (!s) throw new Error("StoreProvider 缺失");
  return s;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>(demoSessions);
  const [activeId, setActiveId] = useState<string>(demoSessions[0].id);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  const mutateActive = useCallback(
    (fn: (s: Session) => Session) => {
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...fn(s), updatedAt: Date.now() } : s)));
    },
    [activeId],
  );

  const injectSystem = useCallback(
    (text: string) => {
      const msg: ChatMessage = { id: nextId("m"), role: "system", text, time: Date.now() };
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

  const value = useMemo<Store>(
    () => ({
      sessions,
      activeId,
      active,
      setActive: setActiveId,
      newSession: () => {
        const id = nextId("s");
        const session: Session = {
          id,
          title: "新会话",
          updatedAt: Date.now(),
          messages: [{ id: nextId("m"), role: "system", text: "会话已创建", time: Date.now() }],
          timeline: { meta: { fps: 30, width: 1280, height: 720 }, clips: [], audio: null, overlays: [] },
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
        // AI 后端尚未接入（v1 演示壳）：回一条占位说明，保持消息流可见
        setTimeout(() => {
          mutateActive((s) => ({
            ...s,
            messages: [
              ...s.messages,
              {
                id: nextId("m"),
                role: "assistant",
                text: "收到。AI 对话后端还没接入（当前是界面演示），你可以先在右侧剪辑面板操作，每一步都会记录在这里。",
                time: Date.now(),
              },
            ],
          }));
        }, 500);
      },
      addClip: () => {
        const clip: Clip = {
          id: nextId("c"),
          type: "video",
          src: "a.mp4",
          inPoint: 0,
          clipDuration: 3,
          transition: "none",
          volume: 1,
        };
        setTimeline((t) => ({ ...t, clips: [...t.clips, clip] }));
        injectSystem(`➕ 你添加了一段素材：${clip.src}（${fmtSec(clip.clipDuration)}）`);
      },
      removeClip: (clipId) => {
        setTimeline((t) => ({ ...t, clips: t.clips.filter((c) => c.id !== clipId) }));
        injectSystem(`➖ 你删除了片段 ${clipId}`);
      },
      updateClip: (clipId, patch) => {
        setTimeline((t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
        }));
        const desc = Object.entries(patch)
          .map(([k, v]) => {
            const name: Record<string, string> = {
              inPoint: "起点",
              clipDuration: "时长",
              transition: "转场",
              volume: "音量",
              src: "素材",
            };
            const val = k === "inPoint" || k === "clipDuration" ? fmtSec(Number(v)) : String(v);
            return `${name[k] ?? k} → ${val}`;
          })
          .join("，");
        injectSystem(`✂️ 你调整了片段 ${clipId}：${desc}`);
      },
      addOverlay: () => {
        const ov: Overlay = {
          text: "新字幕",
          startSeconds: 0,
          endSeconds: 3,
          position: "bottom",
          fontSize: 48,
          color: "#ffffff",
        };
        setTimeline((t) => ({ ...t, overlays: [...t.overlays, ov] }));
        injectSystem(`💬 你添加了一条字幕（${fmtSec(ov.startSeconds)}–${fmtSec(ov.endSeconds)}）`);
      },
      removeOverlay: (index) => {
        setTimeline((t) => ({ ...t, overlays: t.overlays.filter((_, i) => i !== index) }));
        injectSystem(`➖ 你删除了第 ${index + 1} 条字幕`);
      },
      updateOverlay: (index, patch) => {
        setTimeline((t) => ({
          ...t,
          overlays: t.overlays.map((o, i) => (i === index ? { ...o, ...patch } : o)),
        }));
        if (patch.text !== undefined) injectSystem(`✏️ 你把第 ${index + 1} 条字幕改为「${patch.text}」`);
      },
    }),
    [sessions, activeId, active, setTimeline, injectSystem, mutateActive],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
