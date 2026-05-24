import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import type { SubtitleLine } from "@/types";

export function parseTimestamp(srt: string): number {
  // "00:01:23,456" or "00:01:23.456"
  const cleaned = srt.replace(",", ".");
  const [h, m, s] = cleaned.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function parseSRT(content: string): SubtitleLine[] {
  const blocks = content.trim().replace(/\r\n/g, "\n").split(/\n\n+/);
  const lines: SubtitleLine[] = [];

  for (const block of blocks) {
    const parts = block.trim().split("\n");
    // Find the timestamp line
    const tsLine = parts.find((p) => p.includes("-->"));
    if (!tsLine) continue;

    const [start, end] = tsLine.split("-->").map((t) => parseTimestamp(t.trim()));
    if (isNaN(start) || isNaN(end)) continue;

    // Text is everything after the timestamp line
    const tsIdx = parts.indexOf(tsLine);
    const text = parts
      .slice(tsIdx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "") // strip HTML tags (common in VTT)
      .trim();

    if (text) {
      lines.push({ start, end, text });
    }
  }

  return lines;
}

export function parseVTT(content: string): SubtitleLine[] {
  // VTT starts with "WEBVTT" header, otherwise same structure as SRT
  const body = content.replace(/^WEBVTT[\s\S]*?\n\n/, "").trim();
  return parseSRT(body);
}

/**
 * Parse LRC lyrics format: [mm:ss.xx]text or [mm:ss]text
 * Timestamps inside lines like <mm:ss.xx> are also supported (enhanced LRC).
 */
export function parseLRC(content: string): SubtitleLine[] {
  const rawLines = content.trim().replace(/\r\n/g, "\n").split("\n");
  const timestampRe = /\[(\d{1,3}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

  // Collect all (timestamp, text) pairs
  const pairs: { seconds: number; text: string }[] = [];

  for (const line of rawLines) {
    const matches = [...line.matchAll(timestampRe)];
    if (matches.length === 0) {
      // Continuation of previous line's text
      if (pairs.length > 0 && line.trim()) {
        pairs[pairs.length - 1].text += " " + line.trim();
      }
      continue;
    }
    // Get text after the last timestamp in this line
    const lastMatch = matches[matches.length - 1];
    const textStart = (lastMatch.index ?? 0) + lastMatch[0].length;
    const text = line.slice(textStart).trim();

    for (const m of matches) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const ms = m[3] ? Number(m[3].padEnd(3, "0")) : 0;
      const seconds = min * 60 + sec + ms / 1000;
      // Skip metadata tags like [ti:Title], [ar:Artist]
      // Metadata has a word before the colon, timestamps have numbers
      // Check: if min > 99 or the captured text looks like metadata (word:value)
      // Actually, a simpler check: metadata tags have non-digit chars before colon
      // We use a stricter check: if the original bracket content has letters, skip it
      const bracketContent = m[0].slice(1, -1); // remove [ ]
      if (/[a-zA-Z]/.test(bracketContent) && bracketContent.includes(":")) continue;

      pairs.push({ seconds, text });
    }
  }

  if (pairs.length === 0) return [];

  // Sort by timestamp
  pairs.sort((a, b) => a.seconds - b.seconds);

  // Build SubtitleLine array with end = next start
  const result: SubtitleLine[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const start = pairs[i].seconds;
    const end = i + 1 < pairs.length ? pairs[i + 1].seconds : start + 3;
    const text = pairs[i].text;
    if (text) {
      result.push({ start, end, text });
    }
  }

  return result;
}

export function detectAndParse(content: string): SubtitleLine[] {
  const trimmed = content.trim();
  if (trimmed.startsWith("WEBVTT")) {
    return parseVTT(content);
  }
  // Detect LRC: lines start with [timestamp] pattern
  if (/^\[\d{1,3}:\d{2}/m.test(trimmed)) {
    return parseLRC(content);
  }
  return parseSRT(content);
}

/**
 * Given a media file path, return the expected subtitle file paths
 * by replacing the extension with .srt and .vtt
 */
export function getSubtitleCandidates(mediaPath: string): string[] {
  // Split on the last dot to replace extension
  const lastDot = mediaPath.lastIndexOf(".");
  if (lastDot === -1) return [];
  const base = mediaPath.slice(0, lastDot);
  return [
    `${base}.srt`, `${base}.vtt`,
    `${base}.zh.srt`, `${base}.zh.vtt`,
    `${base}.lrc`, `${base}.zh.lrc`,
  ];
}

/**
 * Read and parse a single subtitle file at the given path.
 */
export async function loadSubtitleFile(path: string): Promise<SubtitleLine[]> {
  const content = await readTextFile(path);
  return detectAndParse(content);
}

/**
 * Try to auto-load subtitles for a media file.
 * Checks candidate paths, reads the first one with content, and parses it.
 */
export async function tryLoadSubtitles(mediaPath: string): Promise<SubtitleLine[]> {
  const candidates = getSubtitleCandidates(mediaPath);
  for (const subPath of candidates) {
    try {
      if (await exists(subPath)) {
        const content = await readTextFile(subPath);
        const subs = detectAndParse(content);
        if (subs.length > 0) return subs;
      }
    } catch { /* try next */ }
  }
  return [];
}
