/** Compute consecutive diary days ending at today or yesterday. */
export function diaryStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...dates].sort().reverse();
  const latest = sorted[0];
  // streak must include today or yesterday
  if (latest !== today && latest !== dateMinusDays(today, 1)) return 0;
  let streak = 0;
  let expected = latest;
  for (const d of sorted) {
    if (d === expected) {
      streak++;
      expected = dateMinusDays(expected, 1);
    } else if (d < expected) {
      break;
    }
  }
  return streak;
}

function dateMinusDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
