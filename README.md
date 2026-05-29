# English Immerser

English Immerser 是一款基于 Tauri 的桌面端英语自学软件，核心理念是 **听力带路、兴趣驱动**。它不面向应试刷题，而是帮助你围绕喜欢的音频、视频、写作和复述，养成每天 60-90 分钟的英语输入输出习惯。

## 核心功能

| 模块 | 说明 |
| --- | --- |
| 沉浸听力与影子跟读 | 播放本地音频/视频、在线音频、播客和 YouTube 来源，支持倒退 5 秒、AB 循环、变速播放和字幕导入。 |
| 语境习词本 | 记录生词、英文释义、发音、自造句子和来源信息，复习时优先展示自己的句子。 |
| 自由写作与三句日记 | 极简写作编辑器，每日三句话引导，内置英文写作提示库。 |
| 自言自语录音棚 | 调用本地麦克风录音并即时回放，录音只保存在本机。 |
| 听写与复述小游戏 | 播放音频、输入关键词、再次播放，再用自己的话复述。 |
| 学习统计与打卡 | 记录每日学习时长、模块使用分布、连续打卡和周/月趋势。 |
| 工具与备份 | 本地数据导出/导入、数据目录入口、录音缓存入口。 |

## v0.4 亮点

- 新增 Apple / macOS Glass 风格界面。
- 新增 YouTube 音频与字幕来源，依赖本机 `yt-dlp`。
- 首页新增学习统计仪表盘。
- 写作模块新增提示库和更清爽的编辑体验。
- 播放器来源模块拆分为本地文件、在线链接、播客和 YouTube 面板。
- 增加 Tauri CSP 安全配置和 UI smoke 测试。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面框架 | Tauri 2.x |
| 后端 | Rust |
| 前端 | React 18 + TypeScript |
| 样式 | Tailwind CSS + 项目内 Apple 风格 surface 工具类 |
| 状态管理 | Zustand，按模块独立 store |
| 场景切换 | scene 状态机，无 router |
| 数据存储 | 本地 JSON + 文本文件 |
| 自动更新 | Tauri Updater + GitHub Releases |

## 开发环境

需要：

- Node.js 18+
- Rust toolchain
- Windows: Microsoft Visual Studio C++ Build Tools

常用命令：

```bash
npm install
npm run dev
npm run build
npm test
npm run tauri dev
npm run tauri build
```

Rust 检查：

```bash
cd src-tauri
cargo check
```

## 项目结构

```text
English Immerser/
├─ src/
│  ├─ App.tsx                    # 场景切换、toast、更新提示
│  ├─ app.css                    # 全局样式与 Apple surface 工具类
│  ├─ components/                # 按模块划分的组件
│  ├─ scenes/                    # Hub / Player / Vocabulary / Writing 等场景
│  ├─ stores/                    # Zustand stores
│  ├─ hooks/                     # 自定义 hooks
│  ├─ types/                     # TypeScript 类型
│  └─ utils/                     # 存储、备份、校验、字幕、统计等工具
├─ src-tauri/
│  ├─ src/                       # Rust 命令与应用入口
│  ├─ capabilities/              # Tauri 权限配置
│  └─ tauri.conf.json            # Tauri 应用配置
├─ tests/                        # Vitest 测试
└─ package.json
```

## 本地数据

所有用户数据都存储在系统文档目录下的 `English Immerser/` 文件夹，不上传服务器。

```text
Documents/English Immerser/
├─ vocabulary.json
├─ checkin.json
├─ dictation.json
├─ podcast_feeds.json
├─ recordings.json
├─ diary/YYYY-MM-DD.txt
├─ writing/
└─ recordings/
```

JSON 文件读写通过 `src/utils/jsonStorage.ts` 和相关工具封装，包含备份、损坏恢复和无效记录过滤。

## YouTube 支持

YouTube 来源依赖本机安装 `yt-dlp`：

```bash
pip install yt-dlp
```

或在 Windows 上使用：

```powershell
winget install yt-dlp
```

## 质量检查

当前主要验证方式：

- `npm test`
- `npm run build`
- `cargo check`
- UI smoke test，检查场景注册、侧栏覆盖和 Apple shell 样式

## 发布

当前版本：`0.4.0`

- Release notes: [RELEASE_NOTES_0.4.0.md](RELEASE_NOTES_0.4.0.md)
- Release checklist: [docs/releases/v0.4.0-checklist.md](docs/releases/v0.4.0-checklist.md)

## License

MIT
