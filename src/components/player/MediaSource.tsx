import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import LocalFilePanel from "@/components/player/media-source/LocalFilePanel";
import PodcastPanel from "@/components/player/media-source/PodcastPanel";
import UrlPanel from "@/components/player/media-source/UrlPanel";
import YouTubePanel from "@/components/player/media-source/YouTubePanel";
import { loadSubtitleFile, tryLoadSubtitles } from "@/utils/subtitleParser";
import type { MediaSource as MediaSourceType, PodcastFeed, PodcastPreset, SubtitleLine, ToastType } from "@/types";
import type { YouTubeResult } from "@/components/player/media-source/types";

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

const SOURCE_TABS: [SourceTab, string][] = [
  ["file", "本地文件"],
  ["url", "在线链接"],
  ["podcast", "播客"],
  ["youtube", "YouTube"],
];

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
  const [downloading, setDownloading] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytResult, setYtResult] = useState<YouTubeResult | null>(null);
  const [ytSubLoading, setYtSubLoading] = useState<string | null>(null);

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
    } finally {
      setDownloading(null);
    }
  };

  const handleYtSearch = async () => {
    if (!ytUrl.trim()) return;
    setYtLoading(true);
    setYtError(null);
    setYtResult(null);
    try {
      const info = await invoke<YouTubeResult>("fetch_youtube", { url: ytUrl.trim() });
      setYtResult(info);
    } catch (err) {
      setYtError(String(err));
    } finally {
      setYtLoading(false);
    }
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
    } finally {
      setYtSubLoading(null);
    }
  };

  return (
    <div className="surface-card">
      <div className="flex border-b border-gray-100">
        {SOURCE_TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === key ? "border-b-2 border-primary-500 text-primary-700" : "text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === "file" && (
          <LocalFilePanel
            source={source}
            recentSources={recentSources}
            onOpenFile={handleOpenFile}
            onImportSubtitle={handleImportSubtitle}
            onSourceChange={onSourceChange}
          />
        )}
        {tab === "url" && (
          <UrlPanel
            urlInput={urlInput}
            onUrlInputChange={setUrlInput}
            onLoad={handleUrlLoad}
          />
        )}
        {tab === "podcast" && (
          <PodcastPanel
            source={source}
            allFeeds={allFeeds}
            customFeeds={customFeeds}
            feedCache={feedCache}
            selectedFeed={selectedFeed}
            loading={loading}
            error={error}
            downloading={downloading}
            onSelectFeed={handleFeedSelect}
            onBack={() => setSelectedFeed(null)}
            onFetchFeed={onFetchFeed}
            onAddCustomFeed={onAddCustomFeed}
            onRemoveCustomFeed={onRemoveCustomFeed}
            onEpisodePlay={handleEpisodePlay}
            onDownload={handleDownload}
          />
        )}
        {tab === "youtube" && (
          <YouTubePanel
            ytUrl={ytUrl}
            ytLoading={ytLoading}
            ytError={ytError}
            ytResult={ytResult}
            ytSubLoading={ytSubLoading}
            onUrlChange={(value) => { setYtUrl(value); setYtError(null); }}
            onSearch={handleYtSearch}
            onLoadAudio={() => {
              if (!ytResult) return;
              onSourceChange({ type: "url", path: ytResult.audio_url, name: ytResult.title });
              toast?.("已加载 YouTube 音频", "success");
            }}
            onLoadSubtitle={handleYtLoadSubtitle}
          />
        )}
      </div>
    </div>
  );
}
