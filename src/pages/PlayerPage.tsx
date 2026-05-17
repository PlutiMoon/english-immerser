import { useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import MediaSource from "@/components/player/MediaSource";
import ProgressBar from "@/components/player/ProgressBar";
import PlayerControls from "@/components/player/PlayerControls";
import SubtitlePanel from "@/components/player/SubtitlePanel";
import { useMediaEngine } from "@/components/player/useMediaEngine";
import { usePlayerStore } from "@/stores/playerStore";
import { openCacheDir } from "@/utils/openFolder";

function MediaVisual() {
  const { source } = usePlayerStore();
  if (!source) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-gray-100 h-48 border border-gray-200">
        <p className="text-gray-400 text-sm">选择音频或视频素材开始学习</p>
      </div>
    );
  }
  const isVideo = /\.(mp4|webm|mkv|avi|mov)$/i.test(source.path);
  if (isVideo) {
    return null; // video element renders in PlayerPage
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-primary-50 to-warm-50 p-8 border border-primary-100">
      <span className="text-6xl mb-3">🎧</span>
      <p className="text-lg font-medium text-gray-800">{source.name}</p>
      <p className="text-xs text-gray-400 mt-1 truncate max-w-full">{source.path}</p>
    </div>
  );
}

function StatusBadge() {
  const { source, playState } = usePlayerStore();
  if (!source) return null;

  const map: Record<string, { text: string; cls: string }> = {
    loading: { text: "加载中...", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    ready: { text: "就绪", cls: "bg-green-50 text-green-700 border-green-200" },
    error: { text: "加载失败", cls: "bg-red-50 text-red-700 border-red-200" },
    idle: { text: "等待播放", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const info = map[playState] ?? map.idle;

  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${info.cls}`}>
      {info.text}
    </span>
  );
}

export default function PlayerPage() {
  const { source } = usePlayerStore();
  const { mediaRef } = useMediaEngine();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const media = mediaRef.current;
      if (!media) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (media.paused) media.play().catch(() => {});
          else media.pause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          media.currentTime = Math.max(0, media.currentTime - 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          media.currentTime = Math.min(media.duration || 0, media.currentTime + 5);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mediaRef]);

  const isVideo = source && /\.(mp4|webm|mkv|avi|mov)$/i.test(source.path);

  return (
    <div className="space-y-4">
      <PageHeader
        title="沉浸听力与影子跟读"
        subtitle="导入本地文件、在线链接或播客RSS，支持-5s快退、AB循环、变速播放"
      />

      {/* Persistent media element */}
      {isVideo ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          className="w-full rounded-xl bg-black max-h-96"
          controls={false}
        />
      ) : (
        <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} />
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <MediaVisual />
          <StatusBadge />
          {source && (
            <>
              <ProgressBar mediaRef={mediaRef} />
              <PlayerControls mediaRef={mediaRef} />
            </>
          )}
        </div>
        <div className="col-span-4 space-y-4">
          <MediaSource />
          <button
            onClick={() => openCacheDir().catch(console.error)}
            className="text-xs text-gray-400 hover:text-primary-600 transition-colors"
          >
            打开下载缓存目录 →
          </button>
          {source && <SubtitlePanel mediaRef={mediaRef} />}
        </div>
      </div>
    </div>
  );
}
