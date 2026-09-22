# D剪 产品缺口审计与补全方案（2026-09-22）

## 审计：对照专业剪辑软件的能力清单

| 方向 | 现状 | 本轮回补 |
|---|---|---|
| 项目管理 | ❌ 全局单条 timeline.json | ✅ 项目制：~/.djian/projects/<id>/{project.json,timeline.json,assets/} |
| 画布调节 | 🟡 meta 有字段，无 UI | ✅ 预设（1080p/720p/竖屏/方形/4K）+ 自定义 + setMeta op |
| 素材文件夹 | ❌ 散装 webui/public | ✅ 项目 assets/ + 上传/删除/缩略图/时长探测 |
| 素材库 UI | ❌ | ✅ 面板素材网格：上传、一键加为片段 |
| 导出参数 | ❌ 固定吃 meta | ✅ 分辨率缩放（50/100/200%）+ 质量档（draft/standard/high → crf） |
| 撤销/重做 | ❌ | ✅ 面板侧快照栈（Ctrl+Z / Ctrl+Shift+Z，上限 50） |
| 多轨视频/音频 | ❌ schema 单轨 | 下轮（schema v2） |
| 滤镜/特效/变速/关键帧 | ❌ | 下轮（schema v2） |
| 转场扩展（擦除/滑动等） | ❌ 仅 fade/none | 下轮 |
| 字幕样式预设/背景 | ❌ 基础字段 | 下轮 |
| 片段分割/拖柄 trim | ❌ 数值输入 | 下轮（轨道交互增强） |

## 设计要点

- **项目 = 文件夹**：`~/.djian/projects/<id>/`，`~/.djian/current` 存活跃 id；旧全局 timeline.json 迁移为 default 项目。
- **事实源不变**：/api/internal/timeline 与 /api/internal/ops 一律作用于当前项目，路径不变（向后兼容）。
- **素材解析顺序**：项目 assets/ → webui public（旧 src 兼容）；缩略图 ffmpeg 懒生成缓存到 .thumbs/。
- **导出参数**：scale 克隆 timeline 改 meta 宽高（偶数对齐），crf 透传 renderMedia。
- **AI 工具新增**：project_list / project_create / project_switch / asset_list；setMeta 走既有 apply_timeline_ops。
