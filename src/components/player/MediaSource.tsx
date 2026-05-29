import { useState, useEffect } from "react";
import AddCustomFeed from "@/components/player/AddCustomFeed";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileTextIcon,
  HeadphonesIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "@/components/icons/AppIcons";
import { tryLoadSubtitles, loadSubtitleFile } from "@/utils/subtitleParser";
import { formatDuration } from "@/utils/formatDuration";
import type { MediaSource as MediaSourceType, PodcastPreset, PodcastFeed, SubtitleLine, ToastType } from "@/types";

type SourceTab = "file" | "url" | "podcast" | "youtube";

interface MediaSourceProps {
  source: MediaSourceType | null;
  onSourceChange: (source: MediaSourceType | null) => void;
  onSubtitlesChange: (subtitles: SubtitleLine[]) => void;
  recentSources: MediaSourceType[];
  presets: PodcastPreset[];
  customFeeds: PodcastPreset[];
  feedCache: Record<string, PodcastFeed>;
  loading: boolean;
  error: string | null;
  onFetchFeed: (url: string) => Promise<PodcastFeed>;
  onAddCustomFeed: (name: string, url: string) => void;
  onRemoveCustomFeed: (url: string) => void;
  onLoadCustomFeeds: () => Promise<void>;
  toast?: (message: string, type?: ToastType, duration?: number) => void;
}

