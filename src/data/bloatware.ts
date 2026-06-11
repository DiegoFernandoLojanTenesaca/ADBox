/**
 * Catálogo de bloatware por fabricante.
 *
 * Todos los paquetes de aquí se quitan con `pm uninstall --user 0 <pkg>`, que
 * NO requiere root y es reversible: vuelven con `cmd package install-existing`
 * o con un restablecimiento de fábrica. Por eso solo se incluyen apps de marca
 * NO esenciales (asistentes, tiendas alternativas, juegos preinstalados,
 * promociones). Nunca servicios del sistema cuya eliminación deje el equipo
 * inestable.
 *
 * Las listas son conservadoras a propósito. Ampliarlas es bienvenido: revisa
 * cada paquete antes de añadirlo.
 */

export interface BloatBrand {
  key: string;
  /** Nombre legible. */
  label: string;
  /** Coincidencias de `ro.product.manufacturer` / `ro.product.brand` (minúsculas). */
  match: string[];
  packages: string[];
}

export const BLOAT_BRANDS: BloatBrand[] = [
  {
    key: "samsung",
    label: "Samsung (One UI)",
    match: ["samsung"],
    packages: [
      "com.samsung.android.bixby.agent", // Bixby
      "com.samsung.android.bixby.wakeup",
      "com.samsung.android.bixbyvision.framework",
      "com.samsung.android.app.spage", // Samsung Free / panel Bixby
      "com.samsung.android.app.news",
      "com.samsung.android.game.gamehome",
      "com.samsung.android.game.gametools",
      "com.samsung.android.app.tips",
      "com.samsung.android.scloud", // Samsung Cloud (opcional)
      "com.facebook.appmanager",
      "com.facebook.services",
      "com.facebook.system",
      "com.microsoft.skydrive", // OneDrive preinstalado
      "com.linkedin.android",
    ],
  },
  {
    key: "xiaomi",
    label: "Xiaomi / Redmi / POCO (MIUI/HyperOS)",
    match: ["xiaomi", "redmi", "poco"],
    packages: [
      "com.miui.analytics",
      "com.miui.msa.global", // sistema de anuncios MSA
      "com.xiaomi.mipicks", // GetApps (tienda)
      "com.miui.player",
      "com.miui.video",
      "com.mi.globalbrowser",
      "com.miui.bugreport",
      "com.xiaomi.glgm", // juegos
      "com.miui.cloudservice",
      "com.facebook.appmanager",
      "com.facebook.services",
      "com.facebook.system",
    ],
  },
  {
    key: "motorola",
    label: "Motorola",
    match: ["motorola", "moto"],
    packages: [
      "com.facebook.appmanager",
      "com.facebook.services",
      "com.facebook.system",
      "com.motorola.genie", // ayuda
      "com.motorola.motocare", // Moto Care / soporte
      "com.tmobile.pr.adapt",
    ],
  },
  {
    key: "oppo",
    label: "OPPO / Realme (ColorOS)",
    match: ["oppo", "realme"],
    packages: [
      "com.coloros.gamespace",
      "com.coloros.video",
      "com.coloros.music",
      "com.heytap.browser",
      "com.heytap.market", // App Market
      "com.coloros.weather2",
      "com.facebook.appmanager",
      "com.facebook.services",
      "com.facebook.system",
    ],
  },
  {
    key: "vivo",
    label: "Vivo / iQOO (Funtouch/OriginOS)",
    match: ["vivo", "iqoo"],
    packages: [
      "com.vivo.gamewatch",
      "com.vivo.browser",
      "com.vivo.appstore",
      "com.vivo.assistant",
      "com.vivo.email",
      "com.facebook.appmanager",
      "com.facebook.services",
      "com.facebook.system",
    ],
  },
  {
    key: "huawei",
    label: "Huawei / Honor (EMUI/MagicOS)",
    match: ["huawei", "honor"],
    packages: [
      "com.huawei.browser",
      "com.huawei.hwireader", // lector
      "com.huawei.gameassistant",
      "com.huawei.android.tips",
      "com.huawei.appmarket", // AppGallery (¡es la tienda! revísalo)
    ],
  },
  {
    key: "google",
    label: "Apps de Google opcionales (cualquier marca)",
    match: [], // no se autodetecta: lista opcional aplicable a todos
    packages: [
      "com.google.android.apps.tachyon", // Meet (antes Duo)
      "com.google.android.apps.youtube.music",
      "com.google.android.apps.magazines", // Google News
      "com.google.android.apps.docs", // Drive
    ],
  },
];

/** Devuelve la lista que corresponde a un fabricante/marca, si la hay. */
export function brandFor(manufacturer: string, brand: string): BloatBrand | null {
  const hay = `${manufacturer} ${brand}`.toLowerCase();
  return (
    BLOAT_BRANDS.find(
      (b) => b.match.length > 0 && b.match.some((m) => hay.includes(m)),
    ) ?? null
  );
}
