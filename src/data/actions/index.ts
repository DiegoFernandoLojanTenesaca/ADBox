/** Catálogo completo de acciones, agregado desde cada categoría. */

import type { AdbAction, CategoryId } from "../../lib/types";
import { ajustes } from "./ajustes";
import { almacenamiento } from "./almacenamiento";
import { apps } from "./apps";
import { archivos } from "./archivos";
import { bateria } from "./bateria";
import { conexion } from "./conexion";
import { diagnostico } from "./diagnostico";
import { hardware } from "./hardware";
import { mantenimiento } from "./mantenimiento";
import { optimizacion } from "./optimizacion";
import { pantalla } from "./pantalla";
import { rendimiento } from "./rendimiento";
import { reparacion } from "./reparacion";
import { red } from "./red";
import { seguridad } from "./seguridad";

/** Todas las acciones del toolkit, en un único array. */
export const ALL_ACTIONS: AdbAction[] = [
  ...conexion,
  ...red,
  ...optimizacion,
  ...bateria,
  ...almacenamiento,
  ...apps,
  ...diagnostico,
  ...pantalla,
  ...hardware,
  ...ajustes,
  ...archivos,
  ...rendimiento,
  ...seguridad,
  ...reparacion,
  ...mantenimiento,
];

/** Acciones de una categoría concreta. */
export function actionsFor(category: CategoryId): AdbAction[] {
  return ALL_ACTIONS.filter((a) => a.category === category);
}

/** Número total de acciones (para mostrar en la UI). */
export const ACTION_COUNT = ALL_ACTIONS.length;
