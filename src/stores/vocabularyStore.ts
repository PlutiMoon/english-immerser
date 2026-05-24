import { create } from "zustand";
import { dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { loadJsonArray, writeJsonArray } from "@/utils/jsonStorage";
import { isValidVocabularyWord } from "@/utils/validators";
import type { VocabularyWord, JsonRecoveryNotice } from "@/types";

interface AddWordInput {
  word: string;
  englishDefinition: string;
  selfSentence: string;
  source: string;
  mediaPath?: string;
  mediaTimestamp?: number;
}

export interface PendingWord {
  word: string;
  source: string;
  mediaPath?: string;
  mediaTimestamp?: number;
}

interface VocabularyStoreState {
  words: VocabularyWord[];
  loaded: boolean;
  recovery: JsonRecoveryNotice | null;
  pendingWord: PendingWord | null;

  loadWords: () => Promise<void>;
  addWord: (input: AddWordInput) => Promise<void>;
  updateWord: (id: string, patch: Partial<VocabularyWord>) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  markReviewed: (id: string) => Promise<void>;
  clearRecovery: () => void;
  setPendingWord: (pw: PendingWord | null) => void;
  clearPendingWord: () => void;
}

export const useVocabularyStore = create<VocabularyStoreState>((set, get) => ({
  words: [],
  loaded: false,
  recovery: null,
  pendingWord: null,

  loadWords: async () => {
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.vocabulary();
      const result = await loadJsonArray(filePath, {
        validator: isValidVocabularyWord,
      });
      set({
        words: result.data,
        loaded: true,
        recovery: result.recovered
          ? { label: "生词本", path: filePath, backupPath: result.backupPath, invalidCount: result.invalidCount }
          : null,
      });
    } catch (err) {
      console.error("Failed to load vocabulary:", err);
      set({ words: [], loaded: true });
    }
  },

  addWord: async (input) => {
    const word: VocabularyWord = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
      lastReviewedAt: null,
      reviewCount: 0,
    };
    const next = [word, ...get().words];
    set({ words: next });
    try {
      await ensureDataDirs();
      await writeJsonArray(await dataFiles.vocabulary(), next);
    } catch (err) {
      set({ words: get().words.filter((w) => w.id !== word.id) });
      console.error("Failed to save vocabulary:", err);
      throw err;
    }
  },

  updateWord: async (id, patch) => {
    const previous = get().words;
    const next = previous.map((w) => (w.id === id ? { ...w, ...patch } : w));
    set({ words: next });
    try {
      await ensureDataDirs();
      await writeJsonArray(await dataFiles.vocabulary(), next);
    } catch (err) {
      set({ words: previous });
      console.error("Failed to save vocabulary:", err);
      throw err;
    }
  },

  deleteWord: async (id) => {
    const previous = get().words;
    const next = previous.filter((w) => w.id !== id);
    set({ words: next });
    try {
      await ensureDataDirs();
      await writeJsonArray(await dataFiles.vocabulary(), next);
    } catch (err) {
      set({ words: previous });
      console.error("Failed to save vocabulary:", err);
      throw err;
    }
  },

  markReviewed: async (id) => {
    const previous = get().words;
    const next = previous.map((w) =>
      w.id === id
        ? {
            ...w,
            lastReviewedAt: new Date().toISOString(),
            reviewCount: w.reviewCount + 1,
          }
        : w,
    );
    set({ words: next });
    try {
      await ensureDataDirs();
      await writeJsonArray(await dataFiles.vocabulary(), next);
    } catch (err) {
      set({ words: previous });
      console.error("Failed to save vocabulary:", err);
      throw err;
    }
  },

  clearRecovery: () => set({ recovery: null }),

  setPendingWord: (pw) => set({ pendingWord: pw }),
  clearPendingWord: () => set({ pendingWord: null }),
}));
