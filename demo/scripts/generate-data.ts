/**
 * Génère les données de démo (déterministe, graine fixe) dans data/.
 *   npx tsx scripts/generate-data.ts
 *
 * Les photos ont été choisies et annotées à la main (data/image-picks.json) : chaque article
 * ci-dessous est décrit à partir de la photo qui lui est associée (couleur, coupe, matière visibles).
 */
import fs from "node:fs";
import path from "node:path";
import type { Brand, BrandId, Category, CalendarTemplate, Color, Order, Product, UserProfile, WardrobeItem, WearDay, WeatherDay } from "../lib/types";
import { COLLARS, JACKETS, LETTERS, SHOES, TROUSERS, recommendSize } from "../lib/sizing";

// ───────────────────────── utilitaires ─────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261116);
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const round1 = (n: number) => Math.round(n * 10) / 10;
const img = (k: string) => `/images/px/${k}.jpg`;
const OUT = path.join(process.cwd(), "data");

const C: Record<string, Color> = {
  blanc: { name: "Blanc", hex: "#F7F6F2" },
  ecru: { name: "Écru", hex: "#EFE8DA" },
  ciel: { name: "Bleu ciel", hex: "#AFC8E0" },
  bleu: { name: "Bleu", hex: "#5B7DB1" },
  marine: { name: "Marine", hex: "#1F2A44" },
  indigo: { name: "Indigo", hex: "#2B3A5C" },
  brut: { name: "Brut", hex: "#1E2B45" },
  delave: { name: "Délavé moyen", hex: "#6F8CB0" },
  noir: { name: "Noir", hex: "#141414" },
  anthracite: { name: "Gris anthracite", hex: "#3A3C40" },
  gris: { name: "Gris chiné", hex: "#9A9DA1" },
  grisclair: { name: "Gris clair", hex: "#C9CACC" },
  pierre: { name: "Pierre", hex: "#CFC7B8" },
  beige: { name: "Beige", hex: "#C8B48F" },
  sable: { name: "Sable", hex: "#D8C8A8" },
  camel: { name: "Camel", hex: "#B08355" },
  cognac: { name: "Cognac", hex: "#9A5A2E" },
  marron: { name: "Marron", hex: "#6B4428" },
  chocolat: { name: "Chocolat", hex: "#4A2E1E" },
  tabac: { name: "Tabac", hex: "#7E5232" },
  olive: { name: "Vert olive", hex: "#5E6440" },
  kaki: { name: "Kaki", hex: "#6E6A50" },
  foret: { name: "Vert forêt", hex: "#2F4A3E" },
  vert: { name: "Vert bouteille", hex: "#2E5A44" },
  rose: { name: "Rose poudré", hex: "#E9B7AE" },
  bordeaux: { name: "Bordeaux", hex: "#6E1F2E" },
  corail: { name: "Corail", hex: "#F07C66" },
  royal: { name: "Bleu roi", hex: "#2F5BA7" },
  mastic: { name: "Mastic", hex: "#D9D1C2" },
};

// ───────────────────────── marques ─────────────────────────
const brands: Brand[] = [
  {
    id: "verac", name: "Maison Vérac", tagline: "Chemisier-tailleur depuis 1987", positioning: "Chemises et tailleur premium, coupes ajustées, tissus italiens et portugais.",
    priceRange: [95, 260], color: "#1F2A44", ink: "#F4EFE6", logo: { font: "serif", weight: 500, tracking: 0.18, uppercase: true },
    members: 12400, founded: 1987, city: "Lyon",
    sizeGuide: {
      fit: "petit", offset: 1, shoeOffset: 0,
      summary: "Taille petit",
      advice: "Nos coupes sont ajustées : prenez une taille au-dessus de votre taille habituelle (chemises : un tour de cou au-dessus).",
      systems: ["tour de cou (37–45)", "vestes (44–56)", "pantalons (36–48)", "maille (XS–XXL)"],
      table: [
        { label: "Tour de cou", values: { "Taille habituelle 38": "39", "39": "40", "40": "41", "41": "42" } },
        { label: "Veste", values: { "Taille habituelle 46": "48", "48": "50", "50": "52" } },
        { label: "Pantalon", values: { "Taille habituelle 38": "40", "40": "42", "42": "44" } },
      ],
    },
    dataRequested: ["Historique de commandes (36 mois)", "Tailles achetées et gardées", "Retours et motifs", "Fiches produits (photos, matières)"],
  },
  {
    id: "bastide", name: "Ligne Bastide", tagline: "Les essentiels, bien faits", positioning: "Basiques casual en matières durables : t-shirts, sweats, chinos.",
    priceRange: [29, 89], color: "#C8553D", ink: "#FFF8F0", logo: { font: "sans", weight: 700, tracking: -0.02, uppercase: false },
    members: 38900, founded: 2014, city: "Marseille",
    sizeGuide: {
      fit: "normal", offset: 0, shoeOffset: 0, summary: "Taille normalement",
      advice: "Prenez votre taille habituelle. Chinos en tour de taille (W) et longueur (L).",
      systems: ["XS–XXL", "W28–W36 / L30–L34"],
      table: [
        { label: "Haut", values: { S: "88–94 cm", M: "95–101 cm", L: "102–108 cm", XL: "109–115 cm" } },
        { label: "Chino", values: { W30: "76 cm", W31: "79 cm", W32: "81 cm", W33: "84 cm" } },
      ],
    },
    dataRequested: ["Historique de commandes", "Tailles achetées", "Retours et motifs"],
  },
  {
    id: "kolm", name: "Kolm Denim", tagline: "Selvedge, coupé à la main", positioning: "Jeans selvedge japonais et coupes ajustées, ateliers en Europe.",
    priceRange: [110, 180], color: "#24324F", ink: "#E9E4D8", logo: { font: "condensed", weight: 800, tracking: 0.06, uppercase: true },
    members: 9750, founded: 2016, city: "Roubaix",
    sizeGuide: {
      fit: "normal", offset: 0, shoeOffset: 0, summary: "Tailles W/L, coupe étroite",
      advice: "Nos jeans se taillent en W (tour de taille) et L (longueur). Coupes étroites : entre deux tailles, prenez celle du dessus. Le brut se détend d'environ 1 cm à la taille.",
      systems: ["W28–W36 / L30–L34", "XS–XXL pour les hauts"],
      table: [
        { label: "K1 Slim", values: { W30: "78 cm", W31: "80,5 cm", W32: "83 cm", W33: "85,5 cm" } },
        { label: "K2 Droit", values: { W30: "79 cm", W31: "81,5 cm", W32: "84 cm", W33: "86,5 cm" } },
      ],
    },
    dataRequested: ["Historique de commandes", "Tailles W/L gardées", "Retours et échanges"],
  },
  {
    id: "norrland", name: "Norrland Supply", tagline: "Pour les jours sans soleil", positioning: "Vestes et manteaux techniques, imperméables et respirants.",
    priceRange: [140, 390], color: "#2F4A3E", ink: "#EEF0E8", logo: { font: "wide", weight: 600, tracking: 0.32, uppercase: true },
    members: 15200, founded: 2011, city: "Annecy",
    sizeGuide: {
      fit: "grand", offset: -1, shoeOffset: 0, summary: "Taille grand",
      advice: "Nos vestes sont pensées pour être portées sur plusieurs couches : prenez une taille en dessous de votre taille habituelle.",
      systems: ["XS–XXL"],
      table: [{ label: "Veste", values: { "Taille habituelle M": "S", L: "M", XL: "L" } }],
    },
    dataRequested: ["Historique de commandes", "Tailles achetées", "Retours et motifs"],
  },
  {
    id: "ferrand", name: "Atelier Ferrand", tagline: "Bottier à Romans-sur-Isère", positioning: "Chaussures en cuir cousues Goodyear et sneakers en cuir pleine fleur.",
    priceRange: [120, 320], color: "#5A3A22", ink: "#F6EEE2", logo: { font: "serif", weight: 600, tracking: 0.04, uppercase: false, italic: true },
    members: 11300, founded: 1952, city: "Romans-sur-Isère",
    sizeGuide: {
      fit: "grand", offset: 0, shoeOffset: -0.5, summary: "Chausse grand d'une demi-pointure",
      advice: "Nos formes chaussent grand : prenez une demi-pointure en dessous de votre pointure habituelle.",
      systems: ["Pointures EU 39–46, demi-pointures"],
      table: [{ label: "Pointure", values: { "Habituelle 42": "41,5", "42,5": "42", "43": "42,5", "43,5": "43", "44": "43,5" } }],
    },
    dataRequested: ["Historique de commandes", "Pointures gardées", "Retours et motifs"],
  },
  {
    id: "rivage", name: "Studio Rivage", tagline: "Bouger, respirer", positioning: "Sport et athleisure : running, salle, récupération.",
    priceRange: [35, 120], color: "#2C6E8F", ink: "#F1F7FA", logo: { font: "sans", weight: 300, tracking: 0.42, uppercase: true },
    members: 21600, founded: 2019, city: "Biarritz",
    sizeGuide: {
      fit: "normal", offset: 0, shoeOffset: 0, summary: "Taille normalement",
      advice: "Prenez votre taille habituelle. Coupe près du corps pour les hauts techniques.",
      systems: ["XS–XXL", "Pointures EU"],
      table: [{ label: "Haut", values: { S: "90–96 cm", M: "97–103 cm", L: "104–110 cm" } }],
    },
    dataRequested: ["Historique de commandes", "Tailles achetées", "Retours et motifs"],
  },
];
const brandById = Object.fromEntries(brands.map((b) => [b.id, b])) as Record<BrandId, Brand>;

// ───────────────────────── catalogues ─────────────────────────
type Spec = {
  key: string; name: string; cat: Category; sub: string; img: string; color: Color; material: string; fit: string;
  price: number; desc: string; season?: string; formality?: number; others?: Color[]; sizes?: string[];
};

const S = (key: string, name: string, cat: Category, sub: string, imgKey: string, color: Color, material: string, fit: string, price: number, desc: string, extra: Partial<Spec> = {}): Spec =>
  ({ key, name, cat, sub, img: imgKey, color, material, fit, price, desc, ...extra });

