import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import Sidebar from "./components/layout/Sidebar";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ToastContainer from "./components/shared/ToastContainer";
import UpdateModal from "./components/shared/UpdateModal";
import { loadAllData, saveAllData } from "./data";
import type { AppData, ToastType, ToastItem } from "./types";
import { DEFAULT_APP_DATA } from "./types";

// --- Scenes ---
export type Scene = "hub" | "player" | "vocabulary" | "writing" | "recording" | "dictation";

export interface SceneProps {
  data: AppData;
  setData: (patch: Partial<AppData>) => void;
  toast: (message: string, type?: ToastType, duration?: number) => void;
  onSceneChange: (scene: Scene) => void;
}

const HubScene = lazy(() => import("./scenes/HubScene"));
const PlayerScene = lazy(() => import("./scenes/PlayerScene"));
const VocabularyScene = lazy(() => import("./scenes/VocabularyScene"));
const WritingScene = lazy(() => import("./scenes/WritingScene"));
const RecordingScene = lazy(() => import("./scenes/RecordingScene"));
const DictationScene = lazy(() => import("./scenes/DictationScene"));

const SCENE_COMPONENTS: Record<Scene, React.LazyExoticComponent<React.ComponentType<any>>> = {
  hub: HubScene,
  player: PlayerScene,
  vocabulary: VocabularyScene,
  writing: WritingScene,
  recording: RecordingScene,
  dictation: DictationScene,
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
  const [data, setDataState] = useState<AppData>(DEFAULT_APP_DATA);
  const [loaded, setLoaded] = useState(false);
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

  // Load all data once on mount
  useEffect(() => {
    loadAllData().then(({ data, recoveries }) => {
      setDataState(data);
      setLoaded(true);
      recoveries.forEach((recovery) => {
        const detail = recovery.backupPath
          ? `已备份到 ${recovery.backupPath}`
          : `已跳过 ${recovery.invalidCount} 条异常记录`;
        addToast(`${recovery.label}数据已自动恢复，${detail}`, "warning", 7000);
      });
    });
  }, [addToast]);

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

  // Centralized setData with auto-save
  const setData = useCallback((patch: Partial<AppData>) => {
    setDataState(prev => {
      const next = { ...prev, ...patch };
      saveAllData(next).catch(console.error);
      return next;
    });
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

  if (!loaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

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
                <ActiveScene
                  data={data}
                  setData={setData}
                  toast={addToast}
                  onSceneChange={setScene}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </>
  );
}
