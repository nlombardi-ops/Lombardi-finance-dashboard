"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { AREAS, type AreaGroup } from "@/lib/areas";

const GROUPS: AreaGroup[] = ["ENTRATE", "COSTI"];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/dashboard/login");
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-60 flex-col bg-stone-100 border-r border-stone-200">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
          {/* ADAPT: 2-3 letter initialism */}FD
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">{/* ADAPT: name */}Finance</p>
          <p className="text-[11px] text-stone-500">Finance Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            pathname === "/dashboard"
              ? "bg-stone-200 text-stone-900 font-medium"
              : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </Link>

        {GROUPS.map((group) => (
          <div key={group}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              {group}
            </p>
            <div className="space-y-1">
              {AREAS.filter((a) => a.group === group).map((area) => {
                const href = `/dashboard/${area.id}`;
                const active = pathname.startsWith(href);
                const Icon = area.icon;
                return (
                  <Link
                    key={area.id}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-stone-200 text-stone-900 font-medium"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{area.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-200 px-3 py-3 space-y-1">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Esci
        </button>
      </div>
    </aside>
  );
}
