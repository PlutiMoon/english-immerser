import { describe, it, expect } from "vitest";
import {
  isValidVocabularyWord,
  isValidCheckInRecord,
  isValidRecordingFile,
  isValidPodcastPreset,
  isValidDictationSession,
  isValidWritingFileInfo,
} from "../src/utils/validators";

describe("isValidVocabularyWord", () => {
  it("rejects null", () => {
    expect(isValidVocabularyWord(null)).toBeFalsy();
  });
  it("rejects undefined", () => {
    expect(isValidVocabularyWord(undefined)).toBeFalsy();
  });
  it("rejects empty object", () => {
    expect(isValidVocabularyWord({})).toBeFalsy();
  });
  it("accepts valid word with null lastReviewedAt", () => {
    expect(isValidVocabularyWord({
      id: "1", word: "serendipity",
      englishDefinition: "the fact of finding interesting things by chance",
      selfSentence: "", source: "",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastReviewedAt: null, reviewCount: 0,
    })).toBeTruthy();
  });
  it("rejects word missing englishDefinition", () => {
    expect(isValidVocabularyWord({
      id: "1", word: "serendipity",
      selfSentence: "", source: "",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastReviewedAt: null, reviewCount: 0,
    })).toBeFalsy();
  });
  it("accepts word with string lastReviewedAt", () => {
    expect(isValidVocabularyWord({
      id: "1", word: "test", englishDefinition: "a test",
      selfSentence: "", source: "",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastReviewedAt: "2024-01-02T00:00:00.000Z", reviewCount: 3,
    })).toBeTruthy();
  });
  it("rejects word with numeric lastReviewedAt", () => {
    expect(isValidVocabularyWord({
      id: "1", word: "test", englishDefinition: "a test",
      selfSentence: "", source: "",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastReviewedAt: 123, reviewCount: 0,
    })).toBeFalsy();
  });
});

describe("isValidCheckInRecord", () => {
  it("rejects null", () => {
    expect(isValidCheckInRecord(null)).toBeFalsy();
  });
  it("rejects empty object", () => {
    expect(isValidCheckInRecord({})).toBeFalsy();
  });
  it("accepts valid record", () => {
    expect(isValidCheckInRecord({
      date: "2024-06-15", durationMinutes: 45, modules: ["player", "vocabulary"],
    })).toBeTruthy();
  });
  it("accepts record with optional note", () => {
    expect(isValidCheckInRecord({
      date: "2024-06-15", durationMinutes: 45, modules: ["player"], note: "good day",
    })).toBeTruthy();
  });
  it("rejects record with non-string note", () => {
    expect(isValidCheckInRecord({
      date: "2024-06-15", durationMinutes: 45, modules: ["player"], note: 123,
    })).toBeFalsy();
  });
  it("rejects record with invalid date format", () => {
    expect(isValidCheckInRecord({
      date: "not-a-date", durationMinutes: 45, modules: ["player"],
    })).toBeFalsy();
  });
  it("rejects record missing durationMinutes", () => {
    expect(isValidCheckInRecord({
      date: "2024-06-15", modules: ["player"],
    })).toBeFalsy();
  });
  it("rejects record with non-array modules", () => {
    expect(isValidCheckInRecord({
      date: "2024-06-15", durationMinutes: 45, modules: "not-array",
    })).toBeFalsy();
  });
});

describe("isValidRecordingFile", () => {
  it("rejects null", () => {
    expect(isValidRecordingFile(null)).toBeFalsy();
  });
  it("rejects empty object", () => {
    expect(isValidRecordingFile({})).toBeFalsy();
  });
  it("accepts valid file", () => {
    expect(isValidRecordingFile({
      name: "recording.webm", path: "/r/recording.webm",
      duration: 120, createdAt: "2024-01-01T00:00:00.000Z",
    })).toBeTruthy();
  });
  it("rejects file missing duration", () => {
    expect(isValidRecordingFile({
      name: "recording.webm", path: "/r/recording.webm",
      createdAt: "2024-01-01T00:00:00.000Z",
    })).toBeFalsy();
  });
});

describe("isValidPodcastPreset", () => {
  it("rejects null", () => {
    expect(isValidPodcastPreset(null)).toBeFalsy();
  });
  it("rejects empty object", () => {
    expect(isValidPodcastPreset({})).toBeFalsy();
  });
  it("accepts valid preset", () => {
    expect(isValidPodcastPreset({ name: "BBC", url: "https://example.com/rss" })).toBeTruthy();
  });
  it("rejects preset missing url", () => {
    expect(isValidPodcastPreset({ name: "BBC" })).toBeFalsy();
  });
});

describe("isValidDictationSession", () => {
  it("rejects null", () => {
    expect(isValidDictationSession(null)).toBeFalsy();
  });
  it("rejects empty object", () => {
    expect(isValidDictationSession({})).toBeFalsy();
  });
  it("accepts valid session", () => {
    expect(isValidDictationSession({
      id: "1", date: "2024-01-01T00:00:00.000Z",
      sourceName: "podcast.mp3", sourcePath: "/p/podcast.mp3",
      keywords: "hello", retellText: "I heard hello",
      results: [],
    })).toBeTruthy();
  });
  it("rejects session missing results", () => {
    expect(isValidDictationSession({
      id: "1", date: "2024-01-01T00:00:00.000Z",
      sourceName: "podcast.mp3", sourcePath: "/p/podcast.mp3",
      keywords: "hello", retellText: "",
    })).toBeFalsy();
  });
});

describe("isValidWritingFileInfo", () => {
  it("rejects null", () => {
    expect(isValidWritingFileInfo(null)).toBeFalsy();
  });
  it("rejects empty object", () => {
    expect(isValidWritingFileInfo({})).toBeFalsy();
  });
  it("accepts valid file info", () => {
    expect(isValidWritingFileInfo({
      name: "my-essay", path: "/writing/my-essay.txt",
      updatedAt: "2024-01-01T00:00:00.000Z",
    })).toBeTruthy();
  });
  it("rejects file info missing path", () => {
    expect(isValidWritingFileInfo({
      name: "my-essay", updatedAt: "2024-01-01T00:00:00.000Z",
    })).toBeFalsy();
  });
});
