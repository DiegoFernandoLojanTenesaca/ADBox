/** Optimización — debloat por marca, animaciones, recompilado AOT y Doze. */

import { useStore } from "../../store";
import { BLOAT_BRANDS, brandFor } from "../bloatware";
import { build, getprop } from "./helpers";

export const optimizacion = build("optimizacion", [
  {
    id: "debloat-seleccion",
    label: "Debloat con selección",
    description: "Elige con casillas qué bloatware de la marca desinstalar.",
    detail:
      "Abre una lista de las apps de marca instaladas para que marques cuáles quitar. Sin root y reversible.",
    cmd: "pm uninstall -k --user 0 <seleccionadas>",
    danger: "danger",
    free: true,
    run: async (ctx) => {
      useStore.getState().openDebloat();
      ctx.log("Abriendo selección de bloatware…", "info");
    },
  },
  {
    id: "debloat-marca",
    label: "Debloat automático por marca",
    description:
      "Detecta la marca y desinstala su bloatware para el usuario actual (sin root, reversible).",
    danger: "danger",
    run: async (ctx) => {
      const manu = await getprop(ctx, "ro.product.manufacturer");
      const brand = await getprop(ctx, "ro.product.brand");
      const b = brandFor(manu, brand);
      if (!b) {
        ctx.log(
          `Sin lista para «${manu}/${brand}». Revisa el debloat de Google o añade la marca a bloatware.ts.`,
          "warn",
        );
        return;
      }

      ctx.log(`Marca detectada: ${b.label}`, "info");
      const installed: string[] = [];
      for (const pkg of b.packages) {
        const r = await ctx.shellQuiet(`pm list packages ${pkg}`);
        if (r.stdout.includes(`package:${pkg}`)) installed.push(pkg);
      }

      if (installed.length === 0) {
        ctx.log("Ninguno de esos paquetes está instalado. Nada que limpiar. ✔", "ok");
        return;
      }

      ctx.log(`Bloatware presente (${installed.length}):\n  ${installed.join("\n  ")}`);
      const ok = await ctx.confirm(
        `Se desinstalarán ${installed.length} apps de ${b.label} para el usuario actual.\n` +
          "Es REVERSIBLE (se restauran con «Restaurar apps de marca» o un reset de fábrica). ¿Continuar?",
      );
      if (!ok) {
        ctx.log("Cancelado.", "warn");
        return;
      }

      let done = 0;
      for (const pkg of installed) {
        const r = await ctx.shell(`pm uninstall -k --user 0 ${pkg}`);
        if (r.stdout.includes("Success")) done++;
      }
      ctx.log(`Debloat completado: ${done}/${installed.length} desinstaladas.`, "ok");
    },
  },
  {
    id: "restaurar-marca",
    label: "Restaurar apps de marca",
    description: "Reinstala el bloatware quitado (install-existing) para el usuario actual.",
    run: async (ctx) => {
      const manu = await getprop(ctx, "ro.product.manufacturer");
      const brand = await getprop(ctx, "ro.product.brand");
      const b = brandFor(manu, brand);
      const list = b ? b.packages : BLOAT_BRANDS.flatMap((x) => x.packages);
      let done = 0;
      for (const pkg of list) {
        const r = await ctx.shellQuiet(`cmd package install-existing ${pkg}`);
        if (r.stdout.toLowerCase().includes("installed")) {
          done++;
          ctx.log(`restaurado: ${pkg}`, "out");
        }
      }
      ctx.log(`Restauradas ${done} apps.`, "ok");
    },
  },
  {
    id: "debloat-google",
    label: "Quitar apps de Google opcionales",
    description: "Desinstala Meet, YT Music, News y Drive para el usuario actual.",
    danger: "danger",
    run: async (ctx) => {
      const g = BLOAT_BRANDS.find((x) => x.key === "google")!;
      if (!(await ctx.confirm(`¿Quitar ${g.packages.length} apps de Google opcionales?`)))
        return;
      let done = 0;
      for (const pkg of g.packages) {
        const r = await ctx.shell(`pm uninstall -k --user 0 ${pkg}`);
        if (r.stdout.includes("Success")) done++;
      }
      ctx.log(`Listo: ${done}/${g.packages.length} desinstaladas.`, "ok");
    },
  },
  {
    id: "animaciones-rapidas",
    label: "Acelerar animaciones (0.5×)",
    description: "Reduce las escalas de animación a la mitad: la UI se siente más rápida.",
    run: async (ctx) => {
      await ctx.shell("settings put global window_animation_scale 0.5");
      await ctx.shell("settings put global transition_animation_scale 0.5");
      await ctx.shell("settings put global animator_duration_scale 0.5");
      ctx.log("Animaciones a 0.5×.", "ok");
    },
  },
  {
    id: "animaciones-off",
    label: "Desactivar animaciones",
    description: "Pone las escalas de animación a 0 (máxima sensación de velocidad).",
    run: async (ctx) => {
      for (const k of [
        "window_animation_scale",
        "transition_animation_scale",
        "animator_duration_scale",
      ]) {
        await ctx.shell(`settings put global ${k} 0`);
      }
      ctx.log("Animaciones desactivadas.", "ok");
    },
  },
  {
    id: "animaciones-default",
    label: "Restaurar animaciones (1×)",
    description: "Vuelve las escalas de animación a su valor de fábrica.",
    run: async (ctx) => {
      for (const k of [
        "window_animation_scale",
        "transition_animation_scale",
        "animator_duration_scale",
      ]) {
        await ctx.shell(`settings put global ${k} 1`);
      }
      ctx.log("Animaciones a 1× (predeterminado).", "ok");
    },
  },
  {
    id: "recompilar-aot",
    label: "Recompilar apps (AOT)",
    description: "Recompila todo a código nativo (speed). Mejora el arranque; tarda varios minutos.",
    danger: "caution",
    run: async (ctx) => {
      if (
        !(await ctx.confirm(
          "Recompilar TODAS las apps (AOT) puede tardar varios minutos. ¿Continuar?",
        ))
      )
        return;
      ctx.log("Recompilando… esto puede tardar. No desconectes el teléfono.", "info");
      await ctx.shell("cmd package compile -m speed -a");
      ctx.log("Recompilación AOT terminada.", "ok");
    },
  },
  {
    id: "doze-activar",
    label: "Activar Doze (ahorro)",
    description: "Habilita el ahorro de batería en reposo (deviceidle).",
    run: async (ctx) => {
      await ctx.shell("dumpsys deviceidle enable");
      ctx.log("Doze habilitado.", "ok");
    },
  },
]);
