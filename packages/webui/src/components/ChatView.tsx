import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { fmtTime, type ChatMessage } from "../data";

// 中间对话区：消息流（用户右气泡 / 助手左文 / 系统注入居中灰条）+ 底部输入卡
const MessageRow: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  if (msg.role === "system") {
    return (
      <div className="msg-system">
        <span>{msg.text}</span>
        <span className="msg-time">{fmtTime(msg.time)}</span>
      </div>
    );
  }
  return (
    <div className={`msg-row ${msg.role}`}>
      <div className="msg-bubble">
        <div className="msg-text">{msg.text}</div>
        <div className="msg-meta">{msg.role === "user" ? "你" : "D剪"} · {fmtTime(msg.time)}</div>
      </div>
    </div>
  );
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
      <div className="composer-wrap">
        <div className="composer">
          <textarea
            value={draft}
            placeholder="描述你想怎么剪…（Enter 发送，Shift+Enter 换行）"
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="send-btn" onClick={send} disabled={!draft.trim()}>
            发送
          </button>
        </div>
      </div>
    </section>
  );
};
