import {
  BookOpenIcon,
  CheckIcon,
  PenToolIcon,
  RepeatIcon,
} from "@/components/icons/AppIcons";

interface SessionResultProps {
  sourceName?: string | null;
  keywords: string;
  retellText: string;
  onNewSession: () => void;
  onAddToVocabulary: () => void;
  onSaveToWriting: () => void;
  onRepeatSource: () => void;
}

export default function SessionResult({
  sourceName, keywords, retellText,
  onNewSession, onAddToVocabulary, onSaveToWriting, onRepeatSource,
}: SessionResultProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CheckIcon className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">已完成，已保存</h3>
        </div>

        {sourceName && (
          <p className="text-xs text-gray-400">素材：{sourceName}</p>
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

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={onNewSession}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors">
          再来一次
        </button>
        {keywords.trim() && (
          <button onClick={onAddToVocabulary}
            className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5">
            <BookOpenIcon className="h-4 w-4" />
            关键词加入习词本
          </button>
        )}
        <button onClick={onSaveToWriting}
          className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5">
          <PenToolIcon className="h-4 w-4" />
          复述保存到写作
        </button>
        <button onClick={onRepeatSource}
          className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors inline-flex items-center gap-1.5">
          <RepeatIcon className="h-4 w-4" />
          同素材再来一组
        </button>
      </div>
    </div>
  );
}
