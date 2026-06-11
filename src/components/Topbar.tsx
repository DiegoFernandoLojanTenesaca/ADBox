/** Barra superior: dispositivo activo, estado de adb y acciones globales. */

import {
  Download,
  Loader2,
  RefreshCw,
  Settings,
  Smartphone,
  Square,
  Usb,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { AdbSettings } from "./AdbSettings";
import { useStore } from "../store";

export function Topbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const devices = useStore((s) => s.devices);
  const selected = useStore((s) => s.selectedSerial);
  const selectDevice = useStore((s) => s.selectDevice);
  const refreshDevices = useStore((s) => s.refreshDevices);
  const refreshing = useStore((s) => s.refreshing);
  const adbReady = useStore((s) => s.adbReady);
  const liveLogcatId = useStore((s) => s.liveLogcatId);
  const stopLiveLogcat = useStore((s) => s.stopLiveLogcat);
  const installing = useStore((s) => s.installing);
  const installAdb = useStore((s) => s.installAdb);

  const ready = devices.filter((d) => d.state === "device");
  const current = devices.find((d) => d.serial === selected);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      {/* Estado de adb */}
      <div className="flex items-center gap-2">
        <span
          className={
            "size-2 rounded-full " + (adbReady ? "bg-ok" : "bg-danger")
          }
          title={adbReady ? "adb disponible" : "adb no detectado"}
        />
        <span className="text-sm text-muted">adb</span>
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Instalación de ADB (si falta) o selector de dispositivo */}
      {!adbReady ? (
        <button
          onClick={installAdb}
          disabled={installing}
          className="flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-2 disabled:opacity-60"
          title="Descarga el ADB oficial de Google y lo deja listo"
        >
          {installing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {installing ? "Instalando ADB…" : "Instalar ADB automáticamente"}
        </button>
      ) : (
        <>
          <Smartphone className="size-4 text-[color:var(--color-text)]" />
          {ready.length === 0 ? (
            <span className="text-sm text-muted">Sin dispositivos conectados</span>
          ) : (
            <select
              value={selected ?? ""}
              onChange={(e) => selectDevice(e.target.value)}
              className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm font-medium text-white outline-none focus:border-accent"
            >
              {ready.map((d) => (
                <option key={d.serial} value={d.serial}>
                  {d.model ?? d.serial} ({d.serial})
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {current &&
        (current.connection === "tcp" ? (
          <Wifi className="size-4 text-ok" />
        ) : (
          <Usb className="size-4 text-muted" />
        ))}

      {/* Dispositivos no autorizados / offline */}
      {devices.some((d) => d.state !== "device") && (
        <span className="text-xs text-warn">
          {devices.filter((d) => d.state !== "device").length} sin autorizar/offline
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {liveLogcatId !== null && (
          <button
            onClick={stopLiveLogcat}
            className="flex items-center gap-1.5 rounded-md bg-danger/15 px-3 py-1.5 text-sm text-danger hover:bg-danger/25"
          >
            <Square className="size-3.5 fill-current" />
            Detener logcat
          </button>
        )}
        <button
          onClick={refreshDevices}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
        >
          <RefreshCw className={"size-3.5 " + (refreshing ? "animate-spin" : "")} />
          Actualizar
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center rounded-md border border-border bg-surface-2 p-2 hover:border-accent"
          title="Ajustes de ADB"
        >
          <Settings className="size-4" />
        </button>
      </div>
      </header>
      {settingsOpen && <AdbSettings onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
