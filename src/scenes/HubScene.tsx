import { useEffect, useMemo, useRef, useState } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StreakBadge from "@/components/home/StreakBadge";
import CheckInModal from "@/components/checkin/CheckInModal";
import { openFolder } from "@/utils/openFolder";
import type { ModuleType } from "@/types";
import { useVocabularyStore } from "@/stores/vocabularyStore";
import { useWritingStore } from "@/stores/writingStore";
import { useCheckinStore } from "@/stores/checkinStore";
import { computeStreak, todayRecord } from "@/utils/checkin";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import { createBackup, importBackup } from "@/utils/backup";

const QUICK_ENTRIES = [
  { scene: "player" as const, icon: "🎧", label: "沉浸听力", desc: "导入音频/视频，精听影子跟读" },
  { scene: "vocabulary" as const, icon: "📖", label: "习词本", desc: "生词卡片，语境中记单词" },
  { scene: "writing" as const, icon: "✍️", label: "自由写作", desc: "三句日记，自由表达" },
  { scene: "recording" as const, icon: "🎙️", label: "录音棚", desc: "自言自语，即时回放" },
  { scene: "dictation" as const, icon: "🎯", label: "听写复述", desc: "听音辨词，复述练习" },
];

const MODULE_LABELS: Record<string, string> = {
  player: "听力", vocabulary: "习词", writing: "写作", recording: "录音", dictation: "听写",
};

export default function HubScene({ toast, onSceneChange }: SceneProps) {
  const [showModal, setShowModal] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [includeRecordingFiles, setIncludeRecordingFiles] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    loadDiaryHistory().catch(console.error);
  }, [loadDiaryHistory]);

  useEffect(() => {
    if (!checkinLoaded) {
      loadCheckins().catch(console.error);
    }
  }, [checkinLoaded, loadCheckins]);

  useEffect(() => {
    if (checkinRecovery) {
      const detail = checkinRecovery.backupPath
        ? `已备份到 ${checkinRecovery.backupPath}`
        : `已跳过 ${checkinRecovery.invalidCount} 条异常记录`;
      toast(`${checkinRecovery.label}数据已自动恢复，${detail}`, "warning", 7000);
      clearCheckinRecovery();
    }
  }, [checkinRecovery, clearCheckinRecovery, toast]);

  useEffect(() => { loadVocab(); }, [loadVocab]);

  const stats = useMemo(() => {
    const streak = computeStreak(checkinRecords);
    const today = todayRecord(checkinRecords);
    return {
      streak,
      checkedInToday: !!today,
      todayMinutes: today?.durationMinutes ?? 0,
      todayModules: today?.modules ?? [],
    };
  }, [checkinRecords]);

  const handleCheckIn = async (duration: number, modules: ModuleType[], note: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const record = { date: today, durationMinutes: duration, modules, note: note || undefined };
    try {
      await addCheckIn(record);
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save check-in:", err);
      toast("打卡保存失败", "error");
    }
  };

  const handleExportBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await createBackup({ includeRecordingFiles });
      downloadTextFile(backup.filename, backup.content);
      toast("备份已导出", "success");
    } catch (err) {
      console.error("Failed to export backup:", err);
      toast("备份导出失败", "error");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportBackup = async (file: File | null | undefined) => {
    if (!file) return;
    setBackupBusy(true);
    try {
      const result = await importBackup(await file.text());
      toast(`导入完成，已预先备份当前数据到 ${result.preImportBackupPath}`, "success", 7000);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.error("Failed to import backup:", err);
      toast("备份导入失败，已保留当前数据", "error", 7000);
    } finally {
      setBackupBusy(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="今日学习" subtitle="每天60-90分钟，听力带路、兴趣驱动" />

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="连续打卡" value={stats.streak > 0 ? `${stats.streak} 天` : "—"} />
        <StatCard label="今日时长" value={stats.todayMinutes > 0 ? `${stats.todayMinutes} 分钟` : "—"} />
        <StatCard label="习词本" value={`${vocabCount} 词`} />
        <StatCard label="日记" value={!diaryLoaded ? "—" : `${diaryCount} 篇`} />
        <StatCard label="累计打卡" value={checkinRecords.length > 0 ? `${checkinRecords.length} 次` : "—"} />
      </div>

      <div className="flex items-center gap-3">
        {stats.checkedInToday ? (
          <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-5 py-3">
            <span className="text-lg">✓</span>
            <div>
              <p className="text-sm font-medium text-green-700">今日已打卡 · {stats.todayMinutes} 分钟</p>
              {stats.todayModules.length > 0 && (
                <p className="text-xs text-green-600 mt-0.5">
                  {stats.todayModules.map(m => MODULE_LABELS[m] || m).join(" · ")}
                </p>
              )}
            </div>
            <StreakBadge streak={stats.streak} />
          </div>
        ) : (
          <button onClick={() => setShowModal(true)} className="rounded-xl bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-600 transition-colors">
            今日打卡
          </button>
        )}
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-gray-500">快速入口</h3>
        <div className="grid grid-cols-5 gap-3">
          {QUICK_ENTRIES.map(entry => (
            <button key={entry.scene} onClick={() => onSceneChange(entry.scene)}
              className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm border border-gray-100 text-center transition-colors hover:bg-primary-50 hover:border-primary-200">
              <span className="text-2xl">{entry.icon}</span>
              <span className="text-sm font-medium text-gray-700">{entry.label}</span>
              <span className="text-xs text-gray-400 leading-tight">{entry.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-gradient-to-r from-primary-50 to-warm-50 p-5 border border-primary-100">
        <h3 className="text-sm font-medium text-primary-800">今日建议</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          先打开"沉浸听力"模块，找一段你感兴趣的英文播客或视频，尝试听懂大意；
          遇到生词不要暂停查词典，听完后统一添加到"习词本"；
          用"三句日记"记录今天的学习感想，哪怕只写一句话也是进步。
        </p>
        <button onClick={async () => { await ensureDataDirs(); await openFolder(await dataPaths.root()); }}
          className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium">
          打开数据文件夹 →
        </button>
      </section>

      <section className="rounded-xl bg-white p-5 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-gray-800">数据备份</h3>
            <p className="mt-1 text-xs text-gray-500">
              导出或恢复本地学习数据，导入前会自动生成当前数据的预备份。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={includeRecordingFiles}
                onChange={(event) => setIncludeRecordingFiles(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
              />
              包含录音音频
            </label>
            <button
              onClick={handleExportBackup}
              disabled={backupBusy}
              className="rounded-lg bg-primary-500 px-4 py-2 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-40"
            >
              导出备份
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={backupBusy}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              导入备份
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => handleImportBackup(event.target.files?.[0])}
            />
          </div>
        </div>
      </section>

      {showModal && <CheckInModal onCheckIn={handleCheckIn} onCancel={() => setShowModal(false)} />}
    </div>
  );
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
