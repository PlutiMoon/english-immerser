import type { ModuleCount } from "@/utils/checkin";

interface Props {
  data: ModuleCount[];
}

const MODULE_COLORS: Record<string, string> = {
  player: "#ed9317",     // primary-500
  vocabulary: "#f07d3b", // warm-500
  writing: "#924913",    // primary-800
  recording: "#c24d1a",  // warm-700
  dictation: "#f5c573",  // primary-300
};

const MODULE_ICONS: Record<string, string> = {
  player: "🎧",
  vocabulary: "📖",
  writing: "✍️",
  recording: "🎙️",
  dictation: "🎯",
};

export default function ModuleChart({ data }: Props) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">模块使用分布</h4>
        <div className="rounded-xl bg-white border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">暂无打卡数据，开始学习后这里会显示各模块的使用频率</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">模块使用分布</h4>
      <div className="rounded-xl bg-white border border-gray-100 p-4 space-y-2">
        {data.map((item) => {
          const pct = Math.round((item.count / total) * 100);
          const barPct = Math.max(2, (item.count / maxCount) * 100);
          return (
            <div key={item.module} className="flex items-center gap-3">
              <span className="text-sm w-5 text-center" title={item.label}>
                {MODULE_ICONS[item.module] || "📦"}
              </span>
              <span className="text-xs font-medium text-gray-600 w-8">{item.label}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: MODULE_COLORS[item.module] || "#9ca3af",
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right tabular-nums">
                {item.count} 次<span className="text-gray-300 ml-0.5">{pct > 0 ? `${pct}%` : ""}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
