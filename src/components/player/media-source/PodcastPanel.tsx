import AddCustomFeed from "@/components/player/AddCustomFeed";
import { ArrowLeftIcon, DownloadIcon, XIcon } from "@/components/icons/AppIcons";
import { formatDuration } from "@/utils/formatDuration";
import type { MediaSource, PodcastFeed, PodcastPreset } from "@/components/player/media-source/types";

interface PodcastPanelProps {
  source: MediaSource | null;
  allFeeds: PodcastPreset[];
  customFeeds: PodcastPreset[];
  feedCache: Record<string, PodcastFeed>;
  selectedFeed: string | null;
  loading: boolean;
  error: string | null;
  downloading: string | null;
  onSelectFeed: (url: string) => void;
  onBack: () => void;
  onFetchFeed: (url: string) => Promise<PodcastFeed>;
  onAddCustomFeed: (name: string, url: string) => void;
  onRemoveCustomFeed: (url: string) => void;
  onEpisodePlay: (audioUrl: string, title: string) => void;
  onDownload: (event: React.MouseEvent, audioUrl: string, title: string) => void;
}

export default function PodcastPanel({
  source,
  allFeeds,
  customFeeds,
  feedCache,
  selectedFeed,
  loading,
  error,
  downloading,
  onSelectFeed,
  onBack,
  onFetchFeed,
  onAddCustomFeed,
  onRemoveCustomFeed,
  onEpisodePlay,
  onDownload,
}: PodcastPanelProps) {
  if (!selectedFeed) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {allFeeds.map(feed => {
            const isCustom = customFeeds.some(c => c.url === feed.url);
            return (
              <div key={feed.url} className="group surface-muted flex items-center hover:bg-primary-50 transition-colors">
                <button onClick={() => onSelectFeed(feed.url)}
                  className="flex-1 px-3 py-2.5 text-left text-sm">
                  <span className="font-medium text-gray-700">{feed.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{isCustom ? "自定义" : "RSS"}</span>
                </button>
                {isCustom && (
                  <button onClick={(e) => { e.stopPropagation(); onRemoveCustomFeed(feed.url); }}
                    className="shrink-0 px-2 py-1 mr-1 text-xs text-gray-300 hover:text-red-500 transition-colors"
                    title="删除此播客源">
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          {allFeeds.length === 0 && <p className="text-sm text-gray-400 text-center py-4">暂无播客源</p>}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <AddCustomFeed onAdd={onAddCustomFeed} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-80 overflow-y-auto">
        <button onClick={onBack}
          className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-flex items-center gap-1">
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          返回播客列表
        </button>
        {loading && <p className="text-sm text-gray-400 py-4 text-center">加载中...</p>}
        {error && !loading && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-3">
            <p className="text-xs text-red-600 mb-1 font-medium">加载失败</p>
            <p className="text-xs text-red-500">{error}</p>
            <button onClick={() => { if (selectedFeed) onFetchFeed(selectedFeed).catch(() => {}); }}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline">点击重试</button>
          </div>
        )}
        {!loading && !error && feedCache[selectedFeed]?.items.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">该播客暂无节目</p>
        )}
        {!loading && !error && feedCache[selectedFeed]?.items.map((item, i) => {
          const isActive = source?.path === item.audio_url || source?.name === item.title;
          const isDownloading = downloading === item.audio_url;
          return (
            <div key={i} className={`flex rounded-lg border text-left transition-colors ${isActive ? "border-primary-300 bg-primary-50" : "border-gray-100 hover:bg-gray-50"}`}>
              <button onClick={() => onEpisodePlay(item.audio_url, item.title)}
                className="flex-1 px-3 py-2.5 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
                  {item.duration && <span className="shrink-0 text-xs text-gray-400 font-mono">{formatDuration(item.duration)}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
              </button>
              <button onClick={e => onDownload(e, item.audio_url, item.title)}
                disabled={isDownloading}
                className="shrink-0 px-2 text-xs text-gray-400 hover:text-primary-600 disabled:text-yellow-500 border-l border-gray-100"
                title="下载到本地">
                {isDownloading ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center">...</span>
                ) : (
                  <DownloadIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
