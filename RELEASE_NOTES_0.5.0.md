# English Immerser 0.5.0

## 版本定位

0.5.0 是一次干净的发布线重整：把 v0.4 后续的 Apple 风格 UI、播放器来源拆分、中文文档整理和 GitHub Actions 自动发布流程统一收进新的正式版本。

## 主要亮点

- **Apple / macOS Glass 界面**：统一侧栏、卡片、输入框、按钮、tabs、modal 和 toast 的轻量玻璃质感。
- **播放器来源拆分**：本地文件、在线链接、播客和 YouTube 来源拆成独立面板，后续维护更清楚。
- **自动发布流程**：新增 GitHub Actions release workflow，可在 tag push 时构建 Windows 安装包并上传 updater artifacts。
- **YouTube 来源与字幕**：继续支持通过本机 `yt-dlp` 解析 YouTube 音频流和字幕。
- **学习统计与写作提示**：保留首页统计仪表盘、写作提示库和三句日记引导。

## 发布流程改进

- 新增 `.github/workflows/release.yml`。
- 使用仓库 Actions Secrets：
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Windows 构建使用 Node 24、Rust stable 和 `tauri-apps/tauri-action@v0`。
- workflow 会上传 NSIS 安装包、签名文件和 updater JSON。

## 兼容性

- 用户数据目录结构不变。
- 备份 schema 不变。
- v0.3 / v0.4 本地数据可以继续使用。
- YouTube 功能仍需要本机安装 `yt-dlp`。

## 验证

发布前验证项：

- `npm ci --dry-run`
- `npm test`
- `npm run build`
- `cargo check`