const catalogSpecs: Record<BrandId, Spec[]> = {
  verac: [
    S("oxford-sg", "Chemise Oxford Saint-Germain", "chemises", "Chemise oxford", "ch-oxford-blue", C.ciel, "100 % coton oxford 140 g/m², tissé au Portugal", "Coupe ajustée, col boutonné", 115, "L'oxford que l'on garde dix ans : une toile dense qui s'adoucit à chaque lavage, un col boutonné qui tient sans cravate.", { formality: 3, others: [C.blanc, C.rose] }),
    S("popeline-haussmann", "Chemise Popeline Haussmann", "chemises", "Chemise habillée", "ch-white-poplin", C.blanc, "100 % coton popeline double retors 120/2", "Coupe ajustée, col italien", 125, "La chemise blanche de référence : popeline double retors au tomber net, col italien qui se porte avec ou sans cravate.", { formality: 5, others: [C.ciel] }),
    S("opera-rayee", "Chemise Popeline rayée Opéra", "chemises", "Chemise habillée", "ch-stripe-sky", C.ciel, "100 % coton popeline 120/2, fines rayures bâton", "Coupe ajustée, col semi-italien", 120, "De fines rayures bleu ciel pour une allure nette en rendez-vous client, sous une veste comme seule.", { formality: 4 }),
    S("vichy-montaigne", "Chemise Vichy Montaigne", "chemises", "Chemise casual", "ch-gingham-blue", C.bleu, "100 % coton, vichy tissé teint 2 × 2 mm", "Coupe ajustée, col boutonné", 110, "Un vichy fin tissé teint, pour les vendredis et les déjeuners en terrasse.", { formality: 3 }),
    S("matignon-rose", "Chemise Matignon", "chemises", "Chemise habillée", "ch-pink", C.rose, "100 % coton pinpoint oxford", "Coupe ajustée, col cutaway", 115, "Un rose poudré discret, à porter avec un costume marine ou gris pour sortir du blanc.", { formality: 4 }),
    S("riviera-lin", "Chemise Riviera en lin", "chemises", "Chemise en lin", "ch-linen-ecru", C.ecru, "100 % lin lavé, filé en Normandie", "Coupe droite, col officier", 120, "Le lin normand lavé, souple dès le premier jour. Col officier, idéal de mai à septembre.", { season: "printemps-été", formality: 2 }),
    S("vendome-twill", "Chemise Twill Vendôme", "chemises", "Chemise habillée", "ch-blue-stack", C.bleu, "100 % coton twill 100/2", "Coupe ajustée, col français", 125, "Un twill légèrement brillant qui ne froisse presque pas : la chemise des longues journées.", { formality: 4, others: [C.ciel, C.blanc] }),
    S("rivoli-pinpoint", "Chemise Pinpoint Rivoli", "chemises", "Chemise habillée", "ch-white-hanger", C.blanc, "100 % coton pinpoint 80/2", "Coupe ajustée, col boutonné", 109, "Entre oxford et popeline, le pinpoint offre la tenue d'une chemise habillée et le confort d'une casual.", { formality: 4 }),
    S("carmin", "Chemise Carmin", "chemises", "Chemise casual", "ch-burgundy", C.bordeaux, "100 % coton sergé brossé", "Coupe ajustée", 115, "Un bordeaux profond en sergé brossé, chaud au toucher, pour l'automne.", { season: "automne-hiver", formality: 3 }),
    S("haussmann-bleu", "Chemise Popeline Haussmann bleue", "chemises", "Chemise habillée", "ch-blue-back", C.bleu, "100 % coton popeline double retors 120/2", "Coupe ajustée, col italien", 125, "Notre popeline Haussmann dans un bleu franc, pour un dos et des épaules parfaitement nets.", { formality: 4 }),
    S("faubourg", "Blazer Faubourg", "vestes", "Blazer", "bz-navy", C.marine, "100 % laine vierge Super 110's, doublure cupro", "Coupe ajustée, deux boutons, épaule naturelle", 249, "Le blazer marine qui va avec tout : épaule naturelle, laine Super 110's au tomber souple, boutons en corozo.", { formality: 4 }),
    S("marais", "Blazer Marais", "vestes", "Blazer", "bz-grey-melange", C.gris, "80 % laine, 20 % cachemire, non doublé", "Coupe ajustée, construction déstructurée", 259, "Une veste déstructurée en laine et cachemire, aussi confortable qu'un cardigan.", { formality: 3 }),
    S("palais", "Veste Palais prince-de-galles", "vestes", "Blazer", "bz-grey-check", C.anthracite, "100 % laine vierge, motif prince-de-galles", "Coupe ajustée, deux boutons", 255, "Le prince-de-galles discret d'un anthracite profond, à porter avec un pantalon uni.", { formality: 4 }),
    S("concorde", "Veste Concorde", "vestes", "Blazer", "bz-black-hanger", C.noir, "98 % laine, 2 % élasthanne, stretch", "Coupe ajustée, revers cranté", 239, "Une veste noire stretch pour les soirées : tenue impeccable, liberté de mouvement.", { formality: 5 }),
    S("trocadero-veste", "Veste de costume Trocadéro", "costumes", "Veste de costume", "su-navy", C.marine, "100 % laine vierge Super 120's, tissée à Biella", "Coupe ajustée, deux boutons", 245, "La veste de notre costume Trocadéro, en laine de Biella. Se porte aussi seule, en dépareillé.", { formality: 5 }),
    S("trocadero-pantalon", "Pantalon de costume Trocadéro", "costumes", "Pantalon de costume", "su-navy-full", C.marine, "100 % laine vierge Super 120's", "Coupe fuselée, sans pinces", 145, "Le pantalon assorti à la veste Trocadéro, bas à revers de 4 cm à la demande.", { formality: 5 }),
    S("wagram", "Veste de costume Wagram", "costumes", "Veste de costume", "su-charcoal", C.anthracite, "100 % laine vierge Super 110's", "Coupe ajustée, deux boutons", 255, "Un anthracite intemporel pour les rendez-vous qui comptent.", { formality: 5 }),
    S("monceau", "Veste de costume Monceau", "costumes", "Veste de costume", "su-lightgrey", C.grisclair, "100 % laine fresco 4 plis", "Coupe ajustée, deux boutons", 249, "Une laine fresco respirante, d'un gris clair qui éclaire les journées de printemps.", { season: "printemps-été", formality: 5 }),
    S("riviera-veste", "Veste de costume Riviera", "costumes", "Veste de costume", "su-beige", C.sable, "55 % lin, 45 % laine, demi-doublée", "Coupe ajustée, deux boutons", 249, "Lin et laine pour les cérémonies d'été : un sable lumineux qui froisse avec élégance.", { season: "printemps-été", formality: 5 }),
    S("riviera-pantalon", "Pantalon de costume Riviera", "costumes", "Pantalon de costume", "su-beige-studio", C.sable, "55 % lin, 45 % laine", "Coupe droite, une pince", 139, "Le pantalon assorti à la veste Riviera, ceinture à pattes de serrage.", { season: "printemps-été", formality: 5 }),
    S("pinces-flanelle", "Pantalon à pinces Flanelle", "pantalons", "Pantalon habillé", "pt-trouser-lightgrey", C.grisclair, "100 % laine flanelle 280 g/m²", "Coupe droite, une pince", 135, "Une flanelle gris clair, douce et chaude, qui habille un simple pull.", { season: "automne-hiver", formality: 4 }),
    S("saint-honore", "Pantalon Saint-Honoré", "pantalons", "Pantalon habillé", "pt-trouser-brown", C.marron, "98 % coton, 2 % élasthanne, sergé", "Coupe fuselée", 129, "Un marron chocolat qui change du gris, avec une chemise bleu ciel ou un col roulé.", { formality: 3 }),
    S("cravate-tricot", "Cravate tricot à pois", "accessoires", "Cravate", "ac-tie-navy", C.marine, "100 % soie tricotée, faite à Côme", "Largeur 6 cm, bout carré", 95, "La cravate en soie tricotée qui détend un costume : pois blancs sur fond marine.", { formality: 5, sizes: ["TU"] }),
    S("montparnasse", "Col roulé Montparnasse", "maille", "Col roulé", "kn-roll-navy", C.marine, "100 % laine mérinos extra-fine 16,5 µm", "Coupe ajustée, côtes fines", 145, "Le col roulé fin qui remplace la chemise sous un blazer, en mérinos extra-fin.", { season: "automne-hiver", formality: 4, others: [C.noir] }),
    S("montparnasse-noir", "Col roulé Montparnasse noir", "maille", "Col roulé", "kn-roll-black", C.noir, "100 % laine mérinos extra-fine 16,5 µm", "Coupe ajustée", 145, "Le Montparnasse en noir, pour les soirées et les tenues monochromes.", { season: "automne-hiver", formality: 4 }),
    S("odeon", "Pardessus Odéon", "vestes", "Manteau", "ou-coat-grey", C.anthracite, "70 % laine, 20 % polyamide, 10 % cachemire", "Coupe droite, longueur genou", 260, "Un pardessus anthracite à porter sur un costume, laine et cachemire.", { season: "automne-hiver", formality: 5 }),
  ],
  bastide: [
    S("essentiel-blanc", "T-shirt Essentiel", "hauts", "T-shirt", "tee-white", C.blanc, "100 % coton biologique, jersey 180 g/m²", "Coupe droite, col rond", 29, "Le t-shirt blanc juste comme il faut : ni trop fin, ni trop épais, col qui ne se déforme pas.", { formality: 1, others: [C.noir, C.marine, C.gris] }),
    S("essentiel-noir", "T-shirt Essentiel noir", "hauts", "T-shirt", "tee-black", C.noir, "100 % coton biologique, jersey 180 g/m²", "Coupe droite, col rond", 29, "Notre Essentiel en noir profond, teinture résistante aux lavages.", { formality: 1 }),
    S("essentiel-marine", "T-shirt Essentiel marine", "hauts", "T-shirt", "tee-navy-flatlay", C.marine, "100 % coton biologique, jersey 180 g/m²", "Coupe droite, col rond", 29, "Le marine, plus doux que le noir, qui va avec tous vos jeans.", { formality: 1 }),
    S("lourd-ecru", "T-shirt Lourd", "hauts", "T-shirt", "tee-white-folded", C.ecru, "100 % coton peigné, jersey 240 g/m²", "Coupe ample, épaules tombantes", 35, "Un jersey épais et structuré, qui tombe comme une chemise.", { formality: 1 }),
    S("pima-noir", "T-shirt Pima", "hauts", "T-shirt", "tee-black-2", C.noir, "100 % coton Pima, jersey 160 g/m²", "Coupe ajustée", 39, "Le coton Pima, plus long et plus doux : un t-shirt qui se porte sous un blazer.", { formality: 2 }),
    S("sorgue-noir", "Polo Sorgue", "hauts", "Polo", "polo-black", C.noir, "100 % coton piqué 210 g/m²", "Coupe ajustée, patte deux boutons", 59, "Le polo piqué sans logo, à porter boutonné jusqu'en haut.", { formality: 2, others: [C.blanc, C.marine] }),
    S("sorgue-ciel", "Polo Sorgue ciel", "hauts", "Polo", "polo-sky", C.ciel, "100 % coton piqué 210 g/m²", "Coupe ajustée", 59, "Notre Sorgue dans un bleu ciel d'été.", { season: "printemps-été", formality: 2 }),
    S("calanque-vert", "Polo maille Calanque", "hauts", "Polo", "polo-green", C.vert, "100 % coton, maille fine rayée ton sur ton", "Coupe ajustée, col contrasté", 65, "Une maille fine rayée ton sur ton, col marine contrasté.", { season: "printemps-été", formality: 2 }),
    S("luberon-sweat", "Sweat Luberon", "maille", "Sweat", "sw-navy", C.marine, "100 % coton biologique, molleton gratté 340 g/m²", "Coupe droite, col rond", 69, "Un molleton épais gratté à l'intérieur, sans aucune inscription.", { formality: 1 }),
    S("hoodie-ventoux", "Hoodie Ventoux", "maille", "Sweat à capuche", "sw-hoodie-grey", C.gris, "80 % coton biologique, 20 % polyester recyclé", "Coupe droite", 75, "Le sweat à capuche gris chiné, poche kangourou, cordons plats.", { formality: 1 }),
    S("merinos-marine", "Pull col rond Mérinos", "maille", "Pull", "kn-crew-navy", C.marine, "100 % laine mérinos 14 gauges", "Coupe ajustée", 79, "Le pull fin à porter sur une chemise ou à même la peau.", { season: "automne-hiver", formality: 3, others: [C.gris, C.noir] }),
    S("merinos-gris", "Pull col rond Mérinos gris", "maille", "Pull", "kn-crew-grey", C.gris, "100 % laine mérinos 14 gauges", "Coupe ajustée", 79, "Notre Mérinos en gris chiné clair.", { season: "automne-hiver", formality: 3 }),
    S("mariniere", "Pull marinière Ventoux", "maille", "Pull", "kn-breton", C.marine, "100 % coton, maille côtelée épaisse", "Coupe droite", 85, "Une marinière en grosse maille de coton, rayures marine et gris.", { formality: 2 }),
    S("gilet-anthracite", "Gilet Alpilles", "maille", "Gilet", "kn-cardigan-charcoal", C.anthracite, "60 % laine, 40 % coton, maille anglaise", "Coupe droite, col châle", 89, "Un gilet col châle épais, à porter comme une veste.", { season: "automne-hiver", formality: 2 }),
    S("camionneur", "Pull camionneur", "maille", "Pull", "kn-zip-navy", C.marine, "100 % laine d'agneau", "Coupe ajustée, col zippé", 89, "Le col camionneur qui se porte sur une chemise, col ouvert.", { season: "automne-hiver", formality: 3 }),
    S("col-v-noir", "Pull col V Mérinos", "maille", "Pull", "kn-vneck-black", C.noir, "100 % laine mérinos 14 gauges", "Coupe ajustée", 75, "Un col V net pour les soirées, en mérinos fin.", { season: "automne-hiver", formality: 3 }),
    S("raye-chataigne", "Pull rayé Châtaigne", "maille", "Pull", "kn-stripe-brown", C.marron, "70 % coton, 30 % laine", "Coupe ajustée, col V", 69, "Des rayures marron et gris pour réchauffer un jean brut.", { season: "automne-hiver", formality: 2 }),
    S("chino-beige", "Chino Luberon", "pantalons", "Chino", "pt-chino-beige", C.beige, "98 % coton, 2 % élasthanne, sergé 270 g/m²", "Coupe fuselée", 69, "Le chino à tout faire : sergé épais légèrement stretch, coupe fuselée qui s'arrête à la cheville.", { formality: 3, others: [C.marine, C.anthracite, C.pierre] }),
    S("chino-anthracite", "Chino Luberon anthracite", "pantalons", "Chino", "pt-chino-charcoal", C.anthracite, "98 % coton, 2 % élasthanne, sergé 270 g/m²", "Coupe fuselée", 69, "Le Luberon en gris anthracite : le chino qui passe au bureau.", { formality: 3 }),
    S("chino-pierre", "Chino Luberon pierre", "pantalons", "Chino", "pt-chino-stone", C.pierre, "98 % coton, 2 % élasthanne, sergé 270 g/m²", "Coupe fuselée", 69, "Un ton pierre très clair pour le printemps.", { season: "printemps-été", formality: 3 }),
    S("calanque-toile", "Chino Calanque, toile légère", "pantalons", "Chino", "pt-chino-stack", C.marine, "100 % coton, toile 210 g/m²", "Coupe droite", 65, "Une toile légère pour l'été, existe en marine, sable et corail.", { season: "printemps-été", formality: 2, others: [C.sable, C.corail] }),
    S("surchemise-velours", "Surchemise velours Camargue", "chemises", "Surchemise", "os-corduroy-camel", C.camel, "100 % coton, velours côtelé 14 côtes", "Coupe droite, deux poches plaquées", 85, "La surchemise en velours camel qui remplace une veste en mi-saison.", { season: "automne-hiver", formality: 2 }),
    S("surchemise-sergé", "Surchemise Camargue sergé", "chemises", "Surchemise", "os-beige", C.beige, "100 % coton sergé lavé", "Coupe droite", 79, "Une surchemise beige en sergé lavé, à porter ouverte sur un t-shirt.", { formality: 2 }),
    S("flanelle-carreaux", "Chemise flanelle Durance", "chemises", "Chemise casual", "ch-flannel-check", C.bordeaux, "100 % coton flanelle brossée", "Coupe droite", 59, "Une flanelle brossée à carreaux, douce comme un plaid.", { season: "automne-hiver", formality: 1 }),
    S("bonnet-cote", "Bonnet côtelé", "accessoires", "Bonnet", "ac-beanie-grey", C.gris, "100 % laine mérinos", "Revers", 29, "Un bonnet côtelé en mérinos, qui ne gratte pas.", { season: "automne-hiver", formality: 1, sizes: ["TU"] }),
    S("echarpe-laine", "Écharpe Mistral", "accessoires", "Écharpe", "ac-scarf-grey", C.gris, "100 % laine d'agneau, chevrons", "180 × 30 cm", 45, "Une écharpe à chevrons gris, assez longue pour un double tour.", { season: "automne-hiver", formality: 2, sizes: ["TU"] }),
  ],
  kolm: [
    S("k1-brut", "Jean K1 Slim selvedge brut", "pantalons", "Jean", "jn-raw-folded", C.brut, "100 % coton selvedge japonais 14 oz, non lavé", "K1 Slim : taille normale, jambe étroite", 145, "Notre best-seller : un selvedge japonais de 14 oz qui prendra vos plis en six mois.", { formality: 2 }),
    S("k1-delave", "Jean K1 Slim délavé", "pantalons", "Jean", "jn-mid-hanger", C.delave, "99 % coton, 1 % élasthanne, 12,5 oz, lavage pierre", "K1 Slim", 135, "Le K1 dans un délavé moyen naturel, sans effet usé artificiel.", { formality: 2 }),
    S("k2-indigo", "Jean K2 Droit indigo rincé", "pantalons", "Jean", "jn-indigo-hanger", C.indigo, "100 % coton 13 oz, rincé une fois", "K2 Droit : taille normale, jambe droite", 139, "Une jambe droite et un indigo rincé, le jean qui va avec une veste.", { formality: 2 }),
    S("k1-gris", "Jean K1 Slim gris acier", "pantalons", "Jean", "jn-grey", C.anthracite, "98 % coton, 2 % élasthanne, 12 oz", "K1 Slim", 129, "Un gris acier délavé, à porter avec une chemise blanche.", { formality: 2 }),
    S("k3-noir", "Jean K3 Fuselé noir délavé", "pantalons", "Jean", "jn-darkgrey", C.noir, "98 % coton, 2 % élasthanne, 12 oz", "K3 Fuselé : taille haute, jambe fuselée", 129, "Le noir délavé qui ne grisaille pas, en coupe fuselée.", { formality: 2 }),
    S("k2-selvedge-15", "Jean K2 Droit selvedge 15 oz", "pantalons", "Jean", "jn-raw-detail", C.brut, "100 % coton selvedge japonais 15 oz, lisière rouge", "K2 Droit", 175, "Notre denim le plus lourd, tissé sur métiers à navette à Okayama.", { formality: 2 }),
    S("k4-vintage", "Jean K4 Relax vintage", "pantalons", "Jean", "jn-stack", C.delave, "100 % coton 13 oz, lavage vintage", "K4 Relax : coupe ample", 130, "Une coupe relax et un lavage vintage pour le week-end.", { formality: 1 }),
    S("k3-brut", "Jean K3 Fuselé brut", "pantalons", "Jean", "jn-raw-folded", C.brut, "100 % coton selvedge 13,5 oz", "K3 Fuselé", 149, "Le brut en coupe fuselée, revers recommandé.", { formality: 2 }),
    S("k3-clair", "Jean K3 Fuselé délavé clair", "pantalons", "Jean", "jn-mid-hanger", C.ciel, "99 % coton, 1 % élasthanne", "K3 Fuselé", 135, "Un délavé clair pour l'été.", { season: "printemps-été", formality: 1 }),
    S("k2-gris", "Jean K2 Droit gris", "pantalons", "Jean", "jn-grey", C.gris, "100 % coton 12 oz", "K2 Droit", 129, "Le K2 en gris moyen.", { formality: 2 }),
    S("k2-noir", "Jean K2 Droit noir", "pantalons", "Jean", "jn-darkgrey", C.noir, "100 % coton 13 oz, teint en fil", "K2 Droit", 135, "Un noir teint en fil qui garde sa profondeur.", { formality: 2 }),
    S("k1-stretch", "Jean K1 Slim stretch", "pantalons", "Jean", "jn-indigo-hanger", C.indigo, "92 % coton, 6 % polyester recyclé, 2 % élasthanne", "K1 Slim", 129, "La K1 en version stretch, pour les journées assises.", { formality: 2 }),
    S("k4-brut", "Jean K4 Relax brut", "pantalons", "Jean", "jn-raw-detail", C.brut, "100 % coton selvedge 14 oz", "K4 Relax", 145, "Le K4 en brut selvedge.", { formality: 1 }),
    S("k3-gris", "Jean K3 Fuselé gris", "pantalons", "Jean", "jn-grey", C.gris, "98 % coton, 2 % élasthanne", "K3 Fuselé", 129, "Le K3 en gris délavé.", { formality: 2 }),
    S("k4-delave", "Jean K4 Relax délavé", "pantalons", "Jean", "jn-stack", C.delave, "100 % coton 12 oz", "K4 Relax", 130, "Le K4 délavé moyen.", { formality: 1 }),
    S("chemise-indigo", "Chemise Kolm en denim indigo", "chemises", "Chemise en jean", "ch-denim-indigo", C.indigo, "100 % coton denim 8 oz", "Coupe ajustée, deux poches à rabat", 119, "Une chemise en denim léger qui se patine comme un jean.", { formality: 2 }),
    S("chemise-western", "Chemise Western", "chemises", "Chemise en jean", "ch-denim-man", C.delave, "100 % coton denim 7 oz", "Coupe ajustée, empiècements", 125, "Les empiècements western, sans les clichés.", { formality: 2 }),
    S("chemise-chambray", "Chemise Chambray délavée", "chemises", "Chemise en jean", "ch-denim-worn", C.delave, "100 % coton chambray 5 oz", "Coupe ajustée", 115, "Un chambray léger, presque une chemise d'été.", { formality: 2 }),
    S("chemise-brute", "Chemise denim brut", "chemises", "Chemise en jean", "ch-denim-indigo", C.brut, "100 % coton denim brut 9 oz", "Coupe ajustée", 125, "La version non lavée, pour les puristes.", { formality: 2 }),
    S("type-iii", "Veste en jean Type III", "vestes", "Veste en jean", "ou-denim-jacket", C.delave, "100 % coton 13 oz", "Coupe courte, ajustée", 169, "Notre veste en jean courte, à porter sur un sweat.", { formality: 1 }),
    S("trucker-brut", "Veste Trucker brute", "vestes", "Veste en jean", "ou-denim-jacket", C.brut, "100 % coton selvedge 14 oz", "Coupe courte", 175, "La Type III en selvedge brut.", { formality: 1 }),
    S("surchemise-moleskine", "Surchemise Moleskine", "chemises", "Surchemise", "os-corduroy-camel", C.camel, "100 % coton moleskine", "Coupe droite", 139, "Une surchemise de travail en moleskine.", { season: "automne-hiver", formality: 2 }),
    S("sweat-loopwheel", "Sweat Loopwheel", "maille", "Sweat à capuche", "sw-hoodie-grey", C.gris, "100 % coton, molleton tricoté loopwheel", "Coupe droite", 115, "Un molleton tricoté lentement, sans couture latérale.", { formality: 1 }),
    S("chino-kolm", "Chino de travail Kolm", "pantalons", "Chino", "pt-chino-stone", C.pierre, "100 % coton sergé 11 oz", "Coupe droite", 119, "Un chino coupé comme nos jeans.", { formality: 2, sizes: ["W29 L32", "W30 L32", "W31 L32", "W32 L32", "W33 L32", "W34 L32"] }),
    S("ceinture-kolm", "Ceinture tannage végétal", "accessoires", "Ceinture", "ac-belt-worn", C.marron, "Cuir de vachette tannage végétal 4 mm", "Largeur 3,5 cm", 110, "Une ceinture épaisse qui se patine avec vos jeans.", { formality: 2, sizes: ["85", "90", "95", "100", "105"] }),
  ],
  norrland: [
    S("kiruna", "Parka Kiruna", "vestes", "Parka", "ou-parka", C.anthracite, "Coton ciré 3 couches, garnissage duvet 90/10, capuche fourrure synthétique", "Coupe droite, mi-cuisse", 389, "Notre parka grand froid, testée à −25 °C en Laponie suédoise.", { season: "automne-hiver", formality: 2 }),
    S("abisko", "Doudoune Abisko", "vestes", "Doudoune", "ou-puffer-black", C.noir, "Polyamide recyclé déperlant, garnissage duvet 700 cuin", "Coupe ajustée", 289, "La doudoune légère et chaude qui se glisse sous un manteau ou se porte seule.", { season: "automne-hiver", formality: 2 }),
    S("lofoten", "Doudoune Lofoten", "vestes", "Doudoune", "ou-puffer-black-2", C.noir, "Polyamide recyclé, ouate synthétique PrimaLoft", "Coupe ajustée", 199, "Une ouate synthétique qui garde la chaleur même humide.", { season: "automne-hiver", formality: 2 }),
    S("tromso", "Veste de pluie Tromsø", "vestes", "Imperméable", "ou-rain-green", C.foret, "Membrane 3 couches 20 000 mm / 20 000 g, coutures étanchées", "Coupe droite, capuche ajustable", 249, "Une vraie veste de pluie, discrète en ville, efficace en montagne.", { formality: 2 }),
    S("lapland", "Softshell Lapland", "vestes", "Softshell", "ou-softshell-khaki", C.kaki, "Softshell 3 couches, coupe-vent, déperlant", "Coupe ajustée", 179, "Coupe-vent et respirant pour les jours frais et secs.", { formality: 1 }),
    S("gotland", "Veste huilée Gotland", "vestes", "Veste huilée", "ou-waxed-olive", C.olive, "Coton huilé 8 oz, doublure tartan", "Coupe droite, col velours", 279, "Le coton huilé à l'anglaise, réimperméabilisable à vie.", { formality: 2 }),
    S("malmo", "Trench Malmö", "vestes", "Trench", "ou-trench-stone", C.mastic, "Gabardine de coton déperlante, doublure amovible", "Coupe droite, croisé", 329, "Un trench mastic, imperméable sans en avoir l'air, avec doublure amovible pour l'hiver.", { formality: 4 }),
    S("uppsala", "Trench Uppsala", "vestes", "Trench", "ou-trench-beige", C.beige, "Gabardine de coton 2 couches", "Coupe ajustée", 319, "Notre trench court, plus près du corps.", { formality: 4 }),
    S("visby", "Veste matelassée Visby", "vestes", "Veste matelassée", "ou-quilted-navy", C.marine, "Polyamide matelassé losanges, ouate recyclée", "Coupe droite", 189, "La veste matelassée à porter sur une chemise et sous un manteau.", { formality: 3 }),
    S("faro", "Field jacket Fårö", "vestes", "Field jacket", "ou-field-beige", C.sable, "Coton ripstop déperlant", "Coupe droite, quatre poches", 229, "La field jacket de mi-saison, quatre poches à soufflet.", { season: "printemps-été", formality: 2 }),
    S("kebnekaise", "Polaire Kebnekaise", "vestes", "Polaire", "ou-fleece-blue", C.royal, "Polaire 100 % recyclée, grille 300 g/m²", "Coupe ajustée", 149, "Une polaire épaisse en fibres recyclées, poches zippées.", { formality: 1 }),
    S("narvik", "Bomber Narvik", "vestes", "Bomber", "ou-bomber-navy", C.marine, "Nylon déperlant, col sherpa", "Coupe courte", 219, "Le bomber marine au col sherpa amovible.", { season: "automne-hiver", formality: 2 }),
    S("sarek", "Veste montagne Sarek", "vestes", "Veste technique", "ou-mountain-green", C.foret, "Membrane 2,5 couches, coupe-vent", "Coupe ajustée", 299, "Une veste de randonnée qui garde la ligne en ville.", { formality: 1 }),
    S("hallen", "Manteau Hallen", "vestes", "Manteau", "ou-coat-camel", C.camel, "80 % laine, 20 % polyamide, traitement déperlant", "Coupe droite, longueur genou", 359, "Un manteau camel en laine traitée déperlante : élégant même sous l'averse.", { season: "automne-hiver", formality: 4 }),
    S("gota", "Manteau Göta", "vestes", "Manteau", "ou-coat-grey", C.anthracite, "80 % laine, 20 % polyamide", "Coupe droite", 349, "Le Hallen en gris anthracite.", { season: "automne-hiver", formality: 4 }),
    S("stockholm", "Blouson cuir Stockholm", "vestes", "Blouson", "ou-leather-black", C.noir, "Cuir d'agneau plongé, doublure coton", "Coupe ajustée", 390, "Un blouson en agneau souple, sans ornements.", { formality: 2 }),
    S("vasa", "Blouson cuir Vasa", "vestes", "Blouson", "ou-leather-black-2", C.noir, "Cuir de vachette ciré", "Coupe ajustée", 369, "Le Vasa, plus robuste, qui se patine avec le temps.", { formality: 2 }),
    S("lund", "Écharpe Lund", "accessoires", "Écharpe", "ac-scarf-grey", C.gris, "100 % cachemire recyclé", "190 × 30 cm", 145, "Un cachemire recyclé, doux et chaud.", { season: "automne-hiver", formality: 2, sizes: ["TU"] }),
    S("midlayer-sarek", "Midlayer Sarek", "sport", "Haut technique", "sp-run-hoodie-navy", C.marine, "Polyester recyclé grid fleece", "Coupe ajustée", 149, "Une couche intermédiaire légère pour la montagne et le running d'hiver.", { formality: 1 }),
    S("abisko-light", "Doudoune Abisko Light", "vestes", "Doudoune", "ou-puffer-black", C.noir, "Polyamide 10D, duvet 800 cuin", "Coupe ajustée", 259, "L'Abisko en version ultra-légère, compressible dans sa poche.", { season: "automne-hiver", formality: 2 }),
    S("tromso-court", "Veste de pluie Tromsø courte", "vestes", "Imperméable", "ou-rain-green", C.foret, "Membrane 2,5 couches 15 000 mm", "Coupe courte", 219, "La Tromsø en version courte, pour la ville.", { formality: 2 }),
    S("malmo-long", "Trench Malmö long", "vestes", "Trench", "ou-trench-stone", C.mastic, "Gabardine de coton déperlante", "Coupe droite, mi-mollet", 349, "Le Malmö en longueur mi-mollet.", { formality: 4 }),
    S("visby-sans-manches", "Gilet matelassé Visby", "vestes", "Gilet matelassé", "ou-quilted-navy", C.marine, "Polyamide matelassé, ouate recyclée", "Coupe ajustée", 149, "Le Visby sans manches, sous une veste.", { formality: 2 }),
    S("kiruna-light", "Parka Kiruna Light", "vestes", "Parka", "ou-parka", C.anthracite, "Coton ciré 2 couches, ouate synthétique", "Coupe droite", 319, "La Kiruna pour les hivers urbains.", { season: "automne-hiver", formality: 2 }),
    S("gotland-court", "Veste huilée Gotland courte", "vestes", "Veste huilée", "ou-waxed-olive", C.olive, "Coton huilé 6 oz", "Coupe courte", 249, "Une version courte et plus légère.", { formality: 2 }),
  ],
  ferrand: [
    S("lucien", "Derby Lucien", "chaussures", "Derby", "fo-derby-brown", C.marron, "Cuir de veau grainé, cousu Goodyear, semelle cuir", "Forme 12, bout rond", 245, "Le derby à tout faire, cuir grainé qui ne craint pas la pluie, ressemelable à vie.", { formality: 4 }),
    S("auguste-noir", "Richelieu Auguste", "chaussures", "Richelieu", "fo-oxford-black", C.noir, "Cuir de veau box-calf, cousu Goodyear, semelle cuir", "Forme 9, bout amande", 265, "Le richelieu noir des rendez-vous importants : box-calf lisse, bout amande.", { formality: 5 }),
    S("marcel", "Chelsea Marcel", "chaussures", "Chelsea boots", "fo-chelsea-brown", C.cognac, "Cuir de veau patiné main, élastiques latéraux, semelle gomme Dainite", "Forme 12", 279, "La chelsea patinée à la main, semelle gomme pour les trottoirs mouillés.", { season: "automne-hiver", formality: 3 }),
    S("leon", "Sneaker Léon", "chaussures", "Sneakers", "fo-sneaker-cognac", C.cognac, "Cuir de veau pleine fleur, semelle cousue", "Forme basse", 189, "La sneaker en cuir cognac, assez sobre pour le bureau.", { formality: 2 }),
    S("auguste-cognac", "Richelieu Auguste cognac", "chaussures", "Richelieu", "fo-oxford-cognac", C.cognac, "Cuir de veau patiné main, cousu Goodyear", "Forme 9", 265, "L'Auguste en cognac patiné, pour les costumes bleus.", { formality: 5 }),
    S("gaston", "Richelieu Gaston", "chaussures", "Richelieu", "fo-oxford-cognac-2", C.cognac, "Cuir de veau, patine à l'ancienne", "Forme 9", 299, "Notre patine la plus profonde, réalisée en douze passages.", { formality: 5 }),
    S("emile", "Richelieu Émile", "chaussures", "Richelieu", "fo-oxford-brown-top", C.marron, "Cuir de veau, cousu Blake", "Forme 7, bout rond", 259, "Un richelieu plus souple, cousu Blake.", { formality: 4 }),
    S("emile-tabac", "Richelieu Émile tabac", "chaussures", "Richelieu", "fo-oxford-brown-small", C.tabac, "Cuir de veau, cousu Blake", "Forme 7", 255, "L'Émile en tabac.", { formality: 4 }),
    S("theodore", "Richelieu Théodore", "chaussures", "Richelieu", "fo-oxford-brown-side", C.marron, "Cuir de veau, bout droit fleuri", "Forme 9", 269, "Un bout droit fleuri, discret.", { formality: 5 }),
    S("auguste-olive", "Richelieu Auguste olive", "chaussures", "Richelieu", "fo-oxford-olive", C.olive, "Cuir de veau teint au tonneau, vert olive", "Forme 9", 279, "L'Auguste dans un vert olive rare, avec un costume gris.", { formality: 4 }),
    S("lucien-chocolat", "Derby Lucien chocolat", "chaussures", "Derby", "fo-derby-darkbrown", C.chocolat, "Cuir de veau lisse, cousu Goodyear", "Forme 12", 245, "Le Lucien en cuir lisse chocolat.", { formality: 4 }),
    S("jules", "Derby Jules", "chaussures", "Derby", "fo-derby-tan", C.camel, "Cuir de veau, semelle cuir", "Forme 10", 235, "Un derby camel clair, pour l'été et les mariages.", { season: "printemps-été", formality: 4 }),
    S("armand", "Derby Armand", "chaussures", "Derby", "fo-derby-burgundy", C.bordeaux, "Cuir de veau bordeaux", "Forme 10", 249, "Le bordeaux, alternative élégante au marron.", { formality: 4 }),
    S("jules-daim", "Derby Jules daim", "chaussures", "Derby", "fo-derby-suede-blue", C.bleu, "Daim de veau, semelle crêpe", "Forme 10", 219, "Le Jules en daim bleu, pour le week-end.", { formality: 2 }),
    S("victor", "Double boucle Victor", "chaussures", "Double boucle", "fo-monk-brown", C.marron, "Cuir de veau, cousu Goodyear", "Forme 9", 289, "La double boucle, entre derby et mocassin.", { formality: 4 }),
    S("henri", "Mocassin Henri", "chaussures", "Mocassin", "fo-loafers", C.cognac, "Cuir de veau et daim, mors métal", "Forme 6", 239, "Un mocassin à mors, sans chaussettes l'été.", { formality: 3 }),
    S("marcel-tabac", "Chelsea Marcel tabac", "chaussures", "Chelsea boots", "fo-chelsea-brown-2", C.tabac, "Cuir de veau, semelle gomme", "Forme 12", 279, "La Marcel en tabac clair.", { season: "automne-hiver", formality: 3 }),
    S("marcel-daim", "Chelsea Marcel daim", "chaussures", "Chelsea boots", "fo-chelsea-grey", C.gris, "Daim de veau hydrofuge", "Forme 12", 259, "Un daim gris traité contre l'eau.", { season: "automne-hiver", formality: 2 }),
    S("gabriel", "Bottine Gabriel", "chaussures", "Bottines", "fo-boots-brown", C.marron, "Cuir de veau gras, semelle commando", "Forme 14", 289, "La bottine lacée pour l'hiver, cuir gras imperméable.", { season: "automne-hiver", formality: 2 }),
    S("raymond", "Bottine Raymond", "chaussures", "Bottines", "fo-boots-buckle", C.cognac, "Cuir de veau patiné, boucle laiton", "Forme 9", 299, "Une bottine à boucle, patinée main.", { season: "automne-hiver", formality: 3 }),
    S("leon-toile", "Sneaker Léon toile", "chaussures", "Sneakers", "fo-sneaker-canvas-navy", C.marine, "Toile de coton, semelle caoutchouc vulcanisée", "Forme basse", 120, "La Léon en toile marine pour l'été.", { season: "printemps-été", formality: 1 }),
    S("ceinture-ferrand", "Ceinture Ferrand", "accessoires", "Ceinture", "ac-belt", C.marine, "Cuir de veau, boucle laiton brossé", "Largeur 3 cm", 120, "Une ceinture fine en cuir marine, bords peints main.", { formality: 3, sizes: ["85", "90", "95", "100"] }),
    S("valmy", "Besace Valmy", "accessoires", "Sac", "ac-messenger", C.marron, "Cuir de vachette pull-up, sangle réglable", "38 × 28 × 10 cm", 319, "Une besace en cuir pull-up qui accueille un ordinateur 14 pouces.", { formality: 3, sizes: ["TU"] }),
    S("valmy-doc", "Porte-documents Valmy", "accessoires", "Sac", "ac-briefcase", C.camel, "Cuir de vachette tannage végétal", "40 × 30 × 8 cm", 320, "Le porte-documents camel, fermeture à rabat.", { formality: 4, sizes: ["TU"] }),
    S("weekender", "Sac week-end Ferrand", "accessoires", "Sac de voyage", "ac-weekender", C.cognac, "Cuir de vachette pull-up, doublure coton", "50 × 28 × 26 cm, 36 L", 320, "Le sac de 48 heures, format cabine.", { formality: 3, sizes: ["TU"] }),
  ],
  rivage: [
    S("course-gris", "T-shirt Course", "sport", "T-shirt technique", "tee-tech-grey", C.gris, "Polyester recyclé 140 g/m², maille respirante", "Coupe près du corps", 39, "Un t-shirt de course qui sèche en vingt minutes.", { formality: 1 }),
    S("course-corail", "T-shirt Course corail", "sport", "T-shirt technique", "tee-run-coral", C.corail, "Polyester recyclé 120 g/m²", "Coupe près du corps", 39, "Le Course en corail, visible à la tombée du jour.", { formality: 1 }),
    S("thermique", "Haut de course thermique", "sport", "Haut technique", "sp-run-hoodie-navy", C.marine, "Polyester gratté, col zippé", "Coupe près du corps", 69, "Le haut d'hiver pour courir quand il fait 3 °C.", { season: "automne-hiver", formality: 1 }),
    S("repos-hoodie", "Sweat Repos", "sport", "Sweat à capuche", "sp-jogging-grey", C.anthracite, "Coton et polyester recyclé, molleton 300 g/m²", "Coupe droite", 75, "Le sweat d'après séance, épais et doux.", { formality: 1 }),
    S("repos-jogging", "Jogging Repos", "sport", "Jogging", "sp-jogging-grey", C.gris, "Coton et polyester recyclé, molleton 300 g/m²", "Coupe fuselée, bas côtelé", 65, "Le jogging assorti au sweat Repos.", { formality: 1 }),
    S("vague-blanc", "Baskets Vague", "chaussures", "Baskets", "fo-sneaker-knit-white", C.blanc, "Tige en maille recyclée, semelle EVA", "Forme basse", 110, "Une basket en maille légère, pour la salle et la ville.", { formality: 1 }),
    S("vague-gris", "Baskets Vague grises", "chaussures", "Baskets", "fo-sneaker-knit-grey", C.anthracite, "Tige en maille recyclée, semelle EVA", "Forme basse", 110, "La Vague en gris anthracite, moins salissante.", { formality: 1 }),
    S("alize", "Polaire Alizé", "sport", "Polaire", "ou-fleece-blue", C.royal, "Polaire recyclée 260 g/m²", "Coupe droite", 79, "Une polaire zippée pour les sorties fraîches.", { formality: 1 }),
    S("respirant-blanc", "T-shirt Respirant", "sport", "T-shirt technique", "tee-white", C.blanc, "Coton et Tencel™, jersey 150 g/m²", "Coupe droite", 35, "Un t-shirt de sport qui ressemble à un t-shirt de ville.", { formality: 1 }),
    S("respirant-noir", "T-shirt Respirant noir", "sport", "T-shirt technique", "tee-black", C.noir, "Coton et Tencel™, jersey 150 g/m²", "Coupe droite", 35, "Le Respirant en noir.", { formality: 1 }),
    S("hoodie-coton", "Hoodie Rivage", "sport", "Sweat à capuche", "sw-hoodie-grey", C.gris, "100 % coton biologique", "Coupe droite", 79, "Le hoodie gris chiné à porter partout.", { formality: 1 }),
    S("sweat-marine", "Sweat Marée", "sport", "Sweat", "sw-navy", C.marine, "Coton biologique, molleton léger", "Coupe droite", 65, "Un sweat léger pour l'échauffement.", { formality: 1 }),
    S("thermique-2", "Haut thermique Zéphyr", "sport", "Haut technique", "sp-run-hoodie-navy", C.marine, "Polyester gratté", "Coupe près du corps", 59, "La version sans col zippé.", { formality: 1 }),
    S("course-gris-ml", "T-shirt Course manches longues", "sport", "T-shirt technique", "tee-tech-grey", C.gris, "Polyester recyclé", "Coupe près du corps", 45, "Le Course à manches longues.", { formality: 1 }),
    S("vague-blanc-2", "Baskets Vague Plus", "chaussures", "Baskets", "fo-sneaker-knit-white", C.blanc, "Maille recyclée, semelle amortie", "Forme basse", 120, "Plus d'amorti pour courir jusqu'à 10 km.", { formality: 1 }),
    S("repos-ensemble", "Ensemble Repos", "sport", "Ensemble", "sp-jogging-grey", C.gris, "Coton et polyester recyclé", "Coupe droite", 120, "Le sweat et le jogging Repos ensemble.", { formality: 1, sizes: ["S", "M", "L", "XL"] }),
    S("course-corail-2", "Débardeur Course", "sport", "Débardeur", "tee-run-coral", C.corail, "Polyester recyclé", "Coupe près du corps", 35, "Le débardeur pour les jours chauds.", { season: "printemps-été", formality: 1 }),
    S("alize-gilet", "Gilet polaire Alizé", "sport", "Polaire", "ou-fleece-blue", C.royal, "Polaire recyclée", "Coupe droite", 69, "L'Alizé sans manches.", { formality: 1 }),
    S("vague-gris-2", "Baskets Vague Trail", "chaussures", "Baskets", "fo-sneaker-knit-grey", C.anthracite, "Maille recyclée renforcée, crampons", "Forme basse", 120, "La Vague avec une semelle crantée pour les chemins.", { formality: 1 }),
    S("respirant-pack", "Lot de 2 t-shirts Respirant", "sport", "T-shirt technique", "tee-white", C.blanc, "Coton et Tencel™", "Coupe droite", 59, "Deux t-shirts Respirant, blanc et noir.", { formality: 1 }),
    S("thermique-3", "Veste de course Grain", "sport", "Veste technique", "sp-run-hoodie-navy", C.marine, "Polyester déperlant", "Coupe près du corps", 99, "Coupe-vent léger à porter sur le thermique.", { formality: 1 }),
    S("hoodie-zip", "Hoodie zippé Rivage", "sport", "Sweat à capuche", "sw-hoodie-grey", C.gris, "100 % coton biologique", "Coupe droite", 85, "Le hoodie Rivage en version zippée.", { formality: 1 }),
    S("repos-jogging-2", "Jogging Repos léger", "sport", "Jogging", "sp-jogging-grey", C.anthracite, "Coton léger 220 g/m²", "Coupe fuselée", 59, "Le jogging Repos pour la mi-saison.", { formality: 1 }),
    S("sweat-marine-2", "Sweat Marée col zippé", "sport", "Sweat", "sw-navy", C.marine, "Coton biologique", "Coupe droite", 72, "Le Marée avec un col camionneur.", { formality: 1 }),
    S("course-noir", "T-shirt Course noir", "sport", "T-shirt technique", "tee-black", C.noir, "Polyester recyclé", "Coupe près du corps", 39, "Le Course en noir.", { formality: 1 }),
  ],
};

