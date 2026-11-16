import type { Brand, Category, UserProfile } from "./types";

export type SizeSystem = "lettres" | "col" | "veste" | "pantalon" | "WL" | "pointure";

export const LETTERS = ["XS", "S", "M", "L", "XL", "XXL"];
export const COLLARS = ["37", "38", "39", "40", "41", "42", "43", "44", "45"];
export const JACKETS = ["44", "46", "48", "50", "52", "54", "56"];
export const TROUSERS = ["36", "38", "40", "42", "44", "46", "48"];
export const WAISTS = ["28", "29", "30", "31", "32", "33", "34", "36"];
export const SHOES = ["39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5", "45", "46"];

export function systemFor(category: Category, sizes: string[]): SizeSystem {
  const s = sizes[0] ?? "";
  if (/^W\d+/.test(s)) return "WL";
  if (category === "chaussures") return "pointure";
  if (/^[A-Z]+$/.test(s)) return "lettres";
  if (category === "chemises") return "col";
  if (s === "36") return "pantalon";
  if (category === "vestes" || category === "costumes") return "veste";
  if (category === "pantalons") return "pantalon";
  return "lettres";
}

export function sizesFor(system: SizeSystem): string[] {
  switch (system) {
    case "lettres": return LETTERS.slice(0, 6);
    case "col": return COLLARS;
    case "veste": return JACKETS;
    case "pantalon": return TROUSERS;
    case "pointure": return SHOES;
    case "WL": return ["W29 L32", "W30 L32", "W31 L32", "W32 L32", "W33 L32", "W34 L32", "W31 L34", "W32 L34"];
  }
}

const label: Record<SizeSystem, string> = {
  lettres: "taille", col: "tour de cou", veste: "taille de veste", pantalon: "taille", WL: "taille", pointure: "pointure",
};

function shift(list: string[], value: string, by: number) {
  const i = list.indexOf(value);
  if (i < 0) return value;
  return list[Math.max(0, Math.min(list.length - 1, i + by))];
}

/** taille habituelle de l'utilisateur dans un système donné (hors marque) */
export function usualSize(user: UserProfile, system: SizeSystem): string {
  const r = user.reference;
  switch (system) {
    case "lettres": return r.top;
    case "col": return r.collar;
    case "veste": return r.jacket;
    case "pantalon": return r.trousersFr;
    case "WL": return `W${r.waist} L${r.inseam}`;
    case "pointure": return r.shoe;
  }
}

export type SizeHistory = { name: string; size: string; kept: boolean; wears: number; returnReason?: string };

export type SizeRecommendation = {
  size: string;
  usual: string;
  system: SizeSystem;
  confidence: number;
  headline: string;
  reasons: string[];
};

const fmt = (s: string) => s.replace(".", ",");

/**
 * Recommande une taille pour un produit d'une marque, à partir de la taille habituelle
 * de l'utilisateur, du guide des tailles de la marque et de l'historique (achats gardés / retours).
 */
export function recommendSize(
  user: UserProfile,
  brand: Brand,
  category: Category,
  productSizes: string[],
  history: SizeHistory[] = [],
  productFit?: string,
): SizeRecommendation {
  const system = systemFor(category, productSizes);
  const usual = usualSize(user, system);
  let size = usual;
  const reasons: string[] = [];
  let confidence = 0.86;

  if (system === "pointure") {
    size = SHOES[Math.max(0, SHOES.indexOf(usual) + Math.round(brand.sizeGuide.shoeOffset * 2))] ?? usual;
  } else if (system !== "WL") {
    size = shift(sizesFor(system), usual, brand.sizeGuide.offset);
  }

  const diff = size !== usual;
  if (diff) {
    const sens = brand.sizeGuide.fit === "petit" ? "taille petit" : brand.sizeGuide.fit === "grand" ? (system === "pointure" ? "chausse grand" : "taille grand") : "";
    reasons.push(`Vous portez ${fmt(usual)} ailleurs et ${brand.name} ${sens}${system === "pointure" ? " d'une demi-pointure" : ""}.`);
  } else {
    reasons.push(`${brand.name} taille normalement : votre ${label[system]} habituelle (${fmt(usual)}) convient.`);
  }

  if (system === "WL" && productFit && /étroit|slim|fuselé/i.test(productFit)) {
    reasons.push("Coupe étroite : si vous hésitez entre deux tailles, prenez celle du dessus.");
  }

  const kept = history.filter((h) => h.kept && h.size === size);
  const returned = history.filter((h) => !h.kept);
  if (kept.length) {
    const best = kept.sort((a, b) => b.wears - a.wears)[0];
    reasons.push(`Vous portez déjà « ${best.name} » en ${fmt(size)} : aucun retour, ${best.wears} ports.`);
    confidence += 0.08;
  }
  if (returned.length) {
    const r = returned[0];
    reasons.push(`Vous aviez retourné ${r.name} en ${fmt(r.size)} (« ${r.returnReason} ») : cela confirme ${fmt(size)}.`);
    confidence += 0.03;
  }
  if (!kept.length && !returned.length) confidence -= 0.02;

  confidence = Math.min(0.98, Math.round(confidence * 100) / 100);
  const headline = diff
    ? `Prenez ${fmt(size)} chez ${brand.name} : vous portez ${fmt(usual)} ailleurs et la marque ${brand.sizeGuide.fit === "petit" ? "taille petit" : system === "pointure" ? "chausse grand" : "taille grand"}.`
    : `Prenez ${fmt(size)} chez ${brand.name}, votre ${label[system]} habituelle.`;
  return { size, usual, system, confidence, headline, reasons };
}
