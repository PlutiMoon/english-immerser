import { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import FileList from "@/components/writing/FileList";
import WritingEditor from "@/components/writing/WritingEditor";
import DiaryView from "@/components/writing/DiaryView";
import { useWritingStore } from "@/stores/writingStore";
import { openFolder } from "@/utils/openFolder";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";

type Tab = "writing" | "diary";

export default function WritingPage() {
  const [tab, setTab] = useState<Tab>("writing");

  // Save current file when switching tabs
  const switchTab = (newTab: Tab) => {
    if (tab === "writing" && newTab !== "writing") {
      const state = useWritingStore.getState();
      if (!state.saved && state.title.trim()) {
        state.saveCurrent().catch(console.error);
      }
    }
    setTab(newTab);
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      const state = useWritingStore.getState();
      if (!state.saved && state.title.trim()) {
        state.saveCurrent().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="自由写作与三句日记"
        subtitle="极简编辑器 + 每日三句话引导，保存为本地文件"
      />

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => switchTab("writing")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "writing"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          自由写作
        </button>
        <button
          onClick={() => switchTab("diary")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "diary"
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          三句日记
        </button>
      </div>

      {/* Content */}
      {tab === "writing" ? (
        <div className="grid grid-cols-12 gap-4">
          {/* Left sidebar: file list */}
          <div className="col-span-3">
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4">
              <FileList />
            </div>
          </div>

          {/* Right: editor */}
          <div className="col-span-9">
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
              <WritingEditor />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
              <DiaryView />
            </div>
          </div>

          {/* Tips card */}
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
                <button
                  onClick={async () => {
                    await ensureDataDirs();
                    await openFolder(await dataPaths.diary());
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  打开日记目录 →
                </button>
                <button
                  onClick={async () => {
                    await ensureDataDirs();
                    await openFolder(await dataPaths.writing());
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  打开写作目录 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
