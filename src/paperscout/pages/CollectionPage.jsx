import {
  CheckSquare,
  GitCompareArrows,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PaperCard } from "../components/PaperCard.jsx";
import { useToast } from "../components/Toast.jsx";
import { ActionButton, EmptyState, PageHeader, Pill, Surface } from "../components/ui.jsx";
import {
  getSelectedPapers,
  removeSelectedPapers,
} from "../lib/selectedPapers.js";

export default function CollectionPage() {
  const { showToast } = useToast();
  const [papers, setPapers] = useState(() => getSelectedPapers());
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedIds, setSelectedIds] = useState([]);

  const visiblePapers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? papers.filter((paper) =>
          [
            paper.title,
            paper.abstract,
            paper.venue,
            ...(paper.authors ?? []),
            ...(paper.tags ?? []),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : papers;

    return [...filtered].sort((a, b) => {
      if (sortBy === "citations") {
        return (b.citationCount ?? 0) - (a.citationCount ?? 0);
      }

      if (sortBy === "year") {
        return (b.year ?? 0) - (a.year ?? 0);
      }

      return String(a.title).localeCompare(String(b.title));
    });
  }, [papers, query, sortBy]);

  function toggleSelection(paperId) {
    setSelectedIds((current) =>
      current.includes(paperId)
        ? current.filter((id) => id !== paperId)
        : [...current, paperId],
    );
  }

  function handlePaperSelectionChange(paper, selected) {
    if (!selected) {
      setPapers((current) => current.filter((item) => item.id !== paper.id));
      setSelectedIds((current) => current.filter((id) => id !== paper.id));
    }
  }

  function deleteSelected() {
    if (selectedIds.length === 0) return;
    const next = removeSelectedPapers(selectedIds);
    setPapers(next);
    setSelectedIds([]);
    showToast(`已移除 ${selectedIds.length} 篇论文`);
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Saved papers"
        title="文献集合"
        description="这里读取你从检索结果中收藏的真实论文，可以搜索、排序、多选、删除和发起比较。"
        actions={
          <>
            <ActionButton to="/discover" icon={<Plus size={16} />}>
              添加论文
            </ActionButton>
            <ActionButton
              to="/agent"
              variant="secondary"
              icon={<GitCompareArrows size={16} />}
            >
              去 Agent 比较
            </ActionButton>
          </>
        }
      />

      <Surface className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <label className="flex min-h-10 flex-1 items-center rounded-md border border-slate-300 bg-white px-3">
          <span className="sr-only">搜索收藏论文</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="搜索标题、摘要、作者或标签"
          />
        </label>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
          aria-label="排序方式"
        >
          <option value="recent">按标题排序</option>
          <option value="citations">按引用量排序</option>
          <option value="year">按年份排序</option>
        </select>

        <button
          type="button"
          onClick={deleteSelected}
          disabled={selectedIds.length === 0}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <Trash2 size={16} aria-hidden="true" />
          删除选中（{selectedIds.length}）
        </button>
      </Surface>

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="teal">{papers.length} papers</Pill>
        <Pill>{visiblePapers.length} visible</Pill>
      </div>

      {visiblePapers.length === 0 ? (
        <EmptyState
          title={papers.length === 0 ? "还没有收藏论文" : "没有匹配结果"}
          description={
            papers.length === 0
              ? "先去检索页搜索论文，并点击卡片右侧的收藏按钮。"
              : "换一个关键词，或者清空搜索条件。"
          }
          action={
            papers.length === 0 ? (
              <ActionButton to="/discover" icon={<Plus size={16} />}>
                去检索论文
              </ActionButton>
            ) : null
          }
        />
      ) : (
        <section className="space-y-3">
          {visiblePapers.map((paper) => {
            const selected = selectedIds.includes(paper.id);

            return (
              <div
                key={paper.id}
                className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-2"
              >
                <button
                  type="button"
                  onClick={() => toggleSelection(paper.id)}
                  className="mt-4 grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
                  aria-label={selected ? "取消选择论文" : "选择论文"}
                  aria-pressed={selected}
                >
                  {selected ? (
                    <CheckSquare size={17} aria-hidden="true" />
                  ) : (
                    <Square size={17} aria-hidden="true" />
                  )}
                </button>
                <PaperCard
                  paper={paper}
                  onSelectionChange={handlePaperSelectionChange}
                />
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
