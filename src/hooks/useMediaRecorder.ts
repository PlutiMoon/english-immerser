import { useRef, useCallback } from "react";
import type { RecordingStatus } from "@/types";

export interface UseMediaRecorderOptions {
  onStatusChange: (status: RecordingStatus) => void;
  onDurationUpdate: (duration: number) => void;
  onRecordingComplete: (blob: Blob, url: string) => void;
}

export function useMediaRecorder({
  onStatusChange,
  onDurationUpdate,
  onRecordingComplete,
}: UseMediaRecorderOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    try {
      onStatusChange("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        onRecordingComplete(blob, url);
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start(250); // collect chunks every 250ms
      onStatusChange("recording");

      // Duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        onDurationUpdate((Date.now() - startTime) / 1000);
      }, 200);
    } catch (err) {
      console.error("Mic access denied:", err);
      onStatusChange("idle");
    }
  }, [onStatusChange, onDurationUpdate, onRecordingComplete]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    onStatusChange("idle");
    onDurationUpdate(0);
  }, [onStatusChange, onDurationUpdate]);

  // Cleanup on unmount — stops tracks and timers, leaves state management to the caller
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { start, stop, cleanup };
}
