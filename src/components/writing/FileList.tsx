import { useState } from "react";
import type { WritingFileInfo } from "@/types";

interface FileListProps {
  files: WritingFileInfo[];
  currentFile: WritingFileInfo | null;
  loading: boolean;
  onSelect: (file: WritingFileInfo) => void;
  onDelete: (file: WritingFileInfo) => Promise<void> | void;
  onNew: () => void;
}

export default function FileList({
  files,
  currentFile,
  loading,
  onSelect,
  onDelete,
  onNew,
}: FileListProps) {
  const [deleteTarget, setDeleteTarget] = useState<WritingFileInfo | null>(null);

  const handleDelete = async (f: WritingFileInfo) => {
    if (deleteTarget?.path === f.path) {
      await onDelete(f);
      setDeleteTarget(null);
    } else {
      setDeleteTarget(f);
      // Auto-cancel after 3s
      setTimeout(() => setDeleteTarget(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">文章列表</h3>
        <button
          onClick={onNew}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          + 新建
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">加载中...</p>
      ) : files.length === 0 ? (
        <p className="text-xs text-gray-400">暂无文章</p>
      ) : (
        <div className="space-y-0.5">
          {files.map((f) => {
            const isActive = currentFile?.path === f.path;
            const isDeleting = deleteTarget?.path === f.path;
            return (
              <div
                key={f.path}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <button
                  onClick={() => onSelect(f)}
                  className="flex-1 text-left truncate"
                >
                  {f.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(f);
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
      )}
    </div>
  );
}
