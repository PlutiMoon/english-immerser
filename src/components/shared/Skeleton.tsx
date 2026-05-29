export function SkeletonCard() {
  return (
    <div className="surface-card p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="surface-card p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

const TEXT_WIDTHS = [85, 92, 78, 65, 88, 72, 95, 60];

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-200 rounded"
          style={{ width: `${TEXT_WIDTHS[i % TEXT_WIDTHS.length]}%` }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="surface-card p-4 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}
