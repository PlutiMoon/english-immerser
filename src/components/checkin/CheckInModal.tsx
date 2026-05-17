import { useState, useEffect } from "react";
import type { ModuleType } from "@/types";

const MODULES: { key: ModuleType; label: string; icon: string }[] = [
  { key: "player", label: "沉浸听力", icon: "🎧" },
  { key: "vocabulary", label: "习词本", icon: "📖" },
  { key: "writing", label: "自由写作", icon: "✍️" },
  { key: "recording", label: "录音棚", icon: "🎙️" },
  { key: "dictation", label: "听写复述", icon: "🎯" },
];

const DURATION_PRESETS = [30, 45, 60, 90, 120];

interface Props {
  onCheckIn: (duration: number, modules: ModuleType[], note: string) => void;
  onCancel: () => void;
}

export default function CheckInModal({ onCheckIn, onCancel }: Props) {
  const [duration, setDuration] = useState(60);
  const [selected, setSelected] = useState<Set<ModuleType>>(new Set());
  const [note, setNote] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const toggle = (m: ModuleType) => {
    const next = new Set(selected);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    setSelected(next);
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    onCheckIn(duration, Array.from(selected), note.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-800">今日打卡</h3>

        {/* Duration */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">学习时长（分钟）</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1 accent-primary-500"
            />
            <span className="w-12 text-right text-sm font-medium text-gray-700">
              {duration}
            </span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  duration === d
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {d}min
              </button>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">使用了哪些模块</p>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((m) => {
              const on = selected.has(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => toggle(m.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? "bg-primary-100 text-primary-700 border border-primary-300"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">备注（可选）</p>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今天学了什么..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="flex-1 rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-40 transition-colors"
          >
            打卡 ✓
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
