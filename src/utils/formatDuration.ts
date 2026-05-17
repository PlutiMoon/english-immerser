/**
 * Parse iTunes duration to "M:SS" or "H:MM:SS" display format.
 * Input can be: "395" (seconds), "6:35" (already formatted), "1:06:35"
 */
export function formatDuration(raw: string | null): string {
  if (!raw) return "";
  const t = raw.trim();
  if (!t) return "";

  // Already contains colon(s): "6:35" or "1:06:35"
  if (t.includes(":")) {
    const parts = t.split(":").map(Number);
    if (parts.length === 2) {
      return `${parts[0]}:${parts[1].toString().padStart(2, "0")}`;
    }
    if (parts.length === 3) {
      return `${parts[0]}:${parts[1].toString().padStart(2, "0")}:${parts[2].toString().padStart(2, "0")}`;
    }
    return t;
  }

  // Plain number of seconds
  const secs = parseInt(t, 10);
  if (isNaN(secs)) return t;

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
