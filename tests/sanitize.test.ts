import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../src/utils/sanitize";

describe("sanitizeFilename", () => {
  it("returns the title unchanged when clean", () => {
    expect(sanitizeFilename("My Essay")).toBe("My Essay");
  });

  it("removes Windows-invalid characters", () => {
    expect(sanitizeFilename('<>:"/\\|?*')).toBe("未命名");
  });

  it("removes invalid chars but keeps valid ones", () => {
    expect(sanitizeFilename("test:file?.txt")).toBe("testfile.txt");
  });

  it('returns "未命名" when all chars are invalid', () => {
    expect(sanitizeFilename("<>:")).toBe("未命名");
  });

  it('returns "未命名" for empty string', () => {
    expect(sanitizeFilename("")).toBe("未命名");
  });

  it('returns "未命名" for whitespace-only', () => {
    expect(sanitizeFilename("   ")).toBe("未命名");
  });

  it("neutralizes path traversal via ../", () => {
    // slashes are stripped, so "../" becomes ".."
    expect(sanitizeFilename("../../../etc/passwd")).toBe("......etcpasswd");
  });

  it("preserves Unicode characters", () => {
    expect(sanitizeFilename("我的文章")).toBe("我的文章");
  });
});
