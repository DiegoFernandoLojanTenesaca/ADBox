/** Reparación profunda — recompilar, reverificar y restablecer ajustes. */

import { build } from "./helpers";

export const reparacion = build("reparacion", [
  {
    id: "reverificar-apps",
    label: "Reverificar integridad de apps",
    description: "Reconcilia el estado de los paquetes instalados.",
    run: async (ctx) => {
      await ctx.shell("pm reconcile 2>/dev/null || pm list packages -f | wc -l");
      ctx.log("Reconciliación de paquetes solicitada.", "ok");
    },
  },
  {
    id: "reset-permisos",
    label: "Restablecer permisos en tiempo de ejecución",
    description: "Devuelve todos los permisos runtime a su estado por defecto.",
    danger: "caution",
    run: async (ctx) => {
      if (!(await ctx.confirm("¿Restablecer TODOS los permisos de apps a su valor por defecto?")))
        return;
      await ctx.shell("pm reset-permissions");
      ctx.log("Permisos restablecidos.", "ok");
    },
  },
  {
    id: "reindexar-media",
    label: "Reindexar archivos multimedia",
    description: "Fuerza un nuevo escaneo de la galería/medios.",
    run: async (ctx) => {
      await ctx.shell(
        "am broadcast -a android.intent.action.MEDIA_MOUNTED -d file:///sdcard 2>/dev/null",
      );
      ctx.log("Reescaneo de medios solicitado.", "ok");
    },
  },
  {
    id: "limpiar-dalvik",
    label: "Recompilar runtime (perfiles)",
    description: "Limpia perfiles y recompila apps por uso (mejora estabilidad).",
    danger: "caution",
    run: async (ctx) => {
      if (!(await ctx.confirm("¿Recompilar apps según perfiles? Puede tardar.")))
        return;
      await ctx.shell("cmd package compile -m speed-profile -a");
      ctx.log("Recompilación por perfiles terminada.", "ok");
    },
  },
  {
    id: "reset-ajustes-red",
    label: "Restablecer DNS y animaciones",
    description: "Devuelve DNS privado y escalas de animación a sus valores por defecto.",
    run: async (ctx) => {
      await ctx.shell("settings put global private_dns_mode off");
      for (const k of [
        "window_animation_scale",
        "transition_animation_scale",
        "animator_duration_scale",
      ]) {
        await ctx.shell(`settings put global ${k} 1`);
      }
      ctx.log("DNS y animaciones restablecidos.", "ok");
    },
  },
]);
