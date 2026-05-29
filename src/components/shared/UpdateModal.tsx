interface UpdateModalProps {
  version: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  downloading?: boolean;
}

export default function UpdateModal({
  version,
  body,
  onConfirm,
  onCancel,
  downloading = false,
}: UpdateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="surface-panel max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">发现新版本</h3>
          <p className="text-sm text-white/90 mt-1">版本 {version}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          {body ? (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {body}
            </pre>
          ) : (
            <p className="text-sm text-gray-500">暂无更新说明</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={downloading}
            className="button-glass px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            稍后提醒
          </button>
          <button
            onClick={onConfirm}
            disabled={downloading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                下载中...
              </>
            ) : (
              "立即更新"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
