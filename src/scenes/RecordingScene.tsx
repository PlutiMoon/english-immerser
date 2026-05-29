import { useState, useEffect } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import RecordButton from "@/components/recording/RecordButton";
import PlaybackPanel from "@/components/recording/PlaybackPanel";
import RecordingsList from "@/components/recording/RecordingsList";
import PromptCard from "@/components/recording/PromptCard";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { openFolder } from "@/utils/openFolder";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import { formatJsonRecoveryNotice } from "@/utils/recoveryNotice";
import type { RecordingStatus, RecordingFile } from "@/types";
import { useRecordingStore } from "@/stores/recordingStore";

export default function RecordingScene({ toast }: SceneProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const { history, loaded, loadHistory, saveRecordingFile, deleteRecordingFile } = useRecordingStore();
  const recovery = useRecordingStore((s) => s.recovery);
  const clearRecovery = useRecordingStore((s) => s.clearRecovery);

  const { start, stop, cleanup } = useMediaRecorder({
    onStatusChange: setStatus,
    onDurationUpdate: setDuration,
    onRecordingComplete: (b, url) => { setBlob(b); setPlaybackUrl(url); setStatus("idle"); },
  });

  useEffect(() => {
    if (!loaded) {
      loadHistory();
    }
  }, [loaded, loadHistory]);

  useEffect(() => {
    if (recovery) {
      toast(formatJsonRecoveryNotice(recovery), "warning", 7000);
      clearRecovery();
    }
  }, [recovery, clearRecovery, toast]);

  useEffect(() => () => cleanup(), [cleanup]);

  const handleSave = async (blob: Blob, name: string) => {
    await saveRecordingFile(blob, name);
  };

  const handleReset = () => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    setBlob(null);
    setPlaybackUrl(null);
    setStatus("idle");
    setDuration(0);
  };

  const handleDelete = async (file: RecordingFile) => {
    await deleteRecordingFile(file);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="自言自语录音棚" subtitle="调用麦克风录音并即时回放，所有数据保存在本地，不上传服务器" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 space-y-4">
          <div className="surface-card flex flex-col items-center p-12">
            <RecordButton status={status} duration={duration} onStart={start} onStop={stop} />
          </div>
          <PlaybackPanel blob={blob} playbackUrl={playbackUrl}
            duration={duration} onSave={handleSave} onReset={handleReset} toast={toast} />
          <RecordingsList history={history} loaded={loaded}
            onPlay={(file) => { setPlaybackUrl(file.path); setStatus("idle"); }}
            onDelete={handleDelete}
            toast={toast} />
        </div>
        <div className="col-span-5">
          <PromptCard />
          <div className="surface-card mt-4 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">小提示</h3>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li>· 不要怕说错，流利度比语法重要</li>
              <li>· 说完可以回放听听自己的发音</li>
              <li>· 每天 5-10 分钟自言自语，坚持就有效</li>
              <li>· 录音保存在本地，不会上传到任何服务器</li>
            </ul>
            <button onClick={async () => {
              try {
                await ensureDataDirs();
                await openFolder(await dataPaths.recordings());
              } catch (err) {
                console.error("Failed to open recordings folder:", err);
                toast("打开录音文件夹失败", "error");
              }
            }}
              className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium">打开录音文件夹 →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
