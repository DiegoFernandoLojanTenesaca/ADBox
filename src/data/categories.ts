/** Las 15 categorías del toolkit, en el orden en que se muestran. */

import type { Category } from "../lib/types";

export const CATEGORIES: Category[] = [
  {
    id: "conexion",
    name: "Conexión",
    description: "Info del equipo, ADB por Wi-Fi y reinicios.",
    icon: "Plug",
  },
  {
    id: "red",
    name: "Red e Internet",
    description: "Diagnóstico por capas, DNS, datos y Wi-Fi.",
    icon: "Wifi",
  },
  {
    id: "optimizacion",
    name: "Optimización",
    description: "Debloat por marca, animaciones, AOT y Doze.",
    icon: "Rocket",
  },
  {
    id: "bateria",
    name: "Batería",
    description: "Estado, temperatura y salud real (capacidad/ciclos).",
    icon: "BatteryCharging",
  },
  {
    id: "almacenamiento",
    name: "Almacenamiento",
    description: "Uso, limpiar caché, liberar RAM y TRIM.",
    icon: "HardDrive",
  },
  {
    id: "apps",
    name: "Apps",
    description: "Listar, instalar, desinstalar y respaldar APK.",
    icon: "Boxes",
  },
  {
    id: "diagnostico",
    name: "Diagnóstico",
    description: "Crashes/ANR, logcat en vivo y bugreport.",
    icon: "Stethoscope",
  },
  {
    id: "pantalla",
    name: "Pantalla y captura",
    description: "Captura al PC, toques/teclas y encender/apagar.",
    icon: "Camera",
  },
  {
    id: "hardware",
    name: "Hardware",
    description: "Sensores, CPU, IMEI e identificadores.",
    icon: "Cpu",
  },
  {
    id: "ajustes",
    name: "Ajustes",
    description: "Settings del sistema: global, secure y system.",
    icon: "SlidersHorizontal",
  },
  {
    id: "archivos",
    name: "Archivos y Respaldo",
    description: "Push/pull de archivos y respaldos.",
    icon: "FolderArchive",
  },
  {
    id: "rendimiento",
    name: "Rendimiento en vivo",
    description: "CPU, memoria y FPS en tiempo real.",
    icon: "Gauge",
  },
  {
    id: "seguridad",
    name: "Seguridad",
    description: "Permisos, verificación y bloqueo.",
    icon: "ShieldCheck",
  },
  {
    id: "reparacion",
    name: "Reparación profunda",
    description: "Recovery, reparar paquetes y ajustes de sistema.",
    icon: "Wrench",
  },
  {
    id: "mantenimiento",
    name: "Mantenimiento completo",
    description: "Optimización automática en un clic.",
    icon: "Sparkles",
  },
];
