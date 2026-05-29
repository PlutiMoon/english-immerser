interface UrlPanelProps {
  urlInput: string;
  onUrlInputChange: (value: string) => void;
  onLoad: () => void;
}

export default function UrlPanel({ urlInput, onUrlInputChange, onLoad }: UrlPanelProps) {
  return (
    <div className="space-y-3">
      <input type="text" value={urlInput} onChange={e => onUrlInputChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onLoad()}
        placeholder="粘贴 MP3/MP4 直链地址..."
        className="input-glass w-full rounded-lg px-3 py-2 text-sm outline-none" />
      <button onClick={onLoad} disabled={!urlInput.trim()}
        className="w-full rounded-lg bg-primary-500 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
        加载链接
      </button>
    </div>
  );
}
