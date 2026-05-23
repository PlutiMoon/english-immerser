interface PlayerControlsProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  abLoop: { start: number; end: number } | null;
  currentTime: number;
  onPlaybackRateChange: (rate: number) => void;
  onVolumeChange: (v: number) => void;
  onABLoopChange: (abLoop: { start: number; end: number } | null) => void;
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export default function PlayerControls({
  mediaRef, isPlaying, playbackRate, volume, abLoop, currentTime,
  onPlaybackRateChange, onVolumeChange, onABLoopChange,
}: PlayerControlsProps) {
  const media = mediaRef.current;

  const togglePlay = () => {
    if (!media) return;
    if (isPlaying) media.pause();
    else media.play().catch(err => console.error("Playback failed:", err));
  };

  const skip = (delta: number) => {
    if (!media) return;
    const dur = isFinite(media.duration) ? media.duration : 0;
    media.currentTime = Math.max(0, Math.min(media.currentTime + delta, dur));
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(playbackRate);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    if (media) media.playbackRate = next;
    onPlaybackRateChange(next);
  };

  const toggleABLoop = () => {
    if (abLoop) {
      onABLoopChange(null);
    } else {
      const start = Math.max(0, currentTime - 3);
      const end = Math.min(media?.duration || currentTime + 3, currentTime + 3);
      onABLoopChange({ start, end });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={togglePlay}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors text-lg"
        title={isPlaying ? "暂停" : "播放"}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button onClick={() => skip(-5)}
        className="rounded-lg px-3 py-1.5 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="倒退5秒 (←)">
        -5s
      </button>
      <button onClick={() => skip(5)}
        className="rounded-lg px-3 py-1.5 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="快进5秒 (→)">
        +5s
      </button>
      <button onClick={cycleSpeed}
        className="rounded-lg px-3 py-1.5 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-mono" title="切换播放速度">
        {playbackRate}x
      </button>
      <button onClick={toggleABLoop}
        className={`rounded-lg px-3 py-1.5 text-sm transition-colors font-medium ${abLoop ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        title="AB循环">
        AB
      </button>
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-xs text-gray-400">🔊</span>
        <input type="range" min="0" max="1" step="0.05" value={volume}
          onChange={e => { const v = Number(e.target.value); if (media) media.volume = v; onVolumeChange(v); }}
          className="w-20 h-1 accent-primary-500" />
      </div>
    </div>
  );
}
