import { describe, it, expect } from "vitest";
import { computeStreak, todayRecord } from "../src/utils/checkin";
import type { CheckInRecord } from "../src/types";

function rec(date: string): CheckInRecord {
  return { date, durationMinutes: 30, modules: ["player"] };
}

describe("computeStreak", () => {
  it("returns 0 for empty records", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("returns 1 when only latest is today", () => {
    // computeStreak uses todayStr() internally, so we can't fully control "today".
    // We test with yesterday-only records to verify the 1-day-grace rule.
    // Records with latest === yesterday → returns at least 1.
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = dateMinusDays(today, 1);
    expect(computeStreak([rec(yesterday)])).toBe(1);
  });

  it("returns 0 when latest is older than yesterday", () => {
    const today = new Date().toISOString().slice(0, 10);
    const twoDaysAgo = dateMinusDays(today, 2);
    expect(computeStreak([rec(twoDaysAgo)])).toBe(0);
  });

  it("counts consecutive days", () => {
    const today = new Date().toISOString().slice(0, 10);
    const d1 = dateMinusDays(today, 0);
    const d2 = dateMinusDays(today, 1);
    const d3 = dateMinusDays(today, 2);
    expect(computeStreak([rec(d1), rec(d2), rec(d3)])).toBe(3);
  });

  it("stops at a gap", () => {
    const today = new Date().toISOString().slice(0, 10);
    const d1 = dateMinusDays(today, 0);
    const d2 = dateMinusDays(today, 1);
    // gap at day-2
    const d4 = dateMinusDays(today, 3);
    expect(computeStreak([rec(d1), rec(d2), rec(d4)])).toBe(2);
  });

  it("skips same-day duplicates", () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = dateMinusDays(today, 1);
    // Two records on the same day — both count (loop doesn't dedupe dates)
    // Actually: both have date === "yesterday", so second matches expected too
    // But expected decrements, so second iteration expected is day-2, and
    // second record is still "yesterday" which is > expected, so it breaks.
    // Let's verify: first record "yesterday" matches expected "yesterday" → streak=1, expected="day-2"
    // second record "yesterday" > "day-2" → break
    const records = [rec(yesterday), rec(yesterday)];
    expect(computeStreak(records)).toBe(1);
  });
});

describe("todayRecord", () => {
  it("returns null for empty", () => {
    expect(todayRecord([])).toBeNull();
  });

  it("finds today's record", () => {
    const today = new Date().toISOString().slice(0, 10);
    const r = rec(today);
    expect(todayRecord([r])).toEqual(r);
  });

  it("returns null when no record matches today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = dateMinusDays(today, 1);
    expect(todayRecord([rec(yesterday)])).toBeNull();
  });
});

// Helper: same logic as checkin.ts dateMinusDays (not exported, so copied here)
function dateMinusDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
