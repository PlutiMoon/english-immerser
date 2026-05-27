import { create } from "zustand";
import type { MediaSource, SavedLoop } from "@/types";

const MAX_RECENT = 10;
const MIN_POSITION_SAVE = 5;

interface PlayerStoreState {
  source: MediaSource | null;
  positions: Record<string, number>;
  recentSources: MediaSource[];
  savedLoops: Record<string, SavedLoop[]>;

  setSource: (source: MediaSource | null) => void;
  rememberSource: (source: MediaSource, currentTime: number) => void;
  restoreRecentSource: () => void;
  setPosition: (path: string, position: number) => void;
  saveLoop: (path: string, loop: SavedLoop) => void;
  deleteLoop: (path: string, index: number) => void;
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  source: null,
  positions: {},
  recentSources: [],
  savedLoops: {},

  setSource: (source) => set({ source }),

  rememberSource: (source, currentTime) => {
    if (currentTime <= MIN_POSITION_SAVE) return;
    set((state) => {
      const positions = { ...state.positions, [source.path]: currentTime };
      const recentSources = [source, ...state.recentSources.filter((item) => item.path !== source.path)].slice(0, MAX_RECENT);
      return { positions, recentSources };
    });
  },

  restoreRecentSource: () => {
    const { source, recentSources } = get();
    if (!source && recentSources.length > 0) {
      set({ source: recentSources[0] });
    }
  },

  setPosition: (path, position) => {
    set((state) => ({
      positions: { ...state.positions, [path]: position },
    }));
  },

  saveLoop: (path, loop) => {
    set((state) => {
      const loops = state.savedLoops[path] ?? [];
      return {
        savedLoops: {
          ...state.savedLoops,
          [path]: [...loops, loop],
        },
      };
    });
  },

  deleteLoop: (path, index) => {
    set((state) => {
      const loops = state.savedLoops[path] ?? [];
      return {
        savedLoops: {
          ...state.savedLoops,
          [path]: loops.filter((_, itemIndex) => itemIndex !== index),
        },
      };
    });
  },
}));