// ───────────────────────── génération des produits ─────────────────────────
const prefix: Record<BrandId, string> = { verac: "MV", bastide: "LB", kolm: "KD", norrland: "NS", ferrand: "AF", rivage: "SR" };
const catCode: Record<Category, string> = { hauts: "HT", chemises: "CH", maille: "MA", pantalons: "PA", vestes: "VE", costumes: "CO", chaussures: "CS", accessoires: "AC", sport: "SP" };

function sizesForSpec(b: BrandId, s: Spec): string[] {
  if (s.sizes) return s.sizes;
  if (s.cat === "chaussures") return SHOES.slice(0, 13);
  if (b === "verac" && s.cat === "chemises") return COLLARS;
  if (b === "verac" && (s.cat === "vestes" || s.cat === "costumes") && !/Pantalon/.test(s.name)) return JACKETS;
  if (b === "verac" && (s.cat === "pantalons" || /Pantalon/.test(s.name))) return TROUSERS;
  if (s.cat === "pantalons") return ["W28 L32", "W29 L32", "W30 L32", "W31 L32", "W32 L32", "W33 L32", "W34 L32", "W36 L32", "W31 L34", "W32 L34"];
  return LETTERS;
}

const products: Product[] = [];
for (const b of brands) {
  catalogSpecs[b.id].forEach((s, i) => {
    const sizes = sizesForSpec(b.id, s).map((size) => ({ size, stock: rnd() < 0.12 ? 0 : int(1, 18) }));
    const baseReturn = b.id === "verac" ? 0.27 : b.id === "kolm" ? 0.24 : b.id === "ferrand" ? 0.19 : b.id === "norrland" ? 0.16 : 0.13;
    products.push({
      id: `${b.id}-${s.key}`,
      ref: `${prefix[b.id]}-${catCode[s.cat]}-${String(2400 + i * 7 + int(0, 6)).padStart(4, "0")}-${String(int(10, 99))}`,
      brandId: b.id,
      name: s.name,
      category: s.cat,
      subcategory: s.sub,
      description: s.desc,
      material: s.material,
      fit: s.fit,
      color: s.color,
      otherColors: s.others ?? [],
      sizes,
      price: s.price,
      rating: round1(4.1 + rnd() * 0.8),
      reviews: int(18, 640),
      returnRate: round1((baseReturn + (rnd() - 0.5) * 0.08) * 100),
      image: img(s.img),
      season: s.season ?? "toutes saisons",
      formality: s.formality ?? 3,
    });
  });
}
const P = (id: string) => {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error("produit inconnu " + id);
  return p;
};

