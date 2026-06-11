/** Ajustes — leer y escribir settings del sistema (global/secure/system). */

import { build } from "./helpers";

export const ajustes = build("ajustes", [
  {
    id: "ver-global",
    label: "Ver ajustes globales",
    description: "Lista todos los settings del espacio «global».",
    run: async (ctx) => {
      await ctx.shell("settings list global");
    },
  },
  {
    id: "ver-secure",
    label: "Ver ajustes seguros",
    description: "Lista todos los settings del espacio «secure».",
    run: async (ctx) => {
      await ctx.shell("settings list secure");
    },
  },
  {
    id: "leer-setting",
    label: "Leer un ajuste",
    description: "Consulta el valor de un setting concreto.",
    run: async (ctx) => {
      const ns = await ctx.prompt("Espacio (global/secure/system):", "system");
      if (!ns) return;
      const key = await ctx.prompt("Clave:", "screen_brightness");
      if (!key) return;
      await ctx.shell(`settings get ${ns} ${key}`);
    },
  },
  {
    id: "escribir-setting",
    label: "Escribir un ajuste",
    description: "Cambia el valor de un setting (úsalo con cuidado).",
    danger: "danger",
    run: async (ctx) => {
      const ns = await ctx.prompt("Espacio (global/secure/system):", "system");
      if (!ns) return;
      const key = await ctx.prompt("Clave:", "screen_off_timeout");
      if (!key) return;
      const val = await ctx.prompt("Nuevo valor:", "60000");
      if (val === null) return;
      await ctx.shell(`settings put ${ns} ${key} ${val}`);
      ctx.log(`${ns}/${key} = ${val}`, "ok");
    },
  },
  {
    id: "brillo",
    label: "Ajustar brillo",
    description: "Fija el brillo de pantalla (0-255).",
    run: async (ctx) => {
      const v = await ctx.prompt("Brillo (0-255):", "128");
      if (!v) return;
      await ctx.shell("settings put system screen_brightness_mode 0");
      await ctx.shell(`settings put system screen_brightness ${v}`);
      ctx.log(`Brillo fijado a ${v}.`, "ok");
    },
  },
  {
    id: "timeout-pantalla",
    label: "Tiempo de apagado de pantalla",
    description: "Cambia el tiempo de espera antes de apagar la pantalla.",
    run: async (ctx) => {
      const v = await ctx.prompt("Milisegundos (ej. 30000 = 30 s):", "30000");
      if (!v) return;
      await ctx.shell(`settings put system screen_off_timeout ${v}`);
      ctx.log(`Apagado de pantalla en ${v} ms.`, "ok");
    },
  },
]);
