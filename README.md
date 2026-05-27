# English Immerser

<p align="center">
  <img src="app-icon.png" alt="app icon" width="128" />
</p>

<p align="center">
  <strong>听力带路、兴趣驱动</strong> — 一款帮助你养成每天 60-90 分钟英语学习习惯的桌面应用。
</p>

<p align="center">
  <strong>Listening leads, interest drives</strong> — a desktop app for building a daily 60-90 min English immersion habit.
</p>

---

## 功能模块 · Modules

| 模块 | 说明 |
|------|------|
| 🎧 **沉浸听力** | 播放本地音频/视频，支持倒退 5 秒、AB 循环、字幕导入 |
| 📖 **习词本** | 生词卡片（单词 + 英文释义 + 自造句子），优先展示自造句子复习 |
| ✍️ **自由写作 · 三句日记** | Markdown 编辑器 + 每日三句话引导 |
| 🎙️ **自言自语录音棚** | 麦克风录音即时回放，不上传任何服务器 |
| 🎯 **听写复述** | 播放 → 输入关键词 → 再播放 → 用自己的话复述 |
| 📊 **打卡追踪** | 每日打卡 + 连续天数统计，激励持续学习 |
| 🛠️ **工具与设置** | 本地备份、恢复、数据目录入口 |

| Module | Description |
|--------|-------------|
| 🎧 **Immersion Listening** | Local audio/video player with -5s skip, A-B loop, subtitle import |
| 📖 **Vocabulary Notebook** | Word cards with definitions & self-made sentences; review prioritized by context |
| ✍️ **Writing · 3-Line Diary** | Markdown editor + daily 3-sentence journal prompt |
| 🎙️ **Recording Studio** | Instant mic recording & playback — nothing uploaded |
| 🎯 **Dictation & Paraphrase** | Listen → type keywords → re-listen → retell in your own words |
| 📊 **Check-in Tracker** | Daily check-in + streak stats to keep you going |

---

## 技术栈 · Tech Stack

| 层 | 技术 |
|---|------|
| 桌面框架 / Desktop Framework | Tauri 2.x (Rust + React) |
| 前端 / Frontend | React 18 + TypeScript |
| 样式 / Styling | Tailwind CSS |
| 状态管理 / State | Zustand stores（7 个独立 store） |
| 场景切换 / Routing | scene 状态机（无 router） |
| 数据存储 / Storage | 本地 JSON + 文本文件（系统文档目录，不上传服务器） |
| 自动更新 / Auto-update | Tauri Updater + GitHub Releases |

---

## 开发 · Development

### 环境要求 · Prerequisites

- Node.js 18+
- Rust toolchain (rustup, cargo)
- Windows: Microsoft Visual Studio C++ Build Tools

### 快速开始 · Quick Start

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run tauri dev

# 打包为安装程序
npm run tauri build
```

### 项目结构 · Project Structure

```
English Immerser/
├── src/                    # React 前端
│   ├── App.tsx              # 主入口（场景切换 + toast + 更新）
│   ├── components/         # 组件（按模块分文件夹：player/ vocabulary/ writing/ recording/ dictation/ checkin/ layout/ shared/ icons/）
│   ├── scenes/             # 场景页面（Hub / Player / Vocabulary / Writing / Recording / Dictation / Tools）
│   ├── stores/             # Zustand 状态管理（7 个独立 store）
│   ├── hooks/              # 自定义 Hooks（useDictionary / useMediaRecorder）
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数（备份 / JSON 存储 / 验证器 / 字幕解析 / 打卡计算 等）
├── src-tauri/              # Tauri Rust 后端
│   ├── src/                # Rust 源码
│   ├── capabilities/       # 权限配置
│   └── tauri.conf.json     # Tauri 配置
└── package.json
```

---

## 数据 · Data

所有用户数据存储在系统文档目录下的 `English Immerser/` 文件夹，不上传任何服务器：

```
文档/English Immerser/
├── vocabulary.json         # 生词本
├── checkin.json            # 打卡记录
├── dictation.json          # 听写记录
├── podcast_feeds.json      # 自定义播客源
├── diary/YYYY-MM-DD.txt    # 每日日记
├── writing/                # 自由写作
└── recordings/             # 录音文件
```

All user data is stored locally under `English Immerser/` in your system's Documents folder — nothing is ever uploaded.

### 备份 · Backup

- 工具页支持导出单文件 `.json` 备份。
- 导入前会自动生成当前数据的预备份。
- 录音备份可按需包含 `.webm` 文件和 `recordings.json`。
- 备份 schema 版本为 `1`；过旧或过新的备份会提示兼容性问题。

Release notes for this version: [RELEASE_NOTES_0.3.0.md](RELEASE_NOTES_0.3.0.md)

---

## License

MIT
