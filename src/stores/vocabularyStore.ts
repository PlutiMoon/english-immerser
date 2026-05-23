import { create } from "zustand";
import { readTextFile, writeFile, exists } from "@tauri-apps/plugin-fs";
import { dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { debounce } from "@/utils/debounce";
import { safeParseJSON, isValidVocabularyWord } from "@/utils/validators";
import { useToastStore } from "@/stores/toastStore";
import type { VocabularyWord } from "@/types";

type SortMode = "newest" | "lastReviewed" | "reviewCount";

interface VocabularyStoreState {
  words: VocabularyWord[];
  loaded: boolean;
  searchQuery: string;
  sourceFilter: string;
  sortBy: SortMode;
  error: string | null;

  addWord: (input: {
    word: string;
    englishDefinition: string;
    selfSentence: string;
    source: string;
  }) => void;
  updateWord: (id: string, updates: Partial<VocabularyWord>) => void;
  deleteWord: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setSourceFilter: (f: string) => void;
  setSortBy: (s: SortMode) => void;
  loadWords: () => Promise<void>;
  saveWords: () => Promise<void>;
  clearError: () => void;
}

export const useVocabularyStore = create<VocabularyStoreState>((set, get) => {
  const debouncedSave = debounce(async () => {
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.vocabulary();
      const json = JSON.stringify(get().words, null, 2);
      await writeFile(filePath, new TextEncoder().encode(json));
      set({ error: null });
    } catch (err) {
      console.error("Failed to save vocabulary:", err);
      const errorMsg = "保存习词本失败";
      set({ error: errorMsg });
      useToastStore.getState().addToast(errorMsg, "error");
    }
  }, 500);

  return {
    words: [],
    loaded: false,
    searchQuery: "",
    sourceFilter: "",
    sortBy: "newest",
    error: null,

    addWord: (input) => {
      const now = new Date().toISOString();
      const word: VocabularyWord = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: now,
        lastReviewedAt: null,
        reviewCount: 0,
      };
      set((s) => ({ words: [...s.words, word] }));
      debouncedSave();
    },

    updateWord: (id, updates) => {
      set((s) => ({
        words: s.words.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      }));
      debouncedSave();
    },

    deleteWord: (id) => {
      set((s) => ({ words: s.words.filter((w) => w.id !== id) }));
      debouncedSave();
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
    setSourceFilter: (f) => set({ sourceFilter: f }),
    setSortBy: (sortBy) => set({ sortBy }),

    loadWords: async () => {
      try {
        await ensureDataDirs();
        const filePath = await dataFiles.vocabulary();
        const fileExists = await exists(filePath);
        if (!fileExists) {
          set({ words: [], loaded: true });
          return;
        }
        const raw = await readTextFile(filePath);
        const words = safeParseJSON(raw, isValidVocabularyWord);
        set({ words, loaded: true, error: null });
      } catch (err) {
        console.error("Failed to load vocabulary:", err);
        const errorMsg = "加载习词本失败";
        set({ words: [], loaded: true, error: errorMsg });
        useToastStore.getState().addToast(errorMsg, "error");
      }
    },

    saveWords: async () => {
      try {
        await ensureDataDirs();
        const filePath = await dataFiles.vocabulary();
        const json = JSON.stringify(get().words, null, 2);
        await writeFile(filePath, new TextEncoder().encode(json));
        set({ error: null });
      } catch (err) {
        console.error("Failed to save vocabulary:", err);
        const errorMsg = "保存习词本失败";
        set({ error: errorMsg });
        useToastStore.getState().addToast(errorMsg, "error");
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  };
});
