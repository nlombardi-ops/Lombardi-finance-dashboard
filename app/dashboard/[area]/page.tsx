import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import AuthGuard from "../../components/dashboard/AuthGuard";
import StatCard from "../../components/dashboard/StatCard";
import { AREAS, getArea } from "@/lib/areas";
import type { AreaData, FinanceItem } from "@/lib/types";

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.id }));
}

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

const FREQUENCY_LABEL: Record<FinanceItem["frequency"], string> = {
  monthly: "al mese",
  quarterly: "trimestrale",
  annual: "annuale",
  "one-time": "una tantum",
};

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area: areaId } = await params;
  const area = getArea(areaId);
  if (!area) notFound();

  const { items } = readAreaData(areaId);
  const totalAnnual = items.reduce((sum, i) => sum + annualized(i), 0);
  const Icon = area.icon;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{area.label}</h1>
          <p className="text-sm text-stone-500">
            {area.group === "ENTRATE" ? "Entrata" : "Costo"} — {items.length}{" "}
            {items.length === 1 ? "voce" : "voci"} registrate
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Totale annuo" value={fmt(totalAnnual)} icon={Icon} />
          <StatCard label="Totale mensile equiv." value={fmt(totalAnnual / 12)} icon={Icon} />
          <StatCard label="Voci" value={String(items.length)} icon={Icon} />
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
            <Icon className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-500">
              Nessuna voce ancora — aggiungi elementi in{" "}
              <code className="text-stone-700">data/{area.id}.json</code>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-100 text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-600">Voce</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-600">Frequenza</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-stone-600">Note</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-900">Importo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-700">{item.label}</td>
                    <td className="px-4 py-3 text-stone-500">{FREQUENCY_LABEL[item.frequency]}</td>
                    <td className="px-4 py-3 text-stone-500">{item.notes ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-stone-900">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
