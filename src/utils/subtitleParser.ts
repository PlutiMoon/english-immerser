import type { SubtitleLine } from "@/types";

function parseTimestamp(srt: string): number {
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

export function detectAndParse(content: string): SubtitleLine[] {
  if (content.trim().startsWith("WEBVTT")) {
    return parseVTT(content);
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
  return [`${base}.srt`, `${base}.vtt`, `${base}.zh.srt`, `${base}.zh.vtt`];
}
