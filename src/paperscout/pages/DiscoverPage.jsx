import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { searchPapers } from "../api/papers.js";
import { VirtualPaperList } from "../components/VirtualPaperList.jsx";
import { PageHeader, Surface } from "../components/ui.jsx";
import {
  getSearchSession,
  saveSearchSession,
} from "../lib/searchSession.js";

const demoResults = [
  {
    id: "agent-memory-survey",
    title: "A Survey on Memory Mechanisms for Language Agents",
    abstract:
      "This survey organizes agent memory into working, episodic, semantic and procedural layers, and compares retrieval strategies across recent systems.",
    authors: ["Chen, L.", "Park, J.", "Zhang, R."],
    year: 2024,
    venue: "arXiv",
    citationCount: 184,
    openAccess: true,
  },
  {
    id: "retrieval-augmented-agents",
    title: "Retrieval-Augmented Language Agents for Long-Horizon Tasks",
    abstract:
      "The paper studies how retrieval quality and memory summarization affect planning performance in long-horizon language agent tasks.",
    authors: ["Sato, K.", "Li, M."],
    year: 2025,
    venue: "NeurIPS",
    citationCount: 67,
    openAccess: false,
  },
  {
    id: "rag-evaluation",
    title: "Evaluating Retrieval-Augmented Generation for Scientific Question Answering",
    abstract:
      "A benchmark and evaluation protocol for retrieval quality, answer faithfulness and citation precision in scientific QA systems.",
    authors: ["Miller, A.", "Wang, H."],
    year: 2025,
    venue: "ACL Findings",
    citationCount: 42,
    openAccess: true,
  },
];

export default function DiscoverPage() {
  const [searchParams] = useSearchParams();
  const savedSession = getSearchSession();
  const urlQuery = searchParams.get("q")?.trim();
  const [query, setQuery] = useState(
    () => urlQuery || savedSession?.query || "LLM agent memory",
  );
  const [results, setResults] = useState(
    () =>
      savedSession?.results?.length
        ? savedSession.results
        : demoResults,
  );
  const [source, setSource] = useState(savedSession?.source || "demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");

  const visibleResults = useMemo(() => {
    const minimumYear = yearFrom ? Number(yearFrom) : null;
    const filtered = results.filter((paper) => {
      const matchesYear = minimumYear ? (paper.year ?? 0) >= minimumYear : true;
      const matchesAccess = openAccessOnly ? paper.openAccess === true : true;
      return matchesYear && matchesAccess;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "citations") {
        return (b.citationCount ?? 0) - (a.citationCount ?? 0);
      }

      if (sortBy === "year") {
        return (b.year ?? 0) - (a.year ?? 0);
      }

      return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
    });
  }, [openAccessOnly, results, sortBy, yearFrom]);

  useEffect(() => {
    const nextQuery = searchParams.get("q")?.trim();
    if (!nextQuery) return undefined;

    let cancelled = false;
    setQuery(nextQuery);
    setLoading(true);
    setError("");

    searchPapers({ query: nextQuery })
      .then((data) => {
        if (!cancelled) {
          const nextResults = data.papers ?? [];
          setResults(nextResults);
          setSource(data.source ?? "unknown");
          saveSearchSession({
            query: nextQuery,
            source: data.source ?? "unknown",
            results: nextResults,
          });
        }
      })
      .catch((searchError) => {
        if (!cancelled) setError(searchError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function runSearch(nextQuery) {
    if (!nextQuery || loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await searchPapers({ query: nextQuery });
      const nextResults = data.papers ?? [];
      setResults(nextResults);
      setSource(data.source ?? "unknown");
      saveSearchSession({
        query: nextQuery,
        source: data.source ?? "unknown",
        results: nextResults,
      });
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    runSearch(query.trim());
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Discover"
        title="检索候选论文"
        description="先把自然语言研究问题放到这里。下一阶段会接入 Semantic Scholar API，并完成去重、排序和保存。"
      />

      <Surface className="p-4 sm:p-5">
        <form
          className="flex flex-col gap-3 lg:flex-row"
          onSubmit={handleSearch}
        >
          <label className="flex min-h-11 flex-1 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
            <Search size={17} className="text-slate-400" aria-hidden="true" />
            <span className="sr-only">研究问题</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="例如：LLM agent memory 有哪些代表论文？"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Search size={16} aria-hidden="true" />
            {loading ? "检索中..." : "检索论文"}
          </button>
        </form>

        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <label className="text-xs font-bold text-slate-600">
            起始年份
            <select
              value={yearFrom}
              onChange={(event) => setYearFrom(event.target.value)}
              className="mt-1.5 min-h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-800"
            >
              <option value="">全部年份</option>
              <option value="2024">2024 年及以后</option>
              <option value="2022">2022 年及以后</option>
              <option value="2020">2020 年及以后</option>
            </select>
          </label>

          <label className="text-xs font-bold text-slate-600">
            排序方式
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="mt-1.5 min-h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-800"
            >
              <option value="relevance">相关度优先</option>
              <option value="citations">引用量优先</option>
              <option value="year">最新论文优先</option>
            </select>
          </label>

          <label className="flex min-h-9 items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={openAccessOnly}
              onChange={(event) => setOpenAccessOnly(event.target.checked)}
              className="size-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            只看开放获取
          </label>
        </div>
      </Surface>

      {error ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => runSearch(query.trim())}
            disabled={loading}
            className="ml-auto rounded border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            重试
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">
          找到 <span className="text-slate-950">{results.length}</span> 篇相关论文
          {visibleResults.length !== results.length ? (
            <span className="ml-2 font-normal text-slate-500">
              当前显示 {visibleResults.length} 篇
            </span>
          ) : null}
          {source !== "demo" ? (
            <span className="ml-2 font-normal text-slate-500">
              来源：{source}
            </span>
          ) : null}
        </p>
      </div>

      <VirtualPaperList papers={visibleResults} />
    </div>
  );
}
