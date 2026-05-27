import { useRef, useEffect, useState } from "react";
import { formatSeconds } from "@/utils/formatSeconds";
import {
  BookOpenIcon,
  MoreHorizontalIcon,
  PenToolIcon,
  XIcon,
} from "@/components/icons/AppIcons";
import { useVocabularyStore } from "@/stores/vocabularyStore";
import { useWritingStore } from "@/stores/writingStore";
import type { Scene } from "@/App";
import type { SubtitleLine } from "@/types";

interface SubtitlePanelProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  subtitles: SubtitleLine[];
  activeSubtitleIndex: number;
  subtitleOffset: number;
  onSubtitleOffsetChange: (offset: number) => void;
  onClearSubtitles: () => void;
  onSceneChange?: (scene: Scene) => void;
  sourceName?: string;
  sourcePath?: string;
}

const OFFSET_STEPS = [-500, -100, -50, 0, 50, 100, 500];

export default function SubtitlePanel({
  mediaRef, subtitles, activeSubtitleIndex,
  subtitleOffset, onSubtitleOffsetChange, onClearSubtitles,
  onSceneChange, sourceName, sourcePath,
}: SubtitlePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);

  useEffect(() => {
    if (activeSubtitleIndex < 0) return;
    const el = scrollRef.current?.children[activeSubtitleIndex] as HTMLElement;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeSubtitleIndex]);

  useEffect(() => {
    const handleClick = () => {
      if (openMenuIdx !== null) setOpenMenuIdx(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenuIdx]);

  const handleClick = (start: number) => {
    const media = mediaRef.current;
    if (media) media.currentTime = start;
  };

  const handleAddToVocabulary = (e: React.MouseEvent, text: string, startTime: number) => {
    e.stopPropagation();
    useVocabularyStore.getState().setPendingWord({
      word: text, source: sourceName ?? "",
      mediaPath: sourcePath, mediaTimestamp: startTime,
    });
    if (onSceneChange) onSceneChange("vocabulary");
    setOpenMenuIdx(null);
  };

  const handleSetWritingPrompt = (e: React.MouseEvent, text: string, startTime: number) => {
    e.stopPropagation();
    useWritingStore.getState().setPendingContent({
      title: `字幕灵感 - ${formatSeconds(startTime)}`,
      content: `Prompt: ${text}\n\n`,
    });
    if (onSceneChange) onSceneChange("writing");
    setOpenMenuIdx(null);
  };

  if (subtitles.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center text-sm text-gray-400">
        暂无字幕 — 导入本地媒体时可自动检测同名 .srt / .vtt 文件
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Offset controls */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-gray-400 mr-1">字幕</span>
        {OFFSET_STEPS.map(step => (
          <button key={step}
            onClick={() => onSubtitleOffsetChange(step)}
            className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
              subtitleOffset === step
                ? "bg-primary-100 text-primary-700 font-medium"
                : "text-gray-500 hover:bg-gray-100"
            }`}>
            {step > 0 ? "+" : ""}{step}ms
          </button>
        ))}
        <button
          onClick={onClearSubtitles}
          className="ml-auto rounded px-1.5 py-0.5 text-xs text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="关闭字幕">
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Subtitle list */}
      <div ref={scrollRef} className="max-h-44 overflow-y-auto rounded-xl bg-gray-50 border border-gray-100 p-2 space-y-1">
        {subtitles.map((line, i) => (
          <div key={i} className={`group flex items-center rounded px-3 py-1.5 text-left text-sm transition-colors ${i === activeSubtitleIndex ? "bg-primary-100 text-primary-800 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
            <button onClick={() => handleClick(line.start)} className="flex-1 text-left min-w-0">
              <span className="text-xs text-gray-400 mr-2 font-mono">{formatSeconds(line.start)}</span>
              {line.text}
            </button>
            {/* "+" action button */}
            <div className="relative shrink-0 ml-1">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenuIdx(openMenuIdx === i ? null : i); }}
                className="opacity-0 group-hover:opacity-100 rounded px-1 text-xs text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                title="更多操作">
                <MoreHorizontalIcon className="h-4 w-4" />
              </button>
              {openMenuIdx === i && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-36">
                  <button
                    onClick={(e) => handleAddToVocabulary(e, line.text, line.start)}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpenIcon className="h-3.5 w-3.5" />
                      添加生词
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleSetWritingPrompt(e, line.text, line.start)}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                    <span className="inline-flex items-center gap-1.5">
                      <PenToolIcon className="h-3.5 w-3.5" />
                      设为写作提示
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
