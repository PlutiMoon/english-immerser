import { create } from "zustand";
import { readTextFile, writeFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import { dataPath } from "@/utils/dataPath";
import type { VocabularyWord } from "@/types";

type SortMode = "newest" | "lastReviewed" | "reviewCount";

interface VocabularyStoreState {
  words: VocabularyWord[];
  loaded: boolean;
  searchQuery: string;
  sourceFilter: string;
  sortBy: SortMode;

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
}

export const useVocabularyStore = create<VocabularyStoreState>((set, get) => ({
  words: [],
  loaded: false,
  searchQuery: "",
  sourceFilter: "",
  sortBy: "newest",

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
    get().saveWords().catch(console.error);
  },

  updateWord: (id, updates) => {
    set((s) => ({
      words: s.words.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
    get().saveWords().catch(console.error);
  },

  deleteWord: (id) => {
    set((s) => ({ words: s.words.filter((w) => w.id !== id) }));
    get().saveWords().catch(console.error);
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSourceFilter: (f) => set({ sourceFilter: f }),
  setSortBy: (sortBy) => set({ sortBy }),

  loadWords: async () => {
    try {
      const root = await dataPath();
      const filePath = `${root}/vocabulary.json`;
      await mkdir(root, { recursive: true });
      const fileExists = await exists(filePath);
      if (!fileExists) {
        set({ words: [], loaded: true });
        return;
      }
      const raw = await readTextFile(filePath);
      const words: VocabularyWord[] = JSON.parse(raw);
      set({ words, loaded: true });
    } catch (err) {
      console.error("Failed to load vocabulary:", err);
      set({ words: [], loaded: true });
    }
  },

  saveWords: async () => {
    const root = await dataPath();
    const filePath = `${root}/vocabulary.json`;
    const json = JSON.stringify(get().words, null, 2);
    await writeFile(filePath, new TextEncoder().encode(json));
  },
}));
