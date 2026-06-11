/** Franja con la información del dispositivo activo (se carga al seleccionarlo). */

import {
  BatteryCharging,
  Cpu,
  Hash,
  Loader2,
  Smartphone,
  Usb,
  Wifi,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import * as adb from "../lib/adb";
import { useStore } from "../store";

interface DevInfo {
  model: string;
  brand: string;
  android: string;
  sdk: string;
  level: string;
  temp: string;
}

export function DeviceInfo() {
  const serial = useStore((s) => s.selectedSerial);
  const devices = useStore((s) => s.devices);
  const conn = devices.find((d) => d.serial === serial)?.connection;

  const [info, setInfo] = useState<DevInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serial) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const get = async (cmd: string) =>
        (await adb.shell(serial, cmd)).stdout.trim();
      try {
        const [model, brand, android, sdk] = await Promise.all([
          get("getprop ro.product.model"),
          get("getprop ro.product.manufacturer"),
          get("getprop ro.build.version.release"),
          get("getprop ro.build.version.sdk"),
        ]);
        const bat = (await adb.shell(serial, "dumpsys battery")).stdout;
        const level = bat.match(/level:\s*(\d+)/)?.[1] ?? "—";
        const tempRaw = bat.match(/temperature:\s*(\d+)/)?.[1];
        if (!cancelled) {
          setInfo({
            model,
            brand,
            android,
            sdk,
            level,
            temp: tempRaw ? (parseInt(tempRaw, 10) / 10).toFixed(0) : "—",
          });
        }
      } catch {
        if (!cancelled) setInfo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serial]);

  if (!serial) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border bg-surface/60 px-5 py-3">
      <div className="flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Smartphone className="size-6" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-semibold">
            {info?.model || serial}
          </span>
          {loading && <Loader2 className="size-3.5 animate-spin text-muted" />}
        </div>
        <div className="text-xs text-muted">{info?.brand || "Leyendo…"}</div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Chip
          icon={<Cpu className="size-3.5" />}
          label="Android"
          value={info ? `${info.android} · API ${info.sdk}` : "…"}
        />
        <Chip
          icon={<BatteryCharging className="size-3.5" />}
          label="Batería"
          value={info ? `${info.level}% · ${info.temp} °C` : "…"}
        />
        <Chip
          icon={conn === "tcp" ? <Wifi className="size-3.5" /> : <Usb className="size-3.5" />}
          label="Conexión"
          value={conn === "tcp" ? "Wi-Fi" : "USB"}
        />
        <Chip icon={<Hash className="size-3.5" />} label="Serie" value={serial} />
      </div>
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5">
      <span className="text-muted">{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
        <div className="text-xs font-medium">{value}</div>
      </div>
    </div>
  );
}
