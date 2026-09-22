import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { fmtTime, type ChatMessage } from "../data";

// 对话区照抄 dsh（deepseek-harness ui-chat）：
// - 用户消息：右列，22px 圆角浅蓝气泡（deepseek-50 底 + 深色字），pre-wrap
// - 助手消息：无气泡，正文直接排在对话列里
// - 系统注入：ContextInjectionRow 风格——24px 行高朴素行，小图标 + 标题 + 圆点分隔 + 灰色摘要
const MessageRow: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  if (msg.role === "system") {
    return (
      <div className="ctx-row" title={fmtTime(msg.time)}>
        <span className="ctx-leading">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1.5v11M1.5 7h11"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="ctx-title">{msg.title ?? "系统"}</span>
        <span className="ctx-sep" />
        <span className="ctx-summary">{msg.text}</span>
      </div>
    );
  }
  if (msg.role === "user") {
    return (
      <div className="user-row">
        <div className="user-stack">
          <div className="bubble" title={fmtTime(msg.time)}>
            {msg.text}
          </div>
        </div>
      </div>
    );
  }
  return <div className="assistant-text">{msg.text}</div>;
};

export const ChatView: React.FC = () => {
  const { active, sendUserMessage } = useStore();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active.messages.length, active.id]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    sendUserMessage(text);
  };

  return (
    <section className="chat-root">
      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-column">
          {active.messages.map((m) => (
            <MessageRow key={m.id} msg={m} />
          ))}
        </div>
      </div>
      {/* 输入卡照抄 dsh InputBar：22px 胶囊卡 + 底部工具行 + 34px 圆形发送键 */}
      <div className="composer-root">
        <div className="composer-card">
          <div className="composer-scroll">
            <textarea
              className="composer-input"
              value={draft}
              placeholder="描述你想怎么剪…"
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
          </div>
          <div className="composer-row">
            <div className="composer-tools">
              <button className="tool-circle" title="添加素材（即将上线）" disabled>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="composer-trailing">
              <button
                className="send-circle"
                title="发送"
                onClick={send}
                disabled={!draft.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 12.5v-9M3.5 7.5L8 3l4.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
