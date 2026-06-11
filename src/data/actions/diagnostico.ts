/** Diagnóstico — crashes/ANR, logcat en vivo y bugreport. */

import { useStore } from "../../store";
import { build } from "./helpers";

export const diagnostico = build("diagnostico", [
  {
    id: "crashes-anr",
    label: "Últimos crashes y ANR",
    description: "Vuelca el búfer de crashes del sistema.",
    free: true,
    run: async (ctx) => {
      await ctx.shell("logcat -b crash -d -t 200");
    },
  },
  {
    id: "logcat-reciente",
    label: "Logcat reciente (instantánea)",
    description: "Las últimas 500 líneas del log del sistema.",
    run: async (ctx) => {
      await ctx.shell("logcat -d -v time -t 500");
    },
  },
  {
    id: "logcat-vivo",
    label: "Logcat en vivo",
    description: "Transmite el log en tiempo real a la consola. Detén desde la barra superior.",
    run: async (ctx) => {
      await useStore.getState().startLiveLogcat();
      ctx.log(
        "Logcat en vivo iniciado. Pulsa «Detener logcat» en la barra superior para parar.",
        "info",
      );
    },
  },
  {
    id: "errores-vivo",
    label: "Solo errores (en vivo)",
    description: "Logcat en vivo filtrado a nivel Error y superior.",
    run: async (ctx) => {
      await useStore.getState().startLiveLogcat(["*:E"]);
      ctx.log("Logcat en vivo (errores) iniciado.", "info");
    },
  },
  {
    id: "bugreport",
    label: "Generar bugreport",
    description: "Crea un informe completo del sistema (.zip) en la carpeta del programa.",
    danger: "caution",
    run: async (ctx) => {
      ctx.log("Generando bugreport… puede tardar 1-2 minutos.", "info");
      await ctx.run(["bugreport", "bugreport-adbox.zip"]);
      ctx.log("bugreport-adbox.zip guardado en la carpeta del programa.", "ok");
    },
  },
  {
    id: "kernel-dmesg",
    label: "Mensajes del kernel (dmesg)",
    description: "Últimas líneas del registro del kernel.",
    run: async (ctx) => {
      await ctx.shell("dmesg -T 2>/dev/null | tail -100");
    },
  },
]);
