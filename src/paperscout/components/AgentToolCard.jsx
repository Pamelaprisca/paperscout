import {
  Check,
  FileSearch,
  LoaderCircle,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { cn } from "../lib/cn.js";

const icons = {
  searchPapers: Search,
  comparePapers: Check,
  searchChunks: FileSearch,
  saveEvidence: ShieldCheck,
};

export function ToolCallCard({ tool }) {
  const Icon = icons[tool.name] ?? Search;

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-md",
            tool.status === "running"
              ? "bg-amber-50 text-amber-700"
              : "bg-teal-50 text-teal-700",
          )}
        >
          {tool.status === "running" ? (
            <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Icon size={14} aria-hidden="true" />
          )}
        </span>
        <div>
          <p className="text-xs font-bold text-slate-800">{tool.label}</p>
          <p className="text-xs text-slate-500">
            {tool.summary || "工具正在执行"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ActionConfirmCard({
  action,
  busy,
  onConfirm,
  onDismiss,
}) {
  const status = action.status || "pending";

  return (
    <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 p-3">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white text-teal-700">
          <ShieldCheck size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{action.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {action.description}
          </p>

          {status === "pending" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onConfirm(action)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Check size={13} aria-hidden="true" />
                {busy ? "保存中..." : "确认保存"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onDismiss(action)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                <X size={13} aria-hidden="true" />
                取消
              </button>
            </div>
          ) : null}

          {status === "confirmed" ? (
            <p className="mt-3 text-xs font-bold text-teal-800">证据已保存到 SQLite。</p>
          ) : null}

          {status === "dismissed" ? (
            <p className="mt-3 text-xs font-bold text-slate-500">已取消本次操作。</p>
          ) : null}

          {status === "error" ? (
            <p className="mt-3 text-xs font-bold text-rose-700">{action.error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
