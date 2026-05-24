import { ensureDataDirs } from "./utils/dataPath";
import type { AppData, JsonRecoveryNotice } from "./types";

export interface AppDataLoadResult {
  data: AppData;
  recoveries: JsonRecoveryNotice[];
}

// --- Load all persistent data ---
export async function loadAllData(): Promise<AppDataLoadResult> {
  await ensureDataDirs();

  const data: AppData = {
    player: { source: null, positions: {}, recentSources: [], savedLoops: {} },
  };

  return {
    data,
    recoveries: [],
  };
}

// --- Centralized save ---
export async function saveAllData(_data: AppData): Promise<void> {
  await ensureDataDirs();
}
