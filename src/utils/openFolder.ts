import { invoke } from "@tauri-apps/api/core";

export async function openFolder(path: string): Promise<void> {
  try {
    await invoke("open_folder", { path });
  } catch (err) {
    console.error("Failed to open folder:", err);
  }
}

export async function openCacheDir(): Promise<void> {
  try {
    await invoke("open_cache_dir");
  } catch (err) {
    console.error("Failed to open cache dir:", err);
  }
}
