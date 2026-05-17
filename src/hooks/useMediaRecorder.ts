import { useRef, useCallback } from "react";
import { useRecordingStore } from "@/stores/recordingStore";

export function useMediaRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setStatus, setDuration, setBlob, reset } = useRecordingStore();

  const start = useCallback(async () => {
    try {
      setStatus("requesting");
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
        setBlob(blob);
        const url = URL.createObjectURL(blob);
        useRecordingStore.getState().setPlaybackUrl(url);
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start(250); // collect chunks every 250ms
      setStatus("recording");

      // Duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration((Date.now() - startTime) / 1000);
      }, 200);
    } catch (err) {
      console.error("Mic access denied:", err);
      setStatus("idle");
    }
  }, [setStatus, setDuration, setBlob]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    setStatus("idle");
    setDuration(0);
  }, [setStatus, setDuration]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    reset();
  }, [reset]);

  return { start, stop, cleanup };
}
