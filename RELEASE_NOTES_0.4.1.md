# English Immerser 0.4.1

## 版本定位

0.4.1 是 v0.4 的正式补丁发布：它不移动已经存在的 `v0.4.0` tag，而是把后续的 UI 打磨、结构整理、文档修复和发布准备一起收进一个新的稳定版本。

## 主要亮点

- **Apple 风格继续收口**：统一更多页面与控件的 glass surface 质感，整体更接近轻量 macOS 桌面应用。
- **播放器结构更清晰**：`MediaSource` 拆分为本地文件、在线链接、播客和 YouTube 四个独立面板。
- **发布文档更完整**：README、release notes 和发布 checklist 都整理为干净中文。
- **项目结构更稳**：补齐 UI smoke test，继续保留 Tauri CSP 安全配置。
- **版本发布更安全**：保留既有 `v0.4.0` tag，新建 `v0.4.1` 承接最新提交。

## 本次包含的改进

### 界面与体验

- 延续 Apple / macOS Glass 风格界面。
- 将更多硬编码白色卡片迁移到统一 surface 工具类。
- 优化播放器、写作、工具、词汇等页面的视觉层级。

### 播放器维护性

- `src/components/player/MediaSource.tsx` 现在只负责 tab 状态和 handler 分发。
- 新增 `media-source/LocalFilePanel.tsx`、`UrlPanel.tsx`、`PodcastPanel.tsx`、`YouTubePanel.tsx` 和共享类型文件。
- 后续新增来源或调整单个来源时，影响范围更小。

### 文档与发布

- README 重新整理为中文项目介绍、功能列表、技术栈、数据目录和发布入口。
- `RELEASE_NOTES_0.4.0.md` 修复为干净中文，保留作为历史版本说明。
- 新增 v0.4 发布检查清单，并在本版本中准备 v0.4.1 发布检查清单。
- GitHub 仓库简介已更新为中文。

## 验证

发布前需要通过：

- `npm test`
- `npm run build`
- `cargo check`
- `npm run tauri build`

## 兼容性

- 用户数据目录结构不变。
- 备份 schema 不变。
- v0.3 与 v0.4 的本地数据可以继续使用。
- YouTube 来源仍需要用户本机安装 `yt-dlp`。

