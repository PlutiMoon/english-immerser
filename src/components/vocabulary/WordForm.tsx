import { useState, useEffect, useRef } from "react";
import type { VocabularyWord } from "@/types";
import { useDictionary } from "@/hooks/useDictionary";

interface WordFormData {
  word: string;
  englishDefinition: string;
  selfSentence: string;
  source: string;
}

interface WordFormProps {
  initial: VocabularyWord | null;
  allSources: string[];
  onSave: (data: WordFormData) => void;
  onCancel: () => void;
}

export default function WordForm({
  initial,
  allSources,
  onSave,
  onCancel,
}: WordFormProps) {
  const [word, setWord] = useState(initial?.word ?? "");
  const [englishDefinition, setEnglishDefinition] = useState(
    initial?.englishDefinition ?? "",
  );
  const [selfSentence, setSelfSentence] = useState(
    initial?.selfSentence ?? "",
  );
  const [source, setSource] = useState(initial?.source ?? "");
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);

  const { data: dictData, loading: dictLoading, error: dictError, lookup } =
    useDictionary();

  const wordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    wordRef.current?.focus();
  }, []);

  // Reset form when editing a different word
  useEffect(() => {
    setWord(initial?.word ?? "");
    setEnglishDefinition(initial?.englishDefinition ?? "");
    setSelfSentence(initial?.selfSentence ?? "");
    setSource(initial?.source ?? "");
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !englishDefinition.trim()) return;
    onSave({
      word: word.trim(),
      englishDefinition: englishDefinition.trim(),
      selfSentence: selfSentence.trim(),
      source: source.trim(),
    });
  };

  const handleLookup = () => {
    if (!word.trim()) return;
    lookup(word.trim());
  };

  const handleFillFromDict = () => {
    if (!dictData) return;
    if (!englishDefinition && dictData.definition)
      setEnglishDefinition(dictData.definition);
    if (!selfSentence && dictData.example) setSelfSentence(dictData.example);
  };

  const filteredSources = allSources.filter(
    (s) =>
      s.toLowerCase().includes(source.toLowerCase()) && s !== source,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        className="rounded-xl bg-white shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initial ? "编辑生词" : "添加生词"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              单词 *
            </label>
            <div className="flex gap-1.5">
              <input
                ref={wordRef}
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
                placeholder="e.g. serendipity"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={dictLoading || word.trim().length < 2}
                className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dictLoading ? "..." : "查词典"}
              </button>
            </div>
          </div>

          {/* Dictionary result */}
          {dictData && (
            <div
              onClick={handleFillFromDict}
              className="rounded-lg bg-primary-50/50 border border-primary-100 p-3 cursor-pointer hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary-700">
                  {dictData.word}
                </p>
                {dictData.phonetic && (
                  <p className="text-xs text-primary-400">{dictData.phonetic}</p>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {dictData.definition}
              </p>
              {dictData.example && (
                <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">
                  "{dictData.example}"
                </p>
              )}
              <p className="text-xs text-primary-400 mt-1.5">
                点击填入表单 →
              </p>
            </div>
          )}

          {dictError && (
            <p className="text-xs text-red-400">{dictError}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              英文释义 *
            </label>
            <textarea
              value={englishDefinition}
              onChange={(e) => setEnglishDefinition(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 resize-none"
              rows={2}
              placeholder="Explain the word in simple English"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              自造句子
            </label>
            <textarea
              value={selfSentence}
              onChange={(e) => setSelfSentence(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 resize-none"
              rows={2}
              placeholder="Write your own sentence using this word"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              来源（可选）
            </label>
            <input
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setShowSourceSuggestions(true);
              }}
              onFocus={() => setShowSourceSuggestions(true)}
              onBlur={() =>
                setTimeout(() => setShowSourceSuggestions(false), 150)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
              placeholder="e.g. BBC 6 Minute English"
            />
            {showSourceSuggestions &&
              source &&
              filteredSources.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow mt-0.5 z-10">
                  {filteredSources.slice(0, 5).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSource(s);
                        setShowSourceSuggestions(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!word.trim() || !englishDefinition.trim()}
              className="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500 hover:bg-gray-200"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
