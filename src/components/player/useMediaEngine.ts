import { useEffect, useRef } from "react";
import type { MediaSource, SubtitleLine } from "@/types";
import { allowMediaFile, resolveLocalMediaSrc } from "@/utils/mediaAsset";

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
  initialPosition: number;
  subtitleOffset: number;
  onStateChange: (patch: Partial<MediaEngineState>) => void;
}

export function useMediaEngine({
  source, playbackRate, volume, abLoop, subtitles, initialPosition, subtitleOffset, onStateChange,
}: UseMediaEngineOptions) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const abLoopRef = useRef(abLoop);
  const subtitlesRef = useRef(subtitles);
  const callbackRef = useRef(onStateChange);
  const initialPosRef = useRef(initialPosition);
  const subtitleOffsetRef = useRef(subtitleOffset);

  useEffect(() => { abLoopRef.current = abLoop; }, [abLoop]);
  useEffect(() => { subtitlesRef.current = subtitles; }, [subtitles]);
  useEffect(() => { callbackRef.current = onStateChange; }, [onStateChange]);
  useEffect(() => { initialPosRef.current = initialPosition; }, [initialPosition]);
  useEffect(() => { subtitleOffsetRef.current = subtitleOffset; }, [subtitleOffset]);

  // Sync source changes
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    let cancelled = false;
    const cb = () => callbackRef.current;
    if (!source) {
      media.pause();
      media.removeAttribute("src");
      cb()({ isPlaying: false, playState: "idle", currentTime: 0 });
      return;
    }
    const loadSource = async () => {
      cb()({ playState: "loading" });
      if (source.type === "file") {
        await allowMediaFile(source.path);
      }
      if (cancelled) return;
      media.src = source.type === "file" ? resolveLocalMediaSrc(source.path) : source.path;
      media.playbackRate = playbackRate;
      media.volume = volume;
      media.load();
      cb()({ currentTime: 0, isPlaying: false });
    };
    loadSource();
    return () => {
      cancelled = true;
    };
  }, [source?.path, source?.type]);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) media.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) media.volume = volume;
  }, [volume]);

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
      const pos = initialPosRef.current;
      if (pos > 0) {
        media.currentTime = pos;
        initialPosRef.current = 0;
      }
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
      const offset = subtitleOffsetRef.current / 1000;
      const effectiveTime = ct + offset;
      const subs = subtitlesRef.current;
      const idx = subs.findIndex(sub => effectiveTime >= sub.start && effectiveTime < sub.end);
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
