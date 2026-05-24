import { create } from "zustand";
import { exists, readDir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import type { WritingFileInfo } from "@/types";
import {
  diaryPath,
  sortedDiaryDates,
  writingFilePath,
  writingNameCandidate,
  writingNameFromTitle,
} from "@/utils/writingFiles";

export interface PendingContent {
  title: string;
  content: string;
}

interface WritingStoreState {
  files: WritingFileInfo[];
  loaded: boolean;
  pendingContent: PendingContent | null;
  diaryDates: string[];
  diaryLoaded: boolean;
  loadFiles: () => Promise<void>;
  createWritingFile: (title: string, content: string) => Promise<WritingFileInfo>;
  readWritingFile: (path: string) => Promise<string>;
  saveWritingFile: (title: string, content: string, currentPath?: string | null) => Promise<WritingFileInfo>;
  deleteWritingFile: (path: string) => Promise<void>;
  upsertFile: (file: WritingFileInfo, previousPath?: string | null) => void;
  removeFile: (path: string) => void;
  loadDiaryHistory: () => Promise<string[]>;
  loadDiary: (date: string) => Promise<string | null>;
  saveDiary: (date: string, content: string) => Promise<void>;
  deleteDiary: (date: string) => Promise<void>;
  setPendingContent: (pc: PendingContent | null) => void;
  clearPendingContent: () => void;
}

export const useWritingStore = create<WritingStoreState>((set, get) => ({
  files: [],
  loaded: false,
  pendingContent: null,
  diaryDates: [],
  diaryLoaded: false,

  loadFiles: async () => {
    try {
      await ensureDataDirs();
      set({
        files: await scanWritingFiles(),
        loaded: true,
      });
    } catch (err) {
      console.error("Failed to load writing files:", err);
      set({ files: [], loaded: true });
      throw err;
    }
  },

  createWritingFile: async (title, content) => {
    await ensureDataDirs();
    const fileInfo = await writeNamedFile(title, content);
    get().upsertFile(fileInfo);
    return fileInfo;
  },

  readWritingFile: async (path) => {
    return readTextFile(path);
  },

  saveWritingFile: async (title, content, currentPath) => {
    await ensureDataDirs();
    const fileInfo = await writeNamedFile(title, content, currentPath);
    if (currentPath && currentPath !== fileInfo.path && await exists(currentPath)) {
      await remove(currentPath);
    }
    get().upsertFile(fileInfo, currentPath);
    return fileInfo;
  },

  deleteWritingFile: async (path) => {
    await remove(path);
    get().removeFile(path);
  },

  upsertFile: (file, previousPath) => {
    const files = get().files;
    const existingIdx = files.findIndex((item) => item.path === file.path);
    const next = existingIdx >= 0
      ? files.map((item) => item.path === file.path ? file : item)
      : [file, ...files.filter((item) => item.path !== previousPath)];
    set({ files: sortFiles(next) });
  },

  removeFile: (path) => {
    set((state) => ({
      files: state.files.filter((item) => item.path !== path),
    }));
  },

  loadDiaryHistory: async () => {
    try {
      await ensureDataDirs();
      const dates = sortedDiaryDates(await readDirSafe(await dataPaths.diary()));
      set({ diaryDates: dates, diaryLoaded: true });
      return dates;
    } catch (err) {
      console.error("Failed to load diary history:", err);
      set({ diaryDates: [], diaryLoaded: true });
      throw err;
    }
  },

  loadDiary: async (date) => {
    await ensureDataDirs();
    const path = diaryPath(await dataPaths.diary(), date);
    return await exists(path) ? readTextFile(path) : null;
  },

  saveDiary: async (date, content) => {
    await ensureDataDirs();
    const path = diaryPath(await dataPaths.diary(), date);
    await writeTextFile(path, content);
    set((state) => ({
      diaryDates: sortDates(uniqueDateList([date, ...state.diaryDates])),
      diaryLoaded: true,
    }));
  },

  deleteDiary: async (date) => {
    await ensureDataDirs();
    const path = diaryPath(await dataPaths.diary(), date);
    await remove(path);
    set((state) => ({
      diaryDates: state.diaryDates.filter((item) => item !== date),
      diaryLoaded: true,
    }));
  },

  setPendingContent: (pc) => set({ pendingContent: pc }),
  clearPendingContent: () => set({ pendingContent: null }),
}));

async function scanWritingFiles(): Promise<WritingFileInfo[]> {
  const dir = await dataPaths.writing();
  const entries = await readDirSafe(dir);
  return sortFiles(
    entries
      .filter((entry) => entry.name?.endsWith(".txt"))
      .map((entry) => ({
        name: entry.name.replace(/\.txt$/, ""),
        path: `${dir}/${entry.name}`,
        updatedAt: "",
      })),
  );
}

async function readDirSafe(dir: string): Promise<{ name: string }[]> {
  try {
    return await readDir(dir);
  } catch {
    return [];
  }
}

async function writeNamedFile(
  title: string,
  content: string,
  currentPath?: string | null,
): Promise<WritingFileInfo> {
  const dir = await dataPaths.writing();
  const baseName = writingNameFromTitle(title);
  let counter = 1;
  let name = writingNameCandidate(baseName, counter);
  let path = writingFilePath(dir, name);

  while (path !== currentPath && await exists(path)) {
    counter++;
    name = writingNameCandidate(baseName, counter);
    path = writingFilePath(dir, name);
  }

  await writeTextFile(path, content);
  return {
    name,
    path,
    updatedAt: new Date().toISOString(),
  };
}

function sortFiles(files: WritingFileInfo[]): WritingFileInfo[] {
  return [...files].sort((a, b) => {
    if (a.updatedAt && b.updatedAt && a.updatedAt !== b.updatedAt) {
      return b.updatedAt.localeCompare(a.updatedAt);
    }
    return a.name.localeCompare(b.name);
  });
}

function uniqueDateList(dates: string[]): string[] {
  return [...new Set(dates)];
}

function sortDates(dates: string[]): string[] {
  return [...dates].sort().reverse();
}
