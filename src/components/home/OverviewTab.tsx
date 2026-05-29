import { useMemo } from "react";
import type { Scene } from "@/App";
import StatCard from "@/components/shared/StatCard";
import StreakBadge from "@/components/home/StreakBadge";
import {
  CheckIcon,
  HeadphonesIcon,
  BookOpenIcon,
  MicIcon,
  PenToolIcon,
  TargetIcon,
  WrenchIcon,
  FolderIcon,
} from "@/components/icons/AppIcons";
import { openFolder } from "@/utils/openFolder";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import { computeStreak, todayRecord, MODULE_LABEL_MAP } from "@/utils/checkin";
import type { CheckInRecord } from "@/types";

const QUICK_ENTRIES: { scene: Scene; icon: (props: { className?: string }) => JSX.Element; label: string; desc: string }[] = [
  { scene: "player", icon: HeadphonesIcon, label: "沉浸听力", desc: "导入音频/视频，精听影子跟读" },
  { scene: "vocabulary", icon: BookOpenIcon, label: "习词本", desc: "生词卡片，语境中记单词" },
  { scene: "writing", icon: PenToolIcon, label: "自由写作", desc: "三句日记，自由表达" },
  { scene: "recording", icon: MicIcon, label: "录音棚", desc: "自言自语，即时回放" },
  { scene: "dictation", icon: TargetIcon, label: "听写复述", desc: "听音辨词，复述练习" },
  { scene: "tools", icon: WrenchIcon, label: "工具设置", desc: "备份恢复，本地文件入口" },
];

interface Props {
  checkinRecords: CheckInRecord[];
  vocabCount: number;
  diaryCount: number;
  diaryLoaded: boolean;
  onSceneChange: (scene: Scene) => void;
  onCheckIn: () => void;
}

export default function OverviewTab({
  checkinRecords, vocabCount, diaryCount, diaryLoaded,
  onSceneChange, onCheckIn,
}: Props) {
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

  return (
    <>
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
            <CheckIcon className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">今日已打卡 · {stats.todayMinutes} 分钟</p>
              {stats.todayModules.length > 0 && (
                <p className="text-xs text-green-600 mt-0.5">
                  {stats.todayModules.map(m => MODULE_LABEL_MAP[m] || m).join(" · ")}
                </p>
              )}
            </div>
            <StreakBadge streak={stats.streak} />
          </div>
        ) : (
          <button onClick={onCheckIn} className="rounded-xl bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-600 transition-colors">
            今日打卡
          </button>
        )}
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-gray-500">快速入口</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ENTRIES.map(entry => (
            <button key={entry.scene} onClick={() => onSceneChange(entry.scene)}
              className="surface-card flex flex-col items-center gap-2 p-4 text-center transition-colors hover:bg-primary-50 hover:border-primary-200">
              <entry.icon className="h-7 w-7 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">{entry.label}</span>
              <span className="text-xs text-gray-400 leading-tight">{entry.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-panel p-5">
        <h3 className="text-sm font-medium text-primary-800">今日建议</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          先打开"沉浸听力"模块，找一段你感兴趣的英文播客或视频，尝试听懂大意；
          遇到生词不要暂停查词典，听完后统一添加到"习词本"；
          用"三句日记"记录今天的学习感想，哪怕只写一句话也是进步。
        </p>
        <button onClick={async () => { await ensureDataDirs(); await openFolder(await dataPaths.root()); }}
          className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium">
          <span className="inline-flex items-center gap-1">
            <FolderIcon className="h-3.5 w-3.5" />
            打开数据文件夹
          </span>
        </button>
      </section>
    </>
  );
}
