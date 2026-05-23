import type {
  VocabularyWord,
  CheckInRecord,
  RecordingFile,
  PodcastPreset,
  DictationSession,
  WritingFileInfo,
} from "@/types";

/**
 * Type guard for VocabularyWord
 */
export function isValidVocabularyWord(obj: any): obj is VocabularyWord {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.word === "string" &&
    typeof obj.englishDefinition === "string" &&
    typeof obj.selfSentence === "string" &&
    typeof obj.source === "string" &&
    typeof obj.createdAt === "string" &&
    (obj.lastReviewedAt === null || typeof obj.lastReviewedAt === "string") &&
    typeof obj.reviewCount === "number"
  );
}

/**
 * Type guard for CheckInRecord
 */
export function isValidCheckInRecord(obj: any): obj is CheckInRecord {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(obj.date) &&
    typeof obj.durationMinutes === "number" &&
    Array.isArray(obj.modules) &&
    obj.modules.every((m: any) => typeof m === "string") &&
    (obj.note === undefined || typeof obj.note === "string")
  );
}

/**
 * Type guard for RecordingFile
 */
export function isValidRecordingFile(obj: any): obj is RecordingFile {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.name === "string" &&
    typeof obj.path === "string" &&
    typeof obj.duration === "number" &&
    typeof obj.createdAt === "string"
  );
}

/**
 * Type guard for PodcastPreset
 */
export function isValidPodcastPreset(obj: any): obj is PodcastPreset {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.name === "string" &&
    typeof obj.url === "string"
  );
}

/**
 * Type guard for DictationSession
 */
export function isValidDictationSession(obj: any): obj is DictationSession {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.date === "string" &&
    typeof obj.sourceName === "string" &&
    typeof obj.sourcePath === "string" &&
    typeof obj.keywords === "string" &&
    typeof obj.retellText === "string" &&
    Array.isArray(obj.results)
  );
}

/**
 * Type guard for WritingFileInfo
 */
export function isValidWritingFileInfo(obj: any): obj is WritingFileInfo {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.name === "string" &&
    typeof obj.path === "string" &&
    typeof obj.updatedAt === "string"
  );
}

/**
 * Filter an array to only valid items
 */
export function filterValid<T>(
  items: any[],
  validator: (obj: any) => obj is T
): T[] {
  return items.filter(validator);
}

/**
 * Safely parse JSON with validation
 */
export function safeParseJSON<T>(
  raw: string,
  validator: (obj: any) => obj is T
): T[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("Parsed JSON is not an array, returning empty array");
      return [];
    }
    const valid = filterValid(parsed, validator);
    const invalid = parsed.length - valid.length;
    if (invalid > 0) {
      console.warn(`Filtered out ${invalid} invalid items from JSON data`);
    }
    return valid;
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    return [];
  }
}
