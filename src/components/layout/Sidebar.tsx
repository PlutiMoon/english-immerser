import type { Scene } from "@/App";
import {
  BookOpenIcon,
  HeadphonesIcon,
  HomeIcon,
  MicIcon,
  TargetIcon,
  WrenchIcon,
  PenToolIcon,
} from "@/components/icons/AppIcons";

const NAV_ITEMS: { scene: Scene; label: string; icon: (props: { className?: string }) => JSX.Element }[] = [
  { scene: "hub", label: "首页", icon: (props) => <HomeIcon {...props} /> },
  { scene: "player", label: "沉浸听力", icon: (props) => <HeadphonesIcon {...props} /> },
  { scene: "vocabulary", label: "习词本", icon: (props) => <BookOpenIcon {...props} /> },
  { scene: "writing", label: "自由写作", icon: (props) => <PenToolIcon {...props} /> },
  { scene: "recording", label: "录音棚", icon: (props) => <MicIcon {...props} /> },
  { scene: "dictation", label: "听写复述", icon: (props) => <TargetIcon {...props} /> },
  { scene: "tools", label: "工具", icon: (props) => <WrenchIcon {...props} /> },
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
            {item.icon({ className: "h-4 w-4 shrink-0" })}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3 text-xs text-gray-400">
        v0.4.0
      </div>
    </aside>
  );
}
