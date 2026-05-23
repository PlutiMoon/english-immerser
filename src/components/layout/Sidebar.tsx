import type { Scene } from "@/App";

const NAV_ITEMS: { scene: Scene; label: string; icon: string }[] = [
  { scene: "hub", label: "首页", icon: "🏠" },
  { scene: "player", label: "沉浸听力", icon: "🎧" },
  { scene: "vocabulary", label: "习词本", icon: "📖" },
  { scene: "writing", label: "自由写作", icon: "✍️" },
  { scene: "recording", label: "录音棚", icon: "🎙️" },
  { scene: "dictation", label: "听写复述", icon: "🎯" },
];

interface SidebarProps {
  scene: Scene;
  onSceneChange: (scene: Scene) => void;
}

export default function Sidebar({ scene, onSceneChange }: SidebarProps) {
  return (
    <aside className="flex w-56 flex-col bg-white shadow-sm border-r border-gray-200">
      <div className="flex h-14 items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-semibold text-primary-700">English Immerser</h1>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.scene}
            onClick={() => onSceneChange(item.scene)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left ${
              item.scene === scene
                ? "bg-primary-50 text-primary-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3 text-xs text-gray-400">
        v0.2.0
      </div>
    </aside>
  );
}
