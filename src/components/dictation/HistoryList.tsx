import { useState } from "react";
import type { DictationSession } from "@/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

interface HistoryListProps {
  history: DictationSession[];
  loaded: boolean;
  onDelete: (id: string) => Promise<void>;
}

export default function HistoryList({ history, loaded, onDelete }: HistoryListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async (session: DictationSession) => {
    if (deleteTarget === session.id) {
      await onDelete(session.id);
      if (expanded === session.id) setExpanded(null);
      setDeleteTarget(null);
    } else {
      setDeleteTarget(session.id);
      setTimeout(() => setDeleteTarget(null), 3000);
    }
  };

  if (!loaded) return null;

  if (history.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-8 text-center">
        <p className="text-gray-400 text-sm">还没有完成过听写练习</p>
        <p className="text-gray-300 text-xs mt-1">完成一次听写后会自动保存在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">
        历史记录 ({history.length})
      </h3>
      <div className="space-y-2">
        {history.map((session) => {
          const isExpanded = expanded === session.id;
          const isDeleting = deleteTarget === session.id;
          return (
            <div
              key={session.id}
              className="rounded-lg bg-white border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpanded(isExpanded ? null : session.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {formatDate(session.date)}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {session.sourceName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {session.retellText.slice(0, 60) || "(无复述内容)"}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(session).catch(console.error);
                  }}
                  className={`shrink-0 px-1.5 py-0.5 rounded text-xs transition-colors ${
                    isDeleting
                      ? "bg-red-100 text-red-600"
                      : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title={isDeleting ? "再点一次确认删除" : "删除"}
                >
                  {isDeleting ? "确认删除" : "删"}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50">
                  {session.keywords.trim() && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">关键词</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {session.keywords}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">复述</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {session.retellText || "(无内容)"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
