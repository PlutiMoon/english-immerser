export type JsonRecoveryReason = "missing" | "parse-error" | "invalid-shape";

export interface JsonParseResult<T> {
  data: T[];
  recovered: boolean;
  reason: JsonRecoveryReason | null;
  invalidCount: number;
}

export interface ParseJsonArrayOptions<T> {
  defaultValue?: T[];
  validator: (obj: unknown) => obj is T;
}

export function parseJsonArrayContent<T>(
  raw: string | null,
  options: ParseJsonArrayOptions<T>,
): JsonParseResult<T> {
  const defaultValue = options.defaultValue ?? [];
  if (raw === null) {
    return {
      data: [...defaultValue],
      recovered: false,
      reason: "missing",
      invalidCount: 0,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      data: [...defaultValue],
      recovered: true,
      reason: "parse-error",
      invalidCount: 0,
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      data: [...defaultValue],
      recovered: true,
      reason: "invalid-shape",
      invalidCount: 0,
    };
  }

  const data = parsed.filter(options.validator);
  if (data.length !== parsed.length) {
    return {
      data,
      recovered: true,
      reason: "invalid-shape",
      invalidCount: parsed.length - data.length,
    };
  }

  return {
    data,
    recovered: false,
    reason: null,
    invalidCount: 0,
  };
}
