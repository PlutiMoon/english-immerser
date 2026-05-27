import { useMemo } from "react";
import StatCard from "@/components/shared/StatCard";
import WeeklyChart from "@/components/home/WeeklyChart";
import ModuleChart from "@/components/home/ModuleChart";
import { weeklyStats, moduleDistribution } from "@/utils/checkin";
import type { CheckInRecord } from "@/types";

interface Props {
  checkinRecords: CheckInRecord[];
}

export default function StatsTab({ checkinRecords }: Props) {
  const weekData = useMemo(() => weeklyStats(checkinRecords, 7), [checkinRecords]);
  const monthData = useMemo(() => weeklyStats(checkinRecords, 30), [checkinRecords]);
  const moduleData = useMemo(() => moduleDistribution(checkinRecords), [checkinRecords]);
  const weekTotal = useMemo(() => weekData.reduce((s, d) => s + d.minutes, 0), [weekData]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="本周总计" value={weekTotal > 0 ? `${weekTotal} 分钟` : "—"} />
        <StatCard label="本周打卡" value={`${weekData.filter(d => d.minutes > 0).length} 天`} />
        <StatCard label="日均时长" value={weekTotal > 0 ? `${Math.round(weekTotal / 7)} 分钟` : "—"} />
        <StatCard label="最常使用" value={moduleData[0]?.count > 0 ? moduleData[0].label : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyChart data={monthData} />
        <ModuleChart data={moduleData} />
      </div>

      {weekTotal === 0 && (
        <div className="rounded-xl bg-warm-50 border border-warm-100 p-5 text-center">
          <p className="text-sm text-warm-700 font-medium mb-1">还没有学习记录</p>
          <p className="text-xs text-gray-500">
            完成每日打卡后，这里会显示你的学习趋势和各模块的使用频率
          </p>
        </div>
      )}
    </>
  );
}
