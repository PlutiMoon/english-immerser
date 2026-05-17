import { useState, useEffect, useRef } from "react";
import { writeFile } from "@tauri-apps/plugin-fs";
import { dataPaths } from "@/utils/dataPath";
import { useRecordingStore } from "@/stores/recordingStore";
import { formatSeconds } from "@/utils/formatSeconds";

function nowFilename(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.webm`;
}

export default function PlaybackPanel() {
  const { playbackUrl, blob, duration, addToHistory, reset } = useRecordingStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Revoke previous blob URL to avoid memory leaks
  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== playbackUrl) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    prevUrlRef.current = playbackUrl;
    setSaved(false);
    setSavedPath(null);
  }, [playbackUrl]);

  if (!playbackUrl || !blob) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const name = nowFilename();
      const dir = await dataPaths.recordings();
      const filePath = `${dir}/${name}`;
      const arrayBuf = await blob.arrayBuffer();
      await writeFile(filePath, new Uint8Array(arrayBuf));
      addToHistory({
        name,
        path: filePath,
        duration: Math.round(duration),
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
      setSavedPath(filePath);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    reset();
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">回放录音</p>
        <span className="text-xs text-gray-400">
          时长 {formatSeconds(duration)}
        </span>
      </div>

      {/* key=playbackUrl forces a new audio element on each recording */}
      <audio
        key={playbackUrl}
        src={playbackUrl}
        className="w-full"
        controls
        preload="auto"
      />

      {saved && savedPath ? (
        <div className="space-y-1">
          <span className="text-sm text-green-600">已保存</span>
          <p className="text-xs text-gray-400 break-all">
            路径: {savedPath}
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存到本地"}
          </button>
          <button
            onClick={handleDiscard}
            disabled={saving}
            className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-200"
          >
            放弃
          </button>
        </div>
      )}
    </div>
  );
}
