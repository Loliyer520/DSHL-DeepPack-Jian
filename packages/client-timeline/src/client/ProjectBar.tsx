import React, { useEffect, useState } from 'react';
import { createProject, listProjects, switchProject, type ProjectInfo } from './api';

// 画布预设（与 MCP project_create 的预设一致）
export const CANVAS_PRESETS = [
  { key: '1080p', label: '1080p 横屏', meta: { width: 1920, height: 1080, fps: 30 } },
  { key: '720p', label: '720p 横屏', meta: { width: 1280, height: 720, fps: 30 } },
  { key: 'vertical', label: '竖屏 9:16', meta: { width: 1080, height: 1920, fps: 30 } },
  { key: 'square', label: '方形 1:1', meta: { width: 1080, height: 1080, fps: 30 } },
  { key: '4k', label: '4K 横屏', meta: { width: 3840, height: 2160, fps: 30 } },
];

// 项目切换栏：下拉切换 + 新建（名称 + 画布预设）
export const ProjectBar: React.FC<{ onSwitched: () => void }> = ({ onSwitched }) => {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [current, setCurrent] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [preset, setPreset] = useState('1080p');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const r = await listProjects();
      setProjects(r.projects);
      setCurrent(r.current);
    } catch {
      // 引擎没起来就静默
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  const onSwitch = async (id: string) => {
    if (!id || id === current || busy) return;
    setBusy(true);
    try {
      await switchProject(id);
      setCurrent(id);
      onSwitched();
    } catch {
      // 切换失败保持原状
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const p = CANVAS_PRESETS.find((x) => x.key === preset) ?? CANVAS_PRESETS[0];
      const r = await createProject(name.trim() || '未命名项目', p.meta);
      await switchProject(r.id);
      setCreating(false);
      setName('');
      await refresh();
      onSwitched();
    } catch {
      // 创建失败留在表单
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="djp-projbar">
      <span className="djp-proj-label">项目</span>
      <select
        className="djp-select djp-proj-select"
        value={current}
        disabled={busy}
        onChange={(e) => void onSwitch(e.target.value)}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.meta ? `（${p.meta.width}×${p.meta.height}）` : ''}
          </option>
        ))}
      </select>
      <button className="djp-add" title="新建项目" onClick={() => setCreating((v) => !v)}>
        +
      </button>
      {creating && (
        <div className="djp-pop djp-proj-new">
          <input
            type="text"
            placeholder="项目名称"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onCreate();
              if (e.key === 'Escape') setCreating(false);
            }}
          />
          <select className="djp-select" value={preset} onChange={(e) => setPreset(e.target.value)}>
            {CANVAS_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}（{p.meta.width}×{p.meta.height}@{p.meta.fps}）
              </option>
            ))}
          </select>
          <button className="djp-export" disabled={busy} onClick={() => void onCreate()}>
            创建
          </button>
        </div>
      )}
    </div>
  );
};
