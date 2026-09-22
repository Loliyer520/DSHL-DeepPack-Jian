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
| 版本历史/崩溃恢复 | ❌ | ✅ 本轮：AI 修改自动快照（history/ 40 份）+ 手动恢复 + 恢复前保底快照 |
| 多轨视频/音频 | ❌ schema 单轨 | ✅ schema v2（本轮）：videoTracks[0] 主轨串行 + 叠加轨 PiP + audioTracks 多轨 |
| 画中画 | ❌ | ✅ 本轮：box 0-1 分数矩形（右下默认 30%）+ 位置预设 + 绝对时间摆放 |
| 变速 | ❌ | ✅ schema v3（本轮）：恒定变速 speed 0.1–10（占时不变、素材消耗换算 + playbackRate），双 UI 速度框 + AI 可调 |
| 关键帧 | ❌ | ✅ schema v3（本轮）：x/y/scale/opacity/rotation/volume 包络（线性插值），分割时右半段时间轴自动平移 |
| 滤镜调色 | ❌ | ✅ schema v3（本轮）：CSS 滤镜 7 通道 + 8 预设下拉（提亮/黑白/复古/暖调/冷调/高饱和/高对比/柔焦），AI 可设 |
| 抠像/特效/跟踪 | ❌ | 下轮起（优先级低） |
| 转场扩展（擦除/滑动等） | ❌ 仅 fade/none | 下轮 |
| 字幕样式预设/背景 | ❌ 基础字段 | 下轮 |
| 片段分割/拖柄 trim | ❌ 数值输入 | ✅ 本轮：✂ 分割（播放头切主轨/音频 clip）+ 轨道裁剪拖柄（头尾 trim）+ 拖拽移动（叠加/音频）+ 吸附（0/播放头/邻块边缘 0.12s） |

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

## schema v3（2026-09-22 本轮，表现力）

- **全 additive**：clip/audioClip 新增 `speed`（默认 1）+ 可选 `filter` / `animations`；旧 JSON 零改动照收。
- **恒定变速**：clipDuration 仍是成片占时；渲染 `endAt = inPoint + 占时 × speed` + `playbackRate = speed`。2x 快放占 2s → 吃素材 4s，实测 60 帧精确。**坑**：Remotion `endAt` 是素材源帧绝对位置（相对素材开头、含 inPoint），不是相对 startFrom 的时长——忘加 inPoint 会把入点吃掉。
- **关键帧**：`animations.{x?,y?,scale?,opacity?,rotation?,volume?}: [{t,v}]`，t=clip 内相对秒，线性插值、区间外钳端点（`evalKeyframes` 从 schema 导出）；x/y 是画布分数 translate，volume 包络乘在 clip.volume 上（视频/音频 clip 都支持）。
- **滤镜**：CSS filter 7 通道 `filterCss()`；验证证据 brightness 全帧均值 126.6→138.9、位移后左 20% 黑底 0.0、音量包络分窗 -25.8→-91dB。
- **服务端净化**（防项目变砖——坏值入库会让 parseTimeline 拒载）：sanitizeFilter/sanitizeAnimations/sanitizeSpeed；未知 filter 字段丢、坏关键帧整通道丢、越界数值 clamp（contrast 99→3）而非丢弃；splitClip 右半段 `shiftAnims` 时间轴平移；updateClip 找不到视频 clip 时回退音频 clip（AI 同一 op 给音频设包络/变速）。
- MCP：updateClip PATCH / addClip / addAudio 均带 v3 字段与描述；ops 协议描述补 v3 能力句。
- UI：双前端速度框（视频/画中画/音频）+ 滤镜预设下拉 ×8；5190 断言速度字段×5、滤镜下拉×4、预设齐全。
