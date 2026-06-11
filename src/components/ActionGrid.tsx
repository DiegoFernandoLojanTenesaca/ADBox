/** Rejilla de tarjetas de acción para la categoría activa. */

import { AlertTriangle, Info, Loader2, Lock, Play, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { actionsFor, ALL_ACTIONS } from "../data/actions";
import { CATEGORIES } from "../data/categories";
import type { AdbAction, Danger } from "../lib/types";
import { useStore } from "../store";

const DANGER_STYLE: Record<Danger, string> = {
  safe: "border-border",
  caution: "border-warn/40",
  danger: "border-danger/40",
};

/** Explicación del nivel de riesgo para el tooltip informativo. */
const RISK_TEXT: Record<Danger, string> = {
  safe: "✓ Acción segura: solo lee información o aplica cambios reversibles.",
  caution: "⚠ Cuidado: modifica ajustes del sistema (reversible).",
  danger: "⛔ Riesgo: desinstala apps o borra datos. Pide confirmación.",
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

/** Icono «i» con tooltip que explica en detalle qué hace la acción. */
function InfoTip({ action }: { action: AdbAction }) {
  return (
    <span
      className="group/info relative flex"
      onClick={(e) => e.stopPropagation()}
    >
      <Info className="size-4 cursor-help text-muted hover:text-accent" />
      <span className="pointer-events-none absolute right-0 top-6 z-20 hidden w-64 rounded-lg border border-border bg-surface-2 p-3 text-left shadow-xl group-hover/info:block">
        <span className="mb-1 block text-sm font-semibold text-[color:var(--color-text)]">
          {action.label}
        </span>
        <span className="block text-xs leading-relaxed text-muted">
          {action.detail || action.description}
        </span>
        {action.cmd && (
          <span className="mt-2 block break-all rounded bg-bg px-2 py-1 font-mono text-[10px] text-accent">
            $ {action.cmd}
          </span>
        )}
        <span className="mt-2 block text-[11px] leading-relaxed text-[color:var(--color-text)]">
          {RISK_TEXT[action.danger]}
        </span>
      </span>
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
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && runAction(action)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) runAction(action);
      }}
      className={
        "group flex flex-col rounded-xl border bg-surface p-4 text-left transition-all " +
        DANGER_STYLE[action.danger] +
        (disabled
          ? " cursor-not-allowed opacity-60"
          : " cursor-pointer hover:-translate-y-0.5 hover:border-accent hover:bg-surface-2")
      }
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="font-medium text-[color:var(--color-text)]">{action.label}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {action.free && (
            <span className="rounded bg-ok/15 px-1.5 py-0.5 text-[10px] font-medium text-ok">
              gratis
            </span>
          )}
          <InfoTip action={action} />
        </div>
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
    </div>
  );
}

export function ActionGrid() {
  const active = useStore((s) => s.activeCategory);
  const category = CATEGORIES.find((c) => c.id === active)!;
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const actions = q
    ? ALL_ACTIONS.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      )
    : actionsFor(active);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">
            {q ? "Resultados de búsqueda" : category.name}
          </h1>
          <p className="truncate text-sm text-muted">
            {q ? `${actions.length} acciones coinciden con «${query.trim()}»` : category.description}
          </p>
        </div>
        <div className="relative ml-auto w-60 shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acción…"
            className="w-full rounded-md border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {actions.length === 0 ? (
          <p className="text-sm text-muted">No hay acciones que coincidan.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {actions.map((a) => (
              <Card key={a.id} action={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
