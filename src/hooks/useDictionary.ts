import { useState, useCallback } from "react";

interface DictEntry {
  word: string;
  phonetic: string;
  definition: string;
  example: string;
}

// Module-level cache so results persist across components
const cache = new Map<string, DictEntry | null>();

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

export function useDictionary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DictEntry | null>(null);

  const lookup = useCallback(async (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return;

    // Check cache
    const cached = cache.get(trimmed);
    if (cached !== undefined) {
      setData(cached);
      setError(cached ? null : "未找到释义");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        cache.set(trimmed, null);
        setError("未找到释义");
        setLoading(false);
        return;
      }
      const json = await res.json();
      const entry = json?.[0];
      if (!entry) {
        cache.set(trimmed, null);
        setError("未找到释义");
        setLoading(false);
        return;
      }

      const phonetic =
        entry.phonetic ||
        entry.phonetics?.find((p: { text?: string }) => p.text)?.text ||
        "";

      let definition = "";
      let example = "";
      if (entry.meanings?.length > 0) {
        for (const m of entry.meanings) {
          for (const d of m.definitions ?? []) {
            if (!definition && d.definition) definition = d.definition;
            if (!example && d.example) example = d.example;
            if (definition && example) break;
          }
          if (definition && example) break;
        }
      }

      const result: DictEntry = {
        word: entry.word || trimmed,
        phonetic,
        definition,
        example,
      };

      cache.set(trimmed, result);
      setData(result);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, lookup };
}
