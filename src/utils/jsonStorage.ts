import { copyFile, exists, readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import { ensureDataDirs } from "./dataPath";
import {
  parseJsonArrayContent,
  type JsonRecoveryReason,
  type ParseJsonArrayOptions,
} from "./jsonStorageCore";

export interface JsonLoadResult<T> {
  data: T[];
  recovered: boolean;
  reason: JsonRecoveryReason | null;
  invalidCount: number;
  backupPath: string | null;
}

type LoadJsonArrayOptions<T> = ParseJsonArrayOptions<T>;

const jsonIndent = 2;

export async function loadJsonArray<T>(
  path: string,
  options: LoadJsonArrayOptions<T>,
): Promise<JsonLoadResult<T>> {
  await ensureDataDirs();

  if (!(await exists(path))) {
    const result = parseJsonArrayContent(null, options);
    return {
      ...result,
      backupPath: null,
    };
  }

  const raw = await readTextFile(path);
  const result = parseJsonArrayContent(raw, options);

  if (result.reason === "parse-error") {
    const backupPath = await moveCorruptFile(path);
    await writeJsonArray(path, result.data, { backupExisting: false });
    return {
      ...result,
      backupPath,
    };
  }

  if (result.reason === "invalid-shape" && result.invalidCount === 0) {
    const backupPath = await moveCorruptFile(path);
    await writeJsonArray(path, result.data, { backupExisting: false });
    return {
      ...result,
      backupPath,
    };
  }

  if (result.invalidCount > 0) {
    const backupPath = await backupExistingFile(path);
    await writeJsonArray(path, result.data, { backupExisting: false });
    return {
      ...result,
      backupPath,
    };
  }

  return {
    ...result,
    backupPath: null,
  };
}

export async function writeJsonArray<T>(
  path: string,
  data: T[],
  options: { backupExisting?: boolean } = {},
): Promise<void> {
  await ensureDataDirs();
  if (options.backupExisting !== false && await exists(path)) {
    await copyFile(path, `${path}.bak`);
  }
  await writeTextFile(path, JSON.stringify(data, null, jsonIndent));
}

async function moveCorruptFile(path: string): Promise<string | null> {
  if (!(await exists(path))) return null;
  const backupPath = `${path}.corrupt-${timestampForFilename()}.bak`;
  await rename(path, backupPath);
  return backupPath;
}

async function backupExistingFile(path: string): Promise<string | null> {
  if (!(await exists(path))) return null;
  const backupPath = `${path}.bak`;
  await copyFile(path, backupPath);
  return backupPath;
}

function timestampForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