// ───────────────────────── utilisateur ─────────────────────────
const user: UserProfile = {
  firstName: "Thomas", lastName: "Lefèvre", age: 28, job: "Consultant junior, cabinet de conseil en stratégie", city: "Paris 11e",
  heightCm: 180, weightKg: 74, build: "Carrure normale",
  style: "Smart casual, couleurs neutres, pas de logos visibles",
  favoriteColors: [C.marine, C.gris, C.blanc, C.beige, C.olive],
  dislikes: ["Logos visibles", "Couleurs vives", "Coupes très amples"],
  monthlyBudget: 120,
  reference: { top: "M", collar: "39", waist: "31", inseam: "32", trousersFr: "40", jacket: "48", shoe: "43.5", chestCm: 98, waistCm: 80 },
  avatar: img("avatar"),
};

// ───────────────────────── commandes ─────────────────────────
type OrderLine = { pid: string; size: string; returned?: { reason: string; date: string } };
const orderDefs: { id: string; brandId: BrandId; date: string; lines: OrderLine[] }[] = [
  { id: "LB2505-48213", brandId: "bastide", date: "2025-05-28", lines: [{ pid: "bastide-essentiel-blanc", size: "M" }, { pid: "bastide-essentiel-noir", size: "M" }] },
  { id: "MV-25-031847", brandId: "verac", date: "2025-06-03", lines: [{ pid: "verac-popeline-haussmann", size: "39", returned: { reason: "Trop petit", date: "2025-06-09" } }] },
  { id: "MV-25-032266", brandId: "verac", date: "2025-06-14", lines: [{ pid: "verac-popeline-haussmann", size: "40" }] },
  { id: "KD-104927", brandId: "kolm", date: "2025-07-19", lines: [{ pid: "kolm-k1-brut", size: "W32 L32", returned: { reason: "Trop large à la taille", date: "2025-07-24" } }] },
  { id: "KD-105311", brandId: "kolm", date: "2025-07-30", lines: [{ pid: "kolm-k1-brut", size: "W31 L32" }] },
  { id: "LB2509-61877", brandId: "bastide", date: "2025-09-10", lines: [{ pid: "bastide-chino-beige", size: "W31 L32" }, { pid: "bastide-chino-anthracite", size: "W31 L32" }, { pid: "bastide-sorgue-noir", size: "M" }] },
  { id: "MV-25-047120", brandId: "verac", date: "2025-10-21", lines: [{ pid: "verac-trocadero-veste", size: "50" }, { pid: "verac-trocadero-pantalon", size: "42" }] },
  { id: "AF-2511-0718", brandId: "ferrand", date: "2025-11-29", lines: [{ pid: "ferrand-lucien", size: "43" }, { pid: "ferrand-marcel", size: "43" }] },
  { id: "LB2601-70452", brandId: "bastide", date: "2026-01-15", lines: [{ pid: "bastide-merinos-marine", size: "M" }, { pid: "bastide-hoodie-ventoux", size: "L", returned: { reason: "Trop grand", date: "2026-01-21" } }, { pid: "bastide-hoodie-ventoux", size: "M" }] },
  { id: "MV-26-012904", brandId: "verac", date: "2026-03-12", lines: [{ pid: "verac-oxford-sg", size: "40" }, { pid: "verac-opera-rayee", size: "40" }] },
  { id: "KD-109842", brandId: "kolm", date: "2026-04-22", lines: [{ pid: "kolm-k1-delave", size: "W31 L32" }, { pid: "kolm-chemise-indigo", size: "M" }] },
  { id: "AF-2605-0233", brandId: "ferrand", date: "2026-05-17", lines: [{ pid: "ferrand-leon", size: "43" }, { pid: "ferrand-auguste-noir", size: "43" }] },
  { id: "MV-26-038511", brandId: "verac", date: "2026-09-02", lines: [{ pid: "verac-faubourg", size: "50" }, { pid: "verac-cravate-tricot", size: "TU" }] },
  { id: "MV-26-044379", brandId: "verac", date: "2026-10-08", lines: [{ pid: "verac-pinces-flanelle", size: "42" }] },
];
const shippingFor: Record<BrandId, number> = { verac: 0, bastide: 4.9, kolm: 0, norrland: 0, ferrand: 0, rivage: 4.9 };
const orders: Order[] = orderDefs.map((o) => {
  const items = o.lines.map((l) => {
    const p = P(l.pid);
    return { productId: p.id, name: p.name, size: l.size, color: p.color.name, price: p.price, qty: 1, returned: l.returned };
  });
  const total = items.reduce((s, i) => s + i.price, 0);
  const shipping = total >= 60 ? 0 : shippingFor[o.brandId];
  const allReturned = items.every((i) => i.returned);
  return { id: o.id, brandId: o.brandId, date: o.date, items, total, shipping, status: allReturned ? "remboursée" : items.some((i) => i.returned) ? "retournée partiellement" : "livrée" };
});

