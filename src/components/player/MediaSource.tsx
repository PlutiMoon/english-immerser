import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { usePlayerStore } from "@/stores/playerStore";
import { usePodcastStore } from "@/stores/podcastStore";
import { getSubtitleCandidates, detectAndParse } from "@/utils/subtitleParser";
import { formatDuration } from "@/utils/formatDuration";

type SourceTab = "file" | "url" | "podcast";

export default function MediaSource() {
  const [tab, setTab] = useState<SourceTab>("podcast");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);

  const { source, setSource } = usePlayerStore();
  const {
    presets, customFeeds, feedCache,
    loading, error, fetchFeed, addCustomFeed, loadCustomFeeds,
  } = usePodcastStore();

  useEffect(() => {
    loadCustomFeeds();
  }, [loadCustomFeeds]);

  const allFeeds = [...presets, ...customFeeds];

  const handleOpenFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "媒体文件",
          extensions: ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "mkv", "avi", "mov"],
        },
      ],
    });
    if (selected) {
      const path = selected as string;
      const name = path.split(/[/\\]/).pop() || path;
      setSource({ type: "file", path, name });

      // Auto-detect subtitle files
      const candidates = getSubtitleCandidates(path);
      for (const subPath of candidates) {
        try {
          if (await exists(subPath)) {
            const content = await readTextFile(subPath);
            const subs = detectAndParse(content);
            if (subs.length > 0) {
              usePlayerStore.getState().setSubtitles(subs);
              break;
            }
          }
        } catch {
          // subtitle file doesn't exist or can't be read, try next
        }
      }
    }
  };

  const handleUrlLoad = () => {
    if (!urlInput.trim()) return;
    let name = urlInput.split("/").pop()?.split("?")[0] || urlInput;
    if (!name.includes(".")) name = "在线音频";
    setSource({ type: "url", path: urlInput.trim(), name });
  };

  const handleFeedSelect = async (url: string) => {
    setSelectedFeed(url);
    try {
      await fetchFeed(url);
    } catch {
      // error is already set in the store
    }
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  // Direct play via URL (works for accessible domains like VOA)
  const handleEpisodePlay = (audioUrl: string, title: string) => {
    setSource({ type: "podcast", path: audioUrl, name: title });
  };

  // Download for offline (via Rust reqwest through proxy)
  const handleDownload = async (e: React.MouseEvent, audioUrl: string, title: string) => {
    e.stopPropagation();
    setDownloading(audioUrl);
    try {
      const localPath = await invoke<string>("download_audio", { url: audioUrl });
      setSource({ type: "file", path: localPath, name: title });
    } catch (err) {
      console.error("Download failed:", err);
      alert("下载失败，该源可能无法直连。请尝试其他播客源。");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {([
          ["file", "本地文件"],
          ["url", "在线链接"],
          ["podcast", "播客"],
        ] as [SourceTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === key
                ? "border-b-2 border-primary-500 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === "file" && (
          <div className="space-y-3">
            <button
              onClick={handleOpenFile}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <p className="text-2xl mb-1">+</p>
              <p className="text-sm">点击选择音频或视频文件</p>
              <p className="text-xs text-gray-400 mt-1">
                支持 MP3 / MP4 / M4A / WAV / OGG
              </p>
            </button>
            {source?.type === "file" && (
              <p className="text-sm text-primary-600 truncate">
                已加载: {source.name}
              </p>
            )}
          </div>
        )}

        {tab === "url" && (
          <div className="space-y-3">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
              placeholder="粘贴 MP3/MP4 直链地址..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
            />
            <button
              onClick={handleUrlLoad}
              disabled={!urlInput.trim()}
              className="w-full rounded-lg bg-primary-500 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              加载链接
            </button>
          </div>
        )}

        {tab === "podcast" && (
          <div className="space-y-3">
            {/* Feed list */}
            {!selectedFeed ? (
              <div className="space-y-2">
                {allFeeds.map((feed) => (
                  <button
                    key={feed.url}
                    onClick={() => handleFeedSelect(feed.url)}
                    className="w-full rounded-lg border border-gray-100 px-3 py-2.5 text-left text-sm hover:bg-primary-50 transition-colors"
                  >
                    <span className="font-medium text-gray-700">
                      {feed.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">RSS</span>
                  </button>
                ))}
                {allFeeds.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    暂无播客源
                  </p>
                )}

                {/* Custom RSS input */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <AddCustomFeed onAdd={addCustomFeed} />
                </div>
              </div>
            ) : (
              /* Episode list */
              <div className="space-y-2 max-h-80 overflow-y-auto">
                <button
                  onClick={() => setSelectedFeed(null)}
                  className="text-sm text-primary-600 hover:text-primary-700 mb-2"
                >
                  ← 返回播客列表
                </button>
                {loading && (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    加载中...
                  </p>
                )}
                {error && !loading && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                    <p className="text-xs text-red-600 mb-1 font-medium">加载失败</p>
                    <p className="text-xs text-red-500">{error}</p>
                    <button
                      onClick={() => {
                        if (selectedFeed) fetchFeed(selectedFeed).catch(() => {});
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                    >
                      点击重试
                    </button>
                  </div>
                )}
                {!loading && !error && feedCache[selectedFeed]?.items.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    该播客暂无节目
                  </p>
                )}
                {!loading && !error && feedCache[selectedFeed]?.items.map((item, i) => {
                  const isActive = source?.path === item.audio_url || source?.name === item.title;
                  const isDownloading = downloading === item.audio_url;
                  return (
                    <div
                      key={i}
                      className={`flex rounded-lg border text-left transition-colors ${
                        isActive
                          ? "border-primary-300 bg-primary-50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <button
                        onClick={() => handleEpisodePlay(item.audio_url, item.title)}
                        className="flex-1 px-3 py-2.5 text-left min-w-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {item.title}
                          </p>
                          {item.duration && (
                            <span className="shrink-0 text-xs text-gray-400 font-mono">
                              {formatDuration(item.duration)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </button>
                      <button
                        onClick={(e) => handleDownload(e, item.audio_url, item.title)}
                        disabled={isDownloading}
                        className="shrink-0 px-2 text-xs text-gray-400 hover:text-primary-600 disabled:text-yellow-500 border-l border-gray-100"
                        title="下载到本地（通过代理）"
                      >
                        {isDownloading ? "⏳" : "↓"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AddCustomFeed({ onAdd }: { onAdd: (name: string, url: string) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) return;
    onAdd(name.trim(), url.trim());
    setName("");
    setUrl("");
    setShow(false);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-xs text-gray-400 hover:text-primary-600"
      >
        + 添加自定义 RSS
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名称（如：我的播客）"
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary-400"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="RSS 地址"
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary-400"
      />
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          className="rounded bg-primary-500 px-3 py-1 text-xs text-white hover:bg-primary-600"
        >
          添加
        </button>
        <button
          onClick={() => setShow(false)}
          className="rounded px-3 py-1 text-xs text-gray-400 hover:text-gray-600"
        >
          取消
        </button>
      </div>
    </div>
  );
}
