// 对话框：导出、历史版本、快捷键
import React, { useEffect, useState } from 'react';
import { useEditor, useStore } from '../context';
import { api, exportDownloadUrl, type ExportStatus, type Snapshot } from '../engine';
import { timecode } from '../geometry';
import { timelineDurationInFrames } from '../../../../engine/src/timeline';
import { Dialog } from './common';
import { Icon } from '../Icon';

// 导出任务在对话框关掉后仍在跑；按项目记住，重新打开能接上进度
const activeJobs = new Map<string, string>();
const STAGE: Record<string, string> = { preparing: '准备中', bundling: '打包渲染器', rendering: '渲染画面', encoding: '渲染并编码', muxing: '合成音频', stitching: '拼接' };

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const project = useStore((s) => s.project);
  const timeline = useStore((s) => s.timeline);
  const pending = useStore((s) => s.pending);
  const [scale, setScale] = useState(1);
  const [quality, setQuality] = useState<'draft' | 'standard' | 'high'>('standard');
  const [jobId, setJobId] = useState<string | null>(() => (project ? activeJobs.get(project.id) ?? null : null));
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!jobId) return;
    let stop = false;
    const tick = async () => {
      try {
        const s = await api.exportStatus(jobId);
        if (stop) return;
        setStatus(s);
        if (s.status === 'rendering') setTimeout(() => void tick(), 1000);
        else if (project) activeJobs.delete(project.id);
      } catch (e) {
        if (!stop) { setError(e instanceof Error ? e.message : String(e)); if (project) activeJobs.delete(project.id); }
      }
    };
    void tick();
    return () => { stop = true; };
  }, [jobId, project]);
  if (!project || !timeline) return null;
  const { width, height, fps } = timeline.meta;
  const dur = timelineDurationInFrames(timeline) / fps;
  const start = async () => {
    setError(null); setStatus(null);
    try {
      const r = await api.startExport(project.id, { scale, quality });
      activeJobs.set(project.id, r.jobId);
      setJobId(r.jobId);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  const rendering = status?.status === 'rendering' || (jobId && !status && !error);
  return (
    <Dialog title="导出视频" onClose={onClose} footer={
      rendering ? <><button className="dj-btn" onClick={onClose}>后台继续</button><button className="dj-btn dj-danger" onClick={() => jobId && void api.cancelExport(jobId)}>取消导出</button></>
        : status?.status === 'done' ? <><button className="dj-btn" onClick={() => { setJobId(null); setStatus(null); }}>再导出一份</button><a className="dj-btn dj-primary" href={exportDownloadUrl(jobId!)} download={status.result?.fileName}><Icon name="export" />下载 MP4</a></>
          : <><button className="dj-btn" onClick={onClose}>取消</button><button className="dj-btn dj-primary" disabled={pending > 0} onClick={() => void start()}>{pending > 0 ? '等待保存…' : '开始导出'}</button></>
    }>
      {!jobId || (status && status.status !== 'rendering' && status.status !== 'done') ? (
        <>
          <div className="dj-field" style={{ marginBottom: 10 }}><span>分辨率</span>
            <div className="dj-seg dj-seg-full" role="radiogroup" aria-label="分辨率">
              {[0.5, 1, 2].map((s) => <button key={s} role="radio" aria-checked={scale === s} onClick={() => setScale(s)}>{Math.round(width * s)}×{Math.round(height * s)}</button>)}
            </div>
          </div>
          <div className="dj-field" style={{ marginBottom: 10 }}><span>画质</span>
            <div className="dj-seg dj-seg-full" role="radiogroup" aria-label="画质">
              {([['draft', '草稿（快）'], ['standard', '标准'], ['high', '高画质']] as const).map(([k, l]) => <button key={k} role="radio" aria-checked={quality === k} onClick={() => setQuality(k)}>{l}</button>)}
            </div>
          </div>
          <p className="dj-hint">时长 {timecode(dur, fps, false)} · {fps}fps · H.264 + AAC。导出在本机进行，可关闭此窗口继续编辑。</p>
          {status?.status === 'cancelled' && <p className="dj-hint">已取消。</p>}
          {status?.status === 'error' && <p className="dj-hint" style={{ color: 'var(--dj-danger)' }}>导出失败：{status.error}</p>}
        </>
      ) : status?.status === 'done' ? (
        <p>导出完成：{status.result?.fileName}（{((status.result?.sizeBytes ?? 0) / 1048576).toFixed(1)} MB）</p>
      ) : (
        <>
          <p className="dj-hint">{STAGE[status?.progress.stage ?? 'preparing'] ?? status?.progress.stage} · {status?.progress.percent ?? 0}%</p>
          <div className="dj-progress"><i style={{ width: (status?.progress.percent ?? 0) + '%' }} /></div>
        </>
      )}
      {error && <p className="dj-hint" style={{ color: 'var(--dj-danger)' }}>{error}</p>}
    </Dialog>
  );
}

export function HistoryDialog({ onClose }: { onClose: () => void }) {
  const ed = useEditor();
  const project = useStore((s) => s.project);
  const [snaps, setSnaps] = useState<Snapshot[] | null>(null);
  const [label, setLabel] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => { if (project) api.history(project.id).then((r) => setSnaps(r.snapshots)).catch((e) => ed.store.toast('error', '读取历史失败：' + e.message)); };
  useEffect(load, [project]);
  if (!project) return null;
  const save = async () => {
    setBusy(true);
    try { await api.saveVersion(project.id, label.trim() || '手动保存'); setLabel(''); load(); ed.store.toast('info', '已保存版本'); }
    catch (e) { ed.store.toast('error', '保存失败：' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const restore = async (s: Snapshot) => {
    setBusy(true);
    try { await api.restore(project.id, s.id, ed.store.clientId); ed.store.toast('info', '已恢复到「' + s.label + '」，可撤销'); onClose(); }
    catch (e) { ed.store.toast('error', '恢复失败：' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); setConfirm(null); }
  };
  return (
    <Dialog title="历史版本" onClose={onClose}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input className="dj-input" placeholder="版本备注（可选）" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') void save(); }} />
        <button className="dj-btn dj-primary" disabled={busy} onClick={() => void save()}>保存当前版本</button>
      </div>
      <p className="dj-hint" style={{ marginTop: 0 }}>AI 大改前、恢复前会自动存档；恢复本身也可以撤销。</p>
      {!snaps && <p className="dj-hint">正在加载…</p>}
      {snaps && !snaps.length && <div className="dj-empty-state">还没有历史版本</div>}
      <div className="dj-list">
        {snaps?.map((s) => (
          <div key={s.id}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
              <small>{new Date(s.at).toLocaleString()} · {s.actor === 'ai' ? 'AI' : s.actor === 'user' ? '你' : '自动'}{s.rev != null ? ' · 版本 ' + s.rev : ''}</small>
            </div>
            {confirm === s.id
              ? <><button className="dj-btn" onClick={() => setConfirm(null)}>取消</button><button className="dj-btn dj-primary" disabled={busy} onClick={() => void restore(s)}>确认恢复</button></>
              : <button className="dj-btn" onClick={() => setConfirm(s.id)}>恢复</button>}
          </div>
        ))}
      </div>
    </Dialog>
  );
}

export const SHORTCUTS: [string, string][] = [
  ['播放 / 暂停', 'Space'], ['后退 1 秒 / 暂停 / 播放', 'J / K / L'], ['上一帧 / 下一帧', '← / →'], ['后退 / 前进 1 秒', 'Shift + ← / →'],
  ['上一个 / 下一个剪辑点', '↑ / ↓'], ['跳到开头 / 结尾', 'Home / End'], ['分割', 'S 或 Ctrl+B'], ['删除', 'Delete / Backspace'],
  ['裁掉播放头之前 / 之后', 'Q / W'], ['复制 / 粘贴 / 创建副本', 'Ctrl+C / Ctrl+V / Ctrl+D'], ['撤销 / 重做', 'Ctrl+Z / Ctrl+Shift+Z'],
  ['全选', 'Ctrl+A'], ['添加字幕 / 标记', 'T / M'], ['微移选中 1 帧（加 Shift 为 10 帧）', 'Alt + ← / →'], ['放大 / 缩小时间线', '+ / -（或 Ctrl+滚轮）'],
  ['时间线适应窗口', 'Shift+Z'], ['吸附开关', 'N'], ['选中内容交给 AI', 'Ctrl+Enter'], ['取消选择 / 取消拖动', 'Esc'], ['快捷键说明', '?'],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="快捷键" onClose={onClose}>
      <table className="dj-kbd-table"><tbody>{SHORTCUTS.map(([a, k]) => <tr key={a}><td>{a}</td><td>{k}</td></tr>)}</tbody></table>
    </Dialog>
  );
}
