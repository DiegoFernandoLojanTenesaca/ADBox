/** Rendimiento en vivo — CPU, memoria y FPS. */

import { build } from "./helpers";

export const rendimiento = build("rendimiento", [
  {
    id: "cpu-top",
    label: "Procesos por uso de CPU",
    description: "Instantánea de los procesos que más CPU consumen.",
    run: async (ctx) => {
      await ctx.shell("top -b -n 1 -m 15 -s cpu 2>/dev/null || top -n 1 | head -25");
    },
  },
  {
    id: "memoria-apps",
    label: "Memoria por app",
    description: "Ranking de uso de memoria por proceso.",
    run: async (ctx) => {
      await ctx.shell("dumpsys meminfo | head -40");
    },
  },
  {
    id: "fps-app",
    label: "FPS / render de una app",
    description: "Estadísticas de renderizado (gfxinfo) de un paquete.",
    run: async (ctx) => {
      const pkg = await ctx.prompt("Paquete a medir:", "com.ejemplo.app");
      if (!pkg) return;
      await ctx.shell(`dumpsys gfxinfo ${pkg} | grep -E 'Total frames|Janky|percentile' | head`);
    },
  },
  {
    id: "carga-sistema",
    label: "Carga del sistema",
    description: "Uptime y promedio de carga (load average).",
    run: async (ctx) => {
      await ctx.shell("uptime");
      await ctx.shell("cat /proc/loadavg");
    },
  },
]);
