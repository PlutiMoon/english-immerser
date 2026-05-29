import { FileTextIcon, HeadphonesIcon, SearchIcon } from "@/components/icons/AppIcons";
import { formatDuration } from "@/utils/formatDuration";
import type { YouTubeResult } from "@/components/player/media-source/types";

interface YouTubePanelProps {
  ytUrl: string;
  ytLoading: boolean;
  ytError: string | null;
  ytResult: YouTubeResult | null;
  ytSubLoading: string | null;
  onUrlChange: (value: string) => void;
  onSearch: () => void;
  onLoadAudio: () => void;
  onLoadSubtitle: (lang: string) => void;
}

export default function YouTubePanel({
  ytUrl,
  ytLoading,
  ytError,
  ytResult,
  ytSubLoading,
  onUrlChange,
  onSearch,
  onLoadAudio,
  onLoadSubtitle,
}: YouTubePanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={ytUrl}
          onChange={e => onUrlChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSearch()}
          placeholder="粘贴 YouTube 视频链接..."
          className="input-glass flex-1 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={onSearch}
          disabled={ytLoading || !ytUrl.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
        >
          <SearchIcon className="h-4 w-4" />
          <span className="whitespace-nowrap">{ytLoading ? "解析中..." : "搜索"}</span>
        </button>
      </div>

      {ytError && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-xs text-red-600">{ytError}</p>
        </div>
      )}

      {ytResult && (
        <div className="surface-muted p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-800 leading-snug">{ytResult.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {ytResult.uploader} / {formatDuration(String(ytResult.duration))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onLoadAudio}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
            >
              <HeadphonesIcon className="h-3.5 w-3.5" />
              加载音频
            </button>
            {ytResult.subtitles.map(sub => (
              <button
                key={sub.lang}
                onClick={() => onLoadSubtitle(sub.lang)}
                disabled={ytSubLoading === sub.lang}
                className="button-glass inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 transition-colors"
              >
                <FileTextIcon className="h-3.5 w-3.5" />
                {ytSubLoading === sub.lang ? "加载中..." : sub.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="surface-muted p-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          需要安装 <code className="bg-gray-200 px-1 rounded text-gray-600">yt-dlp</code> 才能使用 YouTube 功能。
          运行 <code className="bg-gray-200 px-1 rounded text-gray-600">pip install yt-dlp</code> 或{" "}
          <code className="bg-gray-200 px-1 rounded text-gray-600">winget install yt-dlp</code>。
        </p>
      </div>
    </div>
  );
}
