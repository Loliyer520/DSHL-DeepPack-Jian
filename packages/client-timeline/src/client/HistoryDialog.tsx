import { useDialog } from './useDialog';
import React, { useEffect, useRef, useState } from 'react';
import { apiFetch, scopedPath } from './api';
import { useProjectSession } from './ProjectSession';

interface SnapInfo {
  id: string;
  at: string;
  label: string;
}

// 版本历史弹层：AI 修改自动存档 + 手动恢复（恢复前服务端自动保底快照，可来回切）
export const HistoryDialog: React.FC<{ onClose: () => void; onRestored: () => void; beforeRestore: () => Promise<void> }> = ({ onClose, onRestored, beforeRestore }) => {
  const sessionId = useProjectSession();
  const restoring = useRef(false);
  const close = () => { if (!restoring.current) onClose(); };
  const dialogRef = useDialog(close);
  const [snaps, setSnaps] = useState<SnapInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErr('');
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let disposed = false;
    apiFetch(scopedPath(`/api/history`, sessionId), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.snapshots)) throw new Error('历史列表格式异常');
        if (!controller.signal.aborted) setSnaps(data.snapshots);
      })
      .catch(() => { if (!disposed) setErr('历史列表加载失败或超时，请重试。'); })
      .finally(() => { clearTimeout(timeout); if (!disposed) setLoading(false); });
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [sessionId, attempt]);

  const restore = async (id: string) => {
    if (restoring.current) return;
    restoring.current = true;
    setBusy(id);
    setErr('');
    try {
      await beforeRestore();
      const r = await apiFetch(scopedPath(`/api/history/${encodeURIComponent(id)}`, sessionId), { method: 'POST', signal: AbortSignal.timeout(15_000) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      onRestored();
      onClose();
    } catch (e) {
      setErr(e instanceof Error && e.name === 'TimeoutError'
        ? '恢复请求超时，结果尚未确认。请关闭此窗口检查当前时间线，再决定是否重试。'
        : e instanceof Error ? e.message : String(e));
    } finally {
      restoring.current = false;
      setBusy(null);
    }
  };

  return (
    <div className="djp-mask" onClick={close}>
      <div className="djp-dialog djp-history" ref={dialogRef} role="dialog" aria-modal="true" aria-label="版本历史" aria-busy={busy !== null} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="djp-history-head">
          <div className="djp-dialog-title">版本历史</div>
          <button className="djp-btn" disabled={busy !== null} onClick={close}>关闭</button>
        </div>
        {err && <div className="djp-error" role="alert">{err} <button className="djp-btn" disabled={loading || busy !== null} onClick={() => setAttempt((value) => value + 1)}>重新加载</button></div>}
        <div className="djp-hist-list">
          {loading && <div className="djp-hint" role="status">正在加载历史记录…</div>}
          {!loading && !err && snaps.length === 0 && <div className="djp-hint">还没有快照——AI 每次修改时间线都会自动存档。</div>}
          {snaps.map((s) => (
            <div className="djp-hist-row" key={s.id}>
              <span className="djp-hist-meta">
                <span className="djp-hist-label" title={s.label}>{s.label || '(无标注)'}</span>
                <time className="djp-hist-time" dateTime={s.at}>{new Date(s.at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
              </span>
              <button className="djp-btn" aria-label={`恢复 ${s.label || '无标注版本'}，${new Date(s.at).toLocaleString()}`} disabled={loading || busy !== null} onClick={() => restore(s.id)}>
                {busy === s.id ? '恢复中…' : '恢复'}
              </button>
            </div>
          ))}
        </div>
        <div className="djp-hint" style={{ marginTop: 8 }}>
          最多保留 40 份；恢复前当前状态也会自动存一份，可来回切换。
        </div>
      </div>
    </div>
  );
};
