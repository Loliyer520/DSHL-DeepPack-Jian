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
| 多轨视频/音频 | ❌ schema 单轨 | ✅ schema v2（本轮）：videoTracks[0] 主轨串行 + 叠加轨 PiP + audioTracks 多轨 |
| 画中画 | ❌ | ✅ 本轮：box 0-1 分数矩形（右下默认 30%）+ 位置预设 + 绝对时间摆放 |
| 滤镜/特效/变速/关键帧 | ❌ | 下轮 |
| 转场扩展（擦除/滑动等） | ❌ 仅 fade/none | 下轮 |
| 字幕样式预设/背景 | ❌ 基础字段 | 下轮 |
| 片段分割/拖柄 trim | ❌ 数值输入 | 下轮（轨道交互增强） |

## 设计要点

- **项目 = 文件夹**：`~/.djian/projects/<id>/`，`~/.djian/current` 存活跃 id；旧全局 timeline.json 迁移为 default 项目。
- **事实源不变**：/api/internal/timeline 与 /api/internal/ops 一律作用于当前项目，路径不变（向后兼容）。
- **素材解析顺序**：项目 assets/ → webui public（旧 src 兼容）；缩略图 ffmpeg 懒生成缓存到 .thumbs/。
- **导出参数**：scale 克隆 timeline 改 meta 宽高（偶数对齐），crf 透传 renderMedia。
- **AI 工具新增**：project_list / project_create / project_switch / asset_list；setMeta 走既有 apply_timeline_ops。

## schema v2（2026-09-22 本轮，多轨）

- **v1 JSON 全兼容**：parseTimeline 收 v1/v2，内部归一化 v2（clips→主轨、audio→音频轨）；磁盘时间线首次加载即升级。
- **模型**：videoTracks[0] 主轨串行（Series）；videoTracks[1+] 叠加轨（clip.atSeconds 绝对秒 + box{x,y,w,h} 0-1 分数，默认右下 30%）；audioTracks[{volume,muted,clips[{src,inPoint,duration,atSeconds,volume}]}]；总时长 = 三方最大。
- **新 ops**：addAudio / removeAudio / updateAudioTrack；addClip 增 track/box/atSeconds（track:"pip" 进叠加轨）。
- **引擎修复**：bundle 缓存按素材目录键控，上传新素材后 bundle 快照 404 → 新增 invalidateBundle()，素材上传/删除时服务端调用。
- **验证**：双轨成片（主轨+左下 PiP+440Hz 音轨）——PiP 区 PSNR 4.97 vs 运动基线 15.0 确认叠加渲染；分窗 volumedetect 证实音频精确 0–6s 摆放（6s 后 -40.8dB 静音底）；5190 面板 DOM 断言 3 行轨道/画中画块/音频块齐全。
- 注意：旧测试素材 a.mp4 无音轨，音频轨要指真音频文件（wav/mp3/m4a）或带声视频。
