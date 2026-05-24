import { useState, useEffect } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import FileList from "@/components/writing/FileList";
import WritingEditor from "@/components/writing/WritingEditor";
import DiaryView from "@/components/writing/DiaryView";
import { openFolder } from "@/utils/openFolder";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import type { WritingFileInfo } from "@/types";
import { useWritingStore } from "@/stores/writingStore";

type Tab = "writing" | "diary";

export default function WritingScene({ toast }: SceneProps) {
  const [tab, setTab] = useState<Tab>("writing");
  const [currentFile, setCurrentFile] = useState<WritingFileInfo | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const {
    files,
    loaded,
    loadFiles,
    createWritingFile,
    readWritingFile,
    saveWritingFile,
    deleteWritingFile,
  } = useWritingStore();
  const pendingContent = useWritingStore((s) => s.pendingContent);
  const clearPendingContent = useWritingStore((s) => s.clearPendingContent);

  // Load writing files on mount
  useEffect(() => {
    (async () => {
      try {
        if (!loaded) {
          await loadFiles();
        }
      } catch (err) {
        console.error("Failed to initialize writing directories:", err);
        toast("写作目录初始化失败", "error");
      }
    })();
  }, [loaded, loadFiles, toast]);

  // Consume pending content from cross-module navigation
  useEffect(() => {
    if (!pendingContent || !loaded) return;
    (async () => {
      try {
        const fileInfo = await createWritingFile(pendingContent.title, pendingContent.content);
        setCurrentFile(fileInfo);
        setTitle(fileInfo.name);
        setContent(pendingContent.content);
        setSaved(true);
        setTab("writing");
        clearPendingContent();
        toast("已自动创建写作文件", "success");
      } catch (err) {
        console.error("Failed to create file from pending content:", err);
        toast("自动创建写作文件失败", "error");
        clearPendingContent();
      }
    })();
  }, [pendingContent, loaded, clearPendingContent, createWritingFile, toast]);

  const selectFile = async (f: WritingFileInfo) => {
    try {
      const raw = await readWritingFile(f.path);
      setCurrentFile(f); setTitle(f.name); setContent(raw); setSaved(true);
    } catch (err) {
      console.error("Failed to read file:", err);
      toast("文章读取失败", "error");
    }
  };

  const handleDelete = async (f: WritingFileInfo) => {
    try {
      await deleteWritingFile(f.path);
      if (currentFile?.path === f.path) {
        setCurrentFile(null); setTitle(""); setContent("");
      }
      toast("文章已删除", "success");
    } catch (err) {
      console.error("Failed to delete file:", err);
      toast("文章删除失败", "error");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      const fileInfo = await saveWritingFile(title, content, currentFile?.path);
      setCurrentFile(fileInfo);
      setTitle(fileInfo.name);
      setSaved(true);
      toast("文章已保存", "success");
    } catch (err) {
      console.error("Failed to save file:", err);
      toast("文章保存失败", "error");
    }
  };

  const switchTab = (newTab: Tab) => {
    if (tab === "writing" && newTab !== "writing" && !saved && title.trim()) {
      handleSave().catch(console.error);
    }
    setTab(newTab);
  };

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      if (!saved && title.trim()) handleSave().catch(console.error);
    };
  }, [saved, title]);

  return (
    <div className="space-y-4">
      <PageHeader title="自由写作与三句日记" subtitle="极简编辑器 + 每日三句话引导，保存为本地文件" />
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => switchTab("writing")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "writing" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          自由写作
        </button>
        <button onClick={() => switchTab("diary")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === "diary" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          三句日记
        </button>
      </div>
      {tab === "writing" ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4">
              <FileList files={files} currentFile={currentFile} loading={!loaded}
                onSelect={selectFile} onDelete={handleDelete} onNew={() => { setCurrentFile(null); setTitle(""); setContent(""); setSaved(true); }} />
            </div>
          </div>
          <div className="col-span-9">
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
              <WritingEditor title={title} content={content} saved={saved} currentFile={currentFile}
                onTitleChange={setTitle} onContentChange={setContent} onSave={handleSave} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6"><DiaryView toast={toast} /></div>
          </div>
          <div className="col-span-4">
            <div className="rounded-xl bg-gradient-to-r from-warm-50 to-primary-50 border border-warm-100 p-4">
              <h3 className="text-sm font-medium text-warm-700 mb-2">日记小贴士</h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>· 每天三句话，不多不少刚刚好</li>
                <li>· 用简单的英文写，先写再改</li>
                <li>· 描述事实 + 感受 + 计划</li>
                <li>· 回顾旧日记，看到自己的进步</li>
                <li>· 昨天的日记无法修改，保持真实</li>
              </ul>
              <div className="mt-3 flex gap-2">
                <button onClick={async () => {
                  try {
                    await ensureDataDirs();
                    await openFolder(await dataPaths.diary());
                  } catch (err) {
                    console.error("Failed to open diary folder:", err);
                    toast("打开日记目录失败", "error");
                  }
                }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium">打开日记目录 →</button>
                <button onClick={async () => {
                  try {
                    await ensureDataDirs();
                    await openFolder(await dataPaths.writing());
                  } catch (err) {
                    console.error("Failed to open writing folder:", err);
                    toast("打开写作目录失败", "error");
                  }
                }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium">打开写作目录 →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