// ───────────────────────── garde-robe ─────────────────────────
const items: WardrobeItem[] = [];
let n = 0;
const nextId = () => `w${String(++n).padStart(3, "0")}`;

// 1) Import de compte : chaque ligne de commande gardée devient un article
for (const o of orders) {
  for (const l of o.items) {
    if (l.returned) continue;
    const p = P(l.productId);
    if (items.some((i) => i.productId === p.id)) continue;
    items.push({
      id: nextId(), source: "import", category: p.category, subcategory: p.subcategory, name: p.name, brandId: p.brandId,
      brandName: brandById[p.brandId].name, color: p.color, material: p.material, size: l.size, fit: p.fit, season: p.season,
      formality: p.formality, purchaseDate: o.date, price: p.price, ref: p.ref, productId: p.id, orderId: o.id,
      baseWears: 0, baseLastWornDaysAgo: null, status: "disponible", image: p.image, quantity: 1, missing: [],
    });
  }
}

// 2) Ajout photo : fiche complète saisie par l'utilisateur (achats en boutique, cadeaux)
const photoDefs: [string, string, string][] = [
  // [produit catalogue, taille, note]
  ["norrland-hallen", "S", "Acheté en boutique à Annecy, Noël 2024"],
  ["norrland-abisko", "S", "Acheté en boutique"],
  ["norrland-malmo", "S", "Soldes d'hiver, boutique Saint-Germain"],
  ["rivage-repos-jogging", "M", "Acheté en boutique"],
  ["rivage-vague-gris", "43.5", "Acheté en boutique"],
  ["rivage-course-gris", "M", "Cadeau"],
  ["ferrand-weekender", "TU", "Acheté à l'atelier de Romans"],
  ["ferrand-ceinture-ferrand", "95", "Acheté à l'atelier de Romans"],
  ["ferrand-valmy", "TU", "Cadeau de fin d'études"],
  ["norrland-lund", "TU", "Cadeau"],
];
const photoDates = ["2024-12-21", "2025-01-11", "2026-01-24", "2025-04-05", "2025-04-05", "2025-12-25", "2025-08-16", "2025-08-16", "2024-07-04", "2025-12-25"];
photoDefs.forEach(([pid, size, note], i) => {
  const p = P(pid);
  items.push({
    id: nextId(), source: "photo", category: p.category, subcategory: p.subcategory, name: p.name, brandId: p.brandId,
    brandName: brandById[p.brandId].name, color: p.color, material: p.material, size, fit: p.fit, season: p.season,
    formality: p.formality, purchaseDate: photoDates[i], price: note === "Cadeau" || note.startsWith("Cadeau") ? null : p.price, ref: null, productId: null, orderId: null,
    baseWears: 0, baseLastWornDaysAgo: null, status: "disponible", image: p.image, quantity: 1, missing: [], notes: note,
  });
});

