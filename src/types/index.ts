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
  /** 用户自己造的例句，复习时优先展示 */
  selfSentence: string;
  source: string; // 来自哪个素材（音频/文章标题）
  createdAt: string; // ISO date
  lastReviewedAt: string | null;
  reviewCount: number;
}

// ============================================================
// 自由写作 & 三句日记
// ============================================================

// ============================================================
// 听写与复述
// ============================================================

export type DictationStep =
  | "listen" // 播放音频
  | "keywords" // 输入关键词
  | "relisten" // 再播放
  | "retell"; // 用自己的话复述

export interface DictationResult {
  step: DictationStep;
  userInput: string;
  timestamp: string;
}

// ============================================================
// 沉浸听力播放器
// ============================================================

export type MediaSourceType = "file" | "url" | "podcast";

export interface MediaSource {
  type: MediaSourceType;
  /** 本地文件路径 或 在线 URL */
  path: string;
  /** 显示名称 */
  name: string;
}

export interface SubtitleLine {
  start: number; // seconds
  end: number; // seconds
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
