/** Apps — listar, instalar, desinstalar, forzar detención y respaldar APK. */

import { build } from "./helpers";

export const apps = build("apps", [
  {
    id: "listar-usuario",
    label: "Listar apps de usuario",
    description: "Paquetes instalados por el usuario (terceros).",
    free: true,
    run: async (ctx) => {
      const r = await ctx.shellQuiet("pm list packages -3");
      const pkgs = r.stdout
        .split("\n")
        .map((l) => l.replace("package:", "").trim())
        .filter(Boolean)
        .sort();
      ctx.log(`${pkgs.length} apps de usuario:`, "info");
      ctx.log(pkgs.join("\n"));
    },
  },
  {
    id: "listar-sistema",
    label: "Listar apps de sistema",
    description: "Paquetes preinstalados / del sistema.",
    run: async (ctx) => {
      await ctx.shell("pm list packages -s");
    },
  },
  {
    id: "buscar-app",
    label: "Buscar app por nombre",
    description: "Filtra los paquetes que contengan un texto.",
    run: async (ctx) => {
      const q = await ctx.prompt("Texto a buscar en el nombre del paquete:", "ej. whatsapp");
      if (!q) return;
      await ctx.shell(`pm list packages ${q}`);
    },
  },
  {
    id: "desinstalar-app",
    label: "Desinstalar una app",
    description: "Desinstala un paquete para el usuario actual (reversible).",
    danger: "danger",
    run: async (ctx) => {
      const pkg = await ctx.prompt("Paquete a desinstalar:", "com.ejemplo.app");
      if (!pkg) return;
      if (!(await ctx.confirm(`¿Desinstalar ${pkg} para el usuario actual?`))) return;
      await ctx.shell(`pm uninstall -k --user 0 ${pkg}`);
    },
  },
  {
    id: "forzar-detencion",
    label: "Forzar detención",
    description: "Detiene por completo una app en ejecución.",
    danger: "caution",
    run: async (ctx) => {
      const pkg = await ctx.prompt("Paquete a forzar detención:", "com.ejemplo.app");
      if (!pkg) return;
      await ctx.shell(`am force-stop ${pkg}`);
      ctx.log(`${pkg} detenida.`, "ok");
    },
  },
  {
    id: "limpiar-datos",
    label: "Borrar datos de una app",
    description: "Restablece una app borrando sus datos y caché.",
    danger: "danger",
    run: async (ctx) => {
      const pkg = await ctx.prompt("Paquete cuyos datos borrar:", "com.ejemplo.app");
      if (!pkg) return;
      if (!(await ctx.confirm(`¿Borrar TODOS los datos de ${pkg}? No se puede deshacer.`)))
        return;
      await ctx.shell(`pm clear ${pkg}`);
    },
  },
  {
    id: "respaldar-apk",
    label: "Respaldar APK al PC",
    description: "Extrae el APK de una app instalada a la carpeta del programa.",
    run: async (ctx) => {
      const pkg = await ctx.prompt("Paquete cuyo APK respaldar:", "com.ejemplo.app");
      if (!pkg) return;
      const path = await ctx.shellQuiet(`pm path ${pkg}`);
      const apk = path.stdout.replace("package:", "").trim().split("\n")[0];
      if (!apk) {
        ctx.log(`No se encontró el APK de ${pkg}.`, "error");
        return;
      }
      await ctx.run(["pull", apk, `${pkg}.apk`]);
      ctx.log(`APK guardado como ${pkg}.apk en la carpeta del programa.`, "ok");
    },
  },
  {
    id: "instalar-apk",
    label: "Instalar un APK",
    description: "Instala un .apk desde una ruta del PC.",
    danger: "caution",
    run: async (ctx) => {
      const ruta = await ctx.prompt("Ruta del APK en el PC:", "/ruta/app.apk");
      if (!ruta) return;
      await ctx.run(["install", "-r", ruta]);
    },
  },
]);
