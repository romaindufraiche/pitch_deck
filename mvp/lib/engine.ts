import { CATALOG, CATALOG_BY_ID, type Category, type Product, type WardrobeItem } from "./catalog.ts";

export interface Outfit {
  title: string;
  why: string;
  owned: WardrobeItem[];
  toBuy: Product[];
  total: number; // somme des pièces à acheter
  budget: number | null;
  withinBudget: boolean;
}

export interface StylistResponse {
  reply: string;
  outfits: Outfit[];
  engine: "claude" | "demo";
}

const CORE: Category[] = ["haut", "bas", "chaussures"];

const CATEGORY_WORDS: [RegExp, Category][] = [
  [/\b(hauts?|chemises?|t-?shirts?|pulls?|polos?|tops?|blouses?|sweats?)\b/i, "haut"],
  [/\b(pantalons?|jeans?|chinos?|jupes?|bas|bermudas?)\b/i, "bas"],
  [/\b(chaussures?|baskets?|sneakers?|mocassins?|bottines?|derbies|sandales?)\b/i, "chaussures"],
  [/\b(vestes?|blazers?|manteaux?|manteau|trench|doudounes?)\b/i, "veste"],
];

const NUMBER_WORDS: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };

export const round2 = (n: number) => Math.round(n * 100) / 100;
const eur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

export interface ParsedRequest {
  budget: number | null;
  style: string;
  occasion: string;
  fromScratch: boolean;
  target: { category: Category; count: number } | null;
  anchor: WardrobeItem | null;
}

export function parseRequest(text: string, wardrobe: WardrobeItem[]): ParsedRequest {
  const t = text.toLowerCase();
  const budgetMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(€|euros?|eur\b)/);
  const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(",", ".")) : null;

  let style = "casual";
  let occasion = "tous les jours";
  if (/\b(date|rendez-vous|rencard|dîner|diner)\b/.test(t)) { style = "date"; occasion = "un date"; }
  else if (/\b(soirée|soiree|mariage|fête|fete|gala|cocktail)\b/.test(t)) { style = "soirée"; occasion = "une soirée"; }
  else if (/\b(travail|bureau|entretien|réunion|reunion|business|pro)\b/.test(t)) { style = "business"; occasion = "le travail"; }
  else if (/\b(sport|salle|running|footing)\b/.test(t)) { style = "sport"; occasion = "le sport"; }
  else if (/\b(chic|élégant|elegant|habillé)\b/.test(t)) { style = "chic"; occasion = "une occasion chic"; }

  const fromScratch = /(de zéro|de zero|from scratch|sans (mon|ma|mes) (dressing|garde-robe)|rien à me mettre|rien a me mettre)/.test(t);

  let target: ParsedRequest["target"] = null;
  const countMatch = t.match(/\b(\d|un|une|deux|trois|quatre|cinq)\s+(\S+)/g) ?? [];
  for (const m of countMatch) {
    const [num, word] = m.split(/\s+/);
    const cat = CATEGORY_WORDS.find(([re]) => re.test(word))?.[1];
    if (cat) {
      target = { category: cat, count: Math.min(5, NUMBER_WORDS[num] ?? (parseInt(num, 10) || 1)) };
      break;
    }
  }

  // « avec ce pantalon / mon jean » → pièce du dressing à garder
  let anchor: WardrobeItem | null = null;
  const anchorMatch = t.match(/avec (?:ce|cette|mon|ma|mes|le|la) ([a-zàâéèêîôûç-]+)/);
  if (anchorMatch) {
    const word = anchorMatch[1];
    const cat = CATEGORY_WORDS.find(([re]) => re.test(word))?.[1];
    anchor =
      wardrobe.find((w) => w.name.toLowerCase().includes(word.replace(/s$/, ""))) ??
      (cat ? wardrobe.find((w) => w.category === cat) ?? null : null);
  }
  if (!target && anchor) target = null;

  return { budget, style, occasion, fromScratch, target, anchor };
}

