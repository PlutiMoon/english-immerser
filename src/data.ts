import { readTextFile, writeFile, exists, readDir } from "@tauri-apps/plugin-fs";
import { dataFiles, dataPaths, ensureDataDirs } from "./utils/dataPath";
import type { AppData, VocabularyWord, CheckInRecord, DictationSession, PodcastPreset, RecordingFile, WritingFileInfo } from "./types";
import { safeParseJSON, isValidVocabularyWord, isValidCheckInRecord, isValidDictationSession, isValidPodcastPreset, isValidRecordingFile } from "./utils/validators";

async function loadJsonFile(path: string): Promise<string> {
  if (!(await exists(path))) return "[]";
  return readTextFile(path);
}

// --- Load all persistent data ---
export async function loadAllData(): Promise<AppData> {
  await ensureDataDirs();

  const [vocabulary, checkin, dictation, podcastFeeds, recordingHistory, writingFiles] =
    await Promise.all([
      loadJsonFile(await dataFiles.vocabulary()).then(raw =>
        safeParseJSON(raw, isValidVocabularyWord)
      ),
      loadJsonFile(await dataFiles.checkin()).then(raw =>
        safeParseJSON(raw, isValidCheckInRecord).sort(
          (a, b) => b.date.localeCompare(a.date)
        )
      ),
      loadJsonFile(await dataFiles.dictation()).then(raw =>
        safeParseJSON(raw, isValidDictationSession).sort(
          (a, b) => b.date.localeCompare(a.date)
        )
      ),
      loadJsonFile(await dataFiles.podcastFeeds()).then(raw =>
        safeParseJSON(raw, isValidPodcastPreset)
      ),
      loadJsonFile(await dataFiles.recordingHistory()).then(async raw => {
        const fromJson = safeParseJSON(raw, isValidRecordingFile);
        if (fromJson.length > 0) return fromJson.sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt)
        );
        // Fallback: scan recordings directory
        const scanned = await scanRecordingFiles();
        return scanned.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }),
      scanWritingFiles(),
    ]);

  return {
    vocabulary,
    checkin: checkin.sort((a, b) => b.date.localeCompare(a.date)),
    dictation,
    podcastFeeds,
    recordingHistory,
    writingFiles,
    player: { source: null },
  };
}

// --- Scanning functions ---
async function scanRecordingFiles(): Promise<RecordingFile[]> {
  const dir = await dataPaths.recordings();
  const entries = await readDirSafe(dir);
  const files: RecordingFile[] = [];
  for (const e of entries) {
    if (e.name?.endsWith(".webm")) {
      files.push({
        name: e.name,
        path: `${dir}/${e.name}`,
        duration: 0,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return files;
}

async function scanWritingFiles(): Promise<WritingFileInfo[]> {
  const dir = await dataPaths.writing();
  const entries = await readDirSafe(dir);
  const files: WritingFileInfo[] = [];
  for (const e of entries) {
    if (e.name?.endsWith(".txt")) {
      files.push({
        name: e.name.replace(/\.txt$/, ""),
        path: `${dir}/${e.name}`,
        updatedAt: "",
      });
    }
  }
  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

async function readDirSafe(dir: string): Promise<{ name: string }[]> {
  try {
    return await readDir(dir);
  } catch {
    return [];
  }
}

// --- Save individual domains ---
export async function saveVocabulary(words: VocabularyWord[]): Promise<void> {
  await ensureDataDirs();
  const path = await dataFiles.vocabulary();
  await writeFile(path, new TextEncoder().encode(JSON.stringify(words, null, 2)));
}

export async function saveCheckin(records: CheckInRecord[]): Promise<void> {
  await ensureDataDirs();
  const path = await dataFiles.checkin();
  await writeFile(path, new TextEncoder().encode(JSON.stringify(records, null, 2)));
}

export async function saveDictation(sessions: DictationSession[]): Promise<void> {
  await ensureDataDirs();
  const path = await dataFiles.dictation();
  await writeFile(path, new TextEncoder().encode(JSON.stringify(sessions, null, 2)));
}

export async function savePodcastFeeds(feeds: PodcastPreset[]): Promise<void> {
  await ensureDataDirs();
  const path = await dataFiles.podcastFeeds();
  await writeFile(path, new TextEncoder().encode(JSON.stringify(feeds, null, 2)));
}

export async function saveRecordingHistory(history: RecordingFile[]): Promise<void> {
  await ensureDataDirs();
  const path = await dataFiles.recordingHistory();
  await writeFile(path, new TextEncoder().encode(JSON.stringify(history, null, 2)));
}

// --- Centralized save ---
export async function saveAllData(data: AppData): Promise<void> {
  await ensureDataDirs();
  await Promise.all([
    saveVocabulary(data.vocabulary),
    saveCheckin(data.checkin),
    saveDictation(data.dictation),
    savePodcastFeeds(data.podcastFeeds),
    saveRecordingHistory(data.recordingHistory),
  ]);
}
