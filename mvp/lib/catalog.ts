// Catalogue de démonstration : produits et prix FICTIFS, à remplacer par les flux
// produits réels des marques partenaires.

export type Category = "haut" | "bas" | "chaussures" | "veste" | "accessoire";

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: Category;
  color: string; // nom de couleur en français
  hex: string; // pastille couleur pour l'affichage
  price: number; // en euros
  styles: string[]; // casual, chic, business, sport, soirée…
}

export interface WardrobeItem {
  id: string;
  brand: string;
  name: string;
  category: Category;
  color: string;
  hex: string;
  price?: number;
  styles: string[];
  source: "import" | "manuel" | "demo";
}

export const BRANDS = ["Zara", "Uniqlo", "Massimo Dutti", "Mango", "Celio"] as const;

const p = (
  id: string, brand: string, name: string, category: Category,
  color: string, hex: string, price: number, styles: string[],
): Product => ({ id, brand, name, category, color, hex, price, styles });

export const CATALOG: Product[] = [
  // Hauts
  p("zr-h1", "Zara", "Chemise en lin oversize", "haut", "blanc", "#f4f1ea", 35.95, ["casual", "chic", "date"]),
  p("zr-h2", "Zara", "T-shirt col rond basique", "haut", "noir", "#1d1d1d", 12.95, ["casual"]),
  p("zr-h3", "Zara", "Polo en maille texturée", "haut", "écru", "#e8dfcc", 29.95, ["chic", "date", "casual"]),
  p("zr-h4", "Zara", "Chemise satinée", "haut", "noir", "#222222", 39.95, ["soirée", "date", "chic"]),
  p("uq-h1", "Uniqlo", "T-shirt Supima coton", "haut", "blanc", "#fafafa", 14.9, ["casual", "sport"]),
  p("uq-h2", "Uniqlo", "Chemise Oxford", "haut", "bleu ciel", "#a9c6e8", 29.9, ["business", "casual", "chic"]),
  p("uq-h3", "Uniqlo", "Pull col rond mérinos", "haut", "gris chiné", "#9a9a9a", 39.9, ["casual", "business", "chic"]),
  p("uq-h4", "Uniqlo", "Sweat à capuche", "haut", "marine", "#1f2a44", 34.9, ["casual", "sport"]),
  p("md-h1", "Massimo Dutti", "Chemise popeline slim", "haut", "blanc", "#ffffff", 49.95, ["business", "chic", "date", "soirée"]),
  p("md-h2", "Massimo Dutti", "Pull cachemire mélangé", "haut", "camel", "#c19a6b", 79.95, ["chic", "date", "business"]),
  p("md-h3", "Massimo Dutti", "Polo manches longues", "haut", "vert olive", "#6b7046", 45.95, ["chic", "date", "casual"]),
  p("mg-h1", "Mango", "Top à bretelles satiné", "haut", "champagne", "#e6d3b3", 25.99, ["soirée", "date"]),
  p("mg-h2", "Mango", "Blouse fluide", "haut", "bordeaux", "#6d1f2e", 35.99, ["chic", "date", "business"]),
  p("ce-h1", "Celio", "Chemise en jean", "haut", "bleu jean", "#4a6a8f", 29.99, ["casual"]),
  p("ce-h2", "Celio", "T-shirt rayé marinière", "haut", "blanc/marine", "#dfe3ea", 17.99, ["casual"]),

  // Bas
  p("zr-b1", "Zara", "Pantalon à pinces", "bas", "beige", "#d6c4a3", 35.95, ["chic", "business", "date"]),
  p("zr-b2", "Zara", "Jean straight", "bas", "bleu brut", "#2f3e5c", 29.95, ["casual", "date"]),
  p("zr-b3", "Zara", "Jupe midi satinée", "bas", "noir", "#1a1a1a", 29.95, ["soirée", "date", "chic"]),
  p("uq-b1", "Uniqlo", "Chino slim", "bas", "marine", "#26324d", 39.9, ["casual", "business", "chic"]),
  p("uq-b2", "Uniqlo", "Jean selvedge", "bas", "indigo", "#2b3a67", 49.9, ["casual", "date"]),
  p("uq-b3", "Uniqlo", "Jogging ultra stretch", "bas", "gris", "#7d7d7d", 29.9, ["sport", "casual"]),
  p("md-b1", "Massimo Dutti", "Pantalon laine costume", "bas", "anthracite", "#3a3a3a", 79.95, ["business", "soirée", "chic"]),
  p("md-b2", "Massimo Dutti", "Pantalon chino coton", "bas", "sable", "#cdb891", 49.95, ["chic", "casual", "date"]),
  p("mg-b1", "Mango", "Pantalon large fluide", "bas", "écru", "#ece3cf", 39.99, ["chic", "date"]),
  p("ce-b1", "Celio", "Bermuda chino", "bas", "kaki", "#7a7552", 25.99, ["casual"]),

  // Chaussures
  p("zr-c1", "Zara", "Mocassins en cuir", "chaussures", "noir", "#151515", 49.95, ["chic", "business", "date"]),
  p("zr-c2", "Zara", "Baskets minimalistes", "chaussures", "blanc", "#f7f7f7", 35.95, ["casual", "date"]),
  p("zr-c3", "Zara", "Sandales à talon", "chaussures", "noir", "#111111", 39.95, ["soirée", "date"]),
  p("md-c1", "Massimo Dutti", "Derbies cuir lisse", "chaussures", "marron", "#5a3a22", 99.95, ["business", "chic", "soirée"]),
  p("md-c2", "Massimo Dutti", "Bottines en daim", "chaussures", "cognac", "#8a5a2b", 109, ["chic", "date", "casual"]),
  p("mg-c1", "Mango", "Ballerines cuir", "chaussures", "beige", "#d9c3a5", 35.99, ["chic", "casual"]),
  p("ce-c1", "Celio", "Baskets toile", "chaussures", "blanc", "#f2f2f2", 29.99, ["casual", "sport"]),
  p("uq-c1", "Uniqlo", "Chaussettes pack x3", "accessoire", "noir", "#202020", 9.9, ["casual", "business"]),

  // Vestes
  p("zr-v1", "Zara", "Blazer structuré", "veste", "noir", "#1b1b1b", 59.95, ["chic", "business", "soirée", "date"]),
  p("zr-v2", "Zara", "Surchemise en velours", "veste", "marron", "#6b4a2f", 39.95, ["casual", "date"]),
  p("uq-v1", "Uniqlo", "Doudoune ultra légère", "veste", "noir", "#1c1c1c", 59.9, ["casual", "sport"]),
  p("md-v1", "Massimo Dutti", "Veste en daim", "veste", "camel", "#b8865a", 199, ["chic", "date"]),
  p("md-v2", "Massimo Dutti", "Trench classique", "veste", "beige", "#cbb48c", 159, ["chic", "business"]),
  p("mg-v1", "Mango", "Veste en jean", "veste", "bleu clair", "#8fa9c8", 45.99, ["casual", "date"]),

  // Accessoires
  p("zr-a1", "Zara", "Ceinture cuir", "accessoire", "marron", "#5c3b23", 19.95, ["chic", "casual", "business"]),
  p("md-a1", "Massimo Dutti", "Écharpe laine", "accessoire", "gris", "#8c8c8c", 39.95, ["chic", "casual"]),
  p("mg-a1", "Mango", "Sac bandoulière", "accessoire", "noir", "#161616", 29.99, ["soirée", "date", "chic"]),
  p("ce-a1", "Celio", "Casquette coton", "accessoire", "beige", "#d8c7a8", 12.99, ["casual", "sport"]),
];

