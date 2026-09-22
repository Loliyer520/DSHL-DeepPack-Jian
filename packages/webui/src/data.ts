import type { Timeline } from "../../engine/src/schema";

// ---------- 会话与消息模型 ----------

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  // system 消息照 dsh ContextInjectionRow：标题（主色暗淡）+ 摘要（三级灰）
  title?: string;
  time: number;
}

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
  timeline: Timeline;
}

let seq = 0;
export const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const fmtTime = (ts: number) => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const fmtSec = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${sec.toFixed(1).padStart(4, "0")}`;
};

// ---------- 演示数据 ----------

export const demoTimeline: Timeline = {
  meta: { fps: 30, width: 1280, height: 720 },
  clips: [
    { id: "c1", type: "video", src: "a.mp4", inPoint: 0.5, clipDuration: 4, transition: "fade", volume: 1 },
    { id: "c2", type: "video", src: "a.mp4", inPoint: 6, clipDuration: 4, transition: "none", volume: 1 },
  ],
  audio: null,
  overlays: [
    {
      text: "D剪 demo · 右侧预览可随剪辑实时更新",
      startSeconds: 0.5,
      endSeconds: 3.5,
      position: "bottom",
      fontSize: 48,
      color: "#ffffff",
    },
  ],
};

export const demoSessions: Session[] = [
  {
    id: "s-demo-1",
    title: "宣传片快剪（demo）",
    updatedAt: Date.now() - 1000 * 60 * 3,
    messages: [
      {
        id: "m-1",
        role: "user",
        text: "帮我把素材剪成 8 秒的短片，开头淡入，底部加一句字幕。",
        time: Date.now() - 1000 * 60 * 5,
      },
      {
        id: "m-2",
        role: "assistant",
        text: "已按需求生成时间线：2 段共 8 秒，开头淡入，底部字幕 0.5s–3.5s。右侧可预览，也可以在下方剪辑面板手动微调——你的每一步修改我都会记录在这里。",
        time: Date.now() - 1000 * 60 * 4,
      },
    ],
    timeline: demoTimeline,
  },
  {
    id: "s-demo-2",
    title: "竖版 9:16 快剪（demo）",
    updatedAt: Date.now() - 1000 * 60 * 60,
    messages: [
      {
        id: "m-3",
        role: "system",
        title: "系统",
        text: "会话已创建",
        time: Date.now() - 1000 * 60 * 60,
      },
    ],
    timeline: {
      meta: { fps: 24, width: 960, height: 540 },
      clips: [
        { id: "x1", type: "video", src: "a.mp4", inPoint: 3, clipDuration: 3, transition: "none", volume: 1 },
        { id: "x2", type: "video", src: "a.mp4", inPoint: 2, clipDuration: 2, transition: "fade", volume: 1 },
      ],
      audio: null,
      overlays: [],
    },
  },
];
