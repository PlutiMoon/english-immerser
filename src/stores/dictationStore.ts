import { create } from "zustand";
import { readTextFile, writeFile, exists } from "@tauri-apps/plugin-fs";
import { dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { safeParseJSON, isValidDictationSession } from "@/utils/validators";
import type { DictationStep, DictationResult } from "@/types";

export interface DictationSession {
  id: string;
  date: string;
  sourceName: string;
  sourcePath: string;
  keywords: string;
  retellText: string;
  results: DictationResult[];
}

interface DictationStoreState {
  step: DictationStep;
  source: { name: string; path: string } | null;
  keywords: string;
  retellText: string;
  sessionActive: boolean;
  history: DictationSession[];
  loaded: boolean;

  setStep: (step: DictationStep) => void;
  setSource: (source: { name: string; path: string } | null) => void;
  setKeywords: (text: string) => void;
  setRetellText: (text: string) => void;
  startSession: (source: { name: string; path: string }) => void;
  saveSession: () => Promise<void>;
  resetSession: () => void;
  loadHistory: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export const useDictationStore = create<DictationStoreState>((set, get) => ({
  step: "listen",
  source: null,
  keywords: "",
  retellText: "",
  sessionActive: false,
  history: [],
  loaded: false,

  setStep: (step) => set({ step }),
  setSource: (source) => set({ source }),
  setKeywords: (keywords) => set({ keywords }),
  setRetellText: (retellText) => set({ retellText }),

  startSession: (source) =>
    set({
      source,
      step: "listen",
      keywords: "",
      retellText: "",
      sessionActive: true,
    }),

  saveSession: async () => {
    const { source, keywords, retellText } = get();
    if (!source) return;
    const now = new Date().toISOString();
    const session: DictationSession = {
      id: crypto.randomUUID(),
      date: now,
      sourceName: source.name,
      sourcePath: source.path,
      keywords,
      retellText,
      results: [
        { step: "listen", userInput: "", timestamp: now },
        { step: "keywords", userInput: keywords, timestamp: now },
        { step: "relisten", userInput: "", timestamp: now },
        { step: "retell", userInput: retellText, timestamp: now },
      ],
    };
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.dictation();
      let existing: DictationSession[] = [];
      if (await exists(filePath)) {
        const raw = await readTextFile(filePath);
        existing = safeParseJSON(raw, isValidDictationSession);
      }
      const updated = [session, ...existing];
      await writeFile(filePath, new TextEncoder().encode(JSON.stringify(updated, null, 2)));
      set((s) => ({ history: [session, ...s.history], sessionActive: false }));
    } catch (err) {
      console.error("Failed to save dictation session:", err);
    }
  },

  resetSession: () =>
    set({
      step: "listen",
      source: null,
      keywords: "",
      retellText: "",
      sessionActive: false,
    }),

  loadHistory: async () => {
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.dictation();
      if (!(await exists(filePath))) {
        set({ history: [], loaded: true });
        return;
      }
      const raw = await readTextFile(filePath);
      const history = safeParseJSON(raw, isValidDictationSession);
      set({ history, loaded: true });
    } catch (err) {
      console.error("Failed to load dictation history:", err);
      set({ history: [], loaded: true });
    }
  },

  deleteSession: async (id: string) => {
    set((s) => ({ history: s.history.filter((h) => h.id !== id) }));
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.dictation();
      await writeFile(filePath, new TextEncoder().encode(JSON.stringify(get().history, null, 2)));
    } catch (err) {
      console.error("Failed to delete dictation session:", err);
    }
  },
}));
