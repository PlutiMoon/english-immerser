import { create } from "zustand";
import { dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { loadJsonArray, writeJsonArray } from "@/utils/jsonStorage";
import { isValidDictationSession } from "@/utils/validators";
import type { DictationStep, DictationResult, JsonRecoveryNotice } from "@/types";

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
  recovery: JsonRecoveryNotice | null;

  setStep: (step: DictationStep) => void;
  setSource: (source: { name: string; path: string } | null) => void;
  setKeywords: (text: string) => void;
  setRetellText: (text: string) => void;
  startSession: (source: { name: string; path: string }) => void;
  saveSession: () => Promise<void>;
  resetSession: () => void;
  loadHistory: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearRecovery: () => void;
}

export const useDictationStore = create<DictationStoreState>((set, get) => ({
  step: "listen",
  source: null,
  keywords: "",
  retellText: "",
  sessionActive: false,
  history: [],
  loaded: false,
  recovery: null,

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
      const { data: existing } = await loadJsonArray(filePath, {
        validator: isValidDictationSession,
      });
      const updated = [session, ...existing];
      await writeJsonArray(filePath, updated);
      set((s) => ({ history: [session, ...s.history], sessionActive: false }));
    } catch (err) {
      console.error("Failed to save dictation session:", err);
      throw err;
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
      const result = await loadJsonArray(filePath, {
        validator: isValidDictationSession,
      });
      const history = result.data.sort(
        (a, b) => b.date.localeCompare(a.date),
      );
      set({
        history,
        loaded: true,
        recovery: result.recovered
          ? { label: "听写记录", path: filePath, backupPath: result.backupPath, invalidCount: result.invalidCount }
          : null,
      });
    } catch (err) {
      console.error("Failed to load dictation history:", err);
      set({ history: [], loaded: true });
    }
  },

  deleteSession: async (id: string) => {
    const previous = get().history;
    const next = previous.filter((h) => h.id !== id);
    set({ history: next });
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.dictation();
      await writeJsonArray(filePath, next);
    } catch (err) {
      set({ history: previous });
      console.error("Failed to delete dictation session:", err);
      throw err;
    }
  },

  clearRecovery: () => set({ recovery: null }),
}));
