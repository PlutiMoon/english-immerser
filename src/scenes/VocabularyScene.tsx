import { useState, useMemo } from "react";
import type { SceneProps } from "@/App";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import WordCard from "@/components/vocabulary/WordCard";
import WordForm from "@/components/vocabulary/WordForm";
import ReviewPanel from "@/components/vocabulary/ReviewPanel";
import { openFolder } from "@/utils/openFolder";
import { dataPaths, ensureDataDirs } from "@/utils/dataPath";
import type { VocabularyWord } from "@/types";

type SortMode = "newest" | "lastReviewed" | "reviewCount";

export default function VocabularyScene({ data, setData }: SceneProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const words = data.vocabulary;

  const allSources = useMemo(
    () => [...new Set(words.map(w => w.source).filter(Boolean))],
    [words],
  );

  const filteredWords = useMemo(() => {
    let list = [...words];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.englishDefinition.toLowerCase().includes(q) ||
        w.source.toLowerCase().includes(q),
      );
    }
    if (sourceFilter) list = list.filter(w => w.source === sourceFilter);
    switch (sortBy) {
      case "newest":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "lastReviewed":
        list.sort((a, b) => {
          if (!a.lastReviewedAt && !b.lastReviewedAt) return 0;
          if (!a.lastReviewedAt) return 1;
          if (!b.lastReviewedAt) return -1;
          return new Date(b.lastReviewedAt).getTime() - new Date(a.lastReviewedAt).getTime();
        });
        break;
      case "reviewCount":
        list.sort((a, b) => a.reviewCount - b.reviewCount);
        break;
    }
    return list;
  }, [words, searchQuery, sourceFilter, sortBy]);

  const stats = useMemo(() => ({
    total: words.length,
    reviewed: words.filter(w => w.reviewCount > 0).length,
    sources: allSources.length,
  }), [words, allSources]);

  const addWord = (input: Parameters<typeof handleSave>[0]) => {
    const word: VocabularyWord = {
      id: crypto.randomUUID(), ...input,
      createdAt: new Date().toISOString(), lastReviewedAt: null, reviewCount: 0,
    };
    setData({ vocabulary: [...data.vocabulary, word] });
  };

  const updateWord = (id: string, updates: Partial<VocabularyWord>) => {
    setData({ vocabulary: data.vocabulary.map(w => w.id === id ? { ...w, ...updates } : w) });
  };

  const deleteWord = (id: string) => {
    setData({ vocabulary: data.vocabulary.filter(w => w.id !== id) });
  };

  const handleSave = (input: { word: string; englishDefinition: string; selfSentence: string; source: string }) => {
    if (editingWord) {
      updateWord(editingWord.id, input);
    } else {
      addWord(input);
    }
    setShowForm(false);
    setEditingWord(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="语境习词本" subtitle="生词卡片（单词、英文释义、发音、自造句子），复习优先展示自造句子" />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="生词总数" value={String(stats.total)} />
        <StatCard label="已复习" value={String(stats.reviewed)} />
        <StatCard label="来源数" value={String(stats.sources)} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索单词或来源..."
            className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">🔍</span>
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-primary-400">
          <option value="">全部来源</option>
          {allSources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortMode)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-primary-400">
          <option value="newest">最新添加</option>
          <option value="lastReviewed">最近复习</option>
          <option value="reviewCount">复习次数</option>
        </select>
        <button onClick={() => { setEditingWord(null); setShowForm(true); }}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          + 添加生词
        </button>
        <button onClick={() => setReviewing(true)} disabled={words.length === 0}
          className="rounded-lg bg-warm-50 border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-100 disabled:opacity-40">
          进入复习
        </button>
        <button onClick={async () => { await ensureDataDirs(); await openFolder(await dataPaths.root()); }}
          className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-100"
          title="打开数据文件夹">打开数据目录</button>
      </div>

      {reviewing ? (
        <ReviewPanel words={words} onClose={() => setReviewing(false)}
          onMarkReviewed={(id) => {
            const word = words.find(w => w.id === id);
            if (word) {
              updateWord(id, { lastReviewedAt: new Date().toISOString(), reviewCount: word.reviewCount + 1 });
            }
          }} />
      ) : filteredWords.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-12 text-center">
          {words.length === 0 ? (
            <>
              <p className="text-gray-400">还没有生词，从听力或阅读中遇到不认识的单词就来添加吧</p>
              <button onClick={() => { setEditingWord(null); setShowForm(true); }}
                className="mt-4 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600">
                + 添加第一个生词
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-400">未找到匹配的生词</p>
              <button onClick={() => { setSearchQuery(""); setSourceFilter(""); }}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">清除筛选</button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredWords.map(w => (
            <WordCard key={w.id} word={w}
              onEdit={() => { setEditingWord(w); setShowForm(true); }}
              onDelete={() => deleteWord(w.id)} />
          ))}
        </div>
      )}

      {showForm && (
        <WordForm initial={editingWord} allSources={allSources}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingWord(null); }} />
      )}
    </div>
  );
}
