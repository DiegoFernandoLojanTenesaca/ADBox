/** Archivos y Respaldo — push/pull de archivos y respaldos. */

import { build } from "./helpers";

export const archivos = build("archivos", [
  {
    id: "listar-sdcard",
    label: "Explorar /sdcard",
    description: "Lista el contenido del almacenamiento interno.",
    run: async (ctx) => {
      await ctx.shell("ls -la /sdcard");
    },
  },
  {
    id: "espacio-carpetas",
    label: "Tamaño de carpetas en /sdcard",
    description: "Cuánto ocupa cada carpeta del almacenamiento interno.",
    run: async (ctx) => {
      await ctx.shell("du -sh /sdcard/* 2>/dev/null");
    },
  },
  {
    id: "push",
    label: "Enviar archivo al teléfono",
    description: "Copia un archivo del PC al dispositivo (push).",
    run: async (ctx) => {
      const local = await ctx.prompt("Ruta en el PC:", "/ruta/archivo.txt");
      if (!local) return;
      const remote = await ctx.prompt("Destino en el teléfono:", "/sdcard/");
      if (!remote) return;
      await ctx.run(["push", local, remote]);
    },
  },
  {
    id: "pull",
    label: "Traer archivo al PC",
    description: "Copia un archivo del dispositivo al PC (pull).",
    run: async (ctx) => {
      const remote = await ctx.prompt("Ruta en el teléfono:", "/sdcard/archivo.txt");
      if (!remote) return;
      await ctx.run(["pull", remote, "."]);
    },
  },
  {
    id: "respaldar-fotos",
    label: "Respaldar fotos (DCIM)",
    description: "Descarga toda la carpeta DCIM al PC.",
    run: async (ctx) => {
      ctx.log("Descargando /sdcard/DCIM… puede tardar según el tamaño.", "info");
      await ctx.run(["pull", "/sdcard/DCIM", "DCIM_backup"]);
      ctx.log("Fotos guardadas en la carpeta DCIM_backup.", "ok");
    },
  },
]);
