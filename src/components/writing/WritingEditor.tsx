import { useEffect, useRef, useCallback, useState } from "react";
import type { WritingFileInfo } from "@/types";
import { randomPrompt } from "@/utils/writingPrompts";
import { RefreshIcon, SaveIcon } from "@/components/icons/AppIcons";

interface WritingEditorProps {
  title: string;
  content: string;
  saved: boolean;
  currentFile: WritingFileInfo | null;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => Promise<void>;
}

export default function WritingEditor({
  title, content, saved, currentFile,
  onTitleChange, onContentChange, onSave,
}: WritingEditorProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [suggestionPrompt, setSuggestionPrompt] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleRef = useRef(title); titleRef.current = title;
  const savedRef = useRef(saved); savedRef.current = saved;
  const onSaveRef = useRef(onSave); onSaveRef.current = onSave;

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (titleRef.current.trim() && !savedRef.current) {
        try { await onSaveRef.current(); setSaveError(null); }
        catch (err) { setSaveError(`自动保存失败: ${String(err)}`); }
      }
    }, 2000);
  }, []);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  const handleManualSave = async () => {
    if (!title.trim()) return;
    try { await onSave(); setSaveError(null); }
    catch (err) { setSaveError(`保存失败: ${String(err)}`); }
  };

  const handleInspire = () => {
    const prompt = randomPrompt();
    if (!title.trim()) {
      onTitleChange(prompt);
    } else {
      setSuggestionPrompt(prompt);
      setShowPrompt(true);
    }
    triggerAutoSave();
  };

  const applyPrompt = () => {
    onContentChange(content ? `${content}\n\n${suggestionPrompt}` : suggestionPrompt);
    setShowPrompt(false);
    triggerAutoSave();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Title area */}
      <input
        value={title}
        onChange={(e) => { onTitleChange(e.target.value); triggerAutoSave(); }}
        placeholder="文章标题..."
        className="w-full text-2xl font-semibold text-gray-800 border-none outline-none bg-transparent placeholder:text-gray-300"
      />

      {/* Visual divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-150" style={{ backgroundColor: "#e5e7eb" }} />
        <button
          onClick={handleInspire}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm"
          title="需要写作灵感？">
          <RefreshIcon className="h-3 w-3" />
          灵感
        </button>
        <div className="flex-1 h-px bg-gray-150" style={{ backgroundColor: "#e5e7eb" }} />
      </div>

      {/* Prompt suggestion bar */}
      {showPrompt && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-start gap-3">
          <span className="text-sm shrink-0">💡</span>
          <p className="text-sm text-amber-800 flex-1 leading-relaxed">{suggestionPrompt}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={applyPrompt}
              className="rounded bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors">
              使用
            </button>
            <button onClick={() => setShowPrompt(false)}
              className="rounded px-2 py-1 text-xs text-amber-500 hover:text-amber-700 transition-colors">
              忽略
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <textarea
        value={content}
        onChange={(e) => { onContentChange(e.target.value); triggerAutoSave(); }}
        placeholder="开始写作..."
        className="flex-1 w-full resize-none border-none outline-none bg-transparent text-gray-700 leading-relaxed placeholder:text-gray-300 min-h-[300px]"
      />

      {/* Status bar */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span>字数 {wordCount}</span>
        <span className="text-gray-200">|</span>
        <span className={saved ? "text-green-500 font-medium" : "text-amber-500"}>
          {saved ? `已保存 ${timeStr}` : "未保存"}
        </span>
        {!saved && title.trim() && (
          <button onClick={handleManualSave}
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
            <SaveIcon className="h-3 w-3" />立即保存
          </button>
        )}
        {saveError && <span className="text-red-500">{saveError}</span>}
        {currentFile && <span className="text-gray-300 ml-auto">{currentFile.name}.txt</span>}
      </div>
    </div>
  );
}
