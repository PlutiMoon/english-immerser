import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { readTextFile, writeFile, exists } from "@tauri-apps/plugin-fs";
import { dataFiles, ensureDataDirs } from "@/utils/dataPath";
import { debounce } from "@/utils/debounce";
import { safeParseJSON, isValidPodcastPreset } from "@/utils/validators";
import type { PodcastFeed, PodcastPreset } from "@/types";

const PRESETS: PodcastPreset[] = [
  {
    name: "VOA Learning English (主频道)",
    url: "https://learningenglish.voanews.com/podcast/?count=50&zoneId=986",
  },
  {
    name: "VOA Science & Technology",
    url: "https://learningenglish.voanews.com/podcast/?count=25&zoneId=1579",
  },
  {
    name: "BBC 6 Minute English",
    url: "https://podcasts.files.bbci.co.uk/p02pc9tn.rss",
  },
  {
    name: "BBC The English We Speak",
    url: "https://podcasts.files.bbci.co.uk/p02pc9zn.rss",
  },
];

interface PodcastStore {
  presets: PodcastPreset[];
  customFeeds: PodcastPreset[];
  feedCache: Record<string, PodcastFeed>;
  loading: boolean;
  error: string | null;

  fetchFeed: (url: string) => Promise<PodcastFeed>;
  addCustomFeed: (name: string, url: string) => void;
  removeCustomFeed: (url: string) => void;
  loadCustomFeeds: () => Promise<void>;
}

export const usePodcastStore = create<PodcastStore>((set, get) => {
  const debouncedSaveFeeds = debounce(async () => {
    try {
      await ensureDataDirs();
      const filePath = await dataFiles.podcastFeeds();
      await writeFile(
        filePath,
        new TextEncoder().encode(JSON.stringify(get().customFeeds, null, 2)),
      );
    } catch (err) {
      console.error("Failed to save custom podcast feeds:", err);
    }
  }, 500);

  return {
    presets: PRESETS,
    customFeeds: [],
    feedCache: {},
    loading: false,
    error: null,

    fetchFeed: async (url: string) => {
      const cached = get().feedCache[url];
      if (cached) return cached;

      set({ loading: true, error: null });
      try {
        const feed = await invoke<PodcastFeed>("fetch_rss", { url });
        set((s) => ({
          feedCache: { ...s.feedCache, [url]: feed },
          loading: false,
        }));
        return feed;
      } catch (e) {
        set({ loading: false, error: String(e) });
        throw e;
      }
    },

    addCustomFeed: (name, url) => {
      set((s) => {
        const next = [...s.customFeeds, { name, url }];
        return { customFeeds: next };
      });
      debouncedSaveFeeds();
    },

    removeCustomFeed: (url) => {
      set((s) => {
        const next = s.customFeeds.filter((f) => f.url !== url);
        return { customFeeds: next };
      });
      debouncedSaveFeeds();
    },

    loadCustomFeeds: async () => {
      try {
        await ensureDataDirs();
        const filePath = await dataFiles.podcastFeeds();
        if (!(await exists(filePath))) return;
        const raw = await readTextFile(filePath);
        const feeds = safeParseJSON(raw, isValidPodcastPreset);
        set({ customFeeds: feeds });
      } catch (err) {
        console.error("Failed to load custom podcast feeds:", err);
      }
    },
  };
});