export default function MediaSource(props: MediaSourceProps) {
  const {
    source, onSourceChange, onSubtitlesChange, recentSources,
    presets, customFeeds, feedCache, loading, error,
    onFetchFeed, onAddCustomFeed, onRemoveCustomFeed, onLoadCustomFeeds,
    toast,
  } = props;

  const [tab, setTab] = useState<SourceTab>("podcast");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);

  useEffect(() => { onLoadCustomFeeds(); }, []);

  const allFeeds = [...presets, ...customFeeds];

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "媒体文件", extensions: ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "mkv", "avi", "mov"] }],
      });
      if (selected) {
        const path = selected as string;
        const name = path.split(/[/\\]/).pop() || path;
        onSourceChange({ type: "file", path, name });
        toast?.("已加载本地媒体", "success");
        const subs = await tryLoadSubtitles(path);
        if (subs.length > 0) {
          onSubtitlesChange(subs);
          toast?.("已自动加载同名字幕", "success");
        }
      }
    } catch (err) {
      console.error("Failed to open media file:", err);
      toast?.("打开媒体文件失败", "error");
    }
  };

  const handleImportSubtitle = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "字幕文件", extensions: ["srt", "vtt", "lrc"] }],
      });
      if (selected) {
        const path = selected as string;
        const subs = await loadSubtitleFile(path);
        if (subs.length > 0) {
          onSubtitlesChange(subs);
          toast?.("已加载字幕", "success");
        } else {
          toast?.("未识别到有效字幕内容", "warning");
        }
      }
    } catch (err) {
      console.error("Failed to import subtitle:", err);
      toast?.("导入字幕失败", "error");
    }
  };

  const handleUrlLoad = () => {
    if (!urlInput.trim()) return;
    let name = urlInput.split("/").pop()?.split("?")[0] || urlInput;
    if (!name.includes(".")) name = "在线音频";
    onSourceChange({ type: "url", path: urlInput.trim(), name });
  };

  const handleFeedSelect = async (url: string) => {
    setSelectedFeed(url);
    try {
      await onFetchFeed(url);
    } catch {
      toast?.("播客源加载失败", "error");
    }
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  // YouTube state
  const [ytUrl, setYtUrl] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytResult, setYtResult] = useState<{
    title: string;
    duration: number;
    uploader: string;
    audio_url: string;
    subtitles: { lang: string; label: string }[];
  } | null>(null);
  const [ytSubLoading, setYtSubLoading] = useState<string | null>(null);

  const handleEpisodePlay = (audioUrl: string, title: string) => {
    onSourceChange({ type: "podcast", path: audioUrl, name: title });
  };

  const handleDownload = async (e: React.MouseEvent, audioUrl: string, title: string) => {
    e.stopPropagation();
    setDownloading(audioUrl);
    try {
      const localPath = await invoke<string>("download_audio", { url: audioUrl });
      onSourceChange({ type: "file", path: localPath, name: title });
      toast?.("已下载到本地缓存", "success");
    } catch (err) {
      console.error("Download failed:", err);
      toast?.("下载失败，该源可能无法直连。请尝试其他播客源。", "error", 5000);
    } finally { setDownloading(null); }
  };

  const handleYtSearch = async () => {
    if (!ytUrl.trim()) return;
    setYtLoading(true);
    setYtError(null);
    setYtResult(null);
    try {
      const info = await invoke<{
        title: string; duration: number; uploader: string;
        audio_url: string; subtitles: { lang: string; label: string }[];
      }>("fetch_youtube", { url: ytUrl.trim() });
      setYtResult(info);
    } catch (err) {
      setYtError(String(err));
    } finally { setYtLoading(false); }
  };

  const handleYtLoadSubtitle = async (lang: string) => {
    if (!ytUrl.trim()) return;
    setYtSubLoading(lang);
    try {
      const lines = await invoke<{ start: number; end: number; text: string }[]>(
        "fetch_youtube_subtitle", { url: ytUrl.trim(), lang }
      );
      onSubtitlesChange(lines);
      toast?.(`已加载字幕 (${lang})`, "success");
    } catch (err) {
      toast?.(`字幕加载失败: ${String(err)}`, "error");
    } finally { setYtSubLoading(null); }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="flex border-b border-gray-100">
        {([["file", "本地文件"], ["url", "在线链接"], ["podcast", "播客"], ["youtube", "YouTube"]] as [SourceTab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === key ? "border-b-2 border-primary-500 text-primary-700" : "text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === "file" && (
          <div className="space-y-3">
            <button onClick={handleOpenFile}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
              <PlusIcon className="mx-auto mb-1 h-6 w-6" />
              <p className="text-sm">点击选择音频或视频文件</p>
              <p className="text-xs text-gray-400 mt-1">支持 MP3 / MP4 / M4A / WAV / OGG</p>
            </button>
            {source?.type === "file" && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-primary-600 truncate flex-1">已加载: {source.name}</p>
                <button onClick={handleImportSubtitle}
                  className="shrink-0 text-xs text-gray-400 hover:text-primary-600 transition-colors"
                  title="手动导入字幕文件">
                  <span className="inline-flex items-center gap-1">
                    <FileTextIcon className="h-3.5 w-3.5" />
                    导入字幕
                  </span>
                </button>
              </div>
            )}
            {/* Recent sources */}
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
        )}
        {tab === "url" && (
          <div className="space-y-3">
            <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleUrlLoad()}
              placeholder="粘贴 MP3/MP4 直链地址..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400" />
            <button onClick={handleUrlLoad} disabled={!urlInput.trim()}
              className="w-full rounded-lg bg-primary-500 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
              加载链接
            </button>
          </div>
        )}
        {tab === "podcast" && (
          <div className="space-y-3">
            {!selectedFeed ? (
              <div className="space-y-2">
                {allFeeds.map(feed => {
                  const isCustom = customFeeds.some(c => c.url === feed.url);
                  return (
                    <div key={feed.url} className="group flex items-center rounded-lg border border-gray-100 hover:bg-primary-50 transition-colors">
                      <button onClick={() => handleFeedSelect(feed.url)}
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
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                <button onClick={() => setSelectedFeed(null)}
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
                      <button onClick={() => handleEpisodePlay(item.audio_url, item.title)}
                        className="flex-1 px-3 py-2.5 text-left min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
                          {item.duration && <span className="shrink-0 text-xs text-gray-400 font-mono">{formatDuration(item.duration)}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                      </button>
                      <button onClick={e => handleDownload(e, item.audio_url, item.title)}
                        disabled={isDownloading}
                        className="shrink-0 px-2 text-xs text-gray-400 hover:text-primary-600 disabled:text-yellow-500 border-l border-gray-100"
                        title="下载到本地（通过代理）">
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
            )}
          </div>
        )}
        {tab === "youtube" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={ytUrl}
                onChange={e => { setYtUrl(e.target.value); setYtError(null); }}
                onKeyDown={e => e.key === "Enter" && handleYtSearch()}
                placeholder="粘贴 YouTube 视频链接..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
              <button
                onClick={handleYtSearch}
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
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-snug">{ytResult.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {ytResult.uploader} · {formatDuration(String(ytResult.duration))}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      onSourceChange({ type: "url", path: ytResult.audio_url, name: ytResult.title });
                      toast?.("已加载 YouTube 音频", "success");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
                  >
                    <HeadphonesIcon className="h-3.5 w-3.5" />
                    加载音频
                  </button>
                  {ytResult.subtitles.map(sub => (
                    <button
                      key={sub.lang}
                      onClick={() => handleYtLoadSubtitle(sub.lang)}
                      disabled={ytSubLoading === sub.lang}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary-300 hover:text-primary-600 disabled:opacity-40 transition-colors"
                    >
                      <FileTextIcon className="h-3.5 w-3.5" />
                      {ytSubLoading === sub.lang ? "加载中..." : sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-xs text-gray-400 leading-relaxed">
                需要安装 <code className="bg-gray-200 px-1 rounded text-gray-600">yt-dlp</code> 才能使用 YouTube 功能。
                运行 <code className="bg-gray-200 px-1 rounded text-gray-600">pip install yt-dlp</code> 或{" "}
                <code className="bg-gray-200 px-1 rounded text-gray-600">winget install yt-dlp</code>。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
