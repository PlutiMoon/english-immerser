import { useState, useEffect, useMemo } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import FileList from "@/components/writing/FileList";
import WritingEditor from "@/components/writing/WritingEditor";
import DiaryView from "@/components/writing/DiaryView";
import { openFolder } from "@/utils/openFolder";
import { diaryStreak } from "@/utils/writingStats";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import { FolderIcon } from "@/components/icons/AppIcons";
import type { WritingFileInfo } from "@/types";
import { useWritingStore } from "@/stores/writingStore";

type Tab = "writing" | "diary";

export default function WritingScene({ toast }: SceneProps) {
  const [tab, setTab] = useState<Tab>("writing");
  const [currentFile, setCurrentFile] = useState<WritingFileInfo | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const { files, loaded, loadFiles, createWritingFile, readWritingFile, saveWritingFile, deleteWritingFile } = useWritingStore();
  const pendingContent = useWritingStore((s) => s.pendingContent);
  const diaryDates = useWritingStore((s) => s.diaryDates);
  const loadDiaryHistory = useWritingStore((s) => s.loadDiaryHistory);
  const clearPendingContent = useWritingStore((s) => s.clearPendingContent);

  const writingStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      fileCount: files.length,
      diaryCount: diaryDates.length,
      diaryStreak: diaryStreak(diaryDates),
      hasTodayDiary: diaryDates.includes(today),
    };
  }, [files.length, diaryDates]);

  useEffect(() => {
    (async () => {
      try { if (!loaded) await loadFiles(); loadDiaryHistory().catch(console.error); }
      catch (err) { console.error("Failed to initialize writing directories:", err); toast("写作目录初始化失败", "error"); }
    })();
  }, [loaded, loadFiles, loadDiaryHistory, toast]);

  useEffect(() => {
    if (!pendingContent || !loaded) return;
    (async () => {
      try {
        const fileInfo = await createWritingFile(pendingContent.title, pendingContent.content);
        setCurrentFile(fileInfo); setTitle(fileInfo.name); setContent(pendingContent.content); setSaved(true);
        setTab("writing"); clearPendingContent();
        toast("已自动创建写作文件", "success");
      } catch (err) { console.error("Failed to create file from pending content:", err); toast("自动创建写作文件失败", "error"); clearPendingContent(); }
    })();
  }, [pendingContent, loaded, clearPendingContent, createWritingFile, toast]);

  const selectFile = async (f: WritingFileInfo) => {
    try { const raw = await readWritingFile(f.path); setCurrentFile(f); setTitle(f.name); setContent(raw); setSaved(true); }
    catch (err) { console.error("Failed to read file:", err); toast("文章读取失败", "error"); }
  };

  const handleDelete = async (f: WritingFileInfo) => {
    try {
      await deleteWritingFile(f.path);
      if (currentFile?.path === f.path) { setCurrentFile(null); setTitle(""); setContent(""); }
      toast("文章已删除", "success");
    } catch (err) { console.error("Failed to delete file:", err); toast("文章删除失败", "error"); }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try { const fileInfo = await saveWritingFile(title, content, currentFile?.path); setCurrentFile(fileInfo); setTitle(fileInfo.name); setSaved(true); toast("文章已保存", "success"); }
    catch (err) { console.error("Failed to save file:", err); toast("文章保存失败", "error"); }
  };

  const switchTab = (newTab: Tab) => {
    if (tab === "writing" && newTab !== "writing" && !saved && title.trim()) handleSave().catch(console.error);
    setTab(newTab);
  };

  useEffect(() => () => { if (!saved && title.trim()) handleSave().catch(console.error); }, [saved, title]);

  // Inline stat pills
  const statPills = tab === "writing"
    ? [{ label: "文章", value: `${writingStats.fileCount}` }]
    : [
        { label: "日记", value: `${writingStats.diaryCount}` },
        { label: "连续", value: writingStats.diaryStreak > 0 ? `${writingStats.diaryStreak}天` : "—" },
        { label: "今日", value: writingStats.hasTodayDiary ? "✓" : "—" },
      ];

  return (
    <div className="space-y-5">
      <PageHeader title="自由写作与三句日记" subtitle="极简编辑器 + 每日三句话引导，保存为本地文件" />

      {/* Tab bar + inline stats */}
      <div className="flex items-center gap-4">
        <div className="tab-bar">
          {(["writing", "diary"] as Tab[]).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              className={`tab-item ${tab === t ? "active" : ""}`}>
              {t === "writing" ? "自由写作" : "三句日记"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {statPills.map(s => (
            <span key={s.label} className="text-xs text-gray-400">
              <span className="text-gray-500 font-medium">{s.label}</span>{" "}
              <span className="text-gray-700">{s.value}</span>
            </span>
          ))}
        </div>
      </div>

      {tab === "writing" ? (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-3">
            <div className="surface-card p-4 h-full">
              <FileList files={files} currentFile={currentFile} loading={!loaded}
                onSelect={selectFile} onDelete={handleDelete}
                onNew={() => { setCurrentFile(null); setTitle(""); setContent(""); setSaved(true); }} />
            </div>
          </div>
          <div className="col-span-9">
            <div className="surface-card p-6 h-full">
              <WritingEditor title={title} content={content} saved={saved} currentFile={currentFile}
                onTitleChange={setTitle} onContentChange={setContent} onSave={handleSave} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8">
            <div className="surface-card p-6">
              <DiaryView toast={toast} />
            </div>
          </div>
          <div className="col-span-4">
            <div className="surface-card p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">写作提示</h3>
                <ul className="mt-2 space-y-1.5 text-xs text-gray-500">
                  <li>· 先写再改，不要边写边纠结语法</li>
                  <li>· 坚持每天三句话比偶尔写长文更重要</li>
                  <li>· 用简单词汇表达清晰的意思</li>
                  <li>· 回顾旧日记，看到自己的进步</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-gray-50 space-y-2">
                <button onClick={async () => { await ensureDataDirs(); await openFolder(await dataPaths.diary()); }}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors">
                  <FolderIcon className="h-3 w-3" />日记目录
                </button>
                <button onClick={async () => { await ensureDataDirs(); await openFolder(await dataPaths.writing()); }}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors ml-4">
                  <FolderIcon className="h-3 w-3" />写作目录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
