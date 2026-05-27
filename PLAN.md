# English Immerser — 开发计划

## 阶段 0：环境搭建与项目初始化 ✅

- [x] 安装 Rust 工具链（`rustup`, `cargo`）及系统依赖
- [x] 使用 `npm create tauri-app@latest` 创建项目骨架（React + TypeScript 模板）
- [x] 安装前端依赖：`tailwindcss`, `zustand`
- [x] 安装 Tauri 插件：`@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`
- [x] 配置 Tailwind CSS、路径别名、TypeScript 严格模式
- [x] 配置 Tauri 窗口（标题、尺寸）
- [x] 验证 `cargo tauri dev` 和 `cargo tauri build` 能正常运行

## 阶段 1：基础布局与路由框架 ✅

- [x] 设计全局布局：左侧导航栏 + 右侧内容区
- [x] 实现侧边导航栏（7 个功能入口，scene 状态切换）
- [x] 使用 scene 状态机代替 React Router（更轻量，无 URL 路由）
- [x] 创建各模块的占位页面组件
- [x] 实现主题色/配色方案（柔和暖色系，Tailwind primary/warm 色板）

## 阶段 2：沉浸听力与影子跟读区（核心模块）✅

- [x] 实现音频/视频播放器组件（基于 HTML5 `<audio>` / `<video>`）
- [x] 实现播放控制：播放/暂停、倒退5秒、前进5秒、音量调节
- [x] 实现本地文件导入（通过 Tauri Dialog 选择文件）
- [x] 支持 Tauri asset 协议播放本地文件（`allow_media_file`）
- [x] AB 循环：设置起点和终点进行循环播放
- [x] 播放速度调节（0.5x ~ 2x）
- [x] 播客 RSS 订阅与下载（VOA / BBC 预设 + 自定义源）
- [x] 字幕导入与同步（SRT/VTT 解析 + 偏移调整）
- [x] AB 循环书签保存
- [x] 播放位置记忆与断点续播
- [x] 键盘快捷键（空格播放/暂停，左右箭头跳转）

## 阶段 3：自言自语录音棚 ✅

- [x] 封装 `useMediaRecorder` Hook（权限申请、开始/停止录音）
- [x] 录音状态 UI（录音中动画、时长显示）
- [x] 录音列表与即时回放
- [x] 录音保存到本地 `.webm` 文件
- [x] 录音元数据持久化（`recordings.json`）
- [x] 说话提示卡（PromptCard）

## 阶段 4：语境习词本 ✅

- [x] 定义单词数据类型（单词、英文释义、自造句子、来源、复习次数）
- [x] 实现添加/编辑生词表单
- [x] 实现单词卡片列表（搜索、来源筛选、排序）
- [x] 实现"自造句子"编辑功能
- [x] 实现本地 JSON 文件读写（通过 `jsonStorage.ts`）
- [x] 实现复习模式：翻转卡片，按复习次数排序
- [x] 媒体时间戳跳转：点击时间戳跳回播放器定位到对应时间点
- [x] 跨模块联动：听写模块关键词一键发送到习词本

## 阶段 5：自由写作与三句日记 ✅

- [x] 实现极简文本编辑器（标题 + 内容 + 字数统计）
- [x] 实现"三句日记"组件：每日三句话引导 + 句式提示
- [x] 实现写作内容保存为本地 `.txt` 文件（通过 writingStore）
- [x] 实现历史日记列表与查看（按日期排列）
- [x] 写作文件管理（创建、重命名、删除）
- [x] 自动保存与离开前保存提示
- [x] 跨模块联动：听写复述文本一键发送到写作模块

## 阶段 6：听写与复述小游戏 ✅

- [x] 设计交互流程：播放 → 输入关键词 → 再播放 → 复述
- [x] 实现步骤状态机（listen → keywords → relisten → retell）
- [x] 用户输入的关键词与复述内容展示对比
- [x] 支持选择本地音频文件或使用播放器中已加载的音频
- [x] 听写记录保存与历史查看
- [x] 跨模块联动：关键词 → 习词本、复述 → 写作

## 阶段 7：打卡系统与数据持久化 ✅

- [x] 实现每日打卡逻辑（手动打卡，选择模块、时长、备注）
- [x] 打卡数据存储与读取（`checkin.json`，通过 checkinStore）
- [x] 首页仪表盘：今日学习时长、连续打卡天数、累计次数
- [x] 连续打卡徽章（StreakBadge）
- [x] 所有模块的数据统一使用 `jsonStorage.ts` + 各自 store

## 阶段 8：打包与分发 ✅

- [x] 配置 Tauri 图标（`tauri icon` 命令，多尺寸 PNG + ICO + ICNS）
- [x] 配置 `tauri.conf.json` 中的打包参数（app name, identifier, version 0.3.0）
- [x] 更新发布说明，明确备份导出/导入、预备份和 schema 兼容策略
- [x] Windows 打包：`cargo tauri build` 生成 `.msi` / `.exe`（NSIS 安装器）
- [ ] macOS 打包：`cargo tauri build` 生成 `.dmg` / `.app`（尚无 macOS 构建环境）
- [x] 测试双击运行、窗口表现、功能完整性
- [x] 配置自动更新（Tauri updater plugin，GitHub Releases endpoint）

---

## 打包配置要点

### Windows 生成 .exe

1. 安装 **Microsoft Visual Studio C++ Build Tools**（含 Windows 10/11 SDK）
2. 在 `tauri.conf.json` 中确认 `bundle > targets` 包含 `msi` 和 `nsis`
3. 运行 `cargo tauri build`
4. 产物在 `src-tauri/target/release/bundle/` 下，`.msi` 为安装包，`.exe` 为独立可执行文件

### macOS 生成 .app / .dmg

1. 安装 **Xcode Command Line Tools**
2. 在 `tauri.conf.json` 中确认 `bundle > targets` 包含 `dmg`
3. 运行 `cargo tauri build`
4. 产物在 `src-tauri/target/release/bundle/macos/` 下

### 关键配置文件位置

- `src-tauri/tauri.conf.json` — 窗口配置、打包配置、插件权限
- `src-tauri/Cargo.toml` — Rust 依赖
- `src-tauri/capabilities/default.json` — Tauri 插件权限声明（Tauri 2.x 新安全模型）
