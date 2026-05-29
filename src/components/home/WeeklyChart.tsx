import { useState } from "react";
import type { DailyStat } from "@/utils/checkin";

interface Props {
  data: DailyStat[];
  goalMinutes?: number;
}

// Apple-style blue palette
const C_BAR_FILL = "#d9ecff";      // primary-100
const C_BAR_TODAY = "#8bc7ff";     // primary-300
const C_BAR_GOAL = "#007aff";      // primary-500
const C_BAR_STROKE = "#006ee6";    // primary-600
const C_GOAL_LINE = "#34c759";     // system green
const C_GRID = "#f3f4f6";          // gray-100
const C_TEXT = "#9ca3af";          // gray-400
const C_TEXT_DARK = "#4b5563";     // gray-600

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const CHART = { padLeft: 38, padRight: 8, padTop: 16, padBottom: 32, svgW: 700, svgH: 220 };

function dayOfWeek(dateStr: string) {
  return DAY_LABELS[new Date(dateStr).getDay()];
}

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

function roundYMax(data: DailyStat[], goal: number) {
  return Math.ceil(Math.max(goal, ...data.map(d => d.minutes)) / 30) * 30;
}

function yTicks(maxY: number): number[] {
  const t: number[] = [];
  for (let v = 0; v <= maxY; v += 30) t.push(v);
  if (t[t.length - 1] < maxY) t.push(maxY);
  return t;
}

export default function WeeklyChart({ data, goalMinutes = 60 }: Props) {
  const [range, setRange] = useState<7 | 30>(7);
  const visible = data.slice(-range);
  const maxY = roundYMax(visible, goalMinutes);
  const { padLeft, padRight, padTop, padBottom, svgW, svgH } = CHART;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;
  const barCount = visible.length;
  const gap = barCount > 14 ? 2 : 8;
  const barW = Math.max(4, (plotW - gap * (barCount - 1)) / barCount);
  const goalY = padTop + plotH - (goalMinutes / maxY) * plotH;
  const ticks = yTicks(maxY);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">每日学习时长</h4>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {([7, 30] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${range === r ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {r} 天
            </button>
          ))}
        </div>
      </div>

      <div className="surface-card p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[400px]" role="img" aria-label="学习时长柱状图">
          {/* Grid + Y labels */}
          {ticks.map(v => {
            const y = padTop + plotH - (v / maxY) * plotH;
            return (
              <g key={`y-${v}`}>
                <line x1={padLeft} y1={y} x2={svgW - padRight} y2={y} stroke={C_GRID} strokeWidth="1" />
                <text x={padLeft - 6} y={y + 4} textAnchor="end" fill={C_TEXT} fontSize="10">{v}</text>
              </g>
            );
          })}

          {/* Goal line */}
          <line x1={padLeft} y1={goalY} x2={svgW - padRight} y2={goalY}
            stroke={C_GOAL_LINE} strokeWidth="1" strokeDasharray="4,3" />
          <text x={svgW - padRight - 4} y={goalY - 4} textAnchor="end" fill={C_GOAL_LINE} fontSize="9">
            目标 {goalMinutes}min
          </text>

          {/* Bars */}
          {visible.map((d, i) => {
            const x = padLeft + i * (barW + gap);
            const barH = Math.max(0, (d.minutes / maxY) * plotH);
            const y = padTop + plotH - barH;
            const isToday = d.date === todayStr;
            const fill = d.minutes >= goalMinutes ? C_BAR_GOAL : isToday ? C_BAR_TODAY : C_BAR_FILL;
            const showLabel = range === 7 || i % 5 === 0 || i === barCount - 1;
            const showValue = d.minutes > 0 && barH > 14;

            return (
              <g key={d.date}>
                <title>{`${shortDate(d.date)} — ${d.minutes} 分钟`}</title>
                <rect x={x} y={y} width={barW} height={barH} rx="2" fill={fill}
                  stroke={isToday ? C_BAR_STROKE : "none"} strokeWidth={isToday ? 1.5 : 0} />
                {showLabel && (
                  <text x={x + barW / 2} y={svgH - 8} textAnchor="middle" fill={C_TEXT} fontSize="9">
                    {range === 7 ? dayOfWeek(d.date) : shortDate(d.date)}
                  </text>
                )}
                {showValue && (
                  <text x={x + barW / 2} y={y + 12} textAnchor="middle" fill={C_TEXT_DARK} fontSize="9">{d.minutes}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
