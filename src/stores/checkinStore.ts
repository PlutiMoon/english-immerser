import { create } from "zustand";
import { dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { loadJsonArray, writeJsonArray } from "@/utils/jsonStorage";
import { isValidCheckInRecord } from "@/utils/validators";
import type { CheckInRecord, JsonRecoveryNotice } from "@/types";

interface CheckinStoreState {
  records: CheckInRecord[];
  loaded: boolean;
  recovery: JsonRecoveryNotice | null;
  loadCheckins: () => Promise<void>;
  addCheckIn: (record: CheckInRecord) => Promise<void>;
  clearRecovery: () => void;
}

export const useCheckinStore = create<CheckinStoreState>((set, get) => ({
  records: [],
  loaded: false,
  recovery: null,

  loadCheckins: async () => {
    try {
      await ensureDataDirs();
      const path = await dataFiles.checkin();
      const result = await loadJsonArray(path, { validator: isValidCheckInRecord });
      const records = result.data.sort((a, b) => b.date.localeCompare(a.date));
      set({
        records,
        loaded: true,
        recovery: result.recovered
          ? { label: "打卡记录", path, backupPath: result.backupPath, invalidCount: result.invalidCount }
          : null,
      });
    } catch (err) {
      console.error("Failed to load check-in records:", err);
      set({ records: [], loaded: true });
    }
  },

  addCheckIn: async (record) => {
    const previous = get().records;
    const next = [record, ...previous.filter((item) => item.date !== record.date)]
      .sort((a, b) => b.date.localeCompare(a.date));
    set({ records: next });
    try {
      await ensureDataDirs();
      await writeJsonArray(await dataFiles.checkin(), next);
    } catch (err) {
      set({ records: previous });
      console.error("Failed to save check-in record:", err);
      throw err;
    }
  },

  clearRecovery: () => set({ recovery: null }),
}));
