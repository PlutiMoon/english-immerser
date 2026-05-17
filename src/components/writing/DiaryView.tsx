import { useState, useEffect, useCallback } from "react";
import { readTextFile, writeFile, readDir, exists, remove } from "@tauri-apps/plugin-fs";
import { dataPaths } from "@/utils/dataPath";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const PROMPTS = [
  "今天发生了什么？描述一件事。",
  "今天有什么值得记住的？",
  "明天想做点什么？",
];

export default function DiaryView() {
  const today = todayStr();
  const [sentences, setSentences] = useState<string[]>(["", "", ""]);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Load today's diary and history list
  const loadToday = useCallback(async () => {
    try {
      const dir = await dataPaths.diary();

      // Load history dates
      const entries = await readDir(dir);
      const dates: string[] = [];
      for (const e of entries) {
        const name = e.name || "";
        const match = name.match(/^(\d{4}-\d{2}-\d{2})\.txt$/);
        if (match) dates.push(match[1]);
      }
      dates.sort().reverse();
      setHistoryDates(dates);

      // Load today
      const filePath = `${dir}/${today}.txt`;
      const fileExists = await exists(filePath);
      if (fileExists) {
        const raw = await readTextFile(filePath);
        const lines = raw.split("\n").filter((l) => l.trim());
        setSentences([
          lines[0] || "",
          lines[1] || "",
          lines[2] || "",
        ]);
      } else {
        setSentences(["", "", ""]);
      }
    } catch (err) {
      console.error("Failed to load diary:", err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

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
      const dir = await dataPaths.diary();
      const filePath = `${dir}/${today}.txt`;
      const content = sentences.map((s) => s.trim()).join("\n");
      await writeFile(filePath, new TextEncoder().encode(content));
      setSaved(true);

      // Refresh history
      setHistoryDates((prev) => {
        if (!prev.includes(today)) {
          const next = [today, ...prev];
          next.sort().reverse();
          return next;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to save diary:", err);
      setError(`保存失败: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // View a history entry
  const viewDate = useCallback(async (date: string) => {
    try {
      const dir = await dataPaths.diary();
      const filePath = `${dir}/${date}.txt`;
      const fileExists = await exists(filePath);
      if (fileExists) {
        const raw = await readTextFile(filePath);
        setViewingContent(raw);
      } else {
        setViewingContent("(日记不存在)");
      }
      setViewingDate(date);
    } catch (err) {
      console.error("Failed to read diary:", err);
    }
  }, []);

  const handleDeleteDate = async (date: string) => {
    if (deleteTarget === date) {
      try {
        const dir = await dataPaths.diary();
        const filePath = `${dir}/${date}.txt`;
        await remove(filePath);
        setHistoryDates((prev) => prev.filter((d) => d !== date));
        // If currently viewing the deleted date, go back
        if (viewingDate === date) {
          setViewingDate(null);
          setViewingContent("");
        }
      } catch (err) {
        console.error("Failed to delete diary:", err);
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
        <button
          onClick={() => setViewingDate(null)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          ← 返回今天
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {formatDate(viewingDate)}
        </h3>
        <div className="rounded-lg bg-white border border-gray-100 p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {viewingContent}
          </pre>
        </div>
      </div>
    );
  }

  const allEmpty = sentences.every((s) => !s.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {formatDate(today)} · 三句日记
        </h3>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
          {!saved && !error && (
            <span className="text-xs text-amber-500">未保存</span>
          )}
          <button
            onClick={handleSave}
            disabled={saved || saving || allEmpty}
            className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-40"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* Three sentence inputs */}
      <div className="space-y-3">
        {sentences.map((s, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="shrink-0 w-4 h-4 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center mt-2.5">
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">{PROMPTS[i]}</p>
              <input
                value={s}
                onChange={(e) => updateSentence(i, e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
                placeholder={`第${i + 1}句话...`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* History list */}
      {historyDates.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-400 mb-2">历史日记</h4>
          <div className="space-y-0.5">
            {historyDates.map((d) => {
              const isDeleting = deleteTarget === d;
              return (
                <div
                  key={d}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    d === today
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => viewDate(d)}
                    className="flex-1 text-left"
                  >
                    {formatDate(d)}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDate(d);
                    }}
                    className={`shrink-0 ml-2 px-1.5 py-0.5 rounded text-xs transition-colors ${
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
      )}
    </div>
  );
}
