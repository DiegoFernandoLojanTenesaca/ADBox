/** Modal de debloat con selección: elige qué bloatware de la marca desinstalar. */

import { Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { brandFor, type BloatBrand } from "../data/bloatware";
import * as adb from "../lib/adb";
import { useStore } from "../store";

interface Item {
  pkg: string;
  checked: boolean;
}

export function DebloatModal() {
  const open = useStore((s) => s.debloatOpen);
  const close = useStore((s) => s.closeDebloat);
  const serial = useStore((s) => s.selectedSerial);
  const appendLog = useStore((s) => s.appendLog);

  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [brand, setBrand] = useState<BloatBrand | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!open || !serial) return;
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setBrand(null);

    (async () => {
      const get = async (c: string) => (await adb.shell(serial, c)).stdout.trim();
      const b = brandFor(
        await get("getprop ro.product.manufacturer"),
        await get("getprop ro.product.brand"),
      );
      if (!b) {
        if (!cancelled) setLoading(false);
        return;
      }
      const installed: string[] = [];
      for (const pkg of b.packages) {
        const r = await adb.shell(serial, `pm list packages ${pkg}`);
        if (r.stdout.includes(`package:${pkg}`)) installed.push(pkg);
      }
      if (!cancelled) {
        setBrand(b);
        setItems(installed.map((pkg) => ({ pkg, checked: true })));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, serial]);

  if (!open) return null;

  const toggle = (pkg: string) =>
    setItems((it) =>
      it.map((i) => (i.pkg === pkg ? { ...i, checked: !i.checked } : i)),
    );
  const setAll = (v: boolean) =>
    setItems((it) => it.map((i) => ({ ...i, checked: v })));

  const selected = items.filter((i) => i.checked);

  const uninstall = async () => {
    if (!serial || selected.length === 0) return;
    setWorking(true);
    appendLog(`▶ Debloat de ${selected.length} apps seleccionadas`, "info");
    let done = 0;
    for (const i of selected) {
      const r = await adb.shell(serial, `pm uninstall -k --user 0 ${i.pkg}`);
      if (r.stdout.includes("Success")) {
        done++;
        appendLog(`✓ ${i.pkg}`, "ok");
      } else {
        appendLog(`✗ ${i.pkg}: ${r.stdout || r.stderr}`, "warn");
      }
    }
    appendLog(`✔ Debloat: ${done}/${selected.length} desinstaladas`, "ok");
    setWorking(false);
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Debloat con selección</h2>
            <p className="text-xs text-muted">
              {brand ? brand.label : "Detectando marca…"}
            </p>
          </div>
          <button onClick={close} className="text-muted hover:text-text">
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Buscando bloatware instalado…
            </div>
          ) : !brand ? (
            <p className="py-8 text-sm text-warn">
              No hay lista de bloatware para esta marca todavía.
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-sm text-ok">
              No se encontró bloatware de la marca instalado. ✔
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-3 text-xs">
                <button onClick={() => setAll(true)} className="text-accent hover:underline">
                  Marcar todo
                </button>
                <button onClick={() => setAll(false)} className="text-accent hover:underline">
                  Desmarcar todo
                </button>
                <span className="ml-auto text-muted">{selected.length} seleccionadas</span>
              </div>
              {items.map((i) => (
                <label
                  key={i.pkg}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={i.checked}
                    onChange={() => toggle(i.pkg)}
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  <span className="font-mono text-xs text-[color:var(--color-text)]">
                    {i.pkg}
                  </span>
                </label>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <span className="text-xs text-muted">
            Reversible: se restauran con «Restaurar apps de marca».
          </span>
          <button
            onClick={uninstall}
            disabled={working || selected.length === 0}
            className="flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/85 disabled:opacity-50"
          >
            {working ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Desinstalar {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
