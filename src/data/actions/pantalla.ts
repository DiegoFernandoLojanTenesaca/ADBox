/** Pantalla y captura — espejado, captura al PC, toques/teclas y encender/apagar. */

import { launchScrcpy } from "../../lib/adb";
import { build } from "./helpers";

export const pantalla = build("pantalla", [
  {
    id: "scrcpy",
    label: "Espejar pantalla (scrcpy)",
    description: "Abre la pantalla del teléfono en el PC para verla y controlarla en vivo.",
    detail:
      "Refleja y controla el teléfono desde el PC con scrcpy. Ideal para reparar sin tocar el equipo. Requiere scrcpy instalado (no viene con ADB).",
    cmd: "scrcpy -s <serial>",
    free: true,
    run: async (ctx) => {
      try {
        await launchScrcpy(ctx.serial);
        ctx.log("scrcpy abierto en una ventana aparte. 📱 → 🖥️", "ok");
      } catch (e) {
        ctx.log(String(e), "error");
      }
    },
  },
  {
    id: "captura-pc",
    label: "Captura de pantalla al PC",
    description: "Hace una captura y la descarga a la carpeta del programa.",
    free: true,
    run: async (ctx) => {
      const remote = "/sdcard/adbox_screen.png";
      await ctx.shell(`screencap -p ${remote}`);
      await ctx.run(["pull", remote, "captura.png"]);
      await ctx.shellQuiet(`rm ${remote}`);
      ctx.log("Captura guardada como captura.png.", "ok");
    },
  },
  {
    id: "grabar-pantalla",
    label: "Grabar pantalla (15 s)",
    description: "Graba 15 segundos de pantalla y descarga el vídeo al PC.",
    run: async (ctx) => {
      const remote = "/sdcard/adbox_rec.mp4";
      ctx.log("Grabando 15 s… interactúa con el teléfono ahora.", "info");
      await ctx.shell(`screenrecord --time-limit 15 ${remote}`);
      await ctx.run(["pull", remote, "grabacion.mp4"]);
      await ctx.shellQuiet(`rm ${remote}`);
      ctx.log("Vídeo guardado como grabacion.mp4.", "ok");
    },
  },
  {
    id: "tap",
    label: "Toque en coordenadas",
    description: "Simula un toque en la pantalla (x y).",
    run: async (ctx) => {
      const xy = await ctx.prompt("Coordenadas X Y (separadas por espacio):", "540 1200");
      if (!xy) return;
      await ctx.shell(`input tap ${xy}`);
    },
  },
  {
    id: "tecla-home",
    label: "Tecla Inicio",
    description: "Envía la tecla HOME.",
    run: async (ctx) => ctx.shell("input keyevent 3").then(() => {}),
  },
  {
    id: "tecla-atras",
    label: "Tecla Atrás",
    description: "Envía la tecla BACK.",
    run: async (ctx) => ctx.shell("input keyevent 4").then(() => {}),
  },
  {
    id: "tecla-recientes",
    label: "Apps recientes",
    description: "Abre la vista de apps recientes.",
    run: async (ctx) => ctx.shell("input keyevent 187").then(() => {}),
  },
  {
    id: "despertar",
    label: "Encender pantalla",
    description: "Despierta la pantalla (WAKEUP).",
    run: async (ctx) => ctx.shell("input keyevent 224").then(() => {}),
  },
  {
    id: "apagar-pantalla",
    label: "Apagar pantalla",
    description: "Pone la pantalla en reposo (SLEEP).",
    run: async (ctx) => ctx.shell("input keyevent 223").then(() => {}),
  },
]);
