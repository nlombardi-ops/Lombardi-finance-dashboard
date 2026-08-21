import { readFileSync } from "fs";
import { join } from "path";
import { FileText, ExternalLink, Clock, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import AuthGuard from "../../components/dashboard/AuthGuard";
import ContractsChat from "../../components/dashboard/ContractsChat";
import type { Contract, ContractsData } from "@/lib/types";

function readContracts(): Contract[] {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "contratti.json"), "utf-8");
    return (JSON.parse(raw) as ContractsData).contracts;
  } catch {
    return [];
  }
}

function getStatusConfig(contract: Contract) {
  if (!contract.permanencia_end) {
    return { icon: CheckCircle, label: "Nessuna permanenza", color: "text-emerald-700", bgColor: "bg-emerald-50" };
  }

  const endDate = new Date(contract.permanencia_end);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return { icon: CheckCircle, label: "Libero da disdire", color: "text-emerald-700", bgColor: "bg-emerald-50" };
  }
  if (daysLeft <= 90) {
    return { icon: Clock, label: `${daysLeft} giorni rimasti`, color: "text-amber-700", bgColor: "bg-amber-50" };
  }
  return {
    icon: AlertTriangle,
    label: `Vincolato fino al ${contract.permanencia_end}`,
    color: "text-red-600",
    bgColor: "bg-red-50",
  };
}

const TYPE_LABELS: Record<string, string> = {
  assicurazione: "Assicurazione",
  utenza: "Utenza",
  banca: "Banca",
  condominio: "Condominio",
};

export default function ContrattiPage() {
  const contracts = readContracts();
  const withPermanencia = contracts.filter((c) => c.permanencia_end).length;
  const autoRenew = contracts.filter((c) => c.auto_renew).length;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Contratti</h1>
          <p className="text-sm text-stone-500">
            Tutti i contratti attivi — stato permanenza, condizioni e rinnovo
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-3">
            <span className="text-xs text-stone-500">Totale</span>
            <span className="ml-2 text-lg font-bold text-stone-900">{contracts.length}</span>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-3">
            <span className="text-xs text-stone-500">Con permanenza</span>
            <span className="ml-2 text-lg font-bold text-amber-600">{withPermanencia}</span>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-3">
            <span className="text-xs text-stone-500">Rinnovo automatico</span>
            <span className="ml-2 text-lg font-bold text-red-600">{autoRenew}</span>
          </div>
        </div>

        {contracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-500">
              Nessun contratto ancora — aggiungili in{" "}
              <code className="text-stone-700">data/contratti.json</code>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const statusConfig = getStatusConfig(contract);
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={contract.id}
                  className="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                        <FileText className="h-5 w-5 text-stone-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">{contract.name}</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-stone-500">{contract.provider}</span>
                          <span className="text-stone-300">·</span>
                          <span className="text-xs text-stone-500">
                            {TYPE_LABELS[contract.type] || contract.type}
                          </span>
                          {contract.start_date && (
                            <>
                              <span className="text-stone-300">·</span>
                              <span className="text-xs text-stone-500">Dal {contract.start_date}</span>
                            </>
                          )}
                          {contract.auto_renew && (
                            <>
                              <span className="text-stone-300">·</span>
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <RefreshCw className="h-3 w-3" /> Rinnovo automatico
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {contract.key_terms && (
                    <div className="mt-3 rounded-lg bg-stone-50 px-4 py-3">
                      <p className="text-xs font-medium text-stone-500 mb-1">Condizioni principali</p>
                      <p className="text-sm text-stone-600 leading-relaxed">{contract.key_terms}</p>
                    </div>
                  )}

                  {contract.notice_period_days && (
                    <p className="mt-2 text-xs text-stone-500">
                      Preavviso di disdetta richiesto: {contract.notice_period_days} giorni
                    </p>
                  )}

                  {contract.drive_link && (
                    <a
                      href={contract.drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Vedi documento
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <ContractsChat />
      </div>
    </AuthGuard>
  );
}
