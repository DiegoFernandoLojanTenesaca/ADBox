/** Seguridad — permisos, verificación de apps y administradores. */

import { build } from "./helpers";

export const seguridad = build("seguridad", [
  {
    id: "permisos-app",
    label: "Permisos de una app",
    description: "Muestra los permisos concedidos a un paquete.",
    run: async (ctx) => {
      const pkg = await ctx.prompt("Paquete:", "com.ejemplo.app");
      if (!pkg) return;
      await ctx.shell(
        `dumpsys package ${pkg} | grep -E 'granted=true|permission' | head -40`,
      );
    },
  },
  {
    id: "revocar-permiso",
    label: "Revocar un permiso",
    description: "Quita un permiso peligroso concedido a una app.",
    danger: "caution",
    run: async (ctx) => {
      const pkg = await ctx.prompt("Paquete:", "com.ejemplo.app");
      if (!pkg) return;
      const perm = await ctx.prompt("Permiso:", "android.permission.CAMERA");
      if (!perm) return;
      await ctx.shell(`pm revoke ${pkg} ${perm}`);
      ctx.log(`Permiso ${perm} revocado de ${pkg}.`, "ok");
    },
  },
  {
    id: "verificacion-apps",
    label: "Estado de verificación de apps",
    description: "Comprueba si la verificación de apps (Play Protect) está activa.",
    run: async (ctx) => {
      await ctx.shell("settings get global package_verifier_enable");
      await ctx.shell("settings get global verifier_verify_adb_installs");
    },
  },
  {
    id: "admins-dispositivo",
    label: "Administradores del dispositivo",
    description: "Lista apps con privilegios de administración.",
    run: async (ctx) => {
      await ctx.shell("dpm list-owners 2>/dev/null");
      await ctx.shell("dumpsys device_policy | grep -E 'Admin|package' | head -20");
    },
  },
  {
    id: "bloqueo-pantalla",
    label: "Estado del bloqueo de pantalla",
    description: "Indica si hay PIN/patrón/contraseña configurados.",
    run: async (ctx) => {
      await ctx.shell("locksettings get-disabled 2>/dev/null");
      ctx.log(
        "Nota: por seguridad, Android no permite leer el PIN/patrón vía adb.",
        "info",
      );
    },
  },
]);
