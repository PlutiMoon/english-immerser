import { describe, it, expect } from "vitest";
import { computeStreak, todayRecord, weeklyStats, moduleDistribution } from "../src/utils/checkin";
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

describe("weeklyStats", () => {
  it("returns N days all zero for empty records", () => {
    const stats = weeklyStats([], 7);
    expect(stats).toHaveLength(7);
    expect(stats.every((s) => s.minutes === 0)).toBe(true);
  });

  it("returns oldest-first order", () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = dateMinusDays(today, 1);
    const records: CheckInRecord[] = [
      { date: yesterday, durationMinutes: 30, modules: ["player"] },
    ];
    const stats = weeklyStats(records, 7);
    expect(stats).toHaveLength(7);
    // first entry is oldest (7 days ago), last is today
    expect(stats[stats.length - 1].date).toBe(today);
    // yesterday should have 30 min
    const y = stats.find((s) => s.date === yesterday);
    expect(y?.minutes).toBe(30);
  });

  it("picks the correct duration for matching dates", () => {
    const today = new Date().toISOString().slice(0, 10);
    const records: CheckInRecord[] = [
      { date: today, durationMinutes: 45, modules: ["vocabulary"] },
    ];
    const stats = weeklyStats(records, 1);
    expect(stats).toHaveLength(1);
    expect(stats[0].date).toBe(today);
    expect(stats[0].minutes).toBe(45);
  });

  it("supports 30-day range", () => {
    const stats = weeklyStats([], 30);
    expect(stats).toHaveLength(30);
  });
});

describe("moduleDistribution", () => {
  it("returns all zeros for empty records", () => {
    const dist = moduleDistribution([]);
    expect(dist).toHaveLength(5);
    expect(dist.every((m) => m.count === 0)).toBe(true);
  });

  it("counts module usage across records", () => {
    const records: CheckInRecord[] = [
      { date: "2026-05-20", durationMinutes: 30, modules: ["player", "vocabulary"] },
      { date: "2026-05-21", durationMinutes: 60, modules: ["player", "writing"] },
      { date: "2026-05-22", durationMinutes: 45, modules: ["player"] },
    ];
    const dist = moduleDistribution(records);
    const player = dist.find((m) => m.module === "player")!;
    const vocab = dist.find((m) => m.module === "vocabulary")!;
    const writing = dist.find((m) => m.module === "writing")!;
    expect(player.count).toBe(3);
    expect(vocab.count).toBe(1);
    expect(writing.count).toBe(1);
  });

  it("sorts descending by count", () => {
    const records: CheckInRecord[] = [
      { date: "2026-05-20", durationMinutes: 30, modules: ["writing"] },
      { date: "2026-05-21", durationMinutes: 30, modules: ["player", "player"] }, // dedup by record, not by array
      { date: "2026-05-22", durationMinutes: 30, modules: ["player", "vocabulary", "dictation"] },
    ];
    const dist = moduleDistribution(records);
    for (let i = 1; i < dist.length; i++) {
      expect(dist[i - 1].count).toBeGreaterThanOrEqual(dist[i].count);
    }
  });

  it("includes label for every module", () => {
    const dist = moduleDistribution([]);
    const labels = dist.map((m) => m.label);
    expect(labels).toContain("听力");
    expect(labels).toContain("习词");
    expect(labels).toContain("写作");
    expect(labels).toContain("录音");
    expect(labels).toContain("听写");
  });
});

// Helper: same logic as checkin.ts dateMinusDays (not exported, so copied here)
function dateMinusDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
