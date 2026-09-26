import React, { useEffect, useState } from 'react';
import { sessionProject, type ProjectInfo } from './api';

// 会话=项目：一个 dsh 会话固定绑定一个剪辑项目（服务端 sessions.json 管理绑定）。
// 这里只做展示——不提供切换/新建；新会话由服务端自动开新项目。
export const ProjectBar: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const [project, setProject] = useState<ProjectInfo | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let stop = false;
    sessionProject(sessionId)
      .then((p) => {
        if (!stop) setProject(p);
      })
      .catch(() => {
        // 引擎没起来就静默
      });
    return () => {
      stop = true;
    };
  }, [sessionId]);

  if (!project) return null;
  return (
    <div className="djp-projbar">
      <span className="djp-proj-icon" aria-hidden>▣</span>
      <span className="djp-proj-name" title={project.id}>{project.name}</span>
      {project.meta && (
        <span className="djp-proj-badge">
          {project.meta.width}×{project.meta.height} · {project.meta.fps}fps
        </span>
      )}
      <span className="djp-proj-tag">本会话项目</span>
    </div>
  );
};
