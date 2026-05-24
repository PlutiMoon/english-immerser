import { create } from "zustand";
import { writeFile, remove, readDir } from "@tauri-apps/plugin-fs";
import { dataFiles, dataPaths, ensureDataDirs } from "@/utils/dataPath";
import { loadJsonArray, writeJsonArray } from "@/utils/jsonStorage";
import { isValidRecordingFile } from "@/utils/validators";
import type { RecordingFile, JsonRecoveryNotice } from "@/types";

interface RecordingStoreState {
  history: RecordingFile[];
  loaded: boolean;
  recovery: JsonRecoveryNotice | null;
  loadHistory: () => Promise<void>;
  addRecording: (file: RecordingFile) => Promise<void>;
  removeRecording: (path: string) => Promise<void>;
  saveRecordingFile: (blob: Blob, fileName: string) => Promise<RecordingFile>;
  deleteRecordingFile: (file: RecordingFile) => Promise<void>;
  clearRecovery: () => void;
}

export const useRecordingStore = create<RecordingStoreState>((set, get) => ({
  history: [],
  loaded: false,
  recovery: null,

  loadHistory: async () => {
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.recordingHistory();
      const result = await loadJsonArray(filePath, {
        validator: isValidRecordingFile,
      });
      const history = result.data.length > 0 ? result.data : await scanRecordingFiles();
      set({
        history: sortNewestFirst(history),
        loaded: true,
        recovery: result.recovered
          ? { label: "录音记录", path: filePath, backupPath: result.backupPath, invalidCount: result.invalidCount }
          : null,
      });
    } catch (err) {
      console.error("Failed to load recording history:", err);
      set({ history: [], loaded: true });
    }
  },

  addRecording: async (file) => {
    const previous = get().history;
    const next = sortNewestFirst([
      file,
      ...previous.filter((item) => item.path !== file.path),
    ]);
    set({ history: next });
    try {
      await persistHistory(next);
    } catch (err) {
      set({ history: previous });
      console.error("Failed to save recording history:", err);
      throw err;
    }
  },

  removeRecording: async (path) => {
    const previous = get().history;
    const next = previous.filter((item) => item.path !== path);
    set({ history: next });
    try {
      await persistHistory(next);
    } catch (err) {
      set({ history: previous });
      console.error("Failed to remove recording history item:", err);
      throw err;
    }
  },

  saveRecordingFile: async (blob, fileName) => {
    await ensureDataDirs();
    const dir = await dataPaths.recordings();
    const filePath = `${dir}/${fileName}`;
    const buffer = new Uint8Array(await blob.arrayBuffer());
    await writeFile(filePath, buffer);

    const file: RecordingFile = {
      name: fileName,
      path: filePath,
      duration: 0,
      createdAt: new Date().toISOString(),
    };

    // Optimistic add (addRecording handles persist + rollback)
    const previous = get().history;
    const next = sortNewestFirst([
      file,
      ...previous.filter((item) => item.path !== filePath),
    ]);
    set({ history: next });
    try {
      await persistHistory(next);
    } catch (err) {
      // Clean up written file on index failure
      try { await remove(filePath); } catch { /* ignore */ }
      set({ history: previous });
      console.error("Failed to save recording history:", err);
      throw err;
    }

    return file;
  },

  deleteRecordingFile: async (file) => {
    const previous = get().history;
    const next = previous.filter((item) => item.path !== file.path);
    set({ history: next });
    try {
      await remove(file.path);
      await persistHistory(next);
    } catch (err) {
      set({ history: previous });
      console.error("Failed to delete recording file:", err);
      throw err;
    }
  },

  clearRecovery: () => set({ recovery: null }),
}));

async function persistHistory(history: RecordingFile[]): Promise<void> {
  await ensureDataDirs();
  await writeJsonArray(await dataFiles.recordingHistory(), sortNewestFirst(history));
}

async function scanRecordingFiles(): Promise<RecordingFile[]> {
  const dir = await dataPaths.recordings();
  const entries = await readDirSafe(dir);
  return entries
    .filter((entry) => entry.name?.endsWith(".webm"))
    .map((entry) => ({
      name: entry.name,
      path: `${dir}/${entry.name}`,
      duration: 0,
      createdAt: new Date().toISOString(),
    }));
}

async function readDirSafe(dir: string): Promise<{ name: string }[]> {
  try {
    return await readDir(dir);
  } catch {
    return [];
  }
}

function sortNewestFirst(history: RecordingFile[]): RecordingFile[] {
  return [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
