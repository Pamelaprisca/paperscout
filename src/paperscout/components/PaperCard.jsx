import { BookOpen, BookmarkCheck, ExternalLink, Quote, Save } from "lucide-react";
import { memo, useState } from "react";
import { Link } from "react-router";

import { cn } from "../lib/cn.js";
import {
  isPaperSelected,
  toggleSelectedPaper,
} from "../lib/selectedPapers.js";
import { useToast } from "./Toast.jsx";
import { Pill, Surface } from "./ui.jsx";

function PaperCardComponent({
  paper,
  compact = false,
  onSelectionChange,
}) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState(() => isPaperSelected(paper.id));

  function handleSave() {
    const nextSelected = toggleSelectedPaper(paper);
    setSelected(nextSelected);
    onSelectionChange?.(paper, nextSelected);
    showToast(nextSelected ? "论文已加入文献集合" : "论文已从集合移除");
  }

  return (
    <Surface className={cn("p-4", compact && "h-full overflow-hidden shadow-none")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Pill tone="teal">{paper.year}</Pill>
            <Pill>{paper.venue}</Pill>
            {paper.openAccess ? <Pill tone="amber">Open access</Pill> : null}
          </div>
          <h2 className="text-base font-bold leading-6 text-slate-950">
            <Link
              to={`/papers/${encodeURIComponent(paper.id)}`}
              className="decoration-teal-700 decoration-2 underline-offset-4 hover:underline"
            >
              {paper.title}
            </Link>
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {paper.abstract}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          aria-pressed={selected}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-md border transition",
            selected
              ? "border-teal-300 bg-teal-50 text-teal-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700",
          )}
          aria-label={selected ? "取消保存论文" : "保存论文"}
        >
          {selected ? (
            <BookmarkCheck size={16} aria-hidden="true" />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen size={14} aria-hidden="true" />
          {paper.authors.join(", ")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Quote size={14} aria-hidden="true" />
          {paper.citationCount} citations
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-teal-700">
          DOI
          <ExternalLink size={13} aria-hidden="true" />
        </span>
      </div>
    </Surface>
  );
}

export const PaperCard = memo(PaperCardComponent);
