import {
  ArrowRight,
  BookOpen,
  FileText,
  MessageSquareText,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import { PaperCard } from "../components/PaperCard.jsx";
import { ActionButton, PageHeader, Pill, Surface } from "../components/ui.jsx";

const recentPapers = [
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
    id: "rag-evaluation",
    title: "Evaluating Retrieval-Augmented Generation for Scientific Question Answering",
    abstract:
      "A benchmark and evaluation protocol for retrieval quality, answer faithfulness and citation precision in scientific QA systems.",
    authors: ["Miller, A.", "Wang, H."],
    year: 2025,
    venue: "ACL Findings",
    citationCount: 42,
    openAccess: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Research workspace"
        title="从研究问题开始，快速收敛到可引用文献"
        description="PaperScout 帮你检索论文、整理证据、比较观点，并生成带引用来源的研究简报。当前页面使用演示数据，后续接入 Express 和学术 API。"
        actions={
          <>
            <ActionButton to="/discover" icon={<Search size={16} />}>
              开始检索
            </ActionButton>
            <ActionButton to="/agent" variant="secondary" icon={<Sparkles size={16} />}>
              Agent 对话
            </ActionButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["12", "候选论文", "本周检索结果"],
          ["5", "已保存集合", "按研究主题整理"],
          ["18", "证据片段", "可关联到论述"],
        ].map(([value, label, note]) => (
          <Surface key={label} className="p-5">
            <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{label}</p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </Surface>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                Recent papers
              </p>
              <h2 className="mt-1 text-lg font-black text-slate-950">最近处理的论文</h2>
            </div>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              查看全部
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              Next actions
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">下一步</h2>
          </div>

          <Surface className="divide-y divide-slate-100">
            <Link to="/discover" className="flex items-start gap-3 p-4 hover:bg-slate-50">
              <Search className="mt-0.5 text-teal-700" size={18} aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold text-slate-900">建立检索问题</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  输入论文主题或一段论述，生成候选论文。
                </span>
              </span>
            </Link>
            <Link
              to="/collections/demo"
              className="flex items-start gap-3 p-4 hover:bg-slate-50"
            >
              <BookOpen className="mt-0.5 text-teal-700" size={18} aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold text-slate-900">整理文献集合</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  保存候选论文并标记相关性、笔记和证据。
                </span>
              </span>
            </Link>
            <Link to="/agent" className="flex items-start gap-3 p-4 hover:bg-slate-50">
              <MessageSquareText className="mt-0.5 text-teal-700" size={18} aria-hidden="true" />
              <span>
                <span className="block text-sm font-bold text-slate-900">比较论文观点</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  让 Agent 找共识、冲突和可引用证据。
                </span>
              </span>
            </Link>
          </Surface>

          <Surface className="p-4">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-slate-500" aria-hidden="true" />
              <Pill>Foundation</Pill>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              当前任务只验证页面壳子和路由。下一阶段接 Express 搜索接口与真实论文数据。
            </p>
          </Surface>
        </div>
      </section>
    </div>
  );
}
