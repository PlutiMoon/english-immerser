import { create } from "zustand";
import type { MediaSource, SubtitleLine } from "@/types";

export type PlayState = "idle" | "loading" | "ready" | "error";

interface PlayerStore {
  source: MediaSource | null;
  playState: PlayState;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  abLoop: { start: number; end: number } | null;
  subtitles: SubtitleLine[];
  activeSubtitleIndex: number;

  setSource: (source: MediaSource | null) => void;
  setPlayState: (s: PlayState) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (v: number) => void;
  setABLoop: (abLoop: { start: number; end: number } | null) => void;
  setSubtitles: (subtitles: SubtitleLine[]) => void;
  setActiveSubtitleIndex: (i: number) => void;
  reset: () => void;
}

const initialState = {
  source: null as MediaSource | null,
  playState: "idle" as PlayState,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  volume: 1.0,
  abLoop: null as { start: number; end: number } | null,
  subtitles: [] as SubtitleLine[],
  activeSubtitleIndex: -1,
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,

  setSource: (source) => set({ source }),
  setPlayState: (playState) => set({ playState }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setVolume: (volume) => set({ volume }),
  setABLoop: (abLoop) => set({ abLoop }),
  setSubtitles: (subtitles) => set({ subtitles, activeSubtitleIndex: -1 }),
  setActiveSubtitleIndex: (activeSubtitleIndex) => set({ activeSubtitleIndex }),
  reset: () => set({ ...initialState }),
}));
