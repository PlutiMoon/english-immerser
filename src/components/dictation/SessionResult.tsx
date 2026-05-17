import { useDictationStore } from "@/stores/dictationStore";

export default function SessionResult({ onNewSession }: { onNewSession: () => void }) {
  const { keywords, retellText, source } = useDictationStore();

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✓</span>
          <h3 className="text-lg font-semibold text-gray-800">已完成，已保存</h3>
        </div>

        {source && (
          <p className="text-xs text-gray-400">素材：{source.name}</p>
        )}

        {keywords.trim() && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">你的关键词</p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{keywords}</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">你的复述</p>
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {retellText}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNewSession}
        className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
      >
        再来一次
      </button>
    </div>
  );
}
