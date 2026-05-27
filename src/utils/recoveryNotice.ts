import type { JsonRecoveryNotice } from "@/types";

export function formatJsonRecoveryNotice(recovery: JsonRecoveryNotice): string {
  const detail = recovery.backupPath
    ? `已备份到 ${recovery.backupPath}`
    : `已跳过 ${recovery.invalidCount} 条异常记录`;
  return `${recovery.label}数据已自动恢复，${detail}`;
}
