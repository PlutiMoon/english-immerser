import { useRef, useState } from "react";
import { formatSeconds } from "@/utils/formatSeconds";
import { allowMediaFile, resolveLocalMediaSrc } from "@/utils/mediaAsset";
import type { RecordingFile, ToastType } from "@/types";
import { PauseIcon, PlayIcon, TrashIcon } from "@/components/icons/AppIcons";

interface RecordingsListProps {
  history: RecordingFile[];
  loaded: boolean;
  onPlay: (file: RecordingFile) => void;
  onDelete: (file: RecordingFile) => Promise<void>;
  toast?: (message: string, type?: ToastType, duration?: number) => void;
}

export default function RecordingsList({
  history,
  loaded,
  onPlay,
  onDelete,
  toast,
}: RecordingsListProps) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!loaded) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center text-sm text-gray-400">
        加载中...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center text-sm text-gray-400">
        暂无录音 — 录完保存后这里会显示历史记录
      </div>
    );
  }

  const handlePlay = async (file: RecordingFile) => {
    onPlay(file);
    const audio = audioRef.current;
    if (!audio) return;
    if (playing === file.path) {
      audio.pause();
      setPlaying(null);
      return;
    }
    try {
      await allowMediaFile(file.path);
      audio.src = resolveLocalMediaSrc(file.path);
      await audio.play();
      setPlaying(file.path);
    } catch (err) {
      console.error("Playback failed:", err);
      toast?.("录音播放失败", "error");
    }
  };

  const handleDelete = async (file: RecordingFile) => {
    if (deleteTarget === file.path) {
      try {
        await onDelete(file);
        toast?.("录音已删除", "success");
      } catch (err) {
        console.error("Delete failed:", err);
        toast?.("录音删除失败", "error");
      }
      setDeleteTarget(null);
    } else {
      setDeleteTarget(file.path);
      setTimeout(() => setDeleteTarget(null), 3000);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">
        历史录音 ({history.length})
      </h3>
      <audio
        ref={audioRef}
        className="hidden"
        onPause={() => setPlaying(null)}
        onEnded={() => setPlaying(null)}
      />
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {history.map((file) => {
          const isPlaying = playing === file.path;
          const isDeleting = deleteTarget === file.path;
          return (
            <div
              key={file.path}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                isPlaying
                  ? "bg-primary-50 border border-primary-200"
                  : "border border-gray-100"
              }`}
            >
              <button
                onClick={() => handlePlay(file)}
                className="shrink-0 text-lg"
                title={isPlaying ? "暂停" : "播放"}
              >
          {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4 translate-x-px" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 truncate text-xs">{file.name}</p>
                <p className="text-gray-400 text-xs">
                  {formatSeconds(file.duration)}
                  {" · "}
                  {formatDate(file.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file);
                }}
                className={`shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors ${
                  isDeleting
                    ? "bg-red-100 text-red-600"
                    : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                }`}
                title={isDeleting ? "再点一次确认删除" : "删除"}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                {isDeleting ? "确认" : ""}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
