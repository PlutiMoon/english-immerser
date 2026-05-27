import { useEffect, useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import DictationFlow from "@/components/dictation/DictationFlow";
import SessionResult from "@/components/dictation/SessionResult";
import HistoryList from "@/components/dictation/HistoryList";
import { usePlayerStore } from "@/stores/playerStore";
import { useDictationStore } from "@/stores/dictationStore";
import { useVocabularyStore } from "@/stores/vocabularyStore";
import { useWritingStore } from "@/stores/writingStore";
import { formatJsonRecoveryNotice } from "@/utils/recoveryNotice";
import type { DictationStep } from "@/types";

export default function DictationScene({ toast, onSceneChange }: SceneProps) {
  const playerSource = usePlayerStore((s) => s.source);
  const { sessionActive, history, loaded, startSession, resetSession } = useDictationStore();
  const recovery = useDictationStore((s) => s.recovery);
  const clearRecovery = useDictationStore((s) => s.clearRecovery);
  const [step, setStep] = useState<DictationStep>("listen");
  const [keywords, setKeywords] = useState("");
  const [retellText, setRetellText] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Load history on mount
  useEffect(() => { useDictationStore.getState().loadHistory(); }, []);

  useEffect(() => {
    if (recovery) {
      toast(formatJsonRecoveryNotice(recovery), "warning", 7000);
      clearRecovery();
    }
  }, [recovery, clearRecovery, toast]);

  const handlePickFile = async () => {
    try {
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
    } catch (err) {
      console.error("Failed to pick dictation file:", err);
      toast("选择音频文件失败", "error");
    }
  };

  const handleUsePlayerSource = useCallback(() => {
    if (playerSource) {
      startSession({ name: playerSource.name, path: playerSource.path });
      setStep("listen"); setKeywords(""); setRetellText("");
      setShowResult(false);
    }
  }, [playerSource, startSession]);

  const handleFinish = async () => {
    const store = useDictationStore.getState();
    store.setKeywords(keywords);
    store.setRetellText(retellText);
    try {
      await store.saveSession();
      setShowResult(true);
      toast("听写记录已保存", "success");
    } catch (err) {
      console.error("Failed to save dictation session:", err);
      toast("听写记录保存失败", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await useDictationStore.getState().deleteSession(id);
      toast("听写记录已删除", "success");
    } catch (err) {
      console.error("Failed to delete dictation session:", err);
      toast("听写记录删除失败", "error");
    }
  };

  const handleNewSession = () => {
    resetSession();
    setStep("listen"); setKeywords(""); setRetellText("");
    setShowResult(false);
  };

  const handleAddToVocabulary = () => {
    const store = useVocabularyStore.getState();
    store.setPendingWord({ word: keywords, source: playerSource?.name ?? "" });
    onSceneChange("vocabulary");
  };

  const handleSaveToWriting = () => {
    const store = useWritingStore.getState();
    store.setPendingContent({
      title: `${playerSource?.name ?? "听写"} 复述`,
      content: retellText,
    });
    onSceneChange("writing");
  };

  const handleRepeatSource = () => {
    if (playerSource) {
      startSession({ name: playerSource.name, path: playerSource.path });
      setStep("listen"); setKeywords(""); setRetellText("");
      setShowResult(false);
    }
  };

  if (showResult && playerSource) {
    return (
      <div className="space-y-6">
        <PageHeader title="听写与复述小游戏" subtitle="播放→输入关键词→再播放→用自己的话复述" />
        <SessionResult sourceName={playerSource.name} keywords={keywords} retellText={retellText}
          onNewSession={handleNewSession}
          onAddToVocabulary={handleAddToVocabulary}
          onSaveToWriting={handleSaveToWriting}
          onRepeatSource={handleRepeatSource} />
        <div className="border-t border-gray-100 pt-6">
          <HistoryList history={history} loaded={loaded}
            onDelete={handleDelete} />
        </div>
      </div>
    );
  }

  if (sessionActive && playerSource) {
    return (
      <div className="space-y-6">
        <PageHeader title="听写与复述小游戏" subtitle={playerSource.name} />
        <DictationFlow step={step} source={playerSource} keywords={keywords} retellText={retellText}
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
          {playerSource && (
            <button onClick={handleUsePlayerSource}
              className="rounded-lg border border-primary-200 bg-primary-50 px-6 py-3 text-sm text-primary-700 hover:bg-primary-100 transition-colors">
              使用播放器中的音频：{playerSource.name}
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
        <HistoryList history={history} loaded={loaded}
          onDelete={handleDelete} />
      </div>
    </div>
  );
}
