/** Conexión — información del equipo, ADB por Wi-Fi y reinicios. */

import { build, getprop } from "./helpers";

export const conexion = build("conexion", [
  {
    id: "info-equipo",
    label: "Información del equipo",
    description: "Marca, modelo, Android, build y nivel de parche de seguridad.",
    free: true,
    run: async (ctx) => {
      const props: [string, string][] = [
        ["Marca", "ro.product.manufacturer"],
        ["Modelo", "ro.product.model"],
        ["Nombre comercial", "ro.product.name"],
        ["Android", "ro.build.version.release"],
        ["Nivel API (SDK)", "ro.build.version.sdk"],
        ["Build", "ro.build.display.id"],
        ["Parche de seguridad", "ro.build.version.security_patch"],
        ["Arquitectura", "ro.product.cpu.abi"],
      ];
      for (const [titulo, key] of props) {
        const v = await getprop(ctx, key);
        ctx.log(`${titulo.padEnd(22)} ${v || "—"}`);
      }
    },
  },
  {
    id: "serial-imei",
    label: "Serie y estado de conexión",
    description: "Número de serie del dispositivo y modo de transporte.",
    run: async (ctx) => {
      await ctx.run(["get-serialno"]);
      await ctx.run(["get-state"]);
    },
  },
  {
    id: "adb-wifi",
    label: "Activar ADB por Wi-Fi",
    description: "Pone adb en modo TCP/IP (puerto 5555) para conectar sin cable.",
    danger: "caution",
    run: async (ctx) => {
      const ip = await ctx.shellQuiet(
        "ip -f inet addr show wlan0 | grep -oE 'inet [0-9.]+' | cut -d' ' -f2",
      );
      await ctx.run(["tcpip", "5555"]);
      const addr = ip.stdout.trim();
      if (addr) {
        ctx.log(`Ahora puedes conectar por Wi-Fi con:`, "info");
        ctx.log(`adb connect ${addr}:5555`, "ok");
      } else {
        ctx.log(
          "ADB TCP/IP activado. Conecta con: adb connect <IP-del-teléfono>:5555",
          "info",
        );
      }
    },
  },
  {
    id: "reiniciar",
    label: "Reiniciar (normal)",
    description: "Reinicia el dispositivo de forma normal.",
    danger: "caution",
    run: async (ctx) => {
      if (!(await ctx.confirm("¿Reiniciar el dispositivo ahora?"))) return;
      await ctx.run(["reboot"]);
    },
  },
  {
    id: "reiniciar-recovery",
    label: "Reiniciar a Recovery",
    description: "Arranca en el modo recovery.",
    danger: "danger",
    run: async (ctx) => {
      if (!(await ctx.confirm("¿Reiniciar en modo RECOVERY?"))) return;
      await ctx.run(["reboot", "recovery"]);
    },
  },
  {
    id: "reiniciar-bootloader",
    label: "Reiniciar a Bootloader",
    description: "Arranca en el bootloader / fastboot.",
    danger: "danger",
    run: async (ctx) => {
      if (!(await ctx.confirm("¿Reiniciar en modo BOOTLOADER (fastboot)?"))) return;
      await ctx.run(["reboot", "bootloader"]);
    },
  },
]);
