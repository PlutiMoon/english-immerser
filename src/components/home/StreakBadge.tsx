import { FlameIcon } from "@/components/icons/AppIcons";

interface Props {
  streak: number;
}

export default function StreakBadge({ streak }: Props) {
  if (streak === 0) return null;

  const colorMap: Record<string, string> = {
    low: "bg-orange-50 text-orange-700 border-orange-200",
    mid: "bg-red-50 text-red-700 border-red-200",
    high: "bg-purple-50 text-purple-700 border-purple-200",
  };

  let tier = "low";
  if (streak >= 7) tier = "high";
  else if (streak >= 3) tier = "mid";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorMap[tier]}`}
    >
      <FlameIcon className="h-3.5 w-3.5" />
      {streak} 天
    </span>
  );
}
