# English Immerser 0.4.0

## 版本定位

0.4.0 是一次面向“可持续学习体验”的版本：它补齐了 YouTube 来源、学习统计、写作提示库，并把界面升级为更接近 macOS 桌面应用的 Apple / Glass 风格。

## 主要亮点

- **Apple 风格界面**：浅色系统背景、半透明侧栏、Apple 蓝主色、统一的 surface 卡片和更柔和的控件层级。
- **YouTube 来源**：粘贴 YouTube 链接后可解析音频流和字幕，适合把公开视频纳入沉浸听力流程。
- **学习统计仪表盘**：首页新增概览/统计分栏，展示周/月学习时长、模块使用分布、连续打卡等信息。
- **写作提示库**：新增 66 条英文写作提示，自由写作和三句日记都可以快速换取灵感。
- **播放器来源重构**：本地文件、在线链接、播客、YouTube 拆分为独立面板，后续维护更清晰。
- **安全与稳定性**：加入 Tauri CSP 配置，补充 UI smoke test，测试数量提升到 126 个。

## 新增功能

### YouTube 来源

- 播放器新增 YouTube tab。
- Rust 后端通过 `yt-dlp` 提取音频流和可用字幕。
- 支持手动选择字幕语言并加载到字幕面板。
- 需要用户本机安装 `yt-dlp`。

### 学习统计

- 首页新增“概览 / 统计”分栏。
- 支持 7 天 / 30 天学习时长柱状图。
- 支持模块使用分布图。
- 展示本周总时长、打卡天数、日均时长、最常使用模块等摘要。

### 写作体验

- 自由写作编辑器新增“灵感”提示。
- 三句日记每句话都有独立提示。
- 日记历史、提示卡片、编辑器层级和文件列表做了视觉优化。

### Apple / macOS Glass UI

- 全局主色从暖橙调整为 Apple 系统蓝。
- 新增 `surface-card`、`surface-panel`、`surface-muted`、`button-glass`、`input-glass` 等通用样式。
- 侧栏、卡片、输入框、按钮、tabs、modal、toast 统一为更轻的玻璃质感。
- 多个局部组件从硬编码白卡片迁移到统一 surface 类。

### 播放器来源重构

- `MediaSource` 拆分为独立面板：
  - `LocalFilePanel`
  - `UrlPanel`
  - `PodcastPanel`
  - `YouTubePanel`
- `MediaSource.tsx` 现在主要负责 tab 状态与 handler 分发。

## 修复与改进

- 切换音源时自动清空字幕、AB 循环和字幕偏移。
- 字幕面板跟随播放自动滚动。
- YouTube 搜索按钮文本不再溢出。
- `Cargo.lock` 版本同步到 0.4.0。
- GitHub 仓库简介更新为中文。
- README 与 release notes 修复为干净中文。

## 安全与维护

- `tauri.conf.json` 从 `csp: null` 改为明确 CSP。
- 保留本地文件、Tauri IPC、asset 协议、远程媒体与 Vite 开发连接所需权限。
- 新增 UI smoke test，检查 App 场景注册、Sidebar 覆盖和 Apple shell 样式。

## 验证

本版本已通过：

- `npm test`：10 个测试文件，126 个测试
- `npm run build`
- `cargo check`
- 浏览器冒烟检查：7 个侧栏入口与播放器 4 个来源 tab

## 兼容性

- 数据目录结构不变。
- 备份 schema 仍为 `1`。
- 0.3.0 备份可以继续导入。
- YouTube 功能需要额外安装 `yt-dlp`，其他功能不受影响。
