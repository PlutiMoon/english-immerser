import { useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import RecordButton from "@/components/recording/RecordButton";
import PlaybackPanel from "@/components/recording/PlaybackPanel";
import RecordingsList from "@/components/recording/RecordingsList";
import PromptCard from "@/components/recording/PromptCard";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { openFolder } from "@/utils/openFolder";
import { dataPaths } from "@/utils/dataPath";

export default function RecordingPage() {
  const { start, stop, cleanup } = useMediaRecorder();

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="自言自语录音棚"
        subtitle="调用麦克风录音并即时回放，所有数据保存在本地，不上传服务器"
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Recording area */}
        <div className="col-span-7 space-y-4">
          <div className="flex flex-col items-center rounded-xl bg-white shadow-sm border border-gray-100 p-12">
            <RecordButton onStart={start} onStop={stop} />
          </div>
          <PlaybackPanel />
          <RecordingsList />
        </div>

        {/* Right: Prompt card */}
        <div className="col-span-5">
          <PromptCard />
          {/* Quick tips */}
          <div className="mt-4 rounded-xl bg-white shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">小提示</h3>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li>· 不要怕说错，流利度比语法重要</li>
              <li>· 说完可以回放听听自己的发音</li>
              <li>· 每天 5-10 分钟自言自语，坚持就有效</li>
              <li>· 录音保存在本地，不会上传到任何服务器</li>
            </ul>
            <button
              onClick={async () => {
                await openFolder(await dataPaths.recordings());
              }}
              className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              打开录音文件夹 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
