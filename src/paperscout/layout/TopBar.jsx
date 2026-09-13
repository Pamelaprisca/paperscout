import { Command, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export function TopBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(event) {
    event.preventDefault();
    const nextQuery = query.trim();
    navigate(nextQuery ? `/discover?q=${encodeURIComponent(nextQuery)}` : "/discover");
  }

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

        <form
          className="hidden flex-1 items-center gap-3 lg:flex"
          onSubmit={handleSearch}
        >
          <label className="flex h-9 max-w-xl flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">搜索论文、作者、DOI 或研究问题</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="搜索论文、作者、DOI 或研究问题"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-800"
              aria-label="提交搜索"
            >
              <Command size={11} aria-hidden="true" /> K
            </button>
          </label>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
            Research preview
          </span>
          <button
            type="button"
            onClick={() => navigate("/discover")}
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
