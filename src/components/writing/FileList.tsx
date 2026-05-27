import { useState } from "react";
import type { WritingFileInfo } from "@/types";
import { FileTextIcon, PlusIcon, TrashIcon } from "@/components/icons/AppIcons";

interface FileListProps {
  files: WritingFileInfo[];
  currentFile: WritingFileInfo | null;
  loading: boolean;
  onSelect: (file: WritingFileInfo) => void;
  onDelete: (file: WritingFileInfo) => Promise<void> | void;
  onNew: () => void;
}

function displayName(name: string): string {
  return name.replace(/\.txt$/, "");
}

export default function FileList({ files, currentFile, loading, onSelect, onDelete, onNew }: FileListProps) {
  const [deleteTarget, setDeleteTarget] = useState<WritingFileInfo | null>(null);

  const handleDelete = async (f: WritingFileInfo) => {
    if (deleteTarget?.path === f.path) {
      await onDelete(f);
      setDeleteTarget(null);
    } else {
      setDeleteTarget(f);
      setTimeout(() => setDeleteTarget(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">文章</h3>
        <button onClick={onNew}
          className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 transition-colors">
          <PlusIcon className="h-3 w-3" />新建
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-9 bg-gray-100 rounded-lg" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
          <FileTextIcon className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">还没有文章</p>
          <p className="text-xs text-gray-300 mt-1">点击"新建"开始写作</p>
        </div>
      ) : (
        <div className="space-y-1">
          {files.map((f) => {
            const isActive = currentFile?.path === f.path;
            const isDeleting = deleteTarget?.path === f.path;
            return (
              <button
                key={f.path}
                onClick={() => onSelect(f)}
                className={`group w-full text-left rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? "bg-primary-50 border-l-[3px] border-l-primary-500 pl-2.5"
                    : "border-l-[3px] border-l-transparent hover:bg-gray-50"
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${isActive ? "font-medium text-primary-700" : "text-gray-600"}`}>
                    {displayName(f.name)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(f); }}
                    className={`shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-all ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } ${
                      isDeleting ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                    title={isDeleting ? "再点一次确认删除" : "删除"}>
                    <TrashIcon className="h-3.5 w-3.5" />
                    {isDeleting ? "确认" : ""}
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