// 3) Détection vidéo : fiche partielle (catégorie, couleur, quantité approximative)
const videoDefs: [Category, string, string, Color, string, number, number][] = [
  // [catégorie, sous-catégorie, nom provisoire, couleur, photo, quantité, formalité]
  ["hauts", "T-shirt", "T-shirts blancs", C.blanc, "tee-white-worn", 3, 1],
  ["hauts", "T-shirt", "T-shirts noirs", C.noir, "tee-black-2", 3, 1],
  ["hauts", "T-shirt", "T-shirt marine", C.marine, "tee-navy-flatlay", 1, 1],
  ["hauts", "T-shirt", "T-shirt écru épais", C.ecru, "tee-white-folded", 1, 1],
  ["hauts", "Polo", "Polo vert", C.vert, "polo-green", 1, 2],
  ["hauts", "Polo", "Polo bleu ciel", C.ciel, "polo-sky", 1, 2],
  ["chemises", "Chemise", "Chemises blanches", C.blanc, "ch-white-hanger", 2, 4],
  ["chemises", "Chemise", "Chemise vichy bleue", C.bleu, "ch-gingham-blue", 1, 3],
  ["chemises", "Chemise", "Chemise en lin écrue", C.ecru, "ch-linen-ecru", 1, 2],
  ["chemises", "Chemise", "Chemises bleues", C.bleu, "ch-blue-stack", 2, 4],
  ["chemises", "Surchemise", "Surchemise velours camel", C.camel, "os-corduroy-camel", 1, 2],
  ["maille", "Col roulé", "Col roulé marine", C.marine, "kn-roll-navy", 1, 4],
  ["maille", "Pull", "Pull marinière", C.marine, "kn-breton", 1, 2],
  ["maille", "Pull", "Pull col V noir", C.noir, "kn-vneck-black", 1, 3],
  ["maille", "Gilet", "Gilet gris anthracite", C.anthracite, "kn-cardigan-charcoal", 1, 2],
  ["maille", "Sweat", "Sweat marine", C.marine, "sw-navy", 1, 1],
  ["maille", "Pull", "Pull camionneur marine", C.marine, "kn-zip-navy", 1, 3],
  ["pantalons", "Chino", "Chino pierre", C.pierre, "pt-chino-stone", 1, 3],
  ["pantalons", "Pantalon", "Pantalon marron", C.marron, "pt-trouser-brown", 1, 3],
  ["pantalons", "Jean", "Jean gris", C.anthracite, "jn-grey", 1, 2],
  ["pantalons", "Jean", "Jean indigo", C.indigo, "jn-indigo-hanger", 1, 2],
  ["vestes", "Blazer", "Blazer gris chiné", C.gris, "bz-grey-melange", 1, 4],
  ["vestes", "Blouson", "Blouson en cuir noir", C.noir, "ou-leather-black", 1, 2],
  ["vestes", "Veste matelassée", "Veste matelassée marine", C.marine, "ou-quilted-navy", 1, 3],
  ["vestes", "Veste légère", "Veste légère beige", C.sable, "ou-field-beige", 1, 2],
  ["chaussures", "Baskets", "Baskets en toile marine", C.marine, "fo-sneaker-canvas-navy", 1, 1],
  ["chaussures", "Mocassins", "Mocassins cognac", C.cognac, "fo-loafers", 1, 3],
  ["chaussures", "Bottines", "Bottines à boucle cognac", C.cognac, "fo-boots-buckle", 1, 3],
  ["accessoires", "Bonnet", "Bonnet gris", C.gris, "ac-beanie-grey", 1, 1],
];
for (const [cat, sub, name, color, im, qty, formality] of videoDefs) {
  items.push({
    id: nextId(), source: "video", category: cat, subcategory: sub, name, brandId: null, brandName: "Marque inconnue", color,
    material: null, size: null, fit: null, season: "toutes saisons", formality, purchaseDate: null, price: null, ref: null, productId: null,
    orderId: null, baseWears: 0, baseLastWornDaysAgo: null, status: "disponible", image: img(im), quantity: qty,
    missing: ["marque", "taille", "matière", "date d'achat"],
  });
}

