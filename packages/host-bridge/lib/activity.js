// 编辑事件注入：把用户在剪辑面板里的修改（以及当前选中/播放头）整理成一条 <editor-activity> 上下文。
// 只在有新内容时产出，保证提示词缓存稳定；单次拉取有超时，绝不拖慢模型调用。
// 本地时间（宿主与用户在同一台机器上；与 DSH 注入给模型的时间上下文一致，不用 UTC）
const pad2 = (n) => String(n).padStart(2, '0');
const time = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
};
const sec = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '?';
  const m = Math.floor(v / 60);
  return m + ':' + (v - m * 60).toFixed(2).padStart(5, '0');
};
const MODE = { main: '主轨', pip: '画中画', audio: '音频', subs: '字幕' };

export class SessionState {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.projectId = null;
    this.projectName = null;
    this.lastSeenRev = undefined;
    this.lastInjectedRev = undefined;
    this.presenceKey = null;
    this.aiTouched = new Map();
    this.clientId = 'ai:' + sessionId;
  }
  /** AI 自己读到/写入的修订：记录它改过哪些实体，便于提示“用户覆盖了你的修改” */
  observe(rev, changed = []) {
    if (Number.isInteger(rev)) this.lastSeenRev = Math.max(this.lastSeenRev ?? 0, rev);
    for (const key of changed) this.aiTouched.set(key, rev);
    if (this.aiTouched.size > 400) this.aiTouched = new Map([...this.aiTouched].slice(-200));
  }
}

function describeSelection(sel) {
  const where = sel.track ? MODE[sel.track] ?? sel.track : '';
  const span = Number.isFinite(sel.start) && Number.isFinite(sel.end) ? ' ' + sec(sel.start) + '–' + sec(sel.end) : '';
  return (sel.id ?? '?') + (sel.label ? '「' + sel.label + '」' : '') + (where ? '（' + where + span + '）' : span);
}

/** 返回要注入的文本，没有新内容时返回 null */
export async function buildActivity(client, state, { step = 1, signal, maxEvents = 25 } = {}) {
  const base = '/api/p/' + encodeURIComponent(state.projectId);
  const since = state.lastInjectedRev ?? 0;
  const [changes, presence] = await Promise.all([
    client.get(base + '/changes?since=' + since + '&actor=user,system&limit=' + (maxEvents + 1), { timeoutMs: 800, signal }),
    client.get(base + '/presence', { timeoutMs: 800, signal }).catch(() => ({ user: null })),
  ]);
  const firstContact = state.lastInjectedRev === undefined;
  if (firstContact) state.lastSeenRev ??= changes.rev;
  const events = firstContact ? [] : changes.events;

  const user = presence?.user;
  const fresh = user && Date.now() - user.at < 120_000;
  const key = fresh ? JSON.stringify([(user.selection ?? []).map((s) => s.id), Math.round((user.playhead ?? 0) * 10), user.mode]) : null;
  const includePresence = Boolean(fresh && (events.length || (step === 1 && key !== state.presenceKey)));

  state.lastInjectedRev = changes.rev;
  if (!events.length && !includePresence) return null;
  if (includePresence) state.presenceKey = key;

  const lines = ['<editor-activity rev="' + changes.rev + '" since="' + since + '">'];
  if (events.length) {
    const shown = events.slice(0, maxEvents);
    lines.push('用户在剪辑面板里做了以下修改（已生效，时间线以此为准）：');
    for (const ev of shown) {
      const overlap = (ev.changed ?? []).filter((k) => state.aiTouched.has(k));
      const who = ev.actor === 'system' ? '系统' : '用户';
      lines.push('- ' + time(ev.at) + ' ' + who + (ev.label ? '「' + ev.label + '」' : '') + '：' + ((ev.summary ?? []).join('；') || '（结构调整）') + (overlap.length ? ' ← 改动了你之前修改过的对象' : ''));
    }
    if (changes.truncated || events.length > maxEvents) lines.push('…另有更多修改，需要时调用 djian_changes{since:' + since + '} 查看全部');
  }
  if (includePresence) {
    const parts = ['播放头 ' + sec(user.playhead ?? 0)];
    if (user.selection?.length) parts.push('选中 ' + user.selection.slice(0, 6).map(describeSelection).join('、'));
    if (user.mode) parts.push('编辑模式 ' + (MODE[user.mode] ?? user.mode));
    lines.push('用户当前：' + parts.join('；') + '。用户说“这段/这里/这个”时优先指这里。');
  }
  lines.push('</editor-activity>');
  return lines.join('\n');
}

/** 从已有会话历史里恢复上次注入到的修订号（宿主重启后避免重复注入） */
export function parseInjectedRev(text) {
  const m = /<editor-activity rev="(\d+)"/.exec(String(text ?? ''));
  return m ? Number(m[1]) : undefined;
}
