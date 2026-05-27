import { useEffect, useState } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import CheckInModal from "@/components/checkin/CheckInModal";
import OverviewTab from "@/components/home/OverviewTab";
import StatsTab from "@/components/home/StatsTab";
import { formatJsonRecoveryNotice } from "@/utils/recoveryNotice";
import type { ModuleType } from "@/types";
import { useVocabularyStore } from "@/stores/vocabularyStore";
import { useWritingStore } from "@/stores/writingStore";
import { useCheckinStore } from "@/stores/checkinStore";

type HubTab = "overview" | "stats";

export default function HubScene({ toast, onSceneChange }: SceneProps) {
  const [tab, setTab] = useState<HubTab>("overview");
  const [showModal, setShowModal] = useState(false);
  const vocabCount = useVocabularyStore((s) => s.words.length);
  const loadVocab = useVocabularyStore((s) => s.loadWords);
  const diaryCount = useWritingStore((s) => s.diaryDates.length);
  const diaryLoaded = useWritingStore((s) => s.diaryLoaded);
  const loadDiaryHistory = useWritingStore((s) => s.loadDiaryHistory);
  const checkinRecords = useCheckinStore((s) => s.records);
  const checkinLoaded = useCheckinStore((s) => s.loaded);
  const loadCheckins = useCheckinStore((s) => s.loadCheckins);
  const addCheckIn = useCheckinStore((s) => s.addCheckIn);
  const checkinRecovery = useCheckinStore((s) => s.recovery);
  const clearCheckinRecovery = useCheckinStore((s) => s.clearRecovery);

  useEffect(() => { loadDiaryHistory().catch(console.error); }, [loadDiaryHistory]);

  useEffect(() => {
    if (!checkinLoaded) { loadCheckins().catch(console.error); }
  }, [checkinLoaded, loadCheckins]);

  useEffect(() => {
    if (checkinRecovery) {
      toast(formatJsonRecoveryNotice(checkinRecovery), "warning", 7000);
      clearCheckinRecovery();
    }
  }, [checkinRecovery, clearCheckinRecovery, toast]);

  useEffect(() => { loadVocab(); }, [loadVocab]);

  const handleCheckIn = async (duration: number, modules: ModuleType[], note: string) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await addCheckIn({ date: today, durationMinutes: duration, modules, note: note || undefined });
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save check-in:", err);
      toast("打卡保存失败", "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="今日学习" subtitle="每天60-90分钟，听力带路、兴趣驱动" />

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["overview", "stats"] as HubTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "overview" ? "概览" : "统计"}
          </button>
        ))}
      </div>

      {tab === "overview"
        ? <OverviewTab checkinRecords={checkinRecords} vocabCount={vocabCount}
            diaryCount={diaryCount} diaryLoaded={diaryLoaded}
            onSceneChange={onSceneChange} onCheckIn={() => setShowModal(true)} />
        : <StatsTab checkinRecords={checkinRecords} />
      }

      {showModal && <CheckInModal onCheckIn={handleCheckIn} onCancel={() => setShowModal(false)} />}
    </div>
  );
}
