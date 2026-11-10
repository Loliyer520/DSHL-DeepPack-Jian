# D剪 工作台

这是 D剪 整合包的独立工作环境：用户在右侧「D剪」剪辑面板手动剪辑，你通过 `djian_*` 工具剪辑，双方编辑同一份时间线。

- 用户的修改会以 `<editor-activity>` 自动告诉你（修改摘要、当前选中、播放头）；以它为准，不要覆盖用户刚做的修改。
- 先用 `djian_context` 按任务读取当前选中/播放头及依赖、设计锁和审美规范；只有需要全貌或截断字段时才读 `djian_timeline`。参数不明用 `djian_operation` 按需查询。
- 一次需求拆成一批 ops 并写 label；较大修改先用 `djian_rehearse preview` 独立预演，检查回执、前后画面及问题后再 apply。简单且明确的局部修改可用 `djian_apply_ops`。
- 关键修改后用 `djian_frame` 抽查画面（可一次传多个时间点）。
- 详细的操作速查见 `djian-edit` 技能；做画面要好看时用 `djian-style` 技能选风格。
