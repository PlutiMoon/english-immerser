import { formatSeconds } from "@/utils/formatSeconds";

interface ProgressBarProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  currentTime: number;
  duration: number;
  abLoop: { start: number; end: number } | null;
}

export default function ProgressBar({ mediaRef, currentTime, duration, abLoop }: ProgressBarProps) {
  const safeDuration = isFinite(duration) && duration > 0 ? duration : 0;
  const progress = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = mediaRef.current;
    if (!media || !safeDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    media.currentTime = Math.max(0, Math.min(ratio * safeDuration, safeDuration));
  };

  return (
    <div className="space-y-1">
      <div className="relative h-2 bg-gray-200 rounded-full cursor-pointer group" onClick={handleSeek}>
        {abLoop && safeDuration > 0 && (
          <div className="absolute top-0 h-full bg-primary-300/50 rounded-full"
            style={{ left: `${(abLoop.start / safeDuration) * 100}%`, width: `${((abLoop.end - abLoop.start) / safeDuration) * 100}%` }} />
        )}
        <div className="absolute top-0 left-0 h-full bg-primary-500 rounded-full"
          style={{ width: `${progress}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatSeconds(isFinite(currentTime) ? currentTime : 0)}</span>
        <span>{formatSeconds(safeDuration)}</span>
      </div>
    </div>
  );
}