export const CATALOG_BY_ID = new Map(CATALOG.map((x) => [x.id, x]));

/** Dressing de démonstration : ce que l'utilisateur « possède déjà ». */
export const DEMO_WARDROBE: WardrobeItem[] = [
  { id: "w-1", brand: "Zara", name: "Jean straight", category: "bas", color: "bleu brut", hex: "#2f3e5c", price: 29.95, styles: ["casual", "date"], source: "demo" },
  { id: "w-2", brand: "Uniqlo", name: "T-shirt Supima coton", category: "haut", color: "blanc", hex: "#fafafa", price: 14.9, styles: ["casual"], source: "demo" },
  { id: "w-3", brand: "Massimo Dutti", name: "Bottines en daim", category: "chaussures", color: "cognac", hex: "#8a5a2b", price: 109, styles: ["chic", "date", "casual"], source: "demo" },
  { id: "w-4", brand: "Uniqlo", name: "Chino slim", category: "bas", color: "marine", hex: "#26324d", price: 39.9, styles: ["casual", "business", "chic"], source: "demo" },
  { id: "w-5", brand: "Zara", name: "Baskets minimalistes", category: "chaussures", color: "blanc", hex: "#f7f7f7", price: 35.95, styles: ["casual", "date"], source: "demo" },
  { id: "w-6", brand: "Uniqlo", name: "Doudoune ultra légère", category: "veste", color: "noir", hex: "#1c1c1c", price: 59.9, styles: ["casual"], source: "demo" },
];

/** E-mails de commande d'exemple pour la démo d'import. */
export const SAMPLE_EMAILS: { brand: string; text: string }[] = [
  {
    brand: "Zara",
    text: `De : ZARA <noreply@zara.com>
Objet : Confirmation de votre commande n° 58213
Merci pour votre commande !
1 x Blazer structuré - Noir - Taille M - 59,95 €
1 x Chemise en lin oversize - Blanc - Taille L - 35,95 €
Total : 95,90 €`,
  },
  {
    brand: "Massimo Dutti",
    text: `Massimo Dutti — Votre commande est confirmée
Article : Pantalon chino coton, couleur Sable, taille 42 — 49,95 EUR
Article : Écharpe laine, coloris Gris — 39,95 EUR`,
  },
];
