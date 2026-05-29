import { FileTextIcon, HeadphonesIcon, PlusIcon } from "@/components/icons/AppIcons";
import type { MediaSource } from "@/components/player/media-source/types";

interface LocalFilePanelProps {
  source: MediaSource | null;
  recentSources: MediaSource[];
  onOpenFile: () => void;
  onImportSubtitle: () => void;
  onSourceChange: (source: MediaSource | null) => void;
}

export default function LocalFilePanel({
  source,
  recentSources,
  onOpenFile,
  onImportSubtitle,
  onSourceChange,
}: LocalFilePanelProps) {
  return (
    <div className="space-y-3">
      <button onClick={onOpenFile}
        className="dictation-upload max-w-none p-8 text-gray-500 hover:border-primary-400 hover:text-primary-600">
        <PlusIcon className="mx-auto mb-1 h-6 w-6" />
        <p className="text-sm">点击选择音频或视频文件</p>
        <p className="text-xs text-gray-400 mt-1">支持 MP3 / MP4 / M4A / WAV / OGG</p>
      </button>
      {source?.type === "file" && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-primary-600 truncate flex-1">已加载: {source.name}</p>
          <button onClick={onImportSubtitle}
            className="shrink-0 text-xs text-gray-400 hover:text-primary-600 transition-colors"
            title="手动导入字幕文件">
            <span className="inline-flex items-center gap-1">
              <FileTextIcon className="h-3.5 w-3.5" />
              导入字幕
            </span>
          </button>
        </div>
      )}
      {recentSources.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 font-medium">最近播放</p>
          {recentSources.filter(s => s.type === "file").slice(0, 5).map((s, i) => (
            <button key={i} onClick={() => { onSourceChange(s); }}
              className={`w-full text-left rounded px-2 py-1.5 text-xs truncate transition-colors ${source?.path === s.path ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <span className="inline-flex items-center gap-1">
                <HeadphonesIcon className="h-3.5 w-3.5" />
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
