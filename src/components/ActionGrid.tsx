/** Rejilla de tarjetas de acción para la categoría activa. */

import { AlertTriangle, Loader2, Lock, Play, ShieldAlert } from "lucide-react";
import { actionsFor } from "../data/actions";
import { CATEGORIES } from "../data/categories";
import type { AdbAction, Danger } from "../lib/types";
import { useStore } from "../store";

const DANGER_STYLE: Record<Danger, string> = {
  safe: "border-border",
  caution: "border-warn/40",
  danger: "border-danger/40",
};

function DangerBadge({ danger }: { danger: Danger }) {
  if (danger === "safe") return null;
  const isDanger = danger === "danger";
  const Icon = isDanger ? ShieldAlert : AlertTriangle;
  return (
    <span
      className={
        "flex items-center gap-1 text-[11px] " +
        (isDanger ? "text-danger" : "text-warn")
      }
    >
      <Icon className="size-3" />
      {isDanger ? "Riesgo" : "Cuidado"}
    </span>
  );
}

function Card({ action }: { action: AdbAction }) {
  const runAction = useStore((s) => s.runAction);
  const runningActionId = useStore((s) => s.runningActionId);
  const selected = useStore((s) => s.selectedSerial);

  const isRunning = runningActionId === action.id;
  const busy = runningActionId !== null;
  const disabled = !selected || busy || !action.implemented;

  return (
    <button
      onClick={() => runAction(action)}
      disabled={disabled}
      className={
        "group flex flex-col rounded-xl border bg-surface p-4 text-left transition-all " +
        DANGER_STYLE[action.danger] +
        (disabled
          ? " cursor-not-allowed opacity-60"
          : " hover:-translate-y-0.5 hover:border-accent hover:bg-surface-2")
      }
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-medium">{action.label}</span>
        {action.free && (
          <span className="rounded bg-ok/15 px-1.5 py-0.5 text-[10px] font-medium text-ok">
            gratis
          </span>
        )}
      </div>
      <p className="mb-3 flex-1 text-xs leading-relaxed text-muted">
        {action.description}
      </p>
      <div className="flex items-center justify-between">
        <DangerBadge danger={action.danger} />
        <span className="ml-auto flex items-center gap-1 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
          {!action.implemented ? (
            <>
              <Lock className="size-3" /> próximamente
            </>
          ) : isRunning ? (
            <>
              <Loader2 className="size-3 animate-spin" /> ejecutando
            </>
          ) : (
            <>
              <Play className="size-3" /> ejecutar
            </>
          )}
        </span>
      </div>
    </button>
  );
}

export function ActionGrid() {
  const active = useStore((s) => s.activeCategory);
  const category = CATEGORIES.find((c) => c.id === active)!;
  const actions = actionsFor(active);

  return (
    <section className="flex-1 overflow-y-auto p-5">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">{category.name}</h1>
        <p className="text-sm text-muted">{category.description}</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {actions.map((a) => (
          <Card key={a.id} action={a} />
        ))}
      </div>
    </section>
  );
}
