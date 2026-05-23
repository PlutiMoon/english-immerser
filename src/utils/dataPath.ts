import { documentDir } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";

const DATA_DIR_NAME = "English Immerser";

let _baseDir: string | null = null;

async function baseDir(): Promise<string> {
  if (_baseDir) return _baseDir;
  const docDir = await documentDir();
  _baseDir = docDir.replace(/\\/g, "/").replace(/\/$/, "") + "/" + DATA_DIR_NAME;
  return _baseDir;
}

export async function dataPath(...segments: string[]): Promise<string> {
  const base = await baseDir();
  return [base, ...segments].join("/");
}

export const dataPaths = {
  root: () => dataPath(),
  diary: () => dataPath("diary"),
  writing: () => dataPath("writing"),
  recordings: () => dataPath("recordings"),
};

export const dataFiles = {
  vocabulary: async () => `${await dataPath()}/vocabulary.json`,
  checkin: async () => `${await dataPath()}/checkin.json`,
  dictation: async () => `${await dataPath()}/dictation.json`,
  podcastFeeds: async () => `${await dataPath()}/podcast_feeds.json`,
  recordingHistory: async () => `${await dataPath()}/recordings.json`,
};

let _dirsEnsured = false;

export async function ensureDataDirs(): Promise<void> {
  if (_dirsEnsured) return;
  const root = await dataPaths.root();
  await mkdir(root, { recursive: true });
  await Promise.all([
    mkdir(await dataPaths.diary(), { recursive: true }),
    mkdir(await dataPaths.writing(), { recursive: true }),
    mkdir(await dataPaths.recordings(), { recursive: true }),
  ]);
  _dirsEnsured = true;
}
