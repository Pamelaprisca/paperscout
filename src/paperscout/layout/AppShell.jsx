import { Outlet } from "react-router";

import { MobileNav, Sidebar } from "./Sidebar.jsx";
import { TopBar } from "./TopBar.jsx";

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav />
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
