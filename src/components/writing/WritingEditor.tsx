import { useEffect, useRef, useCallback, useState } from "react";
import { useWritingStore } from "@/stores/writingStore";

export default function WritingEditor() {
  const { title, content, saved, currentFile, setTitle, setContent } =
    useWritingStore();

  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save: 2 seconds after user stops typing
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const state = useWritingStore.getState();
      if (state.title.trim() && !state.saved) {
        try {
          await state.saveCurrent();
          setSaveError(null);
        } catch (err) {
          setSaveError(`自动保存失败: ${String(err)}`);
        }
      }
    }, 2000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const handleManualSave = async () => {
    const state = useWritingStore.getState();
    if (!state.title.trim()) return;
    try {
      await state.saveCurrent();
      setSaveError(null);
    } catch (err) {
      setSaveError(`保存失败: ${String(err)}`);
    }
  };

  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  const charCount = content.length;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          triggerAutoSave();
        }}
        placeholder="文章标题..."
        className="w-full text-2xl font-semibold text-gray-800 border-none outline-none bg-transparent mb-4 placeholder:text-gray-300"
      />

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          triggerAutoSave();
        }}
        placeholder="开始写作..."
        className="flex-1 w-full resize-none border-none outline-none bg-transparent text-gray-700 leading-relaxed placeholder:text-gray-300 min-h-[300px]"
      />

      {/* Status bar */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-xs">
        <span className="text-gray-400">字数: {wordCount}</span>
        <span className="text-gray-400">字符: {charCount}</span>
        <span className={saved ? "text-green-500" : "text-amber-500"}>
          {saved ? `已保存 ${timeStr}` : "未保存..."}
        </span>
        {!saved && title.trim() && (
          <button
            onClick={handleManualSave}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            立即保存
          </button>
        )}
        {saveError && (
          <span className="text-red-500">{saveError}</span>
        )}
        {currentFile && (
          <span className="text-gray-300">| {currentFile.name}.txt</span>
        )}
      </div>
    </div>
  );
}
