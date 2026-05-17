import { useRef, useEffect } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { formatSeconds } from "@/utils/formatSeconds";

interface SubtitlePanelProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
}

export default function SubtitlePanel({ mediaRef }: SubtitlePanelProps) {
  const { subtitles, activeSubtitleIndex } = usePlayerStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep active subtitle visible
  useEffect(() => {
    if (activeSubtitleIndex < 0) return;
    const el = scrollRef.current?.children[activeSubtitleIndex] as HTMLElement;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeSubtitleIndex]);

  const handleClick = (start: number) => {
    const media = mediaRef.current;
    if (media) {
      media.currentTime = start;
    }
  };

  if (subtitles.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center text-sm text-gray-400">
        暂无字幕 — 导入本地媒体时可自动检测同名 .srt / .vtt 文件
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-48 overflow-y-auto rounded-xl bg-gray-50 border border-gray-100 p-2 space-y-1"
    >
      {subtitles.map((line, i) => (
        <button
          key={i}
          onClick={() => handleClick(line.start)}
          className={`w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
            i === activeSubtitleIndex
              ? "bg-primary-100 text-primary-800 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="text-xs text-gray-400 mr-2 font-mono">
            {formatSubtitleTime(line.start)}
          </span>
          {line.text}
        </button>
      ))}
    </div>
  );
}

function formatSubtitleTime(s: number): string {
  return formatSeconds(s);
}
