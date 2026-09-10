import { Command, Menu, Search } from "lucide-react";
import { Link } from "react-router";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-black text-slate-950 lg:hidden"
        >
          <span className="grid size-8 place-items-center rounded-md bg-slate-950 text-white">
            <Menu size={16} aria-hidden="true" />
          </span>
          PaperScout
        </Link>

        <div className="hidden flex-1 items-center gap-3 lg:flex">
          <div className="flex h-9 max-w-xl flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <Search size={15} aria-hidden="true" />
            <span>搜索论文、作者、DOI 或研究问题</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
              <Command size={11} aria-hidden="true" /> K
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
            Research preview
          </span>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="搜索"
          >
            <Search size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
