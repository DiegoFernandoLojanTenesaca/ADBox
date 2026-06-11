/** Mantenimiento completo — optimización automática en un clic. */

import { build } from "./helpers";

export const mantenimiento = build("mantenimiento", [
  {
    id: "mantenimiento-completo",
    label: "★ Optimización completa (un clic)",
    description:
      "Limpia caché, libera RAM, ejecuta TRIM, acelera animaciones y activa Doze, todo seguido.",
    danger: "caution",
    free: true,
    run: async (ctx) => {
      if (
        !(await ctx.confirm(
          "Se ejecutará la rutina de optimización completa (no borra tus datos). ¿Continuar?",
        ))
      )
        return;

      const pasos: [string, string][] = [
        ["Limpiando caché de apps", "pm trim-caches 999999999999"],
        ["Liberando RAM (segundo plano)", "am kill-all"],
        ["Ejecutando TRIM / mantenimiento", "sm idle-maint run"],
        ["Acelerando animaciones (0.5×)", "settings put global window_animation_scale 0.5"],
        ["Acelerando transiciones (0.5×)", "settings put global transition_animation_scale 0.5"],
        ["Acelerando animadores (0.5×)", "settings put global animator_duration_scale 0.5"],
        ["Activando Doze (ahorro)", "dumpsys deviceidle enable"],
      ];

      let n = 0;
      for (const [titulo, cmd] of pasos) {
        n++;
        ctx.log(`(${n}/${pasos.length}) ${titulo}…`, "info");
        await ctx.shellQuiet(cmd);
      }
      ctx.log("Optimización completa terminada. Tu Android debería ir más fluido. ✔", "ok");
    },
  },
  {
    id: "reporte-salud",
    label: "Reporte rápido de salud",
    description: "Resumen de batería, almacenamiento y memoria en un vistazo.",
    free: true,
    run: async (ctx) => {
      ctx.log("— Batería —", "info");
      const bat = await ctx.shellQuiet("dumpsys battery | grep -E 'level|temperature'");
      ctx.log(bat.stdout || "—");
      ctx.log("— Almacenamiento —", "info");
      const disk = await ctx.shellQuiet("df -h /data | tail -1");
      ctx.log(disk.stdout || "—");
      ctx.log("— Memoria —", "info");
      const mem = await ctx.shellQuiet("cat /proc/meminfo | grep -E 'MemTotal|MemAvailable'");
      ctx.log(mem.stdout || "—");
    },
  },
]);
