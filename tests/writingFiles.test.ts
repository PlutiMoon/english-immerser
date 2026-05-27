import { describe, expect, it } from "vitest";
import {
  diaryDateFromFilename,
  sortedDiaryDates,
  writingFilePath,
  writingNameCandidate,
  writingNameFromTitle,
} from "../src/utils/writingFiles";
import { diaryStreak } from "../src/utils/writingStats";

describe("writingNameFromTitle", () => {
  it("sanitizes file names through the shared filename rules", () => {
    expect(writingNameFromTitle("bad:file/name")).toBe("badfilename");
  });

  it('returns "未命名" for empty titles', () => {
    expect(writingNameFromTitle("   ")).toBe("未命名");
  });
});

describe("writingNameCandidate", () => {
  it("returns the base name for the first candidate", () => {
    expect(writingNameCandidate("draft", 1)).toBe("draft");
  });

  it("adds a numeric suffix after the first candidate", () => {
    expect(writingNameCandidate("draft", 2)).toBe("draft-2");
  });
});

describe("writingFilePath", () => {
  it("builds a txt path under the writing directory", () => {
    expect(writingFilePath("C:/Docs/English Immerser/writing", "draft")).toBe(
      "C:/Docs/English Immerser/writing/draft.txt",
    );
  });
});

describe("diaryDateFromFilename", () => {
  it("extracts dates from diary txt files", () => {
    expect(diaryDateFromFilename("2026-05-24.txt")).toBe("2026-05-24");
  });

  it("rejects non-diary names", () => {
    expect(diaryDateFromFilename("notes.txt")).toBeNull();
    expect(diaryDateFromFilename("2026-5-24.txt")).toBeNull();
    expect(diaryDateFromFilename(null)).toBeNull();
  });
});

describe("sortedDiaryDates", () => {
  it("returns diary dates newest first and ignores unrelated files", () => {
    expect(
      sortedDiaryDates([
        { name: "2026-05-22.txt" },
        { name: "draft.txt" },
        { name: "2026-05-24.txt" },
        { name: "2026-05-23.md" },
        { name: "2026-05-21.txt" },
      ]),
    ).toEqual(["2026-05-24", "2026-05-22", "2026-05-21"]);
  });
});

describe("diaryStreak", () => {
  it("returns 0 for empty dates", () => {
    expect(diaryStreak([])).toBe(0);
  });

  it("returns 1 when today has an entry", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(diaryStreak([today])).toBe(1);
  });

  it("returns 1 when only yesterday has an entry (1-day grace)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = dateMinusDays(today, 1);
    expect(diaryStreak([yesterday])).toBe(1);
  });

  it("returns 0 when latest entry is older than yesterday", () => {
    const today = new Date().toISOString().slice(0, 10);
    const twoDaysAgo = dateMinusDays(today, 2);
    expect(diaryStreak([twoDaysAgo])).toBe(0);
  });

  it("counts consecutive days", () => {
    const today = new Date().toISOString().slice(0, 10);
    const d1 = dateMinusDays(today, 0);
    const d2 = dateMinusDays(today, 1);
    const d3 = dateMinusDays(today, 2);
    expect(diaryStreak([d1, d2, d3])).toBe(3);
    expect(diaryStreak([d3, d1, d2])).toBe(3); // unordered input
  });

  it("stops at a gap", () => {
    const today = new Date().toISOString().slice(0, 10);
    const d1 = dateMinusDays(today, 0);
    const d2 = dateMinusDays(today, 1);
    const d4 = dateMinusDays(today, 3);
    expect(diaryStreak([d1, d2, d4])).toBe(2);
  });
});

function dateMinusDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
