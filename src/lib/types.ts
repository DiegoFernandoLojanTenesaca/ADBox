/** Tipos compartidos entre el backend (Rust) y la UI. */

/** Dispositivo reportado por `adb devices -l`. Refleja `adb::Device` en Rust. */
export interface Device {
  serial: string;
  state: string; // device | unauthorized | offline | recovery | …
  model: string | null;
  product: string | null;
  transport_id: string | null;
  connection: "usb" | "tcp";
}

/** Resultado de un comando adb. Refleja `adb::AdbOutput` en Rust. */
export interface AdbOutput {
  success: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  command: string;
}

/** Nivel de riesgo de una acción, usado para colorear y pedir confirmación. */
export type Danger = "safe" | "caution" | "danger";

/** Identificadores de las 15 categorías del toolkit. */
export type CategoryId =
  | "conexion"
  | "red"
  | "optimizacion"
  | "bateria"
  | "almacenamiento"
  | "apps"
  | "diagnostico"
  | "pantalla"
  | "hardware"
  | "ajustes"
  | "archivos"
  | "rendimiento"
  | "seguridad"
  | "reparacion"
  | "mantenimiento";

/** Metadatos de una categoría (lo que se ve en la barra lateral). */
export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** Nombre del icono de lucide-react. */
  icon: string;
}

/** Niveles del registro de la consola. */
export type LogLevel = "info" | "cmd" | "out" | "ok" | "warn" | "error";

/** Una línea en la consola de salida. */
export interface LogEntry {
  id: number;
  level: LogLevel;
  text: string;
}

/**
 * Contexto que recibe cada acción al ejecutarse. Le da acceso controlado a adb
 * y a la consola, sin que la acción necesite conocer la store ni Tauri.
 */
export interface ActionContext {
  /** Serial del dispositivo activo (las acciones asumen que hay uno). */
  serial: string;
  /** Ejecuta `adb <args>` y vuelca el comando + salida en la consola. */
  run: (args: string[]) => Promise<AdbOutput>;
  /** Ejecuta `adb shell <command>` y vuelca el comando + salida en la consola. */
  shell: (command: string) => Promise<AdbOutput>;
  /** Versión silenciosa de shell: ejecuta y devuelve sin tocar la consola. */
  shellQuiet: (command: string) => Promise<AdbOutput>;
  /** Escribe una línea propia en la consola. */
  log: (text: string, level?: LogLevel) => void;
  /** Pide confirmación (sí/no) antes de una acción peligrosa. */
  confirm: (message: string) => Promise<boolean>;
  /** Pide un texto al usuario (devuelve null si cancela). */
  prompt: (message: string, placeholder?: string) => Promise<string | null>;
}

/** El "verbo" que ejecuta una acción concreta. */
export type ActionRunner = (ctx: ActionContext) => Promise<void>;

/** Una acción del catálogo: una tarjeta clicable dentro de una categoría. */
export interface AdbAction {
  id: string;
  category: CategoryId;
  label: string;
  description: string;
  /** Detalle ampliado (qué hace exactamente), mostrado en el tooltip de la «i». */
  detail?: string;
  danger: Danger;
  /** false → tarjeta visible pero marcada como "próximamente". */
  implemented: boolean;
  /** Si true, forma parte de las 6 funciones gratis de referencia. */
  free?: boolean;
  run: ActionRunner;
}
