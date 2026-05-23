import { useRef, useState } from "react";
import { remove } from "@tauri-apps/plugin-fs";
import { useRecordingStore } from "@/stores/recordingStore";
import { formatSeconds } from "@/utils/formatSeconds";
import type { RecordingFile } from "@/types";

export default function RecordingsList() {
  const { history, removeFromHistory } = useRecordingStore();
  const [playing, setPlaying] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (history.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center text-sm text-gray-400">
        暂无录音 — 录完保存后这里会显示历史记录
      </div>
    );
  }

  const handlePlay = (file: RecordingFile) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing === file.path) {
      audio.pause();
      setPlaying(null);
      return;
    }
    audio.src = file.path;
    audio.play().catch(console.error);
    setPlaying(file.path);
  };

  const handleDelete = async (file: RecordingFile) => {
    if (deleteTarget === file.path) {
      try {
        await remove(file.path);
        await removeFromHistory(file.path);
      } catch (err) {
        console.error("Delete failed:", err);
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
                {isPlaying ? "⏸" : "▶"}
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
                className={`shrink-0 px-1.5 py-0.5 rounded text-xs transition-colors ${
                  isDeleting
                    ? "bg-red-100 text-red-600"
                    : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                }`}
                title={isDeleting ? "再点一次确认删除" : "删除"}
              >
                {isDeleting ? "确认删除" : "删"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
