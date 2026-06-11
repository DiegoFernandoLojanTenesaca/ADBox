/** Estado global de la app (zustand): dispositivos, consola y ejecución. */

import { create } from "zustand";
import * as adb from "./lib/adb";
import type {
  ActionContext,
  AdbAction,
  AdbOutput,
  CategoryId,
  Device,
  LogEntry,
  LogLevel,
} from "./lib/types";

/** Diálogo modal pendiente (confirmación o entrada de texto). */
interface DialogRequest {
  kind: "confirm" | "prompt";
  message: string;
  placeholder?: string;
  resolve: (value: boolean | string | null) => void;
}

interface AppState {
  // ── adb / dispositivos ──────────────────────────────────────────────
  adbPath: string;
  adbReady: boolean;
  devices: Device[];
  selectedSerial: string | null;
  refreshing: boolean;
  init: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  selectDevice: (serial: string | null) => void;
  setAdbPath: (path: string) => Promise<void>;
  installing: boolean;
  installAdb: () => Promise<void>;
  debloatOpen: boolean;
  openDebloat: () => void;
  closeDebloat: () => void;

  // ── navegación ──────────────────────────────────────────────────────
  activeCategory: CategoryId;
  setCategory: (id: CategoryId) => void;

  // ── consola ─────────────────────────────────────────────────────────
  log: LogEntry[];
  appendLog: (text: string, level?: LogLevel) => void;
  clearLog: () => void;

  // ── ejecución de acciones ───────────────────────────────────────────
  runningActionId: string | null;
  runAction: (action: AdbAction) => Promise<void>;

  // ── logcat en vivo ──────────────────────────────────────────────────
  liveLogcatId: number | null;
  startLiveLogcat: (filter?: string[]) => Promise<void>;
  stopLiveLogcat: () => Promise<void>;

  // ── diálogos ────────────────────────────────────────────────────────
  dialog: DialogRequest | null;
}

let logSeq = 0;

/** El dispositivo seleccionado, o el primero "device" disponible. */
function pickDefault(devices: Device[], current: string | null): string | null {
  if (current && devices.some((d) => d.serial === current && d.state === "device")) {
    return current;
  }
  return devices.find((d) => d.state === "device")?.serial ?? null;
}

