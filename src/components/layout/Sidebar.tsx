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
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">English Immerser</h1>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.scene}
            onClick={() => onSceneChange(item.scene)}
            className={`sidebar-item ${
              item.scene === scene
                ? "active"
                : ""
            }`}
          >
            {item.icon({ className: "h-4 w-4 sidebar-item-icon" })}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        v0.4.0
      </div>
    </aside>
  );
}
