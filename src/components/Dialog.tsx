/** Modal de confirmación / entrada de texto, dirigido por la store. */

import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";

export function Dialog() {
  const dialog = useStore((s) => s.dialog);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reinicia el campo y enfoca cada vez que aparece un diálogo nuevo.
  useEffect(() => {
    setValue("");
    if (dialog?.kind === "prompt") {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [dialog]);

  if (!dialog) return null;

  const accept = () =>
    dialog.resolve(dialog.kind === "prompt" ? value : true);
  const cancel = () =>
    dialog.resolve(dialog.kind === "prompt" ? null : false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={cancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">
          {dialog.message}
        </p>

        {dialog.kind === "prompt" && (
          <input
            ref={inputRef}
            value={value}
            placeholder={dialog.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") accept();
              if (e.key === "Escape") cancel();
            }}
            className="mb-4 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={cancel}
            className="rounded-md px-4 py-2 text-sm text-muted hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-2"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
