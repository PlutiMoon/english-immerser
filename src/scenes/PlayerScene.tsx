import { useEffect, useState, useCallback, useRef } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import MediaSourceComponent from "@/components/player/MediaSource";
import ProgressBar from "@/components/player/ProgressBar";
import PlayerControls from "@/components/player/PlayerControls";
import SubtitlePanel from "@/components/player/SubtitlePanel";
import { useMediaEngine } from "@/components/player/useMediaEngine";
import type { MediaEngineState } from "@/components/player/useMediaEngine";
import { usePodcastStore } from "@/stores/podcastStore";
import { openCacheDir } from "@/utils/openFolder";
import type { MediaSource, SubtitleLine, SavedLoop } from "@/types";

const MAX_RECENT = 10;
const POSITION_SAVE_INTERVAL = 5; // seconds
const MIN_POSITION_SAVE = 5; // don't save positions before 5s

function MediaVisual({ source }: { source: MediaSource | null }) {
  if (!source) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-gray-100 h-48 border border-gray-200">
        <p className="text-gray-400 text-sm">选择音频或视频素材开始学习</p>
      </div>
    );
  }
  const isVideo = /\.(mp4|webm|mkv|avi|mov)$/i.test(source.path);
  if (isVideo) return null;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-primary-50 to-warm-50 p-8 border border-primary-100">
      <span className="text-6xl mb-3">🎧</span>
      <p className="text-lg font-medium text-gray-800">{source.name}</p>
      <p className="text-xs text-gray-400 mt-1 truncate max-w-full">{source.path}</p>
    </div>
  );
}

