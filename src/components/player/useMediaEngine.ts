import { useEffect, useRef } from "react";
import type { MediaSource, SubtitleLine } from "@/types";

export type PlayState = "idle" | "loading" | "ready" | "error";

export interface MediaEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playState: PlayState;
  activeSubtitleIndex: number;
}

interface UseMediaEngineOptions {
  source: MediaSource | null;
  playbackRate: number;
  volume: number;
  abLoop: { start: number; end: number } | null;
  subtitles: SubtitleLine[];
  onStateChange: (patch: Partial<MediaEngineState>) => void;
}

export function useMediaEngine({
  source, playbackRate, volume, abLoop, subtitles, onStateChange,
}: UseMediaEngineOptions) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const abLoopRef = useRef(abLoop);
  const subtitlesRef = useRef(subtitles);
  const callbackRef = useRef(onStateChange);

  useEffect(() => { abLoopRef.current = abLoop; }, [abLoop]);
  useEffect(() => { subtitlesRef.current = subtitles; }, [subtitles]);
  useEffect(() => { callbackRef.current = onStateChange; }, [onStateChange]);

  // Sync source changes
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    const cb = () => callbackRef.current;
    if (!source) {
      media.pause();
      media.removeAttribute("src");
      cb()({ isPlaying: false, playState: "idle", currentTime: 0 });
      return;
    }
    cb()({ playState: "loading" });
    media.src = source.path;
    media.playbackRate = playbackRate;
    media.volume = volume;
    media.load();
    cb()({ currentTime: 0, isPlaying: false });
  }, [source?.path, source?.type, playbackRate, volume]);

  // Wire media events once
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const onLoadedMeta = () => {
      const d = media.duration;
      callbackRef.current({ duration: isFinite(d) ? d : 0 });
    };
    const onCanPlay = () => {
      callbackRef.current({ playState: "ready" });
      const d = media.duration;
      if (isFinite(d)) callbackRef.current({ duration: d });
    };
    const onWaiting = () => callbackRef.current({ playState: "loading" });
    const onError = () => callbackRef.current({ playState: "error" });
    const onDurationChange = () => {
      const d = media.duration;
      if (isFinite(d)) callbackRef.current({ duration: d });
    };
    const onTimeUpdate = () => {
      const ct = media.currentTime;
      const loop = abLoopRef.current;
      if (loop && ct >= loop.end) {
        media.currentTime = loop.start;
        return;
      }
      const subs = subtitlesRef.current;
      const idx = subs.findIndex(sub => ct >= sub.start && ct < sub.end);
      callbackRef.current({ currentTime: ct, activeSubtitleIndex: idx });
    };
    const onEnded = () => callbackRef.current({ isPlaying: false });
    const onPlay = () => callbackRef.current({ isPlaying: true });
    const onPause = () => callbackRef.current({ isPlaying: false });

    media.addEventListener("loadedmetadata", onLoadedMeta);
    media.addEventListener("canplay", onCanPlay);
    media.addEventListener("waiting", onWaiting);
    media.addEventListener("error", onError);
    media.addEventListener("durationchange", onDurationChange);
    media.addEventListener("timeupdate", onTimeUpdate);
    media.addEventListener("ended", onEnded);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);

    return () => {
      media.removeEventListener("loadedmetadata", onLoadedMeta);
      media.removeEventListener("canplay", onCanPlay);
      media.removeEventListener("waiting", onWaiting);
      media.removeEventListener("error", onError);
      media.removeEventListener("durationchange", onDurationChange);
      media.removeEventListener("timeupdate", onTimeUpdate);
      media.removeEventListener("ended", onEnded);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
    };
  }, []);

  return { mediaRef };
}
