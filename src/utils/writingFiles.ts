import { sanitizeFilename } from "./sanitize";

const DIARY_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})\.txt$/;

export function writingFilePath(dir: string, name: string): string {
  return `${dir}/${name}.txt`;
}

export function writingNameFromTitle(title: string): string {
  return sanitizeFilename(title);
}

export function writingNameCandidate(baseName: string, counter: number): string {
  return counter <= 1 ? baseName : `${baseName}-${counter}`;
}

export function diaryPath(dir: string, date: string): string {
  return `${dir}/${date}.txt`;
}

export function diaryDateFromFilename(name: string | null | undefined): string | null {
  if (!name) return null;
  const match = name.match(DIARY_FILENAME_RE);
  return match ? match[1] : null;
}

export function sortedDiaryDates(entries: { name?: string | null }[]): string[] {
  return entries
    .map((entry) => diaryDateFromFilename(entry.name))
    .filter((date): date is string => date !== null)
    .sort()
    .reverse();
}
