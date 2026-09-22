import React, { useEffect, useRef, useState } from 'react';
import {
  assetThumbUrl,
  deleteAsset,
  listAssets,
  uploadAsset,
  type AssetInfo,
} from './api';

const fmtSize = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`;
const fmtDur = (d: number | null) => (d == null ? '' : `${d.toFixed(1)}s`);

// 素材库：网格缩略图 + 上传 + 加为片段 / 设为配乐 / 删除
export const AssetsSection: React.FC<{
  onAddClip: (asset: AssetInfo) => void;
  onSetBgm: (name: string) => void;
}> = ({ onAddClip, onSetBgm }) => {
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      setAssets(await listAssets());
      setError('');
    } catch {
      // 引擎没起来就保持现状
    }
  };
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    setBusy(true);
    setError('');
    try {
      for (const f of Array.from(files)) await uploadAsset(f);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDelete = async (name: string) => {
    if (!window.confirm(`删除素材「${name}」？时间线里引用它的片段会失效。`)) return;
    try {
      await deleteAsset(name);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="djp-section">
      <div className="djp-section-head">
        <span
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? '展开' : '收起'}
        >
          {collapsed ? '▸' : '▾'} 素材库（{assets.length}）
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="video/*,image/*,audio/*"
            style={{ display: 'none' }}
            onChange={(e) => void onFiles(e.target.files)}
          />
          <button
            className="djp-btn"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            title="上传视频/图片/音频到当前项目素材文件夹"
          >
            {busy ? '上传中…' : '上传'}
          </button>
        </span>
      </div>
      {error && <div className="djp-hint" style={{ color: 'var(--dsw-alias-state-error-primary)' }}>{error}</div>}
      {!collapsed &&
        (assets.length === 0 ? (
          <div className="djp-hint">空素材库——点「上传」把素材放进当前项目</div>
        ) : (
          <div className="djp-assets">
            {assets.map((a) => (
              <div className="djp-asset" key={a.name} title={`${a.name} · ${fmtSize(a.size)}${a.duration ? ` · ${fmtDur(a.duration)}` : ''}`}>
                {a.thumb ? (
                  <img className="djp-asset-thumb" src={assetThumbUrl(a.name)} alt={a.name} loading="lazy" />
                ) : (
                  <div className="djp-asset-thumb djp-asset-audio">♪</div>
                )}
                <div className="djp-asset-name">{a.name}</div>
                <div className="djp-asset-acts">
                  {a.type !== 'audio' ? (
                    <button title="加为片段" onClick={() => onAddClip(a)}>＋片段</button>
                  ) : (
                    <button title="设为配乐" onClick={() => onSetBgm(a.name)}>♪配乐</button>
                  )}
                  <button title="删除素材" onClick={() => void onDelete(a.name)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};
