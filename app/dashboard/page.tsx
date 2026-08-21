import { readFileSync } from "fs";
import { join } from "path";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import AuthGuard from "../components/dashboard/AuthGuard";
import StatCard from "../components/dashboard/StatCard";
import FinanceChat from "../components/dashboard/FinanceChat";
import { AREAS } from "@/lib/areas";
import type { AreaData, FinanceItem } from "@/lib/types";

function readAreaData(id: string): AreaData {
  try {
    const raw = readFileSync(join(process.cwd(), "data", `${id}.json`), "utf-8");
    return JSON.parse(raw) as AreaData;
  } catch {
    return { items: [] };
  }
}

function annualized(item: FinanceItem): number {
  switch (item.frequency) {
    case "monthly":
      return item.amount * 12;
    case "quarterly":
      return item.amount * 4;
    case "annual":
    case "one-time":
    default:
      return item.amount;
  }
}

const fmt = (n: number) =>
  n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function DashboardOverviewPage() {
  const totals = AREAS.map((area) => {
    const { items } = readAreaData(area.id);
    const total = items.reduce((sum, i) => sum + annualized(i), 0);
    return { ...area, total };
  });

  const totalEntrate = totals.filter((a) => a.group === "ENTRATE").reduce((s, a) => s + a.total, 0);
  const totalCosti = totals.filter((a) => a.group === "COSTI").reduce((s, a) => s + a.total, 0);
  const saldo = totalEntrate - totalCosti;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Panoramica</h1>
          <p className="text-sm text-stone-500">Entrate e costi annuali, per area</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Entrate annue" value={fmt(totalEntrate)} icon={TrendingUp} color="bg-emerald-50" />
          <StatCard label="Costi annui" value={fmt(totalCosti)} icon={TrendingDown} color="bg-red-50" />
          <StatCard
            label="Saldo annuo"
            value={fmt(saldo)}
            icon={Scale}
            color={saldo >= 0 ? "bg-emerald-50" : "bg-red-50"}
          />
        </div>

        {(["ENTRATE", "COSTI"] as const).map((group) => (
          <div key={group} className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">{group}</h3>
            <div className="space-y-2">
              {totals
                .filter((a) => a.group === group)
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{a.label}</span>
                    <span className="font-medium text-stone-900">{fmt(a.total)}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}

        <FinanceChat />
      </div>
    </AuthGuard>
  );
}