// statuts linge (le chino beige est géré dynamiquement : il passe « au linge » après le port de mardi)
const byName = (name: string) => {
  const it = items.find((i) => i.name === name);
  if (!it) throw new Error("article introuvable " + name);
  return it;
};
byName("Chemise Popeline Haussmann").status = "au pressing";
byName("T-shirts noirs").status = "au linge";
byName("Hoodie Ventoux").status = "au linge";

// vues 360° (séries de photos du même modèle sous plusieurs angles)
byName("Chelsea Marcel").gallery = [0, 1, 2, 3, 4, 5].map((k) => `/images/360/chelsea-${k}.jpg`);
byName("Bottines à boucle cognac").gallery = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => `/images/360/raymond-${k}.jpg`);

// historique de port antérieur au journal
for (const it of items) {
  const ageDays = it.purchaseDate ? Math.max(30, Math.round((Date.parse("2026-11-16") - Date.parse(it.purchaseDate)) / 86400000)) : int(200, 900);
  const freq = it.formality >= 5 ? 0.025 : it.category === "hauts" ? 0.07 : it.category === "accessoires" ? 0.03 : 0.045;
  it.baseWears = Math.max(0, Math.round((ageDays - 30) * freq * (0.6 + rnd() * 0.8)));
  it.baseLastWornDaysAgo = it.baseWears ? int(31, 140) : null;
}
// articles délaissés (pour la statistique « non portés depuis 3 mois »)
for (const name of ["Chemise flanelle Durance", "Polo bleu ciel", "Chemise en lin écrue", "Pull marinière", "Veste légère beige", "Baskets en toile marine", "Mocassins cognac", "Polo vert", "Chino pierre", "Pantalon marron", "Blouson en cuir noir", "Sac week-end Ferrand", "Chemises bleues", "T-shirt écru épais"]) {
  const it = items.find((i) => i.name === name);
  if (it) { it.baseLastWornDaysAgo = int(95, 260); it.baseWears = Math.min(it.baseWears, int(1, 6)); }
}
// enrichissement progressif : les t-shirts noirs ont été portés 6 fois
byName("T-shirts noirs").baseWears = 6;

