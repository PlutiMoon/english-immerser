import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("UI shell smoke checks", () => {
  const scenes = ["hub", "player", "vocabulary", "writing", "recording", "dictation", "tools"];

  it("keeps every scene registered in the app shell and sidebar", () => {
    const app = read("src/App.tsx");
    const sidebar = read("src/components/layout/Sidebar.tsx");

    for (const scene of scenes) {
      expect(app).toContain(`${scene}:`);
      expect(sidebar).toContain(`scene: "${scene}"`);
    }
  });

  it("keeps the Apple-style shell and reusable surface classes wired", () => {
    const app = read("src/App.tsx");
    const sidebar = read("src/components/layout/Sidebar.tsx");
    const css = read("src/app.css");

    expect(app).toContain("app-shell");
    expect(app).toContain("app-main");
    expect(sidebar).toContain("sidebar");
    expect(css).toContain(".surface-card");
    expect(css).toContain(".surface-panel");
    expect(css).toContain(".button-glass");
  });
});
