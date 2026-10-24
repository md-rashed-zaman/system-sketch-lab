import {
  Archive,
  Cpu,
  Database,
  DatabaseZap,
  Globe,
  Layers,
  ListOrdered,
  MapPin,
  Network,
  Radio,
  ServerCog,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "@/engine/types";

export const ICONS: Record<ComponentType, LucideIcon> = {
  client: Users,
  cdn: Globe,
  lb: Network,
  gateway: ShieldCheck,
  app: ServerCog,
  ws: Radio,
  cache: Zap,
  sqldb: Database,
  replica: Layers,
  nosql: DatabaseZap,
  queue: ListOrdered,
  worker: Cpu,
  blob: Archive,
  geo: MapPin,
};

/** Category colour for the accent bar on each component card. */
export const TINT: Record<ComponentType, string> = {
  client: "#9db4ff",
  cdn: "#38bdf8",
  lb: "#a78bfa",
  gateway: "#f472b6",
  app: "#60a5fa",
  ws: "#2dd4bf",
  cache: "#facc15",
  sqldb: "#fb923c",
  replica: "#fdba74",
  nosql: "#f97316",
  queue: "#a3e635",
  worker: "#84cc16",
  blob: "#94a3b8",
  geo: "#34d399",
};

export function utilColor(u: number | undefined, down?: boolean): string {
  if (down) return "#94a3b8";
  if (u === undefined) return "var(--edge)";
  if (u < 0.7) return "#22c55e";
  if (u < 0.9) return "#f59e0b";
  return "#ef4444";
}
