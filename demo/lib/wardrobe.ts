import type { BrandId, ItemStatus, WardrobeItem, WearDay } from "./types";
import { baseWardrobe, brandById, wearLog } from "./data";
import { daysSinceLastWeekday } from "./time";

/** État utilisateur nécessaire pour dériver la garde-robe (sérialisable, envoyé à l'API). */
export type WardrobeState = {
  connected: BrandId[];
  scanned: boolean;
  prefilled: boolean;
  overrides: Record<string, ItemOverride>;
  added: WardrobeItem[];
};

export type ItemOverride = {
  status?: ItemStatus;
  brandId?: BrandId | null;
  brandName?: string;
  size?: string;
  extraWears?: number;
  wornToday?: boolean;
};

export type DerivedItem = WardrobeItem & {
  timesWorn: number;
  lastWornDaysAgo: number | null;
  wornLastTuesday: boolean;
};

export function effectiveWearLog(today: Date): WearDay[] {
  const tue = daysSinceLastWeekday(today, wearLog.pinnedTuesday.weekday);
  return wearLog.days.map((d) =>
    d.daysAgo === tue ? { daysAgo: d.daysAgo, itemIds: wearLog.pinnedTuesday.itemIds, occasion: wearLog.pinnedTuesday.occasion } : d,
  );
}

export function visibleBaseItems(s: Pick<WardrobeState, "connected" | "scanned" | "prefilled">) {
  return baseWardrobe.filter((i) => {
    if (i.source === "import") return i.brandId ? s.connected.includes(i.brandId) : false;
    if (i.source === "video") return s.scanned;
    return s.scanned || s.prefilled;
  });
}

export function deriveWardrobe(s: WardrobeState, today: Date): DerivedItem[] {
  const log = effectiveWearLog(today);
  const tue = daysSinceLastWeekday(today, wearLog.pinnedTuesday.weekday);
  const all = [...visibleBaseItems(s), ...s.added];
  return all.map((it) => {
    const o = s.overrides[it.id] ?? {};
    const days = log.filter((d) => d.itemIds.includes(it.id)).map((d) => d.daysAgo);
    const lastLog = days.length ? Math.min(...days) : null;
    const wornLastTuesday = wearLog.pinnedTuesday.itemIds.includes(it.id);
    let status: ItemStatus = it.status;
    if (wearLog.pinnedTuesday.laundry.includes(it.id) && tue <= 6) status = "au linge";
    if (o.status) status = o.status;
    const brandId = o.brandId !== undefined ? o.brandId : it.brandId;
    const brandName = o.brandName ?? (brandId ? brandById[brandId].name : it.brandName);
    const missing = it.missing.filter((m) => !(m === "marque" && (o.brandName || o.brandId)) && !(m === "taille" && o.size));
    return {
      ...it,
      brandId,
      brandName,
      size: o.size ?? it.size,
      missing,
      status,
      timesWorn: it.baseWears + days.length + (o.extraWears ?? 0) + (o.wornToday ? 1 : 0),
      lastWornDaysAgo: o.wornToday ? 0 : lastLog ?? it.baseLastWornDaysAgo,
      wornLastTuesday,
    };
  });
}

export const isAvailable = (i: { status: ItemStatus }) => i.status === "disponible";

export const CATEGORY_LABELS: Record<string, string> = {
  hauts: "Hauts", chemises: "Chemises", maille: "Maille", pantalons: "Pantalons", vestes: "Vestes & manteaux",
  costumes: "Costumes", chaussures: "Chaussures", accessoires: "Accessoires", sport: "Sport",
};

export function wardrobeStats(items: DerivedItem[]) {
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const notWorn90 = items.filter((i) => i.lastWornDaysAgo === null || i.lastWornDaysAgo > 90);
  const atLaundry = items.filter((i) => i.status !== "disponible");
  const value = items.reduce((s, i) => s + (i.price ?? 0), 0);
  const brandsCount = new Set(items.map((i) => i.brandName).filter((b) => b !== "Marque inconnue")).size;
  const toEnrich = items.filter((i) => i.missing.length > 0);
  return {
    count,
    entries: items.length,
    notWorn90: notWorn90.length,
    notWorn90Pct: items.length ? Math.round((notWorn90.length / items.length) * 100) : 0,
    atLaundry: atLaundry.length,
    value,
    brandsCount,
    toEnrich: toEnrich.length,
  };
}
