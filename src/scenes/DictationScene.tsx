import { useEffect, useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import DictationFlow from "@/components/dictation/DictationFlow";
import SessionResult from "@/components/dictation/SessionResult";
import HistoryList from "@/components/dictation/HistoryList";
import { useDictationStore } from "@/stores/dictationStore";
import type { DictationStep } from "@/types";

export default function DictationScene({ data, setData }: SceneProps) {
  const { source, sessionActive, startSession, resetSession } = useDictationStore();
  const [step, setStep] = useState<DictationStep>("listen");
  const [keywords, setKeywords] = useState("");
  const [retellText, setRetellText] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Load history on mount
  useEffect(() => { useDictationStore.getState().loadHistory(); }, []);

  // Persist dictation sessions to AppData
  useEffect(() => {
    const unsub = useDictationStore.subscribe(state => {
      if (state.history.length > 0) setData({ dictation: state.history });
    });
    return unsub;
  }, [setData]);

  const handlePickFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "音频文件", extensions: ["mp3", "mp4", "m4a", "wav", "ogg", "webm"] }],
    });
    if (selected) {
      const path = selected as string;
      const name = path.split(/[/\\]/).pop() || path;
      startSession({ name, path });
      setStep("listen"); setKeywords(""); setRetellText("");
      setShowResult(false);
    }
  };

  const handleUsePlayerSource = useCallback(() => {
    if (data.player.source) {
      startSession({ name: data.player.source.name, path: data.player.source.path });
      setStep("listen"); setKeywords(""); setRetellText("");
      setShowResult(false);
    }
  }, [data.player.source, startSession]);

  const handleFinish = async () => {
    const store = useDictationStore.getState();
    store.setKeywords(keywords);
    store.setRetellText(retellText);
    await store.saveSession();
    setShowResult(true);
  };

  const handleNewSession = () => {
    resetSession();
    setStep("listen"); setKeywords(""); setRetellText("");
    setShowResult(false);
  };

  if (showResult && source) {
    return (
      <div className="space-y-6">
        <PageHeader title="听写与复述小游戏" subtitle="播放→输入关键词→再播放→用自己的话复述" />
        <SessionResult sourceName={source.name} keywords={keywords} retellText={retellText}
          onNewSession={handleNewSession} />
        <div className="border-t border-gray-100 pt-6">
          <HistoryList history={data.dictation} loaded={true}
            onDelete={async (id) => { await useDictationStore.getState().deleteSession(id); }} />
        </div>
      </div>
    );
  }

  if (sessionActive && source) {
    return (
      <div className="space-y-6">
        <PageHeader title="听写与复述小游戏" subtitle={source.name} />
        <DictationFlow step={step} source={source} keywords={keywords} retellText={retellText}
          setStep={setStep} setKeywords={setKeywords} setRetellText={setRetellText}
          onFinish={handleFinish} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="听写与复述小游戏" subtitle="播放→输入关键词→再播放→用自己的话复述" />
      <div className="rounded-xl bg-white border border-gray-100 p-8 space-y-4">
        <p className="text-sm text-gray-500 text-center">选择一段音频素材开始听写练习</p>
        <div className="flex flex-col items-center gap-3">
          <button onClick={handlePickFile}
            className="rounded-lg border-2 border-dashed border-gray-300 px-8 py-6 text-center hover:border-primary-400 hover:text-primary-600 transition-colors w-full max-w-sm">
            <p className="text-2xl mb-1">+</p>
            <p className="text-sm font-medium">选择本地音频文件</p>
            <p className="text-xs text-gray-400 mt-1">MP3 / MP4 / M4A / WAV / OGG</p>
          </button>
          {data.player.source && (
            <button onClick={handleUsePlayerSource}
              className="rounded-lg border border-primary-200 bg-primary-50 px-6 py-3 text-sm text-primary-700 hover:bg-primary-100 transition-colors">
              使用播放器中的音频：{data.player.source.name}
            </button>
          )}
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 max-w-sm mx-auto">
          <p className="text-xs font-medium text-gray-600 mb-2">流程说明</p>
          <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
            <li>盲听 — 不写任何东西，专注理解大意</li>
            <li>关键词 — 凭记忆写下你抓到的关键词</li>
            <li>再听 — 重新播放，核对并修正关键词</li>
            <li>复述 — 用自己的英文组织语言复述内容</li>
          </ol>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-6">
        <HistoryList history={data.dictation} loaded={true}
          onDelete={async (id) => { await useDictationStore.getState().deleteSession(id); }} />
      </div>
    </div>
  );
}
