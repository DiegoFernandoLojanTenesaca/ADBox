/** Utilidades para declarar acciones con menos repetición. */

import type { AdbAction, CategoryId, Danger } from "../../lib/types";

/** Una acción sin los campos que el `build` rellena (category, defaults). */
export type ActionDef = Omit<AdbAction, "category" | "implemented" | "danger"> & {
  danger?: Danger;
  implemented?: boolean;
};

/** Aplica category fija + valores por defecto (danger=safe, implemented=true). */
export function build(category: CategoryId, defs: ActionDef[]): AdbAction[] {
  return defs.map((d) => ({
    category,
    danger: "safe" as Danger,
    implemented: true,
    ...d,
  }));
}

/** Lee una propiedad del sistema (getprop) de forma silenciosa. */
export async function getprop(
  ctx: { shellQuiet: (c: string) => Promise<{ stdout: string }> },
  key: string,
): Promise<string> {
  const out = await ctx.shellQuiet(`getprop ${key}`);
  return out.stdout.trim();
}
