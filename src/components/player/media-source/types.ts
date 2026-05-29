import type { MediaSource, PodcastFeed, PodcastPreset, ToastType } from "@/types";

export interface YouTubeResult {
  title: string;
  duration: number;
  uploader: string;
  audio_url: string;
  subtitles: { lang: string; label: string }[];
}

export interface MediaPanelProps {
  source: MediaSource | null;
  onSourceChange: (source: MediaSource | null) => void;
  toast?: (message: string, type?: ToastType, duration?: number) => void;
}

export type { MediaSource, PodcastFeed, PodcastPreset };
