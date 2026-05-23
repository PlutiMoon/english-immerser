import { useRef, useEffect } from "react";
import { formatSeconds } from "@/utils/formatSeconds";
import type { SubtitleLine } from "@/types";

interface SubtitlePanelProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  subtitles: SubtitleLine[];
  activeSubtitleIndex: number;
}

export default function SubtitlePanel({ mediaRef, subtitles, activeSubtitleIndex }: SubtitlePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSubtitleIndex < 0) return;
    const el = scrollRef.current?.children[activeSubtitleIndex] as HTMLElement;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeSubtitleIndex]);

  const handleClick = (start: number) => {
    const media = mediaRef.current;
    if (media) media.currentTime = start;
  };

  if (subtitles.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center text-sm text-gray-400">
        暂无字幕 — 导入本地媒体时可自动检测同名 .srt / .vtt 文件
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="max-h-48 overflow-y-auto rounded-xl bg-gray-50 border border-gray-100 p-2 space-y-1">
      {subtitles.map((line, i) => (
        <button key={i} onClick={() => handleClick(line.start)}
          className={`w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${i === activeSubtitleIndex ? "bg-primary-100 text-primary-800 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
          <span className="text-xs text-gray-400 mr-2 font-mono">{formatSeconds(line.start)}</span>
          {line.text}
        </button>
      ))}
    </div>
  );
}
