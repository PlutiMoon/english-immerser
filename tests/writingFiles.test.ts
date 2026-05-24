import { describe, expect, it } from "vitest";
import {
  diaryDateFromFilename,
  sortedDiaryDates,
  writingFilePath,
  writingNameCandidate,
  writingNameFromTitle,
} from "../src/utils/writingFiles";

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
