import { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ToastContainer from "./components/shared/ToastContainer";
import UpdateModal from "./components/shared/UpdateModal";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const HomePage = lazy(() => import("./pages/HomePage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
const VocabularyPage = lazy(() => import("./pages/VocabularyPage"));
const WritingPage = lazy(() => import("./pages/WritingPage"));
const RecordingPage = lazy(() => import("./pages/RecordingPage"));
const DictationPage = lazy(() => import("./pages/DictationPage"));

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

export default function App() {
  const location = useLocation();
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const update = await check();
        if (update) {
          setUpdateInfo(update);
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo) return;
    setDownloading(true);
    try {
      await updateInfo.downloadAndInstall();
      await relaunch();
    } catch (err) {
      console.error("Failed to download and install update:", err);
      setDownloading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      {updateInfo && (
        <UpdateModal
          version={updateInfo.version}
          body={updateInfo.body || ""}
          onConfirm={handleUpdate}
          onCancel={() => setUpdateInfo(null)}
          downloading={downloading}
        />
      )}
      <AppLayout>
        <div key={location.pathname} className="animate-fade-in">
          <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/player" element={<PlayerPage />} />
              <Route path="/vocabulary" element={<VocabularyPage />} />
              <Route path="/writing" element={<WritingPage />} />
              <Route path="/recording" element={<RecordingPage />} />
              <Route path="/dictation" element={<DictationPage />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </div>
      </AppLayout>
    </>
  );
}
