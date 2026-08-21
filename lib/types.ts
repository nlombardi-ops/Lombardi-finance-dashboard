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