export const useStore = create<AppState>((set, get) => ({
  adbPath: "adb",
  adbReady: false,
  devices: [],
  selectedSerial: null,
  refreshing: false,

  init: async () => {
    try {
      const path = await adb.getPath();
      const ver = await adb.version();
      set({ adbPath: path, adbReady: ver.success });
      if (ver.success) {
        const firstLine = ver.stdout.split("\n")[0] ?? "adb listo";
        get().appendLog(`ADBox listo · ${firstLine}`, "ok");
      } else {
        get().appendLog(
          "No se detectó adb. Instálalo o fija su ruta en Ajustes.",
          "error",
        );
      }
    } catch (e) {
      set({ adbReady: false });
      get().appendLog(`Error inicializando adb: ${String(e)}`, "error");
    }
    await get().refreshDevices();
  },

  refreshDevices: async () => {
    if (get().refreshing) return;
    set({ refreshing: true });
    try {
      const list = await adb.devices();
      set((s) => ({
        devices: list,
        selectedSerial: pickDefault(list, s.selectedSerial),
      }));
    } catch (e) {
      get().appendLog(`No se pudieron listar dispositivos: ${String(e)}`, "error");
    } finally {
      set({ refreshing: false });
    }
  },

  selectDevice: (serial) => set({ selectedSerial: serial }),

  setAdbPath: async (path) => {
    try {
      const applied = await adb.setPath(path);
      set({ adbPath: applied, adbReady: true });
      get().appendLog(`Ruta de adb fijada: ${applied}`, "ok");
      await get().refreshDevices();
    } catch (e) {
      get().appendLog(String(e), "error");
    }
  },

  installing: false,

  installAdb: async () => {
    if (get().installing) return;
    set({ installing: true });
    get().appendLog("Descargando ADB (platform-tools oficial de Google)…", "info");
    try {
      const path = await adb.installAdb();
      set({ adbPath: path, adbReady: true });
      get().appendLog(`ADB instalado en: ${path}`, "ok");
      const ver = await adb.version();
      if (ver.success) get().appendLog(ver.stdout.split("\n")[0] ?? "adb listo", "ok");
      await get().refreshDevices();
    } catch (e) {
      get().appendLog(`No se pudo instalar ADB: ${String(e)}`, "error");
    } finally {
      set({ installing: false });
    }
  },

  debloatOpen: false,
  openDebloat: () => set({ debloatOpen: true }),
  closeDebloat: () => set({ debloatOpen: false }),

  activeCategory: "conexion",
  setCategory: (id) => set({ activeCategory: id }),

  log: [],
  appendLog: (text, level = "info") =>
    set((s) => ({ log: [...s.log, { id: ++logSeq, level, text }] })),
  clearLog: () => set({ log: [] }),

  runningActionId: null,

  runAction: async (action) => {
    const { selectedSerial, runningActionId, appendLog } = get();

    if (runningActionId) {
      appendLog("Espera a que termine la acción en curso.", "warn");
      return;
    }
    if (!action.implemented) {
      appendLog(`«${action.label}» aún no está implementada.`, "warn");
      return;
    }
    if (!selectedSerial) {
      appendLog("Conecta y selecciona un dispositivo primero.", "warn");
      return;
    }

    set({ runningActionId: action.id });
    appendLog(`▶ ${action.label}`, "info");

    const logOutput = (out: AdbOutput) => {
      appendLog(`$ ${out.command}`, "cmd");
      if (out.stdout) appendLog(out.stdout, "out");
      if (out.stderr) appendLog(out.stderr, out.success ? "warn" : "error");
    };

    const ctx: ActionContext = {
      serial: selectedSerial,
      run: async (args) => {
        const out = await adb.run(selectedSerial, args);
        logOutput(out);
        return out;
      },
      shell: async (command) => {
        const out = await adb.shell(selectedSerial, command);
        logOutput(out);
        return out;
      },
      shellQuiet: (command) => adb.shell(selectedSerial, command),
      log: (text, level = "out") => appendLog(text, level),
      confirm: (message) =>
        new Promise<boolean>((resolve) =>
          set({
            dialog: {
              kind: "confirm",
              message,
              resolve: (v) => {
                set({ dialog: null });
                resolve(Boolean(v));
              },
            },
          }),
        ),
      prompt: (message, placeholder) =>
        new Promise<string | null>((resolve) =>
          set({
            dialog: {
              kind: "prompt",
              message,
              placeholder,
              resolve: (v) => {
                set({ dialog: null });
                resolve(typeof v === "string" ? v : null);
              },
            },
          }),
        ),
    };

    try {
      await action.run(ctx);
      appendLog(`✔ ${action.label} — completado`, "ok");
    } catch (e) {
      appendLog(`✗ ${action.label} — ${String(e)}`, "error");
    } finally {
      set({ runningActionId: null });
    }
  },

  liveLogcatId: null,

  startLiveLogcat: async (filter = []) => {
    const { selectedSerial, appendLog } = get();
    if (!selectedSerial) {
      appendLog("Selecciona un dispositivo primero.", "warn");
      return;
    }
    if (get().liveLogcatId !== null) await get().stopLiveLogcat();
    try {
      const id = await adb.logcatStart(selectedSerial, ["-v", "time", ...filter]);
      set({ liveLogcatId: id });
    } catch (e) {
      appendLog(`No se pudo iniciar logcat: ${String(e)}`, "error");
    }
  },

  stopLiveLogcat: async () => {
    const id = get().liveLogcatId;
    if (id === null) return;
    try {
      await adb.logcatStop(id);
    } catch {
      /* el proceso pudo haber muerto ya */
    }
    set({ liveLogcatId: null });
    get().appendLog("Logcat en vivo detenido.", "info");
  },

  dialog: null,
}));
