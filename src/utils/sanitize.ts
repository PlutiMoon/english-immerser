export function sanitizeFilename(title: string): string {
  return title.replace(/[<>:"/\\|?*]/g, "").trim() || "未命名";
}
