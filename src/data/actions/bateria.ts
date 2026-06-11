/** Batería — estado, temperatura y salud real (capacidad vs fábrica + ciclos). */

import { build } from "./helpers";

/** Lee un entero de un nodo /sys; 0 si no existe o no es numérico. */
async function sysInt(
  ctx: { shellQuiet: (c: string) => Promise<{ stdout: string }> },
  path: string,
): Promise<number> {
  const out = await ctx.shellQuiet(`cat ${path} 2>/dev/null`);
  const n = parseInt(out.stdout.trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

export const bateria = build("bateria", [
  {
    id: "estado-bateria",
    label: "Estado de la batería",
    description: "Nivel, estado de carga, voltaje, temperatura y tecnología.",
    free: true,
    run: async (ctx) => {
      const d = await ctx.shellQuiet("dumpsys battery");
      const get = (k: string) => {
        const m = d.stdout.match(new RegExp(`${k}:\\s*(.+)`));
        return m ? m[1].trim() : "—";
      };
      const tempRaw = parseInt(get("temperature"), 10);
      const voltRaw = parseInt(get("voltage"), 10);
      const healthMap: Record<string, string> = {
        "1": "Desconocida",
        "2": "Buena",
        "3": "Sobrecalentada",
        "4": "Muerta",
        "5": "Sobre-voltaje",
        "6": "Fallo",
        "7": "Fría",
      };
      ctx.log(`Nivel:        ${get("level")} %`);
      ctx.log(`Estado:       ${get("status")}`);
      ctx.log(`Salud SO:     ${healthMap[get("health")] ?? get("health")}`);
      ctx.log(`Tecnología:   ${get("technology")}`);
      if (Number.isFinite(tempRaw)) ctx.log(`Temperatura:  ${(tempRaw / 10).toFixed(1)} °C`);
      if (Number.isFinite(voltRaw)) ctx.log(`Voltaje:      ${(voltRaw / 1000).toFixed(3)} V`);
    },
  },
  {
    id: "salud-real",
    label: "Salud real (capacidad y ciclos)",
    description:
      "Compara la capacidad actual con la de fábrica y muestra los ciclos de carga.",
    run: async (ctx) => {
      const base = "/sys/class/power_supply/battery";
      const design = await sysInt(ctx, `${base}/charge_full_design`);
      const full = await sysInt(ctx, `${base}/charge_full`);
      const cycles = await sysInt(ctx, `${base}/cycle_count`);

      if (design > 0 && full > 0) {
        const health = (full / design) * 100;
        ctx.log(`Capacidad de fábrica: ${(design / 1000).toFixed(0)} mAh`);
        ctx.log(`Capacidad actual:     ${(full / 1000).toFixed(0)} mAh`);
        ctx.log(
          `Salud estimada:       ${health.toFixed(1)} %`,
          health >= 80 ? "ok" : health >= 60 ? "warn" : "error",
        );
      } else {
        ctx.log(
          "Este equipo no expone charge_full_design (frecuente). No se puede calcular salud por capacidad.",
          "warn",
        );
      }
      if (cycles > 0) ctx.log(`Ciclos de carga:      ${cycles}`);
      else ctx.log("Ciclos de carga: no reportados por este equipo.", "warn");
    },
  },
  {
    id: "uso-bateria",
    label: "Apps que más consumen",
    description: "Resumen de consumo estimado por dumpsys batterystats.",
    run: async (ctx) => {
      await ctx.shell(
        "dumpsys batterystats --charged | grep -E 'Estimated power|Uid' | head -25",
      );
    },
  },
  {
    id: "reset-stats",
    label: "Reiniciar estadísticas de batería",
    description: "Borra el histórico de batterystats para medir desde cero.",
    danger: "caution",
    run: async (ctx) => {
      if (!(await ctx.confirm("¿Reiniciar las estadísticas de batería?"))) return;
      await ctx.shell("dumpsys batterystats --reset");
      ctx.log("Estadísticas reiniciadas.", "ok");
    },
  },
]);
