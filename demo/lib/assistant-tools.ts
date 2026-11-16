import type { BrandId, Product, UserProfile } from "./types";
import { brandById, forGender, orders, products, productById, weather } from "./data";
import { calendar, cap, longDate, relativeDay, addDays } from "./time";
import { effectiveWearLog, type DerivedItem } from "./wardrobe";
import { recommendSize, systemFor, type SizeHistory, type SizeRecommendation } from "./sizing";
import type { Card } from "./cards";

/** Contexte d'exécution des outils : la garde-robe dérivée de l'état client et la date du jour. */
export type ToolContext = { items: DerivedItem[]; today: Date; connected: BrandId[]; budget: number; user: UserProfile };

const compact = (i: DerivedItem) => ({
  id: i.id, nom: i.name, marque: i.brandName, categorie: i.category, type: i.subcategory, couleur: i.color.name,
  taille: i.size, formalite: i.formality, saison: i.season, statut: i.status, ports: i.timesWorn,
  dernier_port: i.lastWornDaysAgo === null ? "jamais (ou inconnu)" : i.lastWornDaysAgo === 0 ? "aujourd'hui" : `il y a ${i.lastWornDaysAgo} j`,
  ...(i.quantity > 1 ? { quantite: i.quantity } : {}),
});

export function getWardrobe(ctx: ToolContext, input: { category?: string; availableOnly?: boolean } = {}) {
  let list = ctx.items;
  if (input.category) list = list.filter((i) => i.category === input.category);
  if (input.availableOnly) list = list.filter((i) => i.status === "disponible");
  return { nombre_articles: list.length, articles: list.map(compact) };
}

export function getWearHistory(ctx: ToolContext, input: { days?: number } = {}) {
  const days = Math.min(30, input.days ?? 14);
  const byId = new Map(ctx.items.map((i) => [i.id, i]));
  return effectiveWearLog(ctx.today, ctx.user.id)
    .filter((d) => d.daysAgo <= days)
    .map((d) => {
      const date = addDays(ctx.today, -d.daysAgo);
      return { jour: `${relativeDay(ctx.today, date)} (${longDate(date)})`, occasion: d.occasion, tenue: d.itemIds.map((id) => byId.get(id)).filter(Boolean).map((i) => `${i!.name} [${i!.id}]`) };
    });
}

export function getCalendar(ctx: ToolContext) {
  return calendar(ctx.today).map((e) => ({
    id: e.id, quand: `${e.label} — ${longDate(e.date)}${e.time ? `, ${e.time.replace(":", " h ")}` : ""}${e.durationDays ? ` (${e.durationDays} jours)` : ""}`,
    titre: e.title, lieu: e.place, dress_code: e.dressCode, precisions: e.dressCodeNote,
  }));
}

export function getWeather(ctx: ToolContext) {
  return {
    ville: weather.city,
    jours: weather.days.map((d) => ({
      jour: `${cap(relativeDay(ctx.today, addDays(ctx.today, d.offset)))} (${longDate(addDays(ctx.today, d.offset))})`,
      min: `${d.tempMin} °C`, max: `${d.tempMax} °C`, ciel: d.condition, pluie: `${d.rainProb} %`, vent: `${d.wind} km/h`,
    })),
    lyon_saisonnier: "Lyon, mi-décembre : 2 à 8 °C, brouillard matinal fréquent, pluie un jour sur trois.",
    juin_saisonnier: "Mi-juin en Île-de-France : 16 à 26 °C, ensoleillé.",
  };
}

