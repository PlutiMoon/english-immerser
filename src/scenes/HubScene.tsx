import { useEffect, useState, useMemo } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StreakBadge from "@/components/home/StreakBadge";
import CheckInModal from "@/components/checkin/CheckInModal";
import { openFolder } from "@/utils/openFolder";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import { computeStreak, todayRecord } from "@/utils/checkin";
import { readDir } from "@tauri-apps/plugin-fs";
import type { ModuleType } from "@/types";

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

export default function HubScene({ data, setData, onSceneChange }: SceneProps) {
  const [showModal, setShowModal] = useState(false);
  const [diaryCount, setDiaryCount] = useState(0);
  const [diaryLoading, setDiaryLoading] = useState(true);

  useEffect(() => {
    ensureDataDirs().then(async () => {
      const dir = await dataPaths.diary();
      try {
        const entries = await readDir(dir);
        setDiaryCount(entries.filter(e => e.name?.endsWith(".txt")).length);
      } catch { setDiaryCount(0); }
      finally { setDiaryLoading(false); }
    });
  }, []);

  const stats = useMemo(() => {
    const streak = computeStreak(data.checkin);
    const today = todayRecord(data.checkin);
    return {
      streak,
      checkedInToday: !!today,
      todayMinutes: today?.durationMinutes ?? 0,
      todayModules: today?.modules ?? [],
    };
  }, [data.checkin]);

  const handleCheckIn = (duration: number, modules: ModuleType[], note: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const record = { date: today, durationMinutes: duration, modules, note: note || undefined };
    const updated = [record, ...data.checkin.filter(r => r.date !== today)];
    updated.sort((a, b) => b.date.localeCompare(a.date));
    setData({ checkin: updated });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="今日学习" subtitle="每天60-90分钟，听力带路、兴趣驱动" />

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="连续打卡" value={stats.streak > 0 ? `${stats.streak} 天` : "—"} />
        <StatCard label="今日时长" value={stats.todayMinutes > 0 ? `${stats.todayMinutes} 分钟` : "—"} />
        <StatCard label="习词本" value={`${data.vocabulary.length} 词`} />
        <StatCard label="日记" value={diaryLoading ? "—" : `${diaryCount} 篇`} />
        <StatCard label="累计打卡" value={data.checkin.length > 0 ? `${data.checkin.length} 次` : "—"} />
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

      {showModal && <CheckInModal onCheckIn={handleCheckIn} onCancel={() => setShowModal(false)} />}
    </div>
  );
}
