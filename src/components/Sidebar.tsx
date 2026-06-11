/** Barra lateral: navegación entre las 15 categorías. */

import {
  BatteryCharging,
  Boxes,
  Camera,
  Cpu,
  FolderArchive,
  Gauge,
  HardDrive,
  Plug,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Stethoscope,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { actionsFor, ACTION_COUNT } from "../data/actions";
import { CATEGORIES } from "../data/categories";
import { useStore } from "../store";

const ICONS: Record<string, LucideIcon> = {
  Plug,
  Wifi,
  Rocket,
  BatteryCharging,
  HardDrive,
  Boxes,
  Stethoscope,
  Camera,
  Cpu,
  SlidersHorizontal,
  FolderArchive,
  Gauge,
  ShieldCheck,
  Wrench,
  Sparkles,
};

export function Sidebar() {
  const active = useStore((s) => s.activeCategory);
  const setCategory = useStore((s) => s.setCategory);

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <img src="/icon.png" alt="ADBox" className="size-8 rounded-lg" />
        <div>
          <div className="font-semibold leading-tight">ADBox</div>
          <div className="text-xs text-muted">Consola ADB libre</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.icon] ?? Square;
          const count = actionsFor(c.id).length;
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              title={c.description}
              className={
                "mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                (isActive
                  ? "bg-accent/15 text-accent"
                  : "text-text/80 hover:bg-surface-2")
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-[11px] text-muted">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-2 text-[11px] text-muted">
        {CATEGORIES.length} categorías · {ACTION_COUNT} acciones
      </div>
    </nav>
  );
}
