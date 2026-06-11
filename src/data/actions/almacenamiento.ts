/** Almacenamiento — uso, limpiar caché, liberar RAM y TRIM. */

import { build } from "./helpers";

export const almacenamiento = build("almacenamiento", [
  {
    id: "uso-almacenamiento",
    label: "Uso de almacenamiento",
    description: "Espacio usado y libre en las particiones principales.",
    free: true,
    run: async (ctx) => {
      await ctx.shell("df -h /data /storage/emulated 2>/dev/null");
    },
  },
  {
    id: "limpiar-cache",
    label: "Limpiar caché de apps",
    description: "Pide al sistema recortar la caché de todas las apps.",
    run: async (ctx) => {
      await ctx.shell("pm trim-caches 999999999999");
      ctx.log("Caché recortada.", "ok");
    },
  },
  {
    id: "liberar-ram",
    label: "Liberar RAM (procesos en 2º plano)",
    description: "Cierra procesos en segundo plano para liberar memoria.",
    danger: "caution",
    run: async (ctx) => {
      await ctx.shell("am kill-all");
      ctx.log("Procesos en segundo plano cerrados.", "ok");
    },
  },
  {
    id: "trim",
    label: "Ejecutar TRIM (mantenimiento)",
    description: "Lanza el mantenimiento en reposo del sistema (incluye fstrim).",
    run: async (ctx) => {
      await ctx.shell("sm idle-maint run");
      ctx.log("Mantenimiento de almacenamiento ejecutado.", "ok");
    },
  },
  {
    id: "top-espacio",
    label: "Qué ocupa más espacio",
    description: "Estadísticas de uso de disco por categoría (diskstats).",
    run: async (ctx) => {
      await ctx.shell("dumpsys diskstats | head -25");
    },
  },
]);
