import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/playerStore";

export function useMediaEngine() {
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  // Sync source changes to the persistent media element
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const { source, playbackRate, volume } = usePlayerStore.getState();
    if (!source) {
      media.pause();
      media.removeAttribute("src");
      usePlayerStore.getState().reset();
      return;
    }

    usePlayerStore.getState().setPlayState("loading");
    media.src = source.path;
    media.playbackRate = playbackRate;
    media.volume = volume;
    media.load();
    usePlayerStore.getState().setCurrentTime(0);
    usePlayerStore.getState().setPlaying(false);
  }, [
    usePlayerStore((s) => s.source?.path),
    usePlayerStore((s) => s.source?.type),
  ]);

  // Wire media events to store (bound once on mount)
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const onLoaded = () => {
      const d = media.duration;
      if (isFinite(d)) usePlayerStore.getState().setDuration(d);
    };

    const onCanPlay = () => {
      usePlayerStore.getState().setPlayState("ready");
      const d = media.duration;
      if (isFinite(d)) usePlayerStore.getState().setDuration(d);
    };

    const onWaiting = () => {
      usePlayerStore.getState().setPlayState("loading");
    };

    const onError = () => {
      usePlayerStore.getState().setPlayState("error");
    };

    const onTimeUpdate = () => {
      const s = usePlayerStore.getState();
      const ct = media.currentTime;
      if (s.abLoop && ct >= s.abLoop.end) {
        media.currentTime = s.abLoop.start;
        return;
      }
      s.setCurrentTime(ct);
      const idx = s.subtitles.findIndex(
        (sub) => ct >= sub.start && ct < sub.end,
      );
      if (idx !== s.activeSubtitleIndex) {
        s.setActiveSubtitleIndex(idx);
      }
    };

    const onEnded = () => usePlayerStore.getState().setPlaying(false);
    const onPlay = () => usePlayerStore.getState().setPlaying(true);
    const onPause = () => usePlayerStore.getState().setPlaying(false);
    const onDurationChange = () => {
      const d = media.duration;
      if (isFinite(d)) usePlayerStore.getState().setDuration(d);
    };

    media.addEventListener("loadedmetadata", onLoaded);
    media.addEventListener("canplay", onCanPlay);
    media.addEventListener("waiting", onWaiting);
    media.addEventListener("error", onError);
    media.addEventListener("durationchange", onDurationChange);
    media.addEventListener("timeupdate", onTimeUpdate);
    media.addEventListener("ended", onEnded);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);

    return () => {
      media.removeEventListener("loadedmetadata", onLoaded);
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

  // Sync playbackRate and volume from store → element
  useEffect(() =>
    usePlayerStore.subscribe((s, prev) => {
      if (s.playbackRate !== prev.playbackRate && mediaRef.current) {
        mediaRef.current.playbackRate = s.playbackRate;
      }
      if (s.volume !== prev.volume && mediaRef.current) {
        mediaRef.current.volume = s.volume;
      }
    }),
  []);

  return { mediaRef };
}
