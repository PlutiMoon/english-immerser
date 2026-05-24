import { useState, useEffect, useRef } from "react";
import type { ToastType } from "@/types";
import { formatSeconds } from "@/utils/formatSeconds";

function nowFilename(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.webm`;
}

interface PlaybackPanelProps {
  blob: Blob | null;
  playbackUrl: string | null;
  duration: number;
  onSave: (blob: Blob, name: string) => Promise<void> | void;
  onReset: () => void;
  toast?: (message: string, type?: ToastType, duration?: number) => void;
}

export default function PlaybackPanel({
  blob, playbackUrl, duration, onSave, onReset, toast,
}: PlaybackPanelProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== playbackUrl) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    prevUrlRef.current = playbackUrl;
    setSaved(false);
  }, [playbackUrl]);

  if (!playbackUrl || !blob) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const name = nowFilename();
      await onSave(blob, name);
      setSaved(true);
      toast?.("录音已保存", "success");
    } catch (err) {
      console.error("Save failed:", err);
      toast?.("录音保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    onReset();
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">回放录音</p>
        <span className="text-xs text-gray-400">
          时长 {formatSeconds(duration)}
        </span>
      </div>

      <audio key={playbackUrl} src={playbackUrl} className="w-full" controls preload="auto" />

      {saved ? (
        <span className="text-sm text-green-600">已保存</span>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50">
            {saving ? "保存中..." : "保存到本地"}
          </button>
          <button
            onClick={handleDiscard}
            disabled={saving}
            className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-200">
            放弃
          </button>
        </div>
      )}
    </div>
  );
}
