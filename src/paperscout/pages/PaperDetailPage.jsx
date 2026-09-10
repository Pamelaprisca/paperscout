import { ArrowLeft, BookOpen, FileDown, Quote, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getPaper } from "../api/papers.js";
import { ActionButton, PageHeader, Pill, Surface } from "../components/ui.jsx";

const fallbackPaper = {
  id: "agent-memory-survey",
  title: "A Survey on Memory Mechanisms for Language Agents",
  authors: ["Chen, L.", "Park, J.", "Zhang, R."],
  year: 2024,
  venue: "arXiv",
  citationCount: 184,
  doi: "10.48550/arXiv.2402.00000",
  openAccess: true,
  abstract:
    "This survey organizes agent memory into working, episodic, semantic and procedural layers. It compares recent retrieval, summarization and forgetting strategies, then discusses evaluation gaps for long-horizon agent tasks.",
};

export default function PaperDetailPage() {
  const { paperId } = useParams();
  const [paper, setPaper] = useState(fallbackPaper);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPaper() {
      try {
        const data = await getPaper(paperId);
        if (!cancelled) setPaper(data);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      }
    }

    loadPaper();

    return () => {
      cancelled = true;
    };
  }, [paperId]);

  return (
    <div className="space-y-7">
      <Link
        to="/discover"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        返回检索结果
      </Link>

      <PageHeader
        eyebrow={`Paper · ${paper.id}`}
        title={paper.title}
        description={`${paper.authors.join(", ")} · ${paper.venue} · ${paper.year}`}
        actions={
          <>
            <ActionButton to="/agent" icon={<Sparkles size={16} />}>
              让 Agent 解释
            </ActionButton>
            <ActionButton to="/collections/demo" variant="secondary" icon={<Save size={16} />}>
              保存到集合
            </ActionButton>
          </>
        }
      />

      {error ? (
        <div
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          role="status"
        >
          当前显示本地演示数据：{error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)]">
        <div className="space-y-5">
          <Surface className="p-5">
            <h2 className="text-base font-black text-slate-950">摘要</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {paper.abstract}
            </p>
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-black text-slate-950">可提取证据</h2>
            <div className="mt-4 space-y-3">
              {[
                "工作记忆主要保存当前任务的短期上下文。",
                "情节记忆可以通过摘要降低长对话 token 成本。",
                "语义记忆更适合保存用户偏好和长期事实。",
              ].map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Quote className="mt-1 shrink-0 text-teal-700" size={15} aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <aside className="space-y-4">
          <Surface className="p-4">
            <h2 className="text-sm font-black text-slate-950">论文信息</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-500">引用数</dt>
                <dd className="mt-1 font-bold text-slate-900">{paper.citationCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">发表来源</dt>
                <dd className="mt-1 font-bold text-slate-900">{paper.venue}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">DOI</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                  {paper.doi}
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen size={17} className="text-slate-500" aria-hidden="true" />
              <Pill tone={paper.openAccess ? "teal" : "slate"}>
                {paper.openAccess ? "Open access" : "Metadata only"}
              </Pill>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <FileDown size={16} aria-hidden="true" />
              导出 BibTeX
            </button>
          </Surface>
        </aside>
      </section>
    </div>
  );
}
