import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export async function allowMediaFile(path: string): Promise<void> {
  try {
    await invoke("allow_media_file", { path });
  } catch {
    // The browser preview has no Tauri backend; keep local fallback behavior.
  }
}

export function resolveLocalMediaSrc(path: string): string {
  try {
    return convertFileSrc(path);
  } catch {
    return path;
  }
}
