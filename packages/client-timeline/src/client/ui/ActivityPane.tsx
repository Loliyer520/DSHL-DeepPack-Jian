// 协作动态：你和 AI 的每一次修改（服务端事件流）。可定位到被改的对象，可单独撤销 AI 的某次修改。
import React, { useEffect, useState } from 'react';
import { locateClip } from '../../../../engine/src/timeline';
import { useEditor, useStore } from '../context';
import type { Selected } from '../selection';
import type { ActivityItem } from '../store';
import { Icon } from '../Icon';

const ago = (iso: string, now: number) => {
  const d = Math.max(0, now - Date.parse(iso)) / 1000;
  if (d < 60) return '刚刚';
  if (d < 3600) return Math.floor(d / 60) + ' 分钟前';
  const t = new Date(iso);
  return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
};
const WHO = { ai: 'AI', user: '你', system: '系统' } as const;

export function ActivityPane() {
  const ed = useEditor();
  const activity = useStore((s) => s.activity);
  const ai = useStore((s) => s.ai);
  const [filter, setFilter] = useState<'all' | 'ai' | 'user'>('all');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);

  const locate = (item: ActivityItem) => {
    const t = ed.store.current;
    if (!t) return;
    const sel: Selected[] = [];
    let at: number | null = null;
    for (const key of item.changed) {
      const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
      if (kind === 'clip') { const loc = locateClip(t, id); if (loc) { sel.push({ kind: 'clip', id }); at = Math.min(at ?? Infinity, loc.start); } }
      else if (kind === 'overlay') { const o = t.overlays.find((x) => x.id === id); if (o) { sel.push({ kind: 'overlay', id }); at = Math.min(at ?? Infinity, o.startSeconds); } }
      else if (kind === 'marker') { const m = t.markers?.find((x) => x.id === id); if (m) { sel.push({ kind: 'marker', id }); at = Math.min(at ?? Infinity, m.t); } }
    }
    if (!sel.length) { ed.store.toast('info', '这次修改涉及的对象已不存在'); return; }
    ed.sel.selectMany(sel);
    if (at !== null && Number.isFinite(at)) ed.clock.seek(at);
  };

  const list = activity.filter((a) => filter === 'all' || (filter === 'ai' ? a.actor === 'ai' : a.actor !== 'ai'));
  return (
    <div className="dj-pane">
      {ai && (
        <div className="dj-ev dj-ai" style={{ marginBottom: 10 }} aria-live="polite">
          <header><Icon name="sparkle" /><b>AI 正在操作</b><span className="dj-spacer" />{ago(new Date(ai.at).toISOString(), now)}</header>
          <ul><li>{ai.label ?? ai.status}</li></ul>
        </div>
      )}
      <div className="dj-chips" style={{ marginBottom: 10 }}>
        {([['all', '全部'], ['ai', 'AI 的修改'], ['user', '我的修改']] as const).map(([k, label]) => (
          <button key={k} type="button" className="dj-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>
      {!list.length && <div className="dj-empty-state">还没有修改记录。你在时间线上的操作和 AI 的修改都会出现在这里，AI 也会在下一轮对话里看到你的操作。</div>}
      <div className="dj-activity">
        {list.map((a) => (
          <div key={a.rev + ':' + a.at} className={'dj-ev ' + (a.actor === 'ai' ? 'dj-ai' : 'dj-user')}>
            <header>
              <b>{WHO[a.actor] ?? a.actor}</b>{a.label && <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.label}>{a.label.replace(/^AI\s*[：:]\s*/, '')}</span>}
              {!a.label && <span className="dj-spacer" />}<span style={{ flex: 'none', whiteSpace: 'nowrap' }} title={'版本 ' + a.rev}>{ago(a.at, now)}</span>
            </header>
            {a.summary.length > 0 && <ul>{a.summary.slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}{a.summary.length > 5 && <li>…等 {a.summary.length} 项</li>}</ul>}
            <footer>
              {a.changed.length > 0 && <button className="dj-btn" onClick={() => locate(a)}><Icon name="focus" />定位</button>}
              {a.actor === 'ai' && a.inverse && a.inverse.length > 0 && <button className="dj-btn" onClick={() => ed.store.revert(a)}><Icon name="undo" />撤销这次修改</button>}
            </footer>
          </div>
        ))}
      </div>
    </div>
  );
}
