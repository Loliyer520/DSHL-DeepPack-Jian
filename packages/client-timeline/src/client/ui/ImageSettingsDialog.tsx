// AI 生图设置：OpenAI 兼容中转站的地址 / 密钥 / 模型 / 超时。密钥只保存到本机引擎，响应里永远只有脱敏提示。
import React, { useEffect, useState } from 'react';
import { useEditor } from '../context';
import { api, type ImageSettingsView } from '../engine';
import { Dialog } from './common';

export function ImageSettingsDialog({ onClose }: { onClose: () => void }) {
  const ed = useEditor();
  const [view, setView] = useState<ImageSettingsView | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [timeoutSec, setTimeoutSec] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    api.imageSettings().then((v) => {
      if (stop) return;
      setView(v);
      setBaseUrl(v.baseUrl);
      setModel(v.model);
      setTimeoutSec(String(Math.round(v.timeoutMs / 1000)));
    }).catch((e) => { if (!stop) setError(e instanceof Error ? e.message : String(e)); });
    return () => { stop = true; };
  }, []);

  const save = async (extra: { apiKey?: string } = {}) => {
    setBusy(true);
    setError(null);
    try {
      const key = apiKey.trim();
      const seconds = Number(timeoutSec);
      const v = await api.saveImageSettings({
        ...extra,
        ...(extra.apiKey === '' ? {} : key ? { apiKey: key } : {}),
        baseUrl: baseUrl.trim() || null,
        model: model.trim() || null,
        timeoutMs: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : null,
      });
      setView(v);
      setApiKey('');
      ed.store.toast('info', v.configured ? 'AI 生图设置已保存' : '已保存：尚未配置密钥，AI 生图前需要填写');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const stopKeys = (e: React.KeyboardEvent) => { e.stopPropagation(); };
  return (
    <Dialog title="AI 生图设置" onClose={onClose} footer={
      <>
        {view?.configured && <button className="dj-btn" disabled={busy} onClick={() => void save({ apiKey: '' })}>清除密钥</button>}
        <span className="dj-spacer" />
        <button className="dj-btn" onClick={onClose}>取消</button>
        <button className="dj-btn dj-primary" disabled={busy || !view} onClick={() => void save()}>{busy ? '保存中…' : '保存'}</button>
      </>
    }>
      {!view && !error && <p className="dj-hint">正在加载…</p>}
      {error && <p className="dj-hint" style={{ color: 'var(--dj-danger)' }}>{error}</p>}
      {view && (
        <>
          <div className="dj-field" style={{ marginBottom: 10 }}>
            <span>API Key{view.configured ? '（' + view.apiKeyHint + '，留空保持不变）' : ''}</span>
            <input className="dj-input" type="password" autoComplete="off" placeholder={view.configured ? '已配置，留空保持不变' : '中转站密钥，如 sk-…'}
              value={apiKey} onChange={(e) => setApiKey(e.target.value)} onKeyDown={stopKeys} />
          </div>
          <div className="dj-field" style={{ marginBottom: 10 }}>
            <span>接口地址（OpenAI 兼容）</span>
            <input className="dj-input" placeholder="https://api.openai.com/v1" value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)} onKeyDown={stopKeys} />
          </div>
          <div className="dj-field" style={{ marginBottom: 10 }}>
            <span>默认模型</span>
            <input className="dj-input" placeholder="gpt-image-1" value={model}
              onChange={(e) => setModel(e.target.value)} onKeyDown={stopKeys} />
          </div>
          <div className="dj-field" style={{ marginBottom: 10 }}>
            <span>超时（秒，1–600）</span>
            <input className="dj-input" inputMode="numeric" placeholder="300" value={timeoutSec}
              onChange={(e) => setTimeoutSec(e.target.value.replace(/[^\d]/g, ''))} onKeyDown={stopKeys} />
          </div>
          <p className="dj-hint">配置保存在本机（引擎数据目录 settings.json），不会出现在对话里。保存后 AI 立即可用 djian_image 生成 / 改造图片素材，无需重启。</p>
        </>
      )}
    </Dialog>
  );
}
