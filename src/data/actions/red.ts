/** Red e Internet — diagnóstico por capas, DNS seguro y datos. */

import { build } from "./helpers";

export const red = build("red", [
  {
    id: "diagnostico-red",
    label: "Diagnóstico por capas",
    description: "Comprueba interfaz, gateway, salida a Internet y DNS.",
    free: true,
    run: async (ctx) => {
      ctx.log("· Capa 1 — Interfaces", "info");
      await ctx.shell("ip -o addr show | grep -v ' lo '");

      ctx.log("· Capa 2 — Puerta de enlace (gateway)", "info");
      const gw = await ctx.shellQuiet(
        "ip route | grep default | grep -oE '[0-9.]+' | head -1",
      );
      const gateway = gw.stdout.trim();
      if (gateway) await ctx.shell(`ping -c 3 ${gateway}`);
      else ctx.log("No hay ruta por defecto (sin red).", "warn");

      ctx.log("· Capa 3 — Salida a Internet (IP)", "info");
      await ctx.shell("ping -c 3 8.8.8.8");

      ctx.log("· Capa 4 — Resolución DNS", "info");
      await ctx.shell("ping -c 3 google.com");
    },
  },
  {
    id: "reparar-wifi",
    label: 'Reparar "Wi-Fi sin internet"',
    description: "Reinicia la interfaz Wi-Fi para forzar reconexión y portal.",
    danger: "caution",
    run: async (ctx) => {
      ctx.log("Apagando Wi-Fi…", "info");
      await ctx.shell("svc wifi disable");
      ctx.log("Encendiendo Wi-Fi…", "info");
      await ctx.shell("svc wifi enable");
      ctx.log("Wi-Fi reiniciado. Espera unos segundos a que reconecte.", "ok");
    },
  },
  {
    id: "dns-seguro",
    label: "Activar DNS seguro (DNS privado)",
    description: "Configura DNS-over-TLS con dns.google a nivel de sistema.",
    danger: "caution",
    run: async (ctx) => {
      await ctx.shell("settings put global private_dns_mode hostname");
      await ctx.shell("settings put global private_dns_specifier dns.google");
      ctx.log("DNS privado activado (dns.google). Para revertir: modo 'off'.", "ok");
    },
  },
  {
    id: "dns-off",
    label: "Desactivar DNS privado",
    description: "Vuelve el DNS privado al modo automático/desactivado.",
    run: async (ctx) => {
      await ctx.shell("settings put global private_dns_mode off");
      ctx.log("DNS privado desactivado.", "ok");
    },
  },
  {
    id: "datos-on",
    label: "Activar datos móviles",
    description: "Enciende los datos móviles vía svc data.",
    run: async (ctx) => ctx.shell("svc data enable").then(() => {}),
  },
  {
    id: "datos-off",
    label: "Desactivar datos móviles",
    description: "Apaga los datos móviles vía svc data.",
    danger: "caution",
    run: async (ctx) => ctx.shell("svc data disable").then(() => {}),
  },
  {
    id: "estado-red",
    label: "Estado de conectividad",
    description: "Resumen de redes activas (Wi-Fi/datos) y direcciones.",
    run: async (ctx) => {
      await ctx.shell("dumpsys connectivity | grep -E 'NetworkAgentInfo|Active' | head -20");
    },
  },
]);
