import { create } from "zustand";
import { readTextFile, writeFile, readDir, remove, exists } from "@tauri-apps/plugin-fs";
import { dataPaths } from "@/utils/dataPath";

export interface WritingFileInfo {
  name: string;      // filename without extension
  path: string;      // full path
  updatedAt: string; // ISO date
}

interface WritingStoreState {
  files: WritingFileInfo[];
  currentFile: WritingFileInfo | null;
  title: string;
  content: string;
  saved: boolean;
  loading: boolean;

  loadFiles: () => Promise<void>;
  selectFile: (f: WritingFileInfo) => Promise<void>;
  newFile: () => void;
  deleteFile: (f: WritingFileInfo) => Promise<void>;
  setTitle: (t: string) => void;
  setContent: (c: string) => void;
  saveCurrent: () => Promise<void>;
}

function sanitizeFilename(title: string): string {
  return title.replace(/[<>:"/\\|?*]/g, "").trim() || "未命名";
}

async function readDirSafe(dir: string): Promise<{ name: string }[]> {
  try {
    return await readDir(dir);
  } catch {
    return [];
  }
}

export const useWritingStore = create<WritingStoreState>((set, get) => ({
  files: [],
  currentFile: null,
  title: "",
  content: "",
  saved: true,
  loading: false,

  loadFiles: async () => {
    set({ loading: true });
    try {
      const dir = await dataPaths.writing();
      const entries = await readDirSafe(dir);
      const files: WritingFileInfo[] = [];
      for (const e of entries) {
        if (e.name?.endsWith(".txt")) {
          const name = e.name.replace(/\.txt$/, "");
          files.push({
            name,
            path: `${dir}/${e.name}`,
            updatedAt: "",
          });
        }
      }
      // Sort by name for now (we don't have mtime easily from readDir)
      files.sort((a, b) => a.name.localeCompare(b.name));
      set({ files, loading: false });
    } catch (err) {
      console.error("Failed to load writing files:", err);
      set({ loading: false });
    }
  },

  selectFile: async (f) => {
    try {
      const raw = await readTextFile(f.path);
      set({
        currentFile: f,
        title: f.name,
        content: raw,
        saved: true,
      });
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  },

  newFile: () => {
    // Deselect current and clear editor
    set({
      currentFile: null,
      title: "",
      content: "",
      saved: true,
    });
  },

  deleteFile: async (f) => {
    try {
      await remove(f.path);
      const { currentFile } = get();
      set((s) => ({
        files: s.files.filter((x) => x.path !== f.path),
        currentFile: currentFile?.path === f.path ? null : currentFile,
        title: currentFile?.path === f.path ? "" : get().title,
        content: currentFile?.path === f.path ? "" : get().content,
      }));
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  },

  setTitle: (t) => set({ title: t, saved: false }),
  setContent: (c) => set({ content: c, saved: false }),

  saveCurrent: async () => {
    const { title, content, currentFile } = get();
    if (!title.trim()) return;

    try {
      const dir = await dataPaths.writing();
      const safeName = sanitizeFilename(title);
      const newPath = `${dir}/${safeName}.txt`;

      // If renaming: remove old file
      if (currentFile && currentFile.path !== newPath) {
        const oldExists = await exists(currentFile.path);
        if (oldExists) await remove(currentFile.path);
      }

      await writeFile(newPath, new TextEncoder().encode(content));

      const now = new Date().toISOString();
      const fileInfo: WritingFileInfo = {
        name: safeName,
        path: newPath,
        updatedAt: now,
      };

      set((s) => {
        const exists = s.files.find((x) => x.path === newPath);
        const files = exists
          ? s.files.map((x) => (x.path === newPath ? fileInfo : x))
          : [fileInfo, ...s.files.filter((x) => x.path !== currentFile?.path)];
        return {
          files,
          currentFile: fileInfo,
          saved: true,
        };
      });
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  },
}));
