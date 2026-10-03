import { useEffect, useRef, useState } from 'react';
import { ExportRequestError, getExportStatus, startExportWith, type ExportStatus } from './api';

export function useExportJob(sessionId?: string) {
  const storageKey = `djian.export.${sessionId ?? 'default'}`;
  const [jobId, setJobId] = useState<string | null>(() => {
    try { return sessionStorage.getItem(storageKey); } catch { return null; }
  });
  const [status, setStatus] = useState<ExportStatus>({ status: 'idle' });
  const [starting, setStarting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    if (!jobId) return;
    let stopped = false, failures = 0;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    const poll = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 12000);
      try {
        const next = await getExportStatus(jobId, controller.signal);
        if (stopped) return;
        failures = 0;
        setConnectionError('');
        if (next.status === 'idle') {
          setStatus({ status: 'error', error: '导出任务已结束或丢失，请重新导出' });
          return;
        }
        setStatus(next);
        if (next.status !== 'rendering') return;
      } catch (error) {
        if (stopped) return;
        if (error instanceof ExportRequestError && error.status >= 400 && error.status < 500) {
          setStatus({ status: 'error', error: error.message });
          setConnectionError('');
          return;
        }
        failures++;
        setConnectionError('暂时无法获取进度，正在重新连接。导出任务可能仍在运行。');
      } finally { clearTimeout(timeout); }
      if (!stopped) timer = setTimeout(poll, Math.min(10000, 1000 * 2 ** failures));
    };
    void poll();
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); };
  }, [jobId, retry]);

  const start = async (timeline: unknown, options: { scale: number; quality: string }) => {
    if (busy.current || starting || (jobId && status.status === 'rendering')) return;
    busy.current = true;
    setStarting(true); setConnectionError('');
    setJobId(null);
    try {
      const id = await startExportWith(timeline, { ...options, sessionId });
      // Keep the receipt even if the panel was closed while the request finished.
      try { sessionStorage.setItem(storageKey, id); } catch { /* In-memory tracking remains available. */ }
      if (alive.current) {
        setStatus({ status: 'rendering', progress: { percent: 0, stage: 'preparing' } });
        setJobId(id);
      }
    } catch (error) {
      if (alive.current) setStatus({ status: 'error', error: error instanceof Error ? error.message : '无法开始导出' });
    } finally {
      busy.current = false;
      if (alive.current) setStarting(false);
    }
  };
  return { jobId, status, starting, connectionError, start, reconnect: () => setRetry((n) => n + 1) };
}
