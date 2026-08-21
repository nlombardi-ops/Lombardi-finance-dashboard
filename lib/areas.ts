import {
  PiggyBank,
  TrendingUp,
  Shield,
  Receipt,
  Building2,
  Briefcase,
  Wifi,
  Landmark,
  Home,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type AreaGroup = "ENTRATE" | "COSTI";

export interface AreaConfig {
  id: string;
  label: string;
  group: AreaGroup;
  icon: LucideIcon;
  // Dominant frequency of items in this area — used only to phrase the
  // stat-card subtitle ("al mese" / "all'anno" / "misto"), not enforced.
  frequency: "monthly" | "quarterly" | "annual" | "mixed";
}

// ADAPT: this is a starting shape based on the areas you named — rename,
// reorder, add, or remove entries freely. Each area only needs a matching
// data/{id}.json file (see data/README.md) to work; nothing else references
// this list by index, so editing it is safe.
export const AREAS: AreaConfig[] = [
  { id: "pensioni", label: "Pensioni", group: "ENTRATE", icon: PiggyBank, frequency: "monthly" },
  { id: "entrate-economiche", label: "Entrate economiche", group: "ENTRATE", icon: TrendingUp, frequency: "mixed" },

  { id: "assicurazioni", label: "Assicurazioni", group: "COSTI", icon: Shield, frequency: "annual" },
  { id: "bollette", label: "Bollette", group: "COSTI", icon: Receipt, frequency: "monthly" },
  { id: "spese-condominio", label: "Spese condominio", group: "COSTI", icon: Building2, frequency: "monthly" },
  { id: "pulizie-commercialista", label: "Pulizie e Commercialista", group: "COSTI", icon: Briefcase, frequency: "mixed" },
  { id: "telefoni-internet", label: "Telefoni e Internet", group: "COSTI", icon: Wifi, frequency: "monthly" },
  { id: "banche", label: "Banche", group: "COSTI", icon: Landmark, frequency: "mixed" },
  { id: "tasse-immobiliari", label: "Tasse immobiliari", group: "COSTI", icon: Home, frequency: "annual" },
  { id: "lifestyle-costs", label: "Lifestyle costs", group: "COSTI", icon: ShoppingBag, frequency: "mixed" },
];

export function getArea(id: string): AreaConfig | undefined {
  return AREAS.find((a) => a.id === id);
}

export function areasByGroup(group: AreaGroup): AreaConfig[] {
  return AREAS.filter((a) => a.group === group);
}
