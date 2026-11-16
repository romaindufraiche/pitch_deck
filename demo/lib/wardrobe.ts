import type { BrandId, ItemStatus, WardrobeItem, WearDay } from "./types";
import { baseWardrobe, brandById, wearLogs } from "./data";
import type { PersonaId } from "./types";
import { daysSinceLastWeekday } from "./time";

/** État utilisateur nécessaire pour dériver la garde-robe (sérialisable, envoyé à l'API). */
export type WardrobeState = {
  persona: PersonaId;
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

export function effectiveWearLog(today: Date, persona: PersonaId = "thomas"): WearDay[] {
  const log = wearLogs[persona];
  const tue = daysSinceLastWeekday(today, log.pinned.weekday);
  return log.days.map((d) => (d.daysAgo === tue ? { daysAgo: d.daysAgo, itemIds: log.pinned.itemIds, occasion: log.pinned.occasion } : d));
}

export function visibleBaseItems(s: Pick<WardrobeState, "persona" | "connected" | "scanned" | "prefilled">) {
  return baseWardrobe.filter((i) => {
    if (i.persona !== (s.persona ?? "thomas")) return false;
    if (i.source === "import") return i.brandId ? s.connected.includes(i.brandId) : false;
    if (i.source === "video") return s.scanned;
    return s.scanned || s.prefilled;
  });
}

export function deriveWardrobe(s: WardrobeState, today: Date): DerivedItem[] {
  const persona = s.persona ?? "thomas";
  const log = effectiveWearLog(today, persona);
  const pinned = wearLogs[persona].pinned;
  const tue = daysSinceLastWeekday(today, pinned.weekday);
  const all = [...visibleBaseItems(s), ...s.added];
  return all.map((it) => {
    const o = s.overrides[it.id] ?? {};
    const days = log.filter((d) => d.itemIds.includes(it.id)).map((d) => d.daysAgo);
    const lastLog = days.length ? Math.min(...days) : null;
    const wornLastTuesday = pinned.itemIds.includes(it.id);
    let status: ItemStatus = it.status;
    if (pinned.laundry.includes(it.id) && tue <= 6) status = "au linge";
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
  costumes: "Costumes & tailleurs", robes: "Robes", jupes: "Jupes", chaussures: "Chaussures", accessoires: "Sacs & accessoires", sport: "Sport",
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
