import type { CheckInRecord, ModuleType } from "@/types";

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateMinusDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Compute streak from sorted (descending) records. */
export function computeStreak(records: CheckInRecord[]): number {
  if (records.length === 0) return 0;
  const today = todayStr();
  const latest = records[0].date;
  if (latest !== today && latest !== dateMinusDays(today, 1)) return 0;
  let streak = 0;
  let expected = latest;
  for (const r of records) {
    if (r.date === expected) {
      streak++;
      expected = dateMinusDays(expected, 1);
    } else if (r.date < expected) {
      break;
    }
  }
  return streak;
}

export function todayRecord(records: CheckInRecord[]): CheckInRecord | null {
  const today = todayStr();
  return records.find((r) => r.date === today) || null;
}

/** Daily minutes for the past `days` days (including today), newest first. */
export interface DailyStat {
  date: string;   // YYYY-MM-DD
  minutes: number;
}

export function weeklyStats(records: CheckInRecord[], days: number): DailyStat[] {
  const result: DailyStat[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const record = records.find((r) => r.date === date);
    result.push({ date, minutes: record ? record.durationMinutes : 0 });
  }
  // oldest first for chart readability
  return result.reverse();
}

/** Module usage count across all check-in records. */
export interface ModuleCount {
  module: ModuleType;
  label: string;
  count: number;
}

export const MODULE_LABEL_MAP: Record<ModuleType, string> = {
  player: "听力",
  vocabulary: "习词",
  writing: "写作",
  recording: "录音",
  dictation: "听写",
};

export function moduleDistribution(records: CheckInRecord[]): ModuleCount[] {
  const counts: Record<ModuleType, number> = {
    player: 0,
    vocabulary: 0,
    writing: 0,
    recording: 0,
    dictation: 0,
  };
  for (const r of records) {
    for (const m of r.modules) {
      counts[m] += 1;
    }
  }
  return (Object.entries(counts) as [ModuleType, number][])
    .map(([module, count]) => ({ module, label: MODULE_LABEL_MAP[module], count }))
    .sort((a, b) => b.count - a.count);
}