const styleScore = (styles: string[], style: string) =>
  styles.includes(style) ? 2 : style === "date" && styles.includes("chic") ? 1 : 0;

function pickOwned(wardrobe: WardrobeItem[], cat: Category, style: string): WardrobeItem | null {
  const candidates = wardrobe
    .filter((w) => w.category === cat)
    .sort((a, b) => styleScore(b.styles, style) - styleScore(a.styles, style));
  const best = candidates[0];
  if (!best) return null;
  // On garde une pièce du dressing si elle colle un minimum au style (ou si style casual)
  return styleScore(best.styles, style) > 0 || style === "casual" ? best : null;
}

function rankProducts(cat: Category, style: string, maxPrice: number, exclude: Set<string>): Product[] {
  return CATALOG.filter((p) => p.category === cat && p.price <= maxPrice && !exclude.has(p.id))
    .sort((a, b) => styleScore(b.styles, style) - styleScore(a.styles, style) || a.price - b.price);
}

function buildOutfit(
  req: ParsedRequest, wardrobe: WardrobeItem[], exclude: Set<string>, title: string,
): Outfit | null {
  const owned: WardrobeItem[] = [];
  const toBuy: Product[] = [];
  const pool = req.fromScratch ? [] : wardrobe;
  let remaining = req.budget ?? Infinity;

  if (req.anchor) owned.push(req.anchor);

  for (const cat of CORE) {
    if (owned.some((o) => o.category === cat)) continue;
    const mine = pickOwned(pool, cat, req.style);
    if (mine) { owned.push(mine); continue; }
    // Réserve une part du budget pour les catégories encore manquantes
    const missingLater = CORE.slice(CORE.indexOf(cat) + 1).filter(
      (c) => !owned.some((o) => o.category === c) && !pickOwned(pool, c, req.style),
    ).length;
    const cheapestLater = missingLater * 15;
    const product = rankProducts(cat, req.style, remaining - cheapestLater, exclude)[0];
    if (!product) return null;
    toBuy.push(product);
    exclude.add(product.id);
    remaining -= product.price;
  }

  // Si du budget reste, une veste pour les occasions habillées
  if (["date", "soirée", "business", "chic"].includes(req.style)) {
    const hasJacket = owned.some((o) => o.category === "veste" && styleScore(o.styles, req.style) > 0);
    if (!hasJacket) {
      const jacket = rankProducts("veste", req.style, remaining, exclude).find((j) => styleScore(j.styles, req.style) > 0);
      if (jacket) { toBuy.push(jacket); exclude.add(jacket.id); remaining -= jacket.price; }
    }
  }

  const total = round2(toBuy.reduce((s, p) => s + p.price, 0));
  return {
    title,
    why: explain(req, owned, toBuy),
    owned,
    toBuy,
    total,
    budget: req.budget,
    withinBudget: req.budget == null || total <= req.budget,
  };
}

function explain(req: ParsedRequest, owned: WardrobeItem[], toBuy: Product[]): string {
  const parts: string[] = [];
  if (owned.length) parts.push(`Tu as déjà : ${owned.map((o) => `${o.name} (${o.brand})`).join(", ")}.`);
  if (toBuy.length) parts.push(`Il te manque : ${toBuy.map((p) => `${p.name} ${p.brand}`).join(", ")}.`);
  else parts.push("Rien à acheter, tout est déjà dans ton dressing !");
  parts.push(`Style visé : ${req.style}, pour ${req.occasion}.`);
  return parts.join(" ");
}

