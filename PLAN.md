# 英语沉浸式自学助手 — 开发计划

## 阶段 0：环境搭建与项目初始化

- [ ] 安装 Rust 工具链（`rustup`, `cargo`）及系统依赖
- [ ] 使用 `npm create tauri-app@latest` 创建项目骨架（React + TypeScript 模板）
- [ ] 安装前端依赖：`tailwindcss`, `zustand`, `react-router-dom`
- [ ] 安装 Tauri 插件：`@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`
- [ ] 配置 Tailwind CSS、路径别名、TypeScript 严格模式
- [ ] 配置 Tauri 窗口（标题、尺寸、无边框/圆角等原生感样式）
- [ ] 验证 `cargo tauri dev` 和 `cargo tauri build` 能正常运行

## 阶段 1：基础布局与路由框架

- [ ] 设计全局布局：左侧导航栏 + 右侧内容区
- [ ] 实现顶部导航栏（5个功能入口 + 每日打卡状态）
- [ ] 配置 React Router，5个功能模块对应5条路由
- [ ] 创建各模块的占位页面组件
- [ ] 实现主题色/配色方案（柔和暖色系）

## 阶段 2：沉浸听力与影子跟读区（核心模块）

- [ ] 实现音频/视频播放器组件（基于 HTML5 `<audio>` / `<video>`）
- [ ] 实现播放控制：播放/暂停、倒退5秒、前进10秒、音量调节
- [ ] 实现本地文件导入（通过 Tauri Dialog 选择文件）
- [ ] 支持在线音视频 URL 输入
- [ ] （进阶）AB 循环：设置起点和终点进行循环播放
- [ ] （进阶）播放速度调节（0.5x ~ 2x）

## 阶段 3：自言自语录音棚

- [ ] 封装 `useMediaRecorder` Hook（权限申请、开始/停止录音）
- [ ] 录音状态 UI（录音中动画、时长显示）
- [ ] 录音列表与即时回放
- [ ] （可选）录音保存到本地文件

## 阶段 4：语境习词本

- [ ] 定义单词数据类型（单词、音标、释义、自造句子、添加日期）
- [ ] 实现添加生词表单
- [ ] 实现单词卡片列表（含发音按钮，调用 Web Speech API）
- [ ] 实现"自造句子"编辑功能
- [ ] 实现本地 JSON 文件读写（通过 Tauri FS API）
- [ ] 实现复习模式：按日期分组，优先展示有自造句子的卡片

## 阶段 5：自由写作与三句日记

- [ ] 实现极简文本编辑器（Textarea + 字数统计）
- [ ] 实现"三句日记"组件：三条输入框 + 每日句式提示
- [ ] 实现写作内容保存为本地 `.txt` 文件（Tauri FS API）
- [ ] 实现历史日记列表与查看

## 阶段 6：听写与复述小游戏

- [ ] 设计交互流程：播放 → 输入关键词 → 再播放 → 复述
- [ ] 实现步骤状态机（Step 0/1/2/3）
- [ ] 用户输入的关键词与复述内容展示对比
- [ ] （可选）内置一段示例音频用于演示

## 阶段 7：打卡系统与数据持久化

- [ ] 实现每日打卡逻辑（自动检测各模块使用情况）
- [ ] 打卡数据存储与读取（`checkin.json`）
- [ ] 首页仪表盘：今日学习时长、连续打卡天数、本周统计
- [ ] 所有模块的数据迁移到统一的本地存储方案

## 阶段 8：打包与分发

- [ ] 配置 Tauri 图标（`tauri icon` 命令）
- [ ] 配置 `tauri.conf.json` 中的打包参数（app name, identifier, version）
- [ ] Windows 打包：`cargo tauri build` 生成 `.msi` / `.exe`
- [ ] macOS 打包：`cargo tauri build` 生成 `.dmg` / `.app`
- [ ] 测试双击运行、窗口表现、功能完整性
- [ ] （可选）配置自动更新（Tauri updater plugin）

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
