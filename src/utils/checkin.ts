import type { CheckInRecord } from "@/types";

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
