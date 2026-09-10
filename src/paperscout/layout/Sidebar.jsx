import {
  BookMarked,
  LayoutDashboard,
  LibraryBig,
  MessageSquareText,
  Search,
} from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "../lib/cn.js";

const navItems = [
  { to: "/", label: "工作台", icon: LayoutDashboard, end: true },
  { to: "/discover", label: "文献检索", icon: Search },
  { to: "/collections/demo", label: "文献集合", icon: LibraryBig },
  { to: "/agent", label: "Agent 对话", icon: MessageSquareText },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/90 lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <span className="grid size-9 place-items-center rounded-lg bg-slate-950 text-white">
          <BookMarked size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-black tracking-tight text-slate-950">PaperScout</p>
          <p className="text-[11px] font-medium text-slate-500">AI research workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary navigation">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )
            }
          >
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}

export function MobileNav() {
  return (
    <nav
      className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
      aria-label="Mobile navigation"
    >
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold transition",
              isActive
                ? "bg-slate-950 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )
          }
        >
          <Icon size={14} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
