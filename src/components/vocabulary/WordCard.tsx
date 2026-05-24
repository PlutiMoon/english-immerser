import { useState } from "react";
import { formatSeconds } from "@/utils/formatSeconds";
import type { VocabularyWord } from "@/types";

interface WordCardProps {
  word: VocabularyWord;
  onEdit: () => void;
  onDelete: () => void;
  onTimestampClick?: () => void;
}

export default function WordCard({ word, onEdit, onDelete, onTimestampClick }: WordCardProps) {
  const [speaking, setSpeaking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSpeak =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const handleSpeak = () => {
    if (!canSpeak) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(word.word);
    u.lang = "en-US";
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(u);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col">
      {/* Word + actions */}
      <div className="flex items-start justify-between">
        <h4 className="text-lg font-semibold text-gray-800">{word.word}</h4>
        <div className="flex items-center gap-1 shrink-0">
          {canSpeak && (
            <button
              onClick={handleSpeak}
              className={`rounded p-1 text-sm transition-colors ${
                speaking
                  ? "bg-primary-100 text-primary-600"
                  : "text-gray-400 hover:text-primary-600 hover:bg-gray-50"
              }`}
              title="发音"
            >
              {speaking ? "🔊" : "🔈"}
            </button>
          )}
          <button
            onClick={onEdit}
            className="rounded p-1 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            title="编辑"
          >
            ✎
          </button>
          <button
            onClick={handleDelete}
            className={`rounded p-1 text-sm transition-colors ${
              confirmDelete
                ? "bg-red-100 text-red-600"
                : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
            }`}
            title={confirmDelete ? "再点一次确认删除" : "删除"}
          >
            {confirmDelete ? "✕" : "✕"}
          </button>
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm text-gray-600 mt-1 line-clamp-3">
        {word.englishDefinition}
      </p>

      {/* Self sentence */}
      {word.selfSentence && (
        <p className="text-sm text-gray-500 italic mt-2 border-l-2 border-primary-200 pl-2 line-clamp-2">
          "{word.selfSentence}"
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        {word.source && (
          <span className="bg-warm-50 text-warm-700 rounded px-1.5 py-0.5">
            {word.source}
          </span>
        )}
        {word.mediaTimestamp != null && (
          onTimestampClick ? (
            <button
              onClick={onTimestampClick}
              className="text-primary-500 hover:text-primary-600 hover:underline"
              title={`跳转到媒体时间点 ${formatSeconds(word.mediaTimestamp)}`}
            >
              ▶ {formatSeconds(word.mediaTimestamp)}
            </button>
          ) : (
            <span className="text-primary-500" title={`来源时间: ${formatSeconds(word.mediaTimestamp)}`}>
              ▶ {formatSeconds(word.mediaTimestamp)}
            </span>
          )
        )}
        <span>{word.createdAt.slice(0, 10)}</span>
        <span>
          {word.reviewCount > 0
            ? `已复习 ${word.reviewCount} 次`
            : "未复习"}
        </span>
      </div>
    </div>
  );
}
