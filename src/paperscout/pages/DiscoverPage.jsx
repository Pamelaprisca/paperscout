import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { searchPapers } from "../api/papers.js";
import { PaperCard } from "../components/PaperCard.jsx";
import { PageHeader, Pill, Surface } from "../components/ui.jsx";

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
  const [query, setQuery] = useState(
    () => searchParams.get("q")?.trim() || "LLM agent memory",
  );
  const [results, setResults] = useState(demoResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextQuery = searchParams.get("q")?.trim();
    if (!nextQuery) return undefined;

    let cancelled = false;
    setQuery(nextQuery);
    setLoading(true);
    setError("");

    searchPapers({ query: nextQuery })
      .then((data) => {
        if (!cancelled) setResults(data.papers ?? []);
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

  async function handleSearch(event) {
    event.preventDefault();

    const nextQuery = query.trim();
    if (!nextQuery || loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await searchPapers({ query: nextQuery });
      setResults(data.papers ?? []);
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill tone="teal">LLM agent</Pill>
          <Pill>memory</Pill>
          <Pill>retrieval</Pill>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            更多筛选
          </button>
        </div>
      </Surface>

      {error ? (
        <div
          className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">
          找到 <span className="text-slate-950">{results.length}</span> 篇相关论文
        </p>
        <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <Filter size={14} aria-hidden="true" />
          按相关度排序
        </div>
      </div>

      <section className="space-y-3">
        {results.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </section>
    </div>
  );
}
