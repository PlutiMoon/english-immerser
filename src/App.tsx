import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import PlayerPage from "./pages/PlayerPage";
import VocabularyPage from "./pages/VocabularyPage";
import WritingPage from "./pages/WritingPage";
import RecordingPage from "./pages/RecordingPage";
import DictationPage from "./pages/DictationPage";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const update = await check();
        if (update) {
          const ok = window.confirm(
            `New version ${update.version} is available.\n\n${update.body || ""}\n\nDownload and install now?`
          );
          if (ok) {
            await update.downloadAndInstall();
            await relaunch();
          }
        }
      } catch {
        // offline or no updates — silently skip
      }
    };
    checkUpdate();
  }, []);

  return (
    <AppLayout>
      <div key={location.pathname} className="animate-fade-in">
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/recording" element={<RecordingPage />} />
          <Route path="/dictation" element={<DictationPage />} />
        </Routes>
      </div>
    </AppLayout>
  );
}
