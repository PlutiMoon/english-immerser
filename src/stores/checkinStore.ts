import { create } from "zustand";
import { readTextFile, writeFile, exists } from "@tauri-apps/plugin-fs";
import { dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { safeParseJSON, isValidCheckInRecord } from "@/utils/validators";
import type { CheckInRecord, ModuleType } from "@/types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateMinusDays(date: string, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

interface CheckinStoreState {
  records: CheckInRecord[];
  loaded: boolean;

  checkIn: (durationMinutes: number, modules: ModuleType[], note?: string) => Promise<void>;
  loadRecords: () => Promise<void>;
}

export const useCheckinStore = create<CheckinStoreState>((set, get) => ({
  records: [],
  loaded: false,

  checkIn: async (durationMinutes, modules, note) => {
    const today = todayStr();
    const record: CheckInRecord = {
      date: today,
      durationMinutes,
      modules,
      note: note || undefined,
    };
    const existing = get().records.filter((r) => r.date !== today);
    const updated = [record, ...existing];
    updated.sort((a, b) => b.date.localeCompare(a.date));
    set({ records: updated });

    try {
      await ensureDataDirs();
      const filePath = await dataFiles.checkin();
      await writeFile(filePath, new TextEncoder().encode(JSON.stringify(updated, null, 2)));
    } catch (err) {
      console.error("Failed to save check-in:", err);
    }
  },

  loadRecords: async () => {
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.checkin();
      if (!(await exists(filePath))) {
        set({ records: [], loaded: true });
        return;
      }
      const raw = await readTextFile(filePath);
      const records = safeParseJSON(raw, isValidCheckInRecord);
      records.sort((a, b) => b.date.localeCompare(a.date));
      set({ records, loaded: true });
    } catch (err) {
      console.error("Failed to load check-in records:", err);
      set({ records: [], loaded: true });
    }
  },
}));

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
