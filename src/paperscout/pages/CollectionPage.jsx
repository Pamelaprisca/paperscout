import { FileDown, GitCompareArrows, Plus } from "lucide-react";
import { useParams } from "react-router";

import { PaperCard } from "../components/PaperCard.jsx";
import { ActionButton, PageHeader, Pill, Surface } from "../components/ui.jsx";

const papers = [
  {
    id: "agent-memory-survey",
    title: "A Survey on Memory Mechanisms for Language Agents",
    abstract:
      "This survey organizes agent memory into working, episodic, semantic and procedural layers.",
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
      "The paper studies how retrieval quality and memory summarization affect planning performance.",
    authors: ["Sato, K.", "Li, M."],
    year: 2025,
    venue: "NeurIPS",
    citationCount: 67,
    openAccess: false,
  },
];

export default function CollectionPage() {
  const { collectionId } = useParams();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`Collection · ${collectionId}`}
        title="Agent Memory Literature"
        description="保存与 Agent 记忆机制相关的候选论文，后续可以比较观点并生成 Related Work 草稿。"
        actions={
          <>
            <ActionButton to="/discover" icon={<Plus size={16} />}>
              添加论文
            </ActionButton>
            <ActionButton to="/agent" variant="secondary" icon={<GitCompareArrows size={16} />}>
              比较观点
            </ActionButton>
          </>
        }
      />

      <Surface className="flex flex-wrap items-center gap-2 p-4">
        <Pill tone="teal">2 papers</Pill>
        <Pill>Agent memory</Pill>
        <Pill>RAG</Pill>
        <button
          type="button"
          className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          <FileDown size={16} aria-hidden="true" />
          导出全部引用
        </button>
      </Surface>

      <section className="space-y-3">
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </section>
    </div>
  );
}
