import { describe, it, expect } from "vitest";
import { parseJsonArrayContent } from "../src/utils/jsonStorageCore";

interface Item {
  id: string;
}

const fallback: Item[] = [{ id: "fallback" }];

function isItem(value: unknown): value is Item {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  );
}

function parse(raw: string | null) {
  return parseJsonArrayContent(raw, {
    defaultValue: fallback,
    validator: isItem,
  });
}

describe("parseJsonArrayContent", () => {
  it("returns defaultValue for null input", () => {
    expect(parse(null)).toEqual({
      data: fallback,
      recovered: false,
      reason: "missing",
      invalidCount: 0,
    });
  });

  it("returns defaultValue on parse error", () => {
    expect(parse("{bad json")).toEqual({
      data: fallback,
      recovered: true,
      reason: "parse-error",
      invalidCount: 0,
    });
  });

  it("returns defaultValue for non-array JSON", () => {
    expect(parse('{"id":"not-array"}')).toEqual({
      data: fallback,
      recovered: true,
      reason: "invalid-shape",
      invalidCount: 0,
    });
  });

  it("filters invalid items from a mixed array", () => {
    expect(parse('[{"id":"ok"},{"bad":true},{"id":"also-ok"}]')).toEqual({
      data: [{ id: "ok" }, { id: "also-ok" }],
      recovered: true,
      reason: "invalid-shape",
      invalidCount: 1,
    });
  });

  it("returns data as-is when all items valid", () => {
    expect(parse('[{"id":"ok"}]')).toEqual({
      data: [{ id: "ok" }],
      recovered: false,
      reason: null,
      invalidCount: 0,
    });
  });

  it("handles empty array", () => {
    expect(parse("[]")).toEqual({
      data: [],
      recovered: false,
      reason: null,
      invalidCount: 0,
    });
  });

  it("returns empty data when all items invalid", () => {
    expect(parse('[{"bad":1},{"bad":2}]')).toEqual({
      data: [],
      recovered: true,
      reason: "invalid-shape",
      invalidCount: 2,
    });
  });

  it("uses [] as default when no defaultValue provided", () => {
    const result = parseJsonArrayContent(null, { validator: isItem });
    expect(result).toEqual({
      data: [],
      recovered: false,
      reason: "missing",
      invalidCount: 0,
    });
  });

  it("passes valid items through validator", () => {
    const result = parseJsonArrayContent('[{"id":"2024-01-01"},{"id":"2024-06-15"}]', { validator: isItem });
    expect(result).toEqual({
      data: [{ id: "2024-01-01" }, { id: "2024-06-15" }],
      recovered: false,
      reason: null,
      invalidCount: 0,
    });
  });
});
