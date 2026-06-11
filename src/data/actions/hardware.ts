/** Hardware — sensores, CPU, memoria, IMEI e identificadores. */

import { build } from "./helpers";

export const hardware = build("hardware", [
  {
    id: "info-cpu",
    label: "Información de CPU",
    description: "Núcleos, ABI y frecuencias del procesador.",
    free: true,
    run: async (ctx) => {
      await ctx.shell("getprop ro.product.cpu.abi");
      await ctx.shell("cat /proc/cpuinfo | grep -E 'processor|Hardware|model name' | head -20");
      await ctx.shell(
        "for c in /sys/devices/system/cpu/cpu[0-9]*/cpufreq/scaling_cur_freq; do cat $c 2>/dev/null; done",
      );
    },
  },
  {
    id: "info-memoria",
    label: "Memoria RAM",
    description: "Memoria total, libre y disponible.",
    run: async (ctx) => {
      await ctx.shell("cat /proc/meminfo | grep -E 'MemTotal|MemFree|MemAvailable|SwapTotal'");
    },
  },
  {
    id: "sensores",
    label: "Sensores del dispositivo",
    description: "Lista los sensores reportados por el sistema.",
    run: async (ctx) => {
      await ctx.shell(
        "dumpsys sensorservice | grep -E '^[0-9]+\\)|handle=' | head -40",
      );
    },
  },
  {
    id: "pantalla-specs",
    label: "Especificaciones de pantalla",
    description: "Resolución, densidad y tamaño físico.",
    run: async (ctx) => {
      await ctx.shell("wm size");
      await ctx.shell("wm density");
    },
  },
  {
    id: "identificadores",
    label: "Identificadores del equipo",
    description: "Número de serie y Android ID.",
    run: async (ctx) => {
      await ctx.shell("getprop ro.serialno");
      await ctx.shell("settings get secure android_id");
    },
  },
  {
    id: "imei",
    label: "IMEI",
    description: "Intenta leer el IMEI (puede requerir permisos en Android reciente).",
    run: async (ctx) => {
      const r = await ctx.shellQuiet("service call iphonesubinfo 1 s16 com.android.shell");
      if (r.stdout.includes("Parcel")) {
        ctx.log(
          "El IMEI está protegido en este Android. Cómpruébalo en Ajustes → Acerca del teléfono.",
          "warn",
        );
        ctx.log(r.stdout, "out");
      } else {
        ctx.log(r.stdout || "Sin respuesta.", "out");
      }
    },
  },
]);
