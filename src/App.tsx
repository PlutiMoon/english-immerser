import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import Sidebar from "./components/layout/Sidebar";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ToastContainer from "./components/shared/ToastContainer";
import UpdateModal from "./components/shared/UpdateModal";
import type { ToastType, ToastItem } from "./types";

// --- Scenes ---
export type Scene = "hub" | "player" | "vocabulary" | "writing" | "recording" | "dictation" | "tools";

export interface SceneProps {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  onSceneChange: (scene: Scene) => void;
}

const HubScene = lazy(() => import("./scenes/HubScene"));
const PlayerScene = lazy(() => import("./scenes/PlayerScene"));
const VocabularyScene = lazy(() => import("./scenes/VocabularyScene"));
const WritingScene = lazy(() => import("./scenes/WritingScene"));
const RecordingScene = lazy(() => import("./scenes/RecordingScene"));
const DictationScene = lazy(() => import("./scenes/DictationScene"));
const ToolsScene = lazy(() => import("./scenes/ToolsScene"));

const SCENE_COMPONENTS: Record<Scene, LazyExoticComponent<ComponentType<SceneProps>>> = {
  hub: HubScene,
  player: PlayerScene,
  vocabulary: VocabularyScene,
  writing: WritingScene,
  recording: RecordingScene,
  dictation: DictationScene,
  tools: ToolsScene,
};

function PageFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="h-20 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

// --- App ---
export default function App() {
  const [scene, setScene] = useState<Scene>("hub");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Toast
  const addToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  // Update check (delayed)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const update = await check();
        if (update) setUpdateInfo(update);
      } catch { /* noop */ }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Update handlers
  const handleUpdate = useCallback(async () => {
    if (!updateInfo) return;
    setDownloading(true);
    try {
      await updateInfo.downloadAndInstall();
      await relaunch();
    } catch (err) {
      console.error("Failed to download and install update:", err);
      setDownloading(false);
    }
  }, [updateInfo]);

  const ActiveScene = SCENE_COMPONENTS[scene];

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      {updateInfo && (
        <UpdateModal
          version={updateInfo.version}
          body={updateInfo.body || ""}
          onConfirm={handleUpdate}
          onCancel={() => setUpdateInfo(null)}
          downloading={downloading}
        />
      )}
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar scene={scene} onSceneChange={setScene} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="animate-fade-in">
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <ActiveScene toast={addToast} onSceneChange={setScene} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </>
  );
}
