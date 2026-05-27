import { useRef, useState, useEffect, useCallback } from "react";
import type { DictationStep } from "@/types";
import { formatSeconds } from "@/utils/formatSeconds";
import { PauseIcon, PlayIcon } from "@/components/icons/AppIcons";

const STEPS: { key: string; label: string }[] = [
  { key: "listen", label: "盲听" },
  { key: "keywords", label: "关键词" },
  { key: "relisten", label: "再听" },
  { key: "retell", label: "复述" },
];

const STEP_KEYS = STEPS.map((s) => s.key);

interface DictationFlowProps {
  step: DictationStep;
  source: { name: string; path: string } | null;
  keywords: string;
  retellText: string;
  setStep: (step: DictationStep) => void;
  setKeywords: (keywords: string) => void;
  setRetellText: (text: string) => void;
  onFinish: () => void;
}

export default function DictationFlow({
  step,
  source,
  keywords,
  retellText,
  setStep,
  setKeywords,
  setRetellText,
  onFinish,
}: DictationFlowProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Initialize audio when source is set
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !source) return;
    audio.src = source.path;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
  }, [source]);

  // Sync audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => { if (isFinite(audio.duration)) setDuration(audio.duration); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  }, []);

  const currentIdx = STEP_KEYS.indexOf(step);

  const goNext = () => {
    const next = STEP_KEYS[currentIdx + 1];
    if (next) setStep(next as DictationStep);
  };

  const goPrev = () => {
    const prev = STEP_KEYS[currentIdx - 1];
    if (prev) setStep(prev as DictationStep);
  };

  return (
    <div className="space-y-5">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                  done
                    ? "bg-green-100 text-green-700"
                    : active
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs ${
                  active ? "text-primary-700 font-medium" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-6 h-0.5 ${i < currentIdx ? "bg-green-300" : "bg-gray-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Audio player bar */}
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="shrink-0 w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
        >
          {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4 translate-x-px" />}
        </button>
        <button
          onClick={skipBack}
          className="shrink-0 px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-200 transition-colors"
          title="倒退5秒"
        >
          -5s
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const t = parseFloat(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = t;
              setCurrentTime(t);
            }}
            className="w-full h-1 accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl bg-white border border-gray-100 p-5">
        {step === "listen" && (
          <div className="space-y-4 text-center">
            <p className="text-gray-500 text-sm">
              仔细听，不要写任何东西。专注于理解大意。
            </p>
            <button
              onClick={goNext}
              className="rounded-lg bg-primary-500 px-8 py-3 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              听完了，写关键词 →
            </button>
          </div>
        )}

        {step === "keywords" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              凭记忆输入你抓到的关键词或短语。用英文写，用逗号或空格分隔。
            </p>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如: climate change, carbon emissions, government policy..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm min-h-[120px] focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 resize-y"
              autoFocus
            />
            <div className="flex justify-between">
              <button
                onClick={goPrev}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← 返回重听
              </button>
              <button
                onClick={goNext}
                className="rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                再听一遍核对 →
              </button>
            </div>
          </div>
        )}

        {step === "relisten" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              再听一遍，对比你写下的关键词，看看有没有遗漏或听错的。
            </p>
            {keywords.trim() && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs text-amber-600 mb-1 font-medium">你的关键词</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{keywords}</p>
              </div>
            )}
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="修正你的关键词..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm min-h-[80px] focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 resize-y"
            />
            <div className="flex justify-between">
              <button
                onClick={goPrev}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← 修改关键词
              </button>
              <button
                onClick={goNext}
                className="rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                用自己的话复述 →
              </button>
            </div>
          </div>
        )}

        {step === "retell" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              用你自己的英文复述这段内容。不用逐字还原，表达核心意思即可。
            </p>
            {keywords.trim() && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">关键词提示</p>
                <p className="text-sm text-gray-600">{keywords}</p>
              </div>
            )}
            <textarea
              value={retellText}
              onChange={(e) => setRetellText(e.target.value)}
              placeholder="用英文复述你理解的内容..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm min-h-[150px] focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 resize-y"
              autoFocus
            />
            <div className="flex justify-between">
              <button
                onClick={goPrev}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← 再听一次
              </button>
              <button
                onClick={onFinish}
                disabled={!retellText.trim()}
                className="rounded-lg bg-green-500 px-8 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-40 transition-colors"
              >
                完成 ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
