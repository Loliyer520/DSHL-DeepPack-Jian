import React, { useEffect, useState } from 'react';
import { API_BASE } from './api';

interface SnapInfo {
  id: string;
  at: string;
  label: string;
}

// 版本历史弹层：AI 修改自动存档 + 手动恢复（恢复前服务端自动保底快照，可来回切）
export const HistoryDialog: React.FC<{ onClose: () => void; onRestored: () => void }> = ({ onClose, onRestored }) => {
  const [snaps, setSnaps] = useState<SnapInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/history`)
      .then((r) => r.json())
      .then((d) => setSnaps(d.snapshots ?? []))
      .catch(() => setErr('历史列表加载失败'));
  }, []);

  const restore = async (id: string) => {
    setBusy(id);
    setErr('');
    try {
      const r = await fetch(`${API_BASE}/api/history/${encodeURIComponent(id)}`, { method: 'POST' });
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

  return (
    <div className="djp-mask" onClick={onClose}>
      <div className="djp-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="djp-dialog-title">版本历史</div>
        {err && <div className="djp-error">{err}</div>}
        <div className="djp-hist-list">
          {snaps.length === 0 && <div className="djp-hint">还没有快照——AI 每次修改时间线都会自动存档。</div>}
          {snaps.map((s) => (
            <div className="djp-hist-row" key={s.id}>
              <span className="djp-hist-meta">
                <span className="djp-hist-time">{new Date(s.at).toLocaleTimeString()}</span>
                <span className="djp-hist-label" title={s.label}>{s.label || '(无标注)'}</span>
              </span>
              <button className="djp-btn" disabled={busy !== null} onClick={() => restore(s.id)}>
                {busy === s.id ? '恢复中…' : '恢复'}
              </button>
            </div>
          ))}
        </div>
        <div className="djp-dialog-actions">
          <button className="djp-btn" onClick={onClose}>关闭</button>
        </div>
        <div className="djp-hint" style={{ marginTop: 8 }}>
          最多保留 40 份；恢复前当前状态也会自动存一份，可来回切换。
        </div>
      </div>
    </div>
  );
};
