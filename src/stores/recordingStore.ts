import { create } from "zustand";
import { exists, readDir, readTextFile, writeFile, stat } from "@tauri-apps/plugin-fs";
import { dataPaths, dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { safeParseJSON, isValidRecordingFile } from "@/utils/validators";
import type { RecordingStatus, RecordingFile } from "@/types";

async function scanRecordingFiles(): Promise<RecordingFile[]> {
  const dir = await dataPaths.recordings();
  const entries = await readDir(dir);
  const files: RecordingFile[] = [];

  for (const entry of entries) {
    if (entry.name?.endsWith(".webm")) {
      const name = entry.name;
      const path = `${dir}/${name}`;

      try {
        const metadata = await stat(path);
        const createdAt = metadata.birthtime
          ? new Date(metadata.birthtime).toISOString()
          : new Date().toISOString();

        files.push({
          name,
          path,
          duration: 0, // Duration still needs to be calculated from media
          createdAt,
        });
      } catch (err) {
        console.warn(`Failed to stat ${path}:`, err);
        // Fallback to basic info
        files.push({
          name,
          path,
          duration: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function saveHistory(history: RecordingFile[]): Promise<void> {
  await ensureDataDirs();
  const filePath = await dataFiles.recordingHistory();
  await writeFile(
    filePath,
    new TextEncoder().encode(JSON.stringify(history, null, 2)),
  );
}

interface RecordingStore {
  status: RecordingStatus;
  duration: number; // seconds elapsed
  blob: Blob | null;
  playbackUrl: string | null;
  history: RecordingFile[];
  loaded: boolean;

  setStatus: (s: RecordingStatus) => void;
  setDuration: (d: number) => void;
  setBlob: (b: Blob | null) => void;
  setPlaybackUrl: (url: string | null) => void;
  setHistory: (h: RecordingFile[]) => void;
  loadHistory: () => Promise<void>;
  addToHistory: (f: RecordingFile) => Promise<void>;
  removeFromHistory: (path: string) => Promise<void>;
  reset: () => void;
}

const initial = {
  status: "idle" as RecordingStatus,
  duration: 0,
  blob: null as Blob | null,
  playbackUrl: null as string | null,
  history: [] as RecordingFile[],
  loaded: false,
};

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  ...initial,

  setStatus: (status) => set({ status }),
  setDuration: (duration) => set({ duration }),
  setBlob: (blob) => set({ blob }),
  setPlaybackUrl: (playbackUrl) => set({ playbackUrl }),
  setHistory: (history) => set({ history }),

  loadHistory: async () => {
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.recordingHistory();
      if (await exists(filePath)) {
        const raw = await readTextFile(filePath);
        const history = safeParseJSON(raw, isValidRecordingFile);
        set({ history, loaded: true });
        return;
      }

      const scanned = await scanRecordingFiles();
      if (scanned.length > 0) {
        await saveHistory(scanned);
      }
      set({ history: scanned, loaded: true });
    } catch (err) {
      console.error("Failed to load recording history:", err);
      set({ history: [], loaded: true });
    }
  },

  addToHistory: async (f) => {
    const next = [f, ...get().history.filter((item) => item.path !== f.path)];
    set({ history: next });
    try {
      await saveHistory(next);
    } catch (err) {
      console.error("Failed to save recording history:", err);
    }
  },

  removeFromHistory: async (path) => {
    const next = get().history.filter((h) => h.path !== path);
    set({ history: next });
    try {
      await saveHistory(next);
    } catch (err) {
      console.error("Failed to save recording history:", err);
    }
  },

  reset: () => {
    const { history, loaded } = useRecordingStore.getState();
    set({ ...initial, history, loaded });
  },
}));
