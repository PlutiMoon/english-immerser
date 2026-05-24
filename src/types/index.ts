// ============================================================
// 核心数据类型
// ============================================================

/** 打卡记录 */
export interface CheckInRecord {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  modules: ModuleType[];
  note?: string;
}

export type ModuleType =
  | "player"
  | "vocabulary"
  | "writing"
  | "recording"
  | "dictation";

// ============================================================
// 语境习词本
// ============================================================

export interface VocabularyWord {
  id: string;
  word: string;
  englishDefinition: string;
  selfSentence: string;
  source: string;
  createdAt: string;
  lastReviewedAt: string | null;
  reviewCount: number;
  mediaPath?: string;
  mediaTimestamp?: number;
}

// ============================================================
// 听写与复述
// ============================================================

export type DictationStep =
  | "listen"
  | "keywords"
  | "relisten"
  | "retell";

export interface DictationResult {
  step: DictationStep;
  userInput: string;
  timestamp: string;
}

export interface DictationSession {
  id: string;
  date: string;
  sourceName: string;
  sourcePath: string;
  keywords: string;
  retellText: string;
  results: DictationResult[];
}

// ============================================================
// 自由写作
// ============================================================

export interface WritingFileInfo {
  name: string;
  path: string;
  updatedAt: string;
}

// ============================================================
// 沉浸听力播放器
// ============================================================

export type MediaSourceType = "file" | "url" | "podcast";

export interface MediaSource {
  type: MediaSourceType;
  path: string;
  name: string;
}

export interface SubtitleLine {
  start: number;
  end: number;
  text: string;
}

export interface PodcastFeed {
  title: string;
  description: string;
  items: PodcastItem[];
}

export interface PodcastItem {
  title: string;
  description: string;
  audio_url: string;
  duration: string | null;
  pub_date: string | null;
}

export interface PodcastPreset {
  name: string;
  url: string;
}

// ============================================================
// 自言自语录音棚
// ============================================================

export type RecordingStatus = "idle" | "requesting" | "recording" | "paused";

export interface RecordingFile {
  name: string;
  path: string;
  duration: number;
  createdAt: string;
}

export interface PromptItem {
  text: string;
  hint?: string;
}

// ============================================================
// 数据恢复通知
// ============================================================

export interface JsonRecoveryNotice {
  label: string;
  path: string;
  backupPath: string | null;
  invalidCount: number;
}

// ============================================================
// UI 类型
// ============================================================

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// ============================================================
// 播放器学习记忆
// ============================================================

export interface SavedLoop {
  start: number;
  end: number;
  label: string;
}

// ============================================================
// 应用全局数据（游戏存档）
// ============================================================

export interface AppData {
  player: {
    source: MediaSource | null;
    positions: Record<string, number>;
    recentSources: MediaSource[];
    savedLoops: Record<string, SavedLoop[]>;
  };
}

export const DEFAULT_APP_DATA: AppData = {
  player: { source: null, positions: {}, recentSources: [], savedLoops: {} },
};
