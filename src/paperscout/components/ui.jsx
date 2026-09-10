import { ArrowUpRight, Inbox } from "lucide-react";
import { Link } from "react-router";

import { cn } from "../lib/cn.js";

export function Surface({ className, children }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/40",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold",
        tones[tone] ?? tones.slate,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function ActionButton({
  children,
  to,
  variant = "primary",
  className,
  icon,
}) {
  const variants = {
    primary:
      "border-teal-700 bg-teal-700 text-white hover:border-teal-800 hover:bg-teal-800",
    secondary:
      "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
  };

  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition",
        variants[variant] ?? variants.primary,
        className,
      )}
    >
      {icon}
      <span>{children}</span>
      {variant === "secondary" ? <ArrowUpRight size={15} aria-hidden="true" /> : null}
    </Link>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
        <Inbox size={20} aria-hidden="true" />
      </span>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
