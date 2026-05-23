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
// 应用全局数据（游戏存档）
// ============================================================

export interface AppData {
  vocabulary: VocabularyWord[];
  checkin: CheckInRecord[];
  dictation: DictationSession[];
  podcastFeeds: PodcastPreset[];
  recordingHistory: RecordingFile[];
  writingFiles: WritingFileInfo[];
  player: { source: MediaSource | null };
}

export const DEFAULT_APP_DATA: AppData = {
  vocabulary: [],
  checkin: [],
  dictation: [],
  podcastFeeds: [],
  recordingHistory: [],
  writingFiles: [],
  player: { source: null },
};
