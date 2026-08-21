export type Frequency = "monthly" | "quarterly" | "annual" | "one-time";

export interface FinanceItem {
  label: string;
  amount: number; // EUR
  frequency: Frequency;
  date?: string; // ISO — when it started, or when a one-time item occurred
  notes?: string;
}

export interface AreaData {
  items: FinanceItem[];
}

export interface Contract {
  id: string;
  name: string;
  type: string; // e.g. "assicurazione", "utenza", "banca", "condominio"
  provider: string;
  start_date: string | null; // ISO date
  permanencia_end: string | null; // ISO date — null means free to cancel anytime
  auto_renew: boolean;
  notice_period_days: number | null; // how many days' notice cancellation requires
  status: string; // e.g. "attivo", "in scadenza", "disdetto"
  key_terms: string; // free text: penalties, coverage, rate, anything the assistant should know
  drive_link: string | null;
}

export interface ContractsData {
  contracts: Contract[];
}
