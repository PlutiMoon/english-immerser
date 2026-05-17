import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: "🏠" },
  { to: "/player", label: "沉浸听力", icon: "🎧" },
  { to: "/vocabulary", label: "习词本", icon: "📖" },
  { to: "/writing", label: "自由写作", icon: "✍️" },
  { to: "/recording", label: "录音棚", icon: "🎙️" },
  { to: "/dictation", label: "听写复述", icon: "🎯" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-56 flex-col bg-white shadow-sm border-r border-gray-200">
      <div className="flex h-14 items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-semibold text-primary-700">英语沉浸助手</h1>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3 text-xs text-gray-400">
        v0.1.0
      </div>
    </aside>
  );
}