/** Moteur de démo sans IA (fonctionne sans clé API). */
export function demoStylist(text: string, wardrobe: WardrobeItem[]): StylistResponse {
  const req = parseRequest(text, wardrobe);
  const outfits: Outfit[] = [];

  if (req.target && req.target.category !== "chaussures" && req.target.count > 1) {
    // « trouve-moi 3 hauts pour 80 € » → N alternatives, une pièce différente chacune
    const max = req.budget ?? Infinity;
    const picks = rankProducts(req.target.category, req.style, max, new Set()).slice(0, req.target.count);
    for (const [i, pick] of picks.entries()) {
      const base = buildOutfit({ ...req, budget: null }, wardrobe.filter((w) => w.category !== req.target!.category), new Set([pick.id]), "");
      const owned = (base?.owned ?? []).filter((o) => o.category !== pick.category);
      outfits.push({
        title: `Option ${i + 1} : ${pick.name}`,
        why: `${pick.name} (${pick.brand}, ${eur(pick.price)}) à porter avec ${owned.map((o) => o.name).join(", ") || "tes basiques"}.`,
        owned,
        toBuy: [pick],
        total: pick.price,
        budget: req.budget,
        withinBudget: req.budget == null || pick.price <= req.budget,
      });
    }
    const reply = picks.length
      ? `Voici ${picks.length} ${req.target.category}s différents${req.budget ? `, chacun à moins de ${req.budget} €` : ""}, qui vont avec ce que tu as déjà.`
      : `Je n'ai rien trouvé dans ce budget. Essaie d'augmenter un peu le budget.`;
    return { reply, outfits, engine: "demo" };
  }

  const exclude = new Set<string>();
  const first = buildOutfit(req, wardrobe, exclude, "Tenue proposée");
  if (first) outfits.push(first);
  const alt = buildOutfit(req, wardrobe, exclude, "Alternative");
  if (alt && alt.toBuy.length) outfits.push(alt);

  const reply = !first
    ? `Impossible de composer une tenue complète${req.budget ? ` pour ${req.budget} €` : ""}. Essaie un budget un peu plus élevé.`
    : first.toBuy.length === 0
      ? `Bonne nouvelle : tu as déjà tout ce qu'il faut pour ${req.occasion} !`
      : `Pour ${req.occasion}${req.budget ? ` avec ${req.budget} €` : ""}, il te suffit d'ajouter ${first.toBuy.length} pièce${first.toBuy.length > 1 ? "s" : ""} (${eur(first.total)}).`;
  return { reply, outfits, engine: "demo" };
}

/** Transforme la réponse de l'IA (identifiants) en tenues vérifiées : on ne fait
 *  jamais confiance au modèle pour les prix ni pour l'existence des articles. */
export function materialize(
  raw: { title: string; why: string; owned_ids: string[]; buy_ids: string[] }[],
  wardrobe: WardrobeItem[],
  budget: number | null,
): Outfit[] {
  const wById = new Map(wardrobe.map((w) => [w.id, w]));
  return raw
    .map((o) => {
      const owned = o.owned_ids.map((id) => wById.get(id)).filter((x): x is WardrobeItem => !!x);
      const toBuy = o.buy_ids.map((id) => CATALOG_BY_ID.get(id)).filter((x): x is Product => !!x);
      const total = round2(toBuy.reduce((s, p) => s + p.price, 0));
      return { title: o.title, why: o.why, owned, toBuy, total, budget, withinBudget: budget == null || total <= budget };
    })
    .filter((o) => o.owned.length + o.toBuy.length > 0);
}

/** Import d'e-mail sans IA : retrouve les articles du catalogue cités dans le texte. */
export function demoImport(text: string): WardrobeItem[] {
  const t = text.toLowerCase();
  return CATALOG.filter((p) => t.includes(p.name.toLowerCase())).map((p) => productToWardrobe(p, "import"));
}

export function productToWardrobe(p: Product, source: WardrobeItem["source"]): WardrobeItem {
  return {
    id: `w-${p.id}-${Math.random().toString(36).slice(2, 7)}`,
    brand: p.brand, name: p.name, category: p.category, color: p.color, hex: p.hex,
    price: p.price, styles: p.styles, source,
  };
}
