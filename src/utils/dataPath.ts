import { documentDir } from "@tauri-apps/api/path";

/**
 * Build a path under the app data directory ($DOCUMENT/英语一号/).
 * All segments are joined with the platform separator.
 */
export async function dataPath(...segments: string[]): Promise<string> {
  const docDir = await documentDir();
  // Normalize to forward slashes, then strip trailing separator
  const base = docDir.replace(/\\/g, "/").replace(/\/$/, "");
  return [base, "英语一号", ...segments].join("/");
}

/** Directory paths */
export const dataPaths = {
  root: () => dataPath(),
  diary: () => dataPath("diary"),
  writing: () => dataPath("writing"),
  recordings: () => dataPath("recordings"),
};
