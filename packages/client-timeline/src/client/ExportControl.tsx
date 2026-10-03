import React, { useEffect, useState } from 'react';
import { timelineDurationInFrames, type Timeline } from '../../../engine/src/schema';
import { exportDownloadUrl } from './api';
import { Icon } from './Icon';
import { useDialog } from './useDialog';
import { useExportJob } from './useExportJob';

const dimension = (size: number, scale: number) => scale === 1 ? size : Math.max(16, Math.round(size * scale / 2) * 2);
function ExportPopover({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const dialog = useDialog(onClose);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('.djp-expwrap')) onClose();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [onClose]);
  return <div className="djp-pop djp-exppop" ref={dialog} role="dialog" aria-label="导出视频" tabIndex={-1}>
    <header className="djp-export-head"><strong>导出视频</strong><button className="djp-iconbtn" aria-label="关闭导出面板" onClick={onClose}><Icon name="close" /></button></header>
    {children}
  </div>;
}

export const ExportControl: React.FC<{ t: Timeline; sessionId?: string }> = ({ t, sessionId }) => {
  const job = useExportJob(sessionId);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [scale, setScale] = useState(1);
  const [quality, setQuality] = useState('standard');
  const busy = job.starting || job.status.status === 'rendering' || Boolean(job.jobId && job.status.status === 'idle');
  const done = job.status.status === 'done' && !settings;
  const percent = job.status.status === 'rendering' ? Math.max(0, Math.min(99, Math.round(job.status.progress.percent) || 0)) : 0;
  const stage = job.starting ? '正在提交导出…' : job.status.status === 'idle' ? '正在恢复任务…'
    : job.status.status === 'rendering' && job.status.progress.stage === 'preparing' ? '正在准备素材…'
    : job.status.status === 'rendering' && job.status.progress.stage === 'muxing' ? '正在合成声音…'
    : job.status.status === 'rendering' && job.status.progress.stage === 'encoding' ? '正在编码视频…' : '正在生成视频…';
  const duration = timelineDurationInFrames(t) / t.meta.fps;
  const error = job.status.status === 'error' ? job.status.error ?? '导出失败，请重试' : '';
  const errorSummary = /permission denied/i.test(error) ? '编码器无法写入文件，导出未完成。请检查输出目录权限或安全软件的拦截记录。'
    : error.length > 240 ? '导出未完成，请查看错误详情后重试。' : error;
  const hasContent = t.videoTracks.some((tr) => tr.clips.length) || t.audioTracks.some((tr) => tr.clips.length) || t.overlays.length > 0;
  const start = () => { setSettings(false); void job.start(t, { scale, quality }); };
  return <span className="djp-expwrap">
    <button className="djp-export" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      {busy ? job.connectionError ? '连接中…' : '导出 ' + percent + '%' : done ? '导出完成' : job.status.status === 'error' ? '导出失败' : '导出'}
    </button>
    {open && <ExportPopover onClose={() => setOpen(false)}>
      {busy ? <>
        <div className="djp-export-status" role="status"><strong>{job.connectionError ? '等待连接' : stage}</strong><span>{percent}%</span></div>
        <progress className="djp-export-progress" max={100} value={percent} aria-label="视频导出进度" />
        <p className="djp-export-note">{job.connectionError || '可以收起此面板继续剪辑，本次导出使用开始时的画面与声音。'}</p>
        {job.connectionError && <button className="djp-btn" onClick={job.reconnect}>立即重连</button>}
      </> : done && job.status.status === 'done' ? <>
        <div className="djp-export-result" role="status"><strong>视频已就绪</strong><span>{(job.status.result.sizeBytes / 1048576).toFixed(1)} MB · MP4</span></div>
        <span className="djp-export-filename" title={job.status.result.fileName}>{job.status.result.fileName}</span>
        <a className="djp-export" href={exportDownloadUrl + '?jobId=' + encodeURIComponent(job.jobId ?? '')} download={job.status.result.fileName}>下载视频</a>
        <button className="djp-btn" onClick={() => setSettings(true)}>重新导出当前版本</button>
      </> : <>
        {error && <p className="djp-export-error" role="alert">{errorSummary}</p>}
        {error && error !== errorSummary && <details className="djp-export-details"><summary>错误详情</summary><pre>{error}</pre></details>}
        <p className="djp-export-note">MP4 · {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')} · {t.meta.fps} fps</p>
        <label className="djp-field"><span>分辨率</span><select className="djp-select" value={scale} onChange={(e) => setScale(Number(e.target.value))}>
          {[1, .5, 2].map((value) => <option key={value} value={value}>{value === 1 ? '原始' : value * 100 + '%'}（{dimension(t.meta.width, value)}×{dimension(t.meta.height, value)}）</option>)}
        </select></label>
        <label className="djp-field"><span>质量</span><select className="djp-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
          <option value="draft">草稿 · 文件更小</option><option value="standard">标准 · 推荐</option><option value="high">高画质 · 文件更大</option>
        </select></label>
        {!hasContent && <p className="djp-export-note">添加画面、音频或字幕后即可导出。</p>}
        <button className="djp-export" disabled={!hasContent} onClick={start}>{job.status.status === 'error' ? '重试导出' : '开始导出'}</button>
      </>}
    </ExportPopover>}
  </span>;
};
