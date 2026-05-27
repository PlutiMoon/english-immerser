import { describe, it, expect } from "vitest";
import { dailyPromptForSlot, randomPromptForSlot, randomPrompt, PROMPT_CATEGORIES } from "../src/utils/writingPrompts";

describe("PROMPT_CATEGORIES", () => {
  it("has 3 slots", () => {
    expect(PROMPT_CATEGORIES).toHaveLength(3);
  });

  it("has at least 60 total prompts", () => {
    const total = PROMPT_CATEGORIES.reduce((s, c) => s + c.prompts.length, 0);
    expect(total).toBeGreaterThanOrEqual(60);
  });

  it("every prompt is a non-empty string", () => {
    for (const cat of PROMPT_CATEGORIES) {
      expect(cat.name.length).toBeGreaterThan(0);
      for (const p of cat.prompts) {
        expect(p.length).toBeGreaterThan(10);
      }
    }
  });

  it("has no duplicate prompts across slots", () => {
    const all: string[] = [];
    for (const cat of PROMPT_CATEGORIES) {
      all.push(...cat.prompts);
    }
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("dailyPromptForSlot", () => {
  it("returns a valid prompt for each slot", () => {
    for (const slot of [0, 1, 2] as const) {
      const p = dailyPromptForSlot(slot);
      expect(p.length).toBeGreaterThan(10);
    }
  });

  it("is deterministic for the same date and slot", () => {
    expect(dailyPromptForSlot(0, "2026-06-15")).toBe(dailyPromptForSlot(0, "2026-06-15"));
    expect(dailyPromptForSlot(1, "2026-06-15")).toBe(dailyPromptForSlot(1, "2026-06-15"));
    expect(dailyPromptForSlot(2, "2026-06-15")).toBe(dailyPromptForSlot(2, "2026-06-15"));
  });

  it("different slots return different prompts for the same date", () => {
    const a = dailyPromptForSlot(0, "2026-06-15");
    const b = dailyPromptForSlot(1, "2026-06-15");
    const c = dailyPromptForSlot(2, "2026-06-15");
    // All three should differ (prime offsets ensure this with high probability)
    const unique = new Set([a, b, c]);
    expect(unique.size).toBe(3);
  });

  it("returns a prompt from the correct slot pool", () => {
    for (const slot of [0, 1, 2] as const) {
      const p = dailyPromptForSlot(slot, "2026-03-15");
      expect(PROMPT_CATEGORIES[slot].prompts).toContain(p);
    }
  });
});

describe("randomPromptForSlot", () => {
  it("returns a valid prompt for each slot", () => {
    for (const slot of [0, 1, 2] as const) {
      const p = randomPromptForSlot(slot);
      expect(p.length).toBeGreaterThan(10);
    }
  });

  it("returns a prompt from the correct slot pool", () => {
    for (const slot of [0, 1, 2] as const) {
      for (let i = 0; i < 10; i++) {
        expect(PROMPT_CATEGORIES[slot].prompts).toContain(randomPromptForSlot(slot));
      }
    }
  });
});

describe("randomPrompt", () => {
  it("returns a valid prompt", () => {
    const p = randomPrompt();
    expect(p.length).toBeGreaterThan(10);
  });

  it("returns a prompt from the full library", () => {
    const allPrompts = PROMPT_CATEGORIES.flatMap((c) => c.prompts);
    for (let i = 0; i < 20; i++) {
      expect(allPrompts).toContain(randomPrompt());
    }
  });
});