function StatusBadge({ playState }: { playState: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    loading: { text: "加载中...", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    ready: { text: "就绪", cls: "bg-green-50 text-green-700 border-green-200" },
    error: { text: "加载失败", cls: "bg-red-50 text-red-700 border-red-200" },
    idle: { text: "等待播放", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const info = map[playState] ?? map.idle;
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${info.cls}`}>{info.text}</span>;
}

export default function PlayerScene({ data, setData, toast, onSceneChange }: SceneProps) {
  const playerData = data.player;
  const [source, setSourceState] = useState<MediaSource | null>(playerData.source);
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);

  // Playback settings
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [abLoop, setABLoop] = useState<{ start: number; end: number } | null>(null);
  const [subtitleOffset, setSubtitleOffset] = useState(0);

  // Initial position on source change
  const initialPosition = source ? (playerData.positions[source.path] ?? 0) : 0;

  // Engine state (high-frequency)
  const [engineState, setEngineState] = useState<MediaEngineState>({
    isPlaying: false, currentTime: 0, duration: 0,
    playState: "idle", activeSubtitleIndex: -1,
  });

  const handleEngineStateChange = useCallback((patch: Partial<MediaEngineState>) => {
    setEngineState(prev => ({ ...prev, ...patch }));
  }, []);

  const { mediaRef } = useMediaEngine({
    source, playbackRate, volume, abLoop, subtitles,
    initialPosition, subtitleOffset,
    onStateChange: handleEngineStateChange,
  });

  // Wrap setSource to manage recent list + position save
  const setSource = useCallback((next: MediaSource | null) => {
    setSourceState(prev => {
      if (prev && prev.path !== next?.path && engineState.currentTime > MIN_POSITION_SAVE) {
        // Save position of previous source
        const positions = { ...playerData.positions, [prev.path]: engineState.currentTime };
        // Update recent list
        const filtered = playerData.recentSources.filter(s => s.path !== prev.path);
        const recentSources = [prev, ...filtered].slice(0, MAX_RECENT);
        setData({ player: { ...playerData, positions, recentSources } });
      }
      return next;
    });
  }, [engineState.currentTime, playerData, setData]);

  // Sync source + player state to AppData
  useEffect(() => {
    setData({ player: { ...playerData, source: source! } });
  }, [source?.path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-restore last source on mount
  useEffect(() => {
    if (!source && playerData.recentSources.length > 0) {
      setSourceState(playerData.recentSources[0]);
    }
  }, []); // only on mount

  // Periodic position save
  const lastSavedPosRef = useRef(-1);
  useEffect(() => {
    const interval = setInterval(() => {
      const ct = engineState.currentTime;
      if (source && ct > MIN_POSITION_SAVE && Math.abs(ct - lastSavedPosRef.current) > 1) {
        lastSavedPosRef.current = ct;
        setData({
          player: {
            ...playerData,
            positions: { ...playerData.positions, [source.path]: ct },
          },
        });
      }
    }, POSITION_SAVE_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [source, playerData, setData, engineState.currentTime]);

  // Podcast store
  const podcast = usePodcastStore();
  const podcastRecovery = usePodcastStore((s) => s.recovery);
  const clearPodcastRecovery = usePodcastStore((s) => s.clearRecovery);

  useEffect(() => {
    if (podcastRecovery) {
      const detail = podcastRecovery.backupPath
        ? `已备份到 ${podcastRecovery.backupPath}`
        : `已跳过 ${podcastRecovery.invalidCount} 条异常记录`;
      toast(`${podcastRecovery.label}数据已自动恢复，${detail}`, "warning", 7000);
      clearPodcastRecovery();
    }
  }, [podcastRecovery, clearPodcastRecovery, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const media = mediaRef.current;
      if (!media) return;
      switch (e.key) {
        case " ": e.preventDefault(); media.paused ? media.play().catch(() => {}) : media.pause(); break;
        case "ArrowLeft": e.preventDefault(); media.currentTime = Math.max(0, media.currentTime - 5); break;
        case "ArrowRight": e.preventDefault(); media.currentTime = Math.min(media.duration || 0, media.currentTime + 5); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mediaRef]);

  // Saved loops for current source
  const savedLoops = source ? (playerData.savedLoops[source.path] ?? []) : [];

  const handleSaveLoop = useCallback((label: string) => {
    if (!abLoop || !source) return;
    const loop: SavedLoop = { start: abLoop.start, end: abLoop.end, label };
    const updated = [...savedLoops, loop];
    setData({
      player: {
        ...playerData,
        savedLoops: { ...playerData.savedLoops, [source.path]: updated },
      },
    });
  }, [abLoop, source, savedLoops, playerData, setData]);

  const handleDeleteLoop = useCallback((index: number) => {
    if (!source) return;
    const updated = savedLoops.filter((_, i) => i !== index);
    setData({
      player: {
        ...playerData,
        savedLoops: { ...playerData.savedLoops, [source.path]: updated },
      },
    });
  }, [source, savedLoops, playerData, setData]);

  const isVideo = source && /\.(mp4|webm|mkv|avi|mov)$/i.test(source.path);

  return (
    <div className="space-y-4">
      <PageHeader title="沉浸听力与影子跟读" subtitle="导入本地文件、在线链接或播客RSS，支持-5s快退、AB循环、变速播放" />
      {isVideo ? (
        <video ref={mediaRef as React.RefObject<HTMLVideoElement>} className="w-full rounded-xl bg-black max-h-96" controls={false} />
      ) : (
        <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} />
      )}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <MediaVisual source={source} />
          <StatusBadge playState={engineState.playState} />
          {source && (
            <>
              <ProgressBar mediaRef={mediaRef}
                currentTime={engineState.currentTime} duration={engineState.duration} abLoop={abLoop} />
              <PlayerControls mediaRef={mediaRef}
                isPlaying={engineState.isPlaying} playbackRate={playbackRate} volume={volume}
                abLoop={abLoop} currentTime={engineState.currentTime}
                savedLoops={savedLoops}
                onPlaybackRateChange={setPlaybackRate} onVolumeChange={setVolume}
                onABLoopChange={setABLoop}
                onSaveLoop={handleSaveLoop} onDeleteLoop={handleDeleteLoop} />
            </>
          )}
        </div>
        <div className="col-span-4 space-y-4">
          <MediaSourceComponent source={source} onSourceChange={setSource}
            onSubtitlesChange={setSubtitles}
            recentSources={playerData.recentSources}
            presets={podcast.presets} customFeeds={podcast.customFeeds}
            feedCache={podcast.feedCache} loading={podcast.loading} error={podcast.error}
            onFetchFeed={podcast.fetchFeed} onAddCustomFeed={podcast.addCustomFeed}
            onRemoveCustomFeed={podcast.removeCustomFeed}
            onLoadCustomFeeds={podcast.loadCustomFeeds}
            toast={toast} />
          <button onClick={() => openCacheDir().catch((err) => {
            console.error("Failed to open cache directory:", err);
            toast("打开下载缓存目录失败", "error");
          })}
            className="text-xs text-gray-400 hover:text-primary-600 transition-colors">
            打开下载缓存目录 →
          </button>
          {source && (
            <SubtitlePanel mediaRef={mediaRef} subtitles={subtitles}
              activeSubtitleIndex={engineState.activeSubtitleIndex}
              subtitleOffset={subtitleOffset} onSubtitleOffsetChange={setSubtitleOffset}
              onSceneChange={onSceneChange}
              sourceName={source.name} sourcePath={source.path} />
          )}
        </div>
      </div>
    </div>
  );
}
