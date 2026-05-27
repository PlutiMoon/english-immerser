# English Immerser — 项目规范

## 项目概述

一款基于 Tauri 的桌面端英语自学软件，核心理念为"听力带路、兴趣驱动"，帮助用户养成每天 60-90 分钟的学习习惯。不追求应试，注重沉浸式输入与自然输出。

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Tauri 2.x (Rust + React) |
| 前端框架 | React 18+ + TypeScript |
| 样式方案 | Tailwind CSS |
| 状态管理 | React state + Zustand stores |
| 场景切换 | scene state (无 router) |
| 数据存储 | 本地 JSON 文件（通过 Tauri FS API 读写用户文档目录） |

## 核心功能模块

1. **沉浸听力与影子跟读** — 播放本地音频/视频，支持倒退5秒、AB循环等精听控制
2. **语境习词本** — 生词卡片（单词、英文释义、发音、自造句子），复习时优先展示自造句子
3. **自由写作与三句日记** — 极简编辑器 + 每日三句话引导，保存为本地文件
4. **自言自语录音棚** — 调用麦克风录音并即时回放，不保存服务器
5. **听写与复述小游戏** — 播放→输入关键词→再播放→用自己的话复述

## 数据存储规范

- 所有用户数据存储在系统文档目录下的 `English Immerser/` 文件夹
- 目录结构：
  - `vocabulary.json` — 生词本
  - `diary/YYYY-MM-DD.txt` — 每日日记
  - `checkin.json` — 打卡记录
  - `writing/` — 自由写作文件
- 使用 Tauri `@tauri-apps/plugin-fs` 读写文件

## 开发规范

- 组件按功能模块划分，每个模块一个文件夹
- App.tsx 只负责场景切换、toast 和更新提示；各模块状态由对应 store 负责
- TypeScript 严格模式，所有类型在 `src/types/` 下定义
- Tailwind 类名按功能分组（布局 → 颜色 → 间距 → 排版）
- 组件文件名使用 PascalCase，工具函数使用 camelCase
- 先搭骨架再填内容：每次新增模块时先做布局占位，再逐步完善交互
- 备份导出/导入保持单文件 JSON 形式；新增 schema 时先补兼容策略和测试

## 环境要求

- Node.js 18+
- Rust 工具链（rustup, cargo）
- 平台对应的系统依赖（Windows: Microsoft Visual Studio C++ Build Tools; macOS: Xcode Command Line Tools）