// ───────────────────────── journal de port (30 jours) ─────────────────────────
const id = (name: string) => byName(name).id;
const workOutfits: [string[], string][] = [
  [["Chemise Oxford Saint-Germain", "Chino Luberon anthracite", "Derby Lucien", "Pull col rond Mérinos"], "Bureau"],
  [["Chemise Popeline rayée Opéra", "Pantalon de costume Trocadéro", "Veste de costume Trocadéro", "Richelieu Auguste", "Cravate tricot à pois"], "Rendez-vous client"],
  [["Chemises bleues", "Pantalon à pinces Flanelle", "Blazer Faubourg", "Derby Lucien"], "Bureau"],
  [["Chemise Kolm en denim indigo", "Jean K1 Slim selvedge brut", "Chelsea Marcel", "Blazer gris chiné"], "Bureau (vendredi)"],
  [["Chemises blanches", "Chino Luberon anthracite", "Blazer Faubourg", "Sneaker Léon"], "Bureau"],
  [["Col roulé marine", "Pantalon à pinces Flanelle", "Blazer gris chiné", "Chelsea Marcel"], "Bureau"],
  [["Chemise Oxford Saint-Germain", "Jean K1 Slim délavé", "Pull camionneur marine", "Sneaker Léon"], "Bureau (vendredi)"],
];
const weekendOutfits: [string[], string][] = [
  [["T-shirt Essentiel", "Jean K1 Slim selvedge brut", "Sneaker Léon", "Veste matelassée marine"], "Brunch"],
  [["T-shirts noirs", "Jean gris", "Chelsea Marcel", "Blouson en cuir noir"], "Soirée"],
  [["Hoodie Ventoux", "Jogging Repos", "Baskets Vague grises"], "Course du dimanche"],
  [["Pull col rond Mérinos", "Jean indigo", "Bottines à boucle cognac", "Manteau Hallen"], "Expo + dîner"],
  [["T-shirt Course", "Jogging Repos", "Baskets Vague grises"], "Running"],
  [["Polo Sorgue", "Jean K1 Slim délavé", "Sneaker Léon"], "Courses, ciné"],
  [["Sweat marine", "Jean K1 Slim selvedge brut", "Doudoune Abisko", "Bonnet gris"], "Balade"],
];
const anchor = new Date("2026-11-16T12:00:00Z"); // jour de génération : sert seulement à alterner semaine / week-end
const wearLog: WearDay[] = [];
let wi = 0, we = 0;
for (let d = 1; d <= 30; d++) {
  const dow = new Date(anchor.getTime() - d * 86400000).getUTCDay();
  const weekend = dow === 0 || dow === 6;
  const [names, occasion] = weekend ? weekendOutfits[we++ % weekendOutfits.length] : workOutfits[(wi++ * 3) % workOutfits.length];
  wearLog.push({ daysAgo: d, itemIds: names.map(id), occasion });
}
// Tenue « épinglée » du mardi précédent (rejouée dynamiquement selon la date du jour)
const pinnedTuesday = {
  weekday: 2,
  itemIds: [id("Chemise Oxford Saint-Germain"), id("Chino Luberon"), id("Sneaker Léon"), id("Pull col rond Mérinos")],
  occasion: "Bureau",
  laundry: [id("Chino Luberon")],
};

// ───────────────────────── agenda & météo ─────────────────────────
const calendar: CalendarTemplate[] = [
  { id: "c1", when: "tomorrow", time: "10:00", title: "Rendez-vous client chez Orsay Conseil", place: "Orsay Conseil, 42 avenue de l'Opéra, Paris 2e", dressCode: "business formel", dressCodeNote: "Comité de direction d'un groupe industriel : costume sombre, cravate appréciée." },
  { id: "c2", when: "tomorrow", time: "13:00", title: "Déjeuner d'équipe", place: "Brasserie Le Mermoz, Paris 8e", dressCode: "smart casual", dressCodeNote: "" },
  { id: "c3", when: "next:4", time: "19:00", title: "Afterwork chez Kiwee", place: "Kiwee (start-up), rue du Faubourg-Saint-Antoine, Paris 11e", dressCode: "casual", dressCodeNote: "Ambiance start-up : jean et sneakers bienvenus." },
  { id: "c4", when: "next:6", time: "20:30", title: "Dîner d'anniversaire de Camille", place: "Le Comptoir des Arts, Paris 3e", dressCode: "smart casual", dressCodeNote: "Restaurant élégant, pas de tenue imposée." },
  { id: "c5", when: "next:0", time: "10:30", title: "Course au parc de Bercy", place: "Parc de Bercy", dressCode: "sport", dressCodeNote: "" },
  { id: "c6", when: "offset:21", time: "08:12", durationDays: 3, title: "Séminaire d'équipe à Lyon (3 jours)", place: "Hôtel Le Confluent, Lyon 2e — TGV Paris Gare de Lyon 08 h 12", dressCode: "smart casual", dressCodeNote: "Journées en salle (smart casual), soirée de gala le 2e soir (veste exigée), activité en extérieur le 3e jour." },
  { id: "c7", when: "date:06-13", time: "15:00", title: "Mariage de Julien et Inès", place: "Domaine de la Bergerie, Vexin", dressCode: "habillé", dressCodeNote: "Cérémonie laïque en extérieur puis dîner. Dress code : « chic d'été »." },
];
const weather: WeatherDay[] = [
  { offset: 0, tempMin: 7, tempMax: 11, condition: "couvert", rainProb: 30, wind: 14 },
  { offset: 1, tempMin: 6, tempMax: 9, condition: "pluie", rainProb: 90, wind: 22 },
  { offset: 2, tempMin: 5, tempMax: 10, condition: "averses", rainProb: 60, wind: 18 },
  { offset: 3, tempMin: 4, tempMax: 11, condition: "éclaircies", rainProb: 20, wind: 10 },
  { offset: 4, tempMin: 6, tempMax: 12, condition: "nuageux", rainProb: 25, wind: 12 },
  { offset: 5, tempMin: 3, tempMax: 9, condition: "soleil", rainProb: 5, wind: 8 },
  { offset: 6, tempMin: 2, tempMax: 8, condition: "soleil", rainProb: 5, wind: 9 },
];

// ───────────────────────── tableau de bord marque (Maison Vérac) ─────────────────────────
const months = ["déc.", "janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov."];
let members = 3100;
const series = months.map((m, i) => {
  members = Math.round(members * (1.12 + rnd() * 0.04));
  const orders = Math.round(members * (0.034 + rnd() * 0.006));
  return {
    month: m,
    members,
    revenue: Math.round(orders * (148 + rnd() * 18)),
    orders,
    returnRateApp: round1(11.8 - i * 0.22 + (rnd() - 0.5) * 0.8),
    returnRateBrand: round1(27.4 + (rnd() - 0.5) * 1.2),
  };
});
// recalage : la dernière valeur vaut exactement 12 400 membres, sans rupture de courbe
const scale = 12400 / series[series.length - 1].members;
for (const x of series) { x.members = Math.round(x.members * scale); x.orders = Math.round(x.orders * scale); x.revenue = Math.round(x.revenue * scale); }
series[series.length - 1].members = 12400;
const totalRevenue = series.reduce((s, x) => s + x.revenue, 0);
const totalOrders = series.reduce((s, x) => s + x.orders, 0);
const brandDashboard = {
  brandId: "verac",
  period: "12 derniers mois",
  kpis: {
    connectedMembers: 12400,
    connectedGrowth: 18.4,
    revenueViaApp: totalRevenue,
    ordersViaApp: totalOrders,
    averageBasket: Math.round(totalRevenue / totalOrders),
    averageBasketBrand: 131,
    returnRateApp: 9.4,
    returnRateBrand: 27.4,
    sizePrecision: 91.6,
    returnsAvoided: Math.round(totalOrders * (0.274 - 0.094)),
    costPerReturn: 21.5,
    markdownRate: 0.25,
    contributionMargin: 0.35,
    co2PerReturnKg: 1.8,
    recommendationsShown: 214300,
    recommendationCtr: 6.8,
    subscription: { plan: "Partenaire Premium", monthly: 2900, commission: 4 },
  },
  series,
  sizeAccuracy: [
    { category: "Chemises", precision: 94.1, returnsSize: 3.2 },
    { category: "Vestes", precision: 89.7, returnsSize: 5.8 },
    { category: "Pantalons", precision: 90.3, returnsSize: 4.9 },
    { category: "Maille", precision: 92.8, returnsSize: 2.7 },
  ],
  returnReasons: [
    { reason: "Taille", brand: 52, app: 21 },
    { reason: "Ne va avec rien", brand: 14, app: 4 },
    { reason: "Rendu différent", brand: 21, app: 15 },
    { reason: "Qualité", brand: 6, app: 6 },
    { reason: "Autre", brand: 7, app: 5 },
  ],
  insights: [
    { value: "38 %", text: "de vos clients connectés n'ont pas de pantalon habillé gris.", action: "Mettre en avant le Pantalon à pinces Flanelle dans les tenues « bureau »." },
    { value: "62 %", text: "portent leur chemise Oxford Saint-Germain avec un chino beige ou un jean brut.", action: "Proposer un lot Oxford + chino avec une marque partenaire." },
    { value: "1 sur 4", text: "de vos clients prend une taille trop petite lors de son premier achat chez vous.", action: "Afficher l'avertissement « taille petit » dès la fiche produit." },
    { value: "2 100", text: "clients ont un mariage ou une cérémonie dans leur agenda d'ici juillet.", action: "Lancer la Veste Riviera (lin et laine) en avant-première pour ce segment." },
    { value: "27 %", text: "des blazers marine vendus ne sont portés qu'une fois par mois.", action: "Suggérer 3 tenues de semaine avec le blazer après l'achat." },
  ],
  topProducts: ["verac-oxford-sg", "verac-popeline-haussmann", "verac-faubourg", "verac-trocadero-veste", "verac-montparnasse"].map((pid, i) => ({
    productId: pid, sales: [612, 488, 301, 244, 233][i], viaRecommendation: [41, 37, 52, 46, 58][i],
  })),
};

// ───────────────────────── écriture ─────────────────────────
fs.mkdirSync(OUT, { recursive: true });
const write = (f: string, d: unknown) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(d, null, 1) + "\n");
write("brands.json", brands);
write("products.json", products);
write("user.json", user);
write("orders.json", orders);
write("wardrobe.json", items);
write("wear-log.json", { days: wearLog, pinnedTuesday });
write("calendar.json", calendar);
write("weather.json", { city: "Paris", days: weather });
write("brand-dashboard.json", brandDashboard);

// contrôle de cohérence des tailles achetées avec le moteur de recommandation
for (const it of items.filter((i) => i.source === "import")) {
  const p = P(it.productId!);
  const b = brandById[p.brandId];
  const rec = recommendSize(user, b, p.category, p.sizes.map((s) => s.size));
  if (p.sizes.length > 1 && rec.size !== it.size) throw new Error(`Incohérence de taille : ${p.name} acheté en ${it.size}, moteur = ${rec.size}`);
}
const counts = items.reduce<Record<string, number>>((a, i) => ((a[i.source] = (a[i.source] ?? 0) + 1), a), {});
console.log(`${brands.length} marques, ${products.length} produits, ${orders.length} commandes, ${items.length} articles`, counts);
