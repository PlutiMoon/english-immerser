import { describe, it, expect } from "vitest";
import {
  parseTimestamp,
  parseSRT,
  parseLRC,
  parseVTT,
  detectAndParse,
  getSubtitleCandidates,
} from "../src/utils/subtitleParser";

describe("parseTimestamp", () => {
  it("parses with comma separator", () => {
    expect(parseTimestamp("00:00:05,500")).toBeCloseTo(5.5);
  });

  it("parses with dot separator", () => {
    expect(parseTimestamp("00:01:00.000")).toBe(60);
  });

  it("parses one hour", () => {
    expect(parseTimestamp("01:00:00,000")).toBe(3600);
  });
});

describe("parseSRT", () => {
  it("parses a standard two-entry SRT", () => {
    const content = [
      "1",
      "00:00:01,000 --> 00:00:03,500",
      "Hello, world!",
      "",
      "2",
      "00:00:04,000 --> 00:00:06,000",
      "This is a test.",
    ].join("\n");
    const result = parseSRT(content);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ start: 1, end: 3.5, text: "Hello, world!" });
    expect(result[1]).toEqual({ start: 4, end: 6, text: "This is a test." });
  });

  it("returns empty for empty content", () => {
    expect(parseSRT("")).toEqual([]);
  });

  it("skips blocks without timestamp", () => {
    const content = ["No timestamp here", "", "just text"].join("\n");
    expect(parseSRT(content)).toEqual([]);
  });

  it("skips blocks with NaN timestamps", () => {
    const content = ["1", "bad --> 00:00:01,000", "text"].join("\n");
    expect(parseSRT(content)).toEqual([]);
  });

  it("strips HTML tags from text", () => {
    const content = [
      "1",
      "00:00:01,000 --> 00:00:02,000",
      "<b>Bold</b> and <i>italic</i>",
    ].join("\n");
    const result = parseSRT(content);
    expect(result[0].text).toBe("Bold and italic");
  });

  it("handles CRLF line endings", () => {
    const content = "1\r\n00:00:01,000 --> 00:00:02,000\r\nHello";
    const result = parseSRT(content);
    expect(result).toHaveLength(1);
  });
});

describe("parseVTT", () => {
  it("parses standard VTT", () => {
    const content = [
      "WEBVTT",
      "",
      "00:00:01.000 --> 00:00:03.000",
      "Hello VTT",
      "",
      "00:00:04.000 --> 00:00:06.000",
      "Second line",
    ].join("\n");
    const result = parseVTT(content);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ start: 1, end: 3, text: "Hello VTT" });
  });

  it("returns empty for WEBVTT-only content", () => {
    expect(parseVTT("WEBVTT\n\n")).toEqual([]);
  });

  it("strips VTT cue tags", () => {
    const content = [
      "WEBVTT",
      "",
      "00:00:01.000 --> 00:00:02.000",
      "<c.vocal>Singing</c.vocal> words",
    ].join("\n");
    const result = parseVTT(content);
    expect(result[0].text).toBe("Singing words");
  });
});

describe("parseLRC", () => {
  it("parses standard LRC", () => {
    const content = [
      "[00:01.00]First line",
      "[00:03.50]Second line",
      "[00:06.00]Third line",
    ].join("\n");
    const result = parseLRC(content);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ start: 1, end: 3.5, text: "First line" });
    expect(result[1]).toEqual({ start: 3.5, end: 6, text: "Second line" });
    expect(result[2]).toEqual({ start: 6, end: 9, text: "Third line" });
  });

  it("skips metadata tags like [ti:Title]", () => {
    const content = [
      "[ti:My Song]",
      "[ar:Artist]",
      "[00:01.00]Actual lyrics",
    ].join("\n");
    const result = parseLRC(content);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Actual lyrics");
  });

  it("merges continuation lines (no timestamp)", () => {
    const content = [
      "[00:01.00]First part",
      "continuation of first",
      "[00:04.00]Second part",
    ].join("\n");
    const result = parseLRC(content);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("First part continuation of first");
  });

  it("handles colon timestamp format [00:01:23]", () => {
    const content = "[00:01:23]Test\n[00:02:00]Done";
    const result = parseLRC(content);
    expect(result).toHaveLength(2);
  });

  it("returns empty for content without timestamps", () => {
    expect(parseLRC("just text\nno timestamps")).toEqual([]);
  });
});

describe("detectAndParse", () => {
  it("routes WEBVTT content to VTT parser", () => {
    const content = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello";
    const result = detectAndParse(content);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Hello");
  });

  it("routes LRC-style content to LRC parser", () => {
    const content = "[00:01.00]LRC line\n[00:02.00]Another";
    const result = detectAndParse(content);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("LRC line");
  });

  it("routes non-WEBVTT content to SRT parser", () => {
    const content = "1\n00:00:01,000 --> 00:00:02,000\nSRT text";
    const result = detectAndParse(content);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("SRT text");
  });
});

describe("getSubtitleCandidates", () => {
  it("returns 6 candidates for a media path", () => {
    const candidates = getSubtitleCandidates("movie.mp4");
    expect(candidates).toEqual([
      "movie.srt", "movie.vtt",
      "movie.zh.srt", "movie.zh.vtt",
      "movie.lrc", "movie.zh.lrc",
    ]);
  });

  it("returns empty for path without extension", () => {
    expect(getSubtitleCandidates("noext")).toEqual([]);
  });

  it("replaces only the last extension", () => {
    const candidates = getSubtitleCandidates("episode.01.mp4");
    expect(candidates).toEqual([
      "episode.01.srt", "episode.01.vtt",
      "episode.01.zh.srt", "episode.01.zh.vtt",
      "episode.01.lrc", "episode.01.zh.lrc",
    ]);
  });
});
