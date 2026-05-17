import { useRecordingStore } from "@/stores/recordingStore";
import { formatSeconds } from "@/utils/formatSeconds";

interface RecordButtonProps {
  onStart: () => void;
  onStop: () => void;
}

export default function RecordButton({ onStart, onStop }: RecordButtonProps) {
  const { status, duration } = useRecordingStore();
  const isRecording = status === "recording";
  const isRequesting = status === "requesting";

  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else if (!isRequesting) {
      onStart();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Button */}
      <button
        onClick={handleClick}
        disabled={isRequesting}
        className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-200 ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-200"
            : isRequesting
              ? "bg-gray-300"
              : "bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg"
        }`}
      >
        {isRecording ? (
          <span className="h-8 w-8 rounded bg-white" />
        ) : (
          <span className="ml-1 text-3xl text-white">&#9654;</span>
        )}
      </button>

      {/* Status & Timer */}
      <div className="text-center">
        {isRequesting && (
          <p className="text-sm text-gray-400">请求麦克风权限...</p>
        )}
        {isRecording && (
          <>
            <p className="text-2xl font-mono font-bold text-red-600 tabular-nums">
              {formatSeconds(duration)}
            </p>
            <p className="text-xs text-red-400 mt-0.5 animate-pulse">● 录音中</p>
          </>
        )}
        {status === "idle" && (
          <p className="text-sm text-gray-400">点击开始录音</p>
        )}
      </div>
    </div>
  );
}
