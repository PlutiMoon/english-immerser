import { useState, useEffect, useCallback } from "react";
import type { ToastType } from "@/types";
import { useWritingStore } from "@/stores/writingStore";
import { dailyPromptForSlot, randomPromptForSlot } from "@/utils/writingPrompts";
import type { PromptSlot } from "@/utils/writingPrompts";
import { RefreshIcon } from "@/components/icons/AppIcons";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const SLOT_LABELS = ["事实", "感受", "思考"] as const;
const SLOT_COLORS = [
  "border-l-blue-400 bg-blue-50/60",
  "border-l-rose-400 bg-rose-50/60",
  "border-l-amber-400 bg-amber-50/60",
];

interface DiaryViewProps {
  toast?: (message: string, type?: ToastType, duration?: number) => void;
}

export default function DiaryView({ toast }: DiaryViewProps) {
  const today = todayStr();
  const [sentences, setSentences] = useState<string[]>(["", "", ""]);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>(() => [
    dailyPromptForSlot(0),
    dailyPromptForSlot(1),
    dailyPromptForSlot(2),
  ]);
  const historyDates = useWritingStore((s) => s.diaryDates);
  const loadDiaryHistory = useWritingStore((s) => s.loadDiaryHistory);
  const loadDiary = useWritingStore((s) => s.loadDiary);
  const saveDiary = useWritingStore((s) => s.saveDiary);
  const deleteDiary = useWritingStore((s) => s.deleteDiary);

  const shuffleSlot = (slot: PromptSlot) => {
    setPrompts(prev => {
      const next = [...prev];
      next[slot] = randomPromptForSlot(slot);
      return next;
    });
  };

  const loadToday = useCallback(async () => {
    try {
      await loadDiaryHistory();
      const raw = await loadDiary(today);
      if (raw !== null) {
        const lines = raw.split("\n").filter((l) => l.trim());
        setSentences([lines[0] || "", lines[1] || "", lines[2] || ""]);
      } else {
        setSentences(["", "", ""]);
      }
    } catch (err) {
      console.error("Failed to load diary:", err);
      toast?.("日记加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [loadDiary, loadDiaryHistory, today, toast]);

  useEffect(() => { loadToday(); }, [loadToday]);

  const updateSentence = (i: number, value: string) => {
    const next = [...sentences];
    next[i] = value;
    setSentences(next);
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveDiary(today, sentences.map((s) => s.trim()).join("\n"));
      setSaved(true);
      toast?.("日记已保存", "success");
    } catch (err) {
      console.error("Failed to save diary:", err);
      setError(`保存失败: ${String(err)}`);
      toast?.("日记保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const viewDate = useCallback(async (date: string) => {
    try {
      const raw = await loadDiary(date);
      setViewingContent(raw ?? "(日记不存在)");
      setViewingDate(date);
    } catch (err) {
      console.error("Failed to read diary:", err);
      toast?.("日记读取失败", "error");
    }
  }, [loadDiary, toast]);

  const handleDeleteDate = async (date: string) => {
    if (deleteTarget === date) {
      try {
        await deleteDiary(date);
        if (viewingDate === date) { setViewingDate(null); setViewingContent(""); }
        toast?.("日记已删除", "success");
      } catch (err) {
        console.error("Failed to delete diary:", err);
        toast?.("日记删除失败", "error");
      }
      setDeleteTarget(null);
    } else {
      setDeleteTarget(date);
      setTimeout(() => setDeleteTarget(null), 3000);
    }
  };

  if (loading) return null;

  // Reading history mode
  if (viewingDate) {
    return (
      <div className="space-y-4">
        <button onClick={() => setViewingDate(null)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          ← 返回今天
        </button>
        <h3 className="text-lg font-semibold text-gray-800">{formatDate(viewingDate)}</h3>
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{viewingContent}</pre>
        </div>
      </div>
    );
  }

  const allEmpty = sentences.every((s) => !s.trim());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{formatDate(today)}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Three sentences a day — fact, feeling, and one more thought.</p>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {!saved && !error && <span className="text-xs text-amber-500">未保存</span>}
          <button
            onClick={handleSave}
            disabled={saved || saving || allEmpty}
            className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-40 transition-colors">
            {saving ? "保存中..." : "保存日记"}
          </button>
        </div>
      </div>

      {/* Three sentences */}
      <div className="space-y-4">
        {sentences.map((s, i) => (
          <div key={i} className="group">
            {/* Prompt card */}
            <div className={`flex items-start gap-3 rounded-lg border border-gray-100 border-l-[3px] px-4 py-3 ${SLOT_COLORS[i]}`}>
              <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-500 text-xs flex items-center justify-center font-medium shadow-sm">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{SLOT_LABELS[i]}</span>
                  <button
                    onClick={() => shuffleSlot(i as PromptSlot)}
                    className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[11px] text-gray-300 hover:text-primary-500 transition-all"
                    title="换一句提示">
                    <RefreshIcon className="h-3 w-3" />换一句
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{prompts[i]}</p>
              </div>
            </div>
            {/* Input */}
            <input
              value={s}
              onChange={(e) => updateSentence(i, e.target.value)}
              className="w-full mt-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 placeholder:text-gray-300 transition-colors"
              placeholder="写下你的句子..."
            />
          </div>
        ))}
      </div>

      {/* History */}
      {historyDates.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-400 mb-3">历史日记</h4>
          <div className="flex flex-wrap gap-1.5">
            {historyDates.map((d) => {
              const isDeleting = deleteTarget === d;
              return (
                <div key={d} className="relative group/pill">
                  <button
                    onClick={() => viewDate(d)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors ${
                      d === today
                        ? "bg-primary-100 text-primary-700 font-medium"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>
                    {shortDate(d)}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDate(d); }}
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all ${
                      isDeleting ? "bg-red-500 text-white scale-110" : "bg-white border border-gray-200 text-gray-400 opacity-0 group-hover/pill:opacity-100 hover:bg-red-50 hover:text-red-500"
                    }`}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
