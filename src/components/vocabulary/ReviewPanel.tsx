import { useState, useMemo } from "react";
import type { VocabularyWord } from "@/types";

interface ReviewPanelProps {
  words: VocabularyWord[];
  onClose: () => void;
  onMarkReviewed: (id: string) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewPanel({
  words,
  onClose,
  onMarkReviewed,
}: ReviewPanelProps) {
  // Build review queue: un-reviewed first, then least reviewed, shuffled within groups
  const queue = useMemo(() => {
    const unReviewed = words.filter((w) => w.reviewCount === 0);
    const reviewed = words.filter((w) => w.reviewCount > 0);
    reviewed.sort((a, b) => a.reviewCount - b.reviewCount);
    return [...shuffleArray(unReviewed), ...shuffleArray(reviewed)];
  }, [words]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (queue.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <p className="text-gray-400">没有可复习的单词</p>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          返回列表
        </button>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="surface-card p-12 text-center">
        <p className="text-lg font-medium text-gray-700">复习完成!</p>
        <p className="text-sm text-gray-400 mt-1">
          共复习 {queue.length} 张卡片
        </p>
        <button
          onClick={onClose}
          className="mt-4 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          返回列表
        </button>
      </div>
    );
  }

  const current = queue[index];

  const handleReviewed = () => {
    onMarkReviewed(current.id);
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  const handleSkip = () => {
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  return (
    <div className="surface-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← 退出复习
        </button>
        <span className="text-xs text-gray-400">
          第 {index + 1} / {queue.length} 张
        </span>
      </div>

      {/* Card */}
      <div className="flex flex-col items-center">
        <div
          onClick={() => setFlipped(true)}
          className={`w-full max-w-lg rounded-xl border-2 p-8 text-center cursor-pointer transition-all duration-300 ${
            flipped
              ? "border-primary-200 bg-primary-50/30"
              : "border-dashed border-gray-200 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/20"
          }`}
        >
          {!flipped ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                看到句子，回忆单词
              </p>
              <p className="text-lg text-gray-700 italic leading-relaxed">
                "{current.selfSentence || "(没有自造句子，直接看单词吧)"}"
              </p>
              <p className="text-sm text-primary-500 font-medium">
                点击翻转 / 显示答案
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-2xl font-bold text-primary-700">
                {current.word}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {current.englishDefinition}
              </p>
              {current.selfSentence && (
                <p className="text-sm text-gray-500 italic">
                  "{current.selfSentence}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => {
              setIndex((i) => Math.max(0, i - 1));
              setFlipped(false);
            }}
            disabled={index === 0}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 disabled:opacity-40"
          >
            ← 上一个
          </button>
          {flipped ? (
            <>
              <button
                onClick={handleReviewed}
                className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                标记已复习 ✓
              </button>
              <button
                onClick={handleSkip}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500 hover:bg-gray-200"
              >
                跳过 →
              </button>
            </>
          ) : (
            <button
              onClick={() => setFlipped(true)}
              className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              显示答案
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
