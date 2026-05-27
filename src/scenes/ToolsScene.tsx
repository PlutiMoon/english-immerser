import { useRef, useState } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import { openCacheDir, openFolder } from "@/utils/openFolder";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import { createBackup, importBackup } from "@/utils/backup";

export default function ToolsScene({ toast }: SceneProps) {
  const [backupBusy, setBackupBusy] = useState(false);
  const [includeRecordingFiles, setIncludeRecordingFiles] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await createBackup({ includeRecordingFiles });
      downloadTextFile(backup.filename, backup.content);
      toast("备份已导出", "success");
    } catch (err) {
      console.error("Failed to export backup:", err);
      toast("备份导出失败", "error");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportBackup = async (file: File | null | undefined) => {
    if (!file) return;
    setBackupBusy(true);
    try {
      const result = await importBackup(await file.text());
      toast(`导入完成，已预先备份当前数据到 ${result.preImportBackupPath}`, "success", 7000);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.error("Failed to import backup:", err);
      toast("备份导入失败，已保留当前数据", "error", 7000);
    } finally {
      setBackupBusy(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="工具与设置" subtitle="备份、恢复和本地文件入口" />

      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-800">数据备份</h3>
            <p className="text-xs text-gray-500">
              导出单文件备份；导入前会自动生成当前数据的预备份。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={includeRecordingFiles}
                onChange={(event) => setIncludeRecordingFiles(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
              />
              包含录音数据
            </label>
            <button
              onClick={handleExportBackup}
              disabled={backupBusy}
              className="rounded-lg bg-primary-500 px-4 py-2 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-40"
            >
              导出备份
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={backupBusy}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              导入备份
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => handleImportBackup(event.target.files?.[0])}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-gray-800">本地位置</h3>
        <p className="mt-1 text-xs text-gray-500">快速打开数据目录、录音缓存和系统文件夹。</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={async () => {
              try {
                await ensureDataDirs();
                await openFolder(await dataPaths.root());
              } catch (err) {
                console.error("Failed to open data folder:", err);
                toast("打开数据目录失败", "error");
              }
            }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            打开数据目录
          </button>
          <button
            onClick={async () => {
              try {
                await openCacheDir();
              } catch (err) {
                console.error("Failed to open cache dir:", err);
                toast("打开缓存目录失败", "error");
              }
            }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            打开缓存目录
          </button>
          <button
            onClick={async () => {
              try {
                await ensureDataDirs();
                await openFolder(await dataPaths.writing());
              } catch (err) {
                console.error("Failed to open writing folder:", err);
                toast("打开写作目录失败", "error");
              }
            }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            打开写作目录
          </button>
          <button
            onClick={async () => {
              try {
                await ensureDataDirs();
                await openFolder(await dataPaths.diary());
              } catch (err) {
                console.error("Failed to open diary folder:", err);
                toast("打开日记目录失败", "error");
              }
            }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            打开日记目录
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-gray-50 border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-800">版本信息</h3>
        <p className="mt-1 text-xs text-gray-500">当前版本 v0.4.0</p>
      </section>
    </div>
  );
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
