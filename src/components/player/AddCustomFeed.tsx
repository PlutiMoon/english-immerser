import { useState } from "react";
import { PlusIcon } from "@/components/icons/AppIcons";

export default function AddCustomFeed({ onAdd }: { onAdd: (name: string, url: string) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) return;
    onAdd(name.trim(), url.trim());
    setName(""); setUrl(""); setShow(false);
  };

  if (!show) return (
    <button onClick={() => setShow(true)} className="text-xs text-gray-400 hover:text-primary-600 inline-flex items-center gap-1">
      <PlusIcon className="h-3.5 w-3.5" />
      添加自定义 RSS
    </button>
  );

  return (
    <div className="space-y-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="名称（如：我的播客）"
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary-400" />
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="RSS 地址"
        className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary-400" />
      <div className="flex gap-2">
        <button onClick={handleAdd} className="rounded bg-primary-500 px-3 py-1 text-xs text-white hover:bg-primary-600">添加</button>
        <button onClick={() => setShow(false)} className="rounded px-3 py-1 text-xs text-gray-400 hover:text-gray-600">取消</button>
      </div>
    </div>
  );
}