export function searchCatalog(ctx: ToolContext, input: { query?: string; category?: string; color?: string; maxPrice?: number; connectedOnly?: boolean; gender?: "homme" | "femme" | "tous" }) {
  const q = (input.query ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const scored = products
    .filter(forGender(input.gender ?? ctx.user.gender))
    .filter((p) => (!input.category || p.category === input.category) && (!input.maxPrice || p.price <= input.maxPrice))
    .filter((p) => !input.color || norm(p.color.name).includes(norm(input.color)))
    .filter((p) => !input.connectedOnly || ctx.connected.includes(p.brandId))
    .map((p) => {
      const hay = norm(`${p.name} ${p.subcategory} ${p.description} ${p.material} ${p.color.name} ${p.season}`);
      const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) + (ctx.connected.includes(p.brandId) ? 0.5 : 0);
      return { p, score };
    })
    .filter((x) => !words.length || x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  return scored.map(({ p }) => ({
    id: p.id, nom: p.name, marque: brandById[p.brandId].name, marque_connectee: ctx.connected.includes(p.brandId), prix: `${p.price} €`,
    couleur: p.color.name, matiere: p.material, coupe: p.fit, saison: p.season, formalite: p.formality,
    tailles_en_stock: p.sizes.filter((s) => s.stock > 0).map((s) => s.size), note: `${p.rating}/5 (${p.reviews} avis)`, taux_retour: `${p.returnRate} %`,
  }));
}

/** Historique de tailles chez une marque, dans le même système de tailles que le produit. */
export function sizeHistory(ctx: ToolContext, product: Product): SizeHistory[] {
  const sys = systemFor(product.category, product.sizes.map((s) => s.size));
  const kept = ctx.items
    .filter((i) => i.brandId === product.brandId && i.productId && i.size)
    .filter((i) => {
      const p = productById[i.productId!];
      return p && systemFor(p.category, p.sizes.map((s) => s.size)) === sys;
    })
    .map((i) => ({ name: i.name, size: i.size!, kept: true, wears: i.timesWorn }));
  const returned = orders
    .filter((o) => o.persona === ctx.user.id && o.brandId === product.brandId && ctx.connected.includes(o.brandId))
    .flatMap((o) => o.items.filter((l) => l.returned).map((l) => ({ l, p: productById[l.productId] })))
    .filter(({ p }) => p && systemFor(p.category, p.sizes.map((s) => s.size)) === sys)
    .map(({ l }) => ({ name: l.name, size: l.size, kept: false, wears: 0, returnReason: l.returned!.reason.toLowerCase() }));
  return [...kept, ...returned];
}

export function recommendSizeFor(ctx: ToolContext, productId: string): (SizeRecommendation & { produit: string; marque: string; en_stock: boolean }) | { erreur: string } {
  const p = productById[productId];
  if (!p) return { erreur: `Produit inconnu : ${productId}` };
  const sizes = p.sizes.map((s) => s.size);
  const rec = recommendSize(ctx.user, brandById[p.brandId], p.category, sizes, sizeHistory(ctx, p), p.fit);
  return { ...rec, produit: p.name, marque: brandById[p.brandId].name, en_stock: (p.sizes.find((s) => s.size === rec.size)?.stock ?? 0) > 0 };
}

/** Nettoie et complète les cartes produites par le modèle (ids inexistants, taille calculée par le moteur). */
export function sanitizeCards(ctx: ToolContext, cards: Card[]): Card[] {
  const ids = new Set(ctx.items.map((i) => i.id));
  const out: Card[] = [];
  for (const c of cards) {
    if (c.type === "outfit") {
      const pieces = c.pieces.filter((p) => (p.itemId && ids.has(p.itemId)) || (p.productId && productById[p.productId]));
      if (pieces.length >= 2) out.push({ ...c, pieces });
    } else if (c.type === "laundry") {
      if (ids.has(c.unavailableId) && ids.has(c.replacementId)) out.push(c);
    } else if (c.type === "purchase") {
      const rec = recommendSizeFor(ctx, c.productId);
      if ("erreur" in rec) continue;
      out.push({ ...c, size: rec.size, sizeHeadline: rec.headline, sizeReasons: rec.reasons, confidence: rec.confidence });
    } else if (c.type === "packing") {
      out.push({ ...c, groups: c.groups.map((g) => ({ ...g, entries: g.entries.map((e) => (e.itemId && !ids.has(e.itemId) ? { label: e.label, qty: e.qty } : e)) })) });
    }
  }
  return out;
}
