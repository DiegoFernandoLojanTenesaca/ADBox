/** Modal de ajustes de ADB: ruta en uso, instalación automática y ruta manual. */

import { Download, FolderInput, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store";

export function AdbSettings({ onClose }: { onClose: () => void }) {
  const adbPath = useStore((s) => s.adbPath);
  const adbReady = useStore((s) => s.adbReady);
  const installing = useStore((s) => s.installing);
  const installAdb = useStore((s) => s.installAdb);
  const setAdbPath = useStore((s) => s.setAdbPath);
  const [manual, setManual] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Ajustes · ADB</h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="size-4" />
          </button>
        </div>

        {/* Ruta en uso */}
        <div className="mb-4 rounded-lg border border-border bg-surface-2 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Ruta de ADB en uso
          </div>
          <div className="mt-1 break-all font-mono text-xs">{adbPath}</div>
          <div className={"mt-1 text-xs " + (adbReady ? "text-ok" : "text-danger")}>
            {adbReady ? "✓ ADB disponible" : "✗ ADB no responde"}
          </div>
        </div>

        {/* Instalación automática */}
        <button
          onClick={installAdb}
          disabled={installing}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2.5 text-sm font-medium text-white hover:bg-accent-2 disabled:opacity-60"
        >
          {installing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {installing ? "Descargando ADB…" : "Descargar / reinstalar ADB automáticamente"}
        </button>
        <p className="mb-4 mt-2 text-xs text-muted">
          Descarga el paquete oficial <code>platform-tools</code> de Google y lo deja
          listo. No necesitas instalar nada a mano.
        </p>

        {/* Ruta manual */}
        <div className="border-t border-border pt-4">
          <div className="mb-2 text-xs text-muted">
            ¿Ya tienes ADB en otra ruta? Fíjala manualmente:
          </div>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="/ruta/a/adb"
              className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => {
                if (manual.trim()) setAdbPath(manual.trim());
              }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm hover:border-accent"
            >
              <FolderInput className="size-4" /> Fijar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
