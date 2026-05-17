import { create } from "zustand";
import type { RecordingStatus, RecordingFile } from "@/types";

interface RecordingStore {
  status: RecordingStatus;
  duration: number; // seconds elapsed
  blob: Blob | null;
  playbackUrl: string | null;
  history: RecordingFile[];

  setStatus: (s: RecordingStatus) => void;
  setDuration: (d: number) => void;
  setBlob: (b: Blob | null) => void;
  setPlaybackUrl: (url: string | null) => void;
  setHistory: (h: RecordingFile[]) => void;
  addToHistory: (f: RecordingFile) => void;
  removeFromHistory: (path: string) => void;
  reset: () => void;
}

const initial = {
  status: "idle" as RecordingStatus,
  duration: 0,
  blob: null as Blob | null,
  playbackUrl: null as string | null,
  history: [] as RecordingFile[],
};

export const useRecordingStore = create<RecordingStore>((set) => ({
  ...initial,

  setStatus: (status) => set({ status }),
  setDuration: (duration) => set({ duration }),
  setBlob: (blob) => set({ blob }),
  setPlaybackUrl: (playbackUrl) => set({ playbackUrl }),
  setHistory: (history) => set({ history }),
  addToHistory: (f) => set((s) => ({ history: [f, ...s.history] })),
  removeFromHistory: (path) =>
    set((s) => ({ history: s.history.filter((h) => h.path !== path) })),
  reset: () => set({ ...initial, history: useRecordingStore.getState().history }),
}));
