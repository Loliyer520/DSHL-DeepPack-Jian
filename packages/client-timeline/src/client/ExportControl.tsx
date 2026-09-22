import React, { useEffect, useRef, useState } from 'react';
import type { Timeline } from '../../../engine/src/schema';
import { exportDownloadUrl, getExportStatus, startExportWith } from './api';

const fmtSize = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

type ExportUi =
  | { phase: 'idle' }
  | { phase: 'rendering'; percent: number }
  | { phase: 'done'; fileName: string; sizeBytes: number }
  | { phase: 'error'; message: string };

// 导出控制：参数弹层（分辨率缩放 + 质量档）→ 单飞行任务 → 轮询 → 下载链接
export const ExportControl: React.FC<{ t: Timeline }> = ({ t }) => {
  const [exp, setExp] = useState<ExportUi>({ phase: 'idle' });
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [quality, setQuality] = useState('standard');
  const pollRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  useEffect(() => stopPolling, []);

  const start = async () => {
    setOpen(false);
    setExp({ phase: 'rendering', percent: 0 });
    try {
      await startExportWith(t, { scale, quality });
      stopPolling();
      pollRef.current = window.setInterval(async () => {
        try {
          const s = await getExportStatus();
          if (s.status === 'rendering') setExp({ phase: 'rendering', percent: s.progress?.percent ?? 0 });
          else if (s.status === 'done') {
            stopPolling();
            setExp({ phase: 'done', fileName: s.result.fileName, sizeBytes: s.result.sizeBytes });
          } else if (s.status === 'error') {
            stopPolling();
            setExp({ phase: 'error', message: s.error ?? '渲染失败' });
          }
        } catch {
          // 网络抖动等下一轮
        }
      }, 1000);
    } catch (e) {
      setExp({ phase: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  };

  if (exp.phase === 'rendering') {
    return <button className="djp-export" disabled>导出中 {exp.percent}%</button>;
  }
  if (exp.phase === 'done') {
    return (
      <a
        className="djp-export"
        href={exportDownloadUrl}
        download={exp.fileName}
        title={`${exp.fileName} · ${fmtSize(exp.sizeBytes)}`}
        onClick={() => window.setTimeout(() => setExp({ phase: 'idle' }), 4000)}
      >
        下载 mp4
      </a>
    );
  }

  return (
    <span className="djp-expwrap">
      {exp.phase === 'error' && (
        <button className="djp-export djp-error" onClick={() => setOpen(true)} title={exp.message}>
          失败重试
        </button>
      )}
      {exp.phase !== 'error' && (
        <button className="djp-export" onClick={() => setOpen((v) => !v)}>导出</button>
      )}
      {open && (
        <div className="djp-pop djp-exppop">
          <label className="djp-field">
            <span>分辨率</span>
            <select className="djp-select" value={scale} onChange={(e) => setScale(Number(e.target.value))}>
              <option value={1}>原始（{t.meta.width}×{t.meta.height}）</option>
              <option value={0.5}>50%（{Math.round((t.meta.width * 0.5) / 2) * 2}×{Math.round((t.meta.height * 0.5) / 2) * 2}）</option>
              <option value={2}>200%（{t.meta.width * 2}×{t.meta.height * 2}）</option>
            </select>
          </label>
          <label className="djp-field">
            <span>质量</span>
            <select className="djp-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
              <option value="draft">草稿（快、小）</option>
              <option value="standard">标准</option>
              <option value="high">高（慢、大）</option>
            </select>
          </label>
          <button className="djp-export" style={{ alignSelf: 'flex-end' }} onClick={() => void start()}>
            开始导出
          </button>
        </div>
      )}
    </span>
  );
};
