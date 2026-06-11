/** Consola de salida: muestra el registro de comandos y resultados. */

import { Eraser, TerminalSquare } from "lucide-react";
import { useEffect, useRef } from "react";
import type { LogLevel } from "../lib/types";
import { useStore } from "../store";

const LEVEL_CLASS: Record<LogLevel, string> = {
  info: "text-accent",
  cmd: "text-muted",
  out: "text-text/90",
  ok: "text-ok",
  warn: "text-warn",
  error: "text-danger",
};

export function Console() {
  const log = useStore((s) => s.log);
  const clearLog = useStore((s) => s.clearLog);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-l border-border bg-bg">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <TerminalSquare className="size-4 text-muted" />
        <span className="text-sm font-medium">Consola</span>
        <span className="text-xs text-muted">{log.length}</span>
        <button
          onClick={clearLog}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-text"
        >
          <Eraser className="size-3.5" />
          Limpiar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-relaxed">
        {log.length === 0 ? (
          <p className="text-muted">
            La salida de los comandos aparecerá aquí. Selecciona una acción para empezar.
          </p>
        ) : (
          log.map((entry) => (
            <pre
              key={entry.id}
              className={"whitespace-pre-wrap break-words " + LEVEL_CLASS[entry.level]}
            >
              {entry.text}
            </pre>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
