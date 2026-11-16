/**
 * Mode secours : réponses scénarisées, calculées à partir des vraies données
 * (garde-robe, statuts linge, agenda, météo, guides des tailles).
 * Utilisé quand la clé API est absente, quand l'appel échoue, ou hors ligne.
 */
import type { Card } from "./cards";
import type { ToolContext } from "./assistant-tools";
import { recommendSizeFor } from "./assistant-tools";
import type { DerivedItem } from "./wardrobe";
import { calendar, longDate, relativeDay, addDays, WEEKDAYS, daysSinceLastWeekday } from "./time";
import { productById, weather, formatPrice } from "./data";

export type ScenarioId = "rdv" | "oxford" | "lyon" | "mariage" | "today" | "aide";
export type Part = { text: string } | { card: Card };
export type Scripted = { steps: string[]; parts: Part[] };

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export function detectScenario(message: string): ScenarioId {
  const m = norm(message);
  if (/mariage|ceremonie|temoin|juin/.test(m)) return "mariage";
  if (/lyon|valise|seminaire|voyage|bagage|partir/.test(m)) return "lyon";
  if (/oxford|quel pantalon|avec ma chemise/.test(m)) return "oxford";
  if (/orsay|rendez-vous|rdv|client|demain/.test(m)) return "rdv";
  if (/aujourd|ce matin|ce soir|tenue|porter|mettre/.test(m)) return "today";
  return "aide";
}

function finder(items: DerivedItem[]) {
  const byName = (n: string) => items.find((i) => i.name === n);
  return {
    get: byName,
    /** premier article existant ET disponible */
    avail: (...names: string[]) => names.map(byName).find((i) => i && i.status === "disponible"),
    any: (...names: string[]) => names.map(byName).find(Boolean),
  };
}

const piece = (i: DerivedItem | undefined, role: string) => (i ? [{ itemId: i.id, role }] : []);

export function buildScenario(id: ScenarioId, ctx: ToolContext): Scripted {
  const f = finder(ctx.items);
  const events = calendar(ctx.today);
  const tue = daysSinceLastWeekday(ctx.today, 2);
  const tueLabel = tue <= 6 ? "mardi" : "mardi dernier";

  if (id === "rdv") {
    const ev = events.find((e) => e.id === "c1")!;
    const w = weather.days[1];
    const preferred = f.any("Chemise Popeline Haussmann", "Chemises blanches");
    const shirt = f.avail("Chemise Popeline Haussmann", "Chemise Popeline rayée Opéra", "Chemises blanches", "Chemises bleues", "Chemise Oxford Saint-Germain");
    const jacket = f.avail("Veste de costume Trocadéro", "Blazer Faubourg", "Blazer gris chiné");
    const trousers = f.avail("Pantalon de costume Trocadéro", "Pantalon à pinces Flanelle", "Chino Luberon anthracite");
    const tie = f.avail("Cravate tricot à pois");
    const shoes = f.avail("Richelieu Auguste", "Derby Lucien", "Chelsea Marcel");
    const coat = f.avail("Trench Malmö", "Manteau Hallen", "Doudoune Abisko");
    const bag = f.avail("Besace Valmy");
    const cards: Card[] = [{
      type: "outfit",
      title: "Rendez-vous chez Orsay Conseil",
      subtitle: `${ev.label}, ${ev.time?.replace(":", " h ")} · business formel · ${w.tempMax} °C, pluie`,
      pieces: [...piece(jacket, "Veste"), ...piece(shirt, "Chemise"), ...piece(trousers, "Pantalon"), ...piece(tie, "Cravate"), ...piece(shoes, "Chaussures"), ...piece(coat, "Par-dessus"), ...piece(bag, "Sac")],
      explanation: `Le costume marine est la valeur sûre face à un comité de direction ; la cravate en tricot évite l'effet trop strict. ${coat?.name === "Trench Malmö" ? "Le trench Malmö est déperlant : il remplace le parapluie entre le métro et l'avenue de l'Opéra." : "Prévoyez un parapluie."}`,
    }];
    if (preferred && shirt && preferred.id !== shirt.id && preferred.status !== "disponible") {
      cards.push({ type: "laundry", unavailableId: preferred.id, replacementId: shirt.id, message: `Votre ${lowerFirst(preferred.name)} est ${preferred.status}. Je l’ai remplacée par la ${lowerFirst(shirt.name)}, tout aussi formelle.` });
    }
    return {
      steps: ["Lecture de votre agenda", "Météo de demain à Paris", "Vérification du linge", "Composition de la tenue"],
      parts: [
        { text: `${ev.label} à ${ev.time?.replace(":", " h ")}, ${ev.title.replace("Rendez-vous client chez ", "rendez-vous chez ")} : le dress code est **business formel**. Météo : ${w.tempMax} °C, pluie (${w.rainProb} %) et vent à ${w.wind} km/h.\n\nVoici ce que je vous propose :` },
        ...cards.map((card) => ({ card })),
        { text: shoes?.name === "Richelieu Auguste" ? "Un détail : vos richelieus Auguste ont une semelle cuir. Si la pluie redouble, passez sur le derby Lucien en cuir grainé, qui ne craint pas l'eau." : "Bon rendez-vous !" },
      ],
    };
  }

  if (id === "oxford") {
    const oxford = f.any("Chemise Oxford Saint-Germain", "Chemises bleues");
    const beige = f.get("Chino Luberon");
    const beigeOk = beige && beige.status === "disponible";
    const chino = beigeOk ? beige : f.avail("Chino Luberon anthracite", "Pantalon à pinces Flanelle", "Chino pierre");
    const knit = f.avail("Pull col rond Mérinos", "Pull camionneur marine", "Col roulé marine");
    const derby = f.avail("Derby Lucien", "Chelsea Marcel", "Sneaker Léon");
    const jean = f.avail("Jean K1 Slim selvedge brut", "Jean indigo", "Jean K1 Slim délavé");
    const sneaker = f.avail("Sneaker Léon", "Baskets en toile marine", "Baskets Vague grises");
    const jacket = f.avail("Veste matelassée marine", "Blazer gris chiné", "Blouson en cuir noir");
    const parts: Part[] = [
      { text: `Bonne pioche : votre ${oxford?.name ?? "chemise oxford"} est l'une de vos pièces les plus polyvalentes (${oxford?.timesWorn ?? 0} ports). Le bleu ciel s'accorde avec les tons neutres : beige, gris, marine et denim brut.` },
    ];
    if (beige && !beigeOk && chino) {
      parts.push({ card: { type: "laundry", unavailableId: beige.id, replacementId: chino.id, message: `Votre chino beige a été porté ${tueLabel}, il est sans doute au linge. Je l'ai remplacé par le ${chino.name === "Chino Luberon anthracite" ? "gris anthracite" : chino.name.toLowerCase()}.` } });
    }
    parts.push({ card: { type: "outfit", title: "Au bureau", subtitle: "Smart casual · semaine", pieces: [...piece(oxford, "Chemise"), ...piece(chino, "Pantalon"), ...piece(knit, "Pull"), ...piece(derby, "Chaussures")], explanation: `${chino?.name === "Chino Luberon anthracite" ? "Le gris anthracite donne plus de tenue que le beige : parfait pour le bureau." : "Le beige adoucit le bleu ciel ; le pull marine structure l'ensemble."} Rentrez la chemise, col ouvert.` } });
    parts.push({ card: { type: "outfit", title: "Le week-end", subtitle: "Casual", pieces: [...piece(oxford, "Chemise"), ...piece(jean, "Jean"), ...piece(sneaker, "Chaussures"), ...piece(jacket, "Veste")], explanation: "Le contraste oxford clair / denim brut est un classique. Chemise portée sortie, manches retroussées deux fois." } });
    return { steps: ["Recherche dans votre dressing", "Vérification du linge", "Accords de couleurs"], parts };
  }

  if (id === "lyon") {
    const ev = events.find((e) => e.id === "c6")!;
    const g = (label: string, names: (string | [string, string])[]) => ({
      label,
      entries: names.flatMap((n) => {
        const [name, note] = Array.isArray(n) ? n : [n, ""];
        const it = f.get(name);
        if (!it) return [];
        const extra = it.status !== "disponible" ? ` (${it.status} : à récupérer avant le départ)` : note;
        return [{ itemId: it.id, label: `${it.name}${extra}`, qty: 1 }];
      }),
    });
    const shirtGala = f.any("Chemise Popeline Haussmann", "Chemises blanches");
    const groups = [
      g("À porter dans le train", ["Manteau Hallen", "Pull col rond Mérinos", "Jean K1 Slim selvedge brut", "Chelsea Marcel"]),
      g("Journées de séminaire", ["Blazer Faubourg", "Chemise Oxford Saint-Germain", "Chemise Popeline rayée Opéra", "Chino Luberon anthracite", "Col roulé marine", "Derby Lucien"]),
      g("Soirée de gala (veste exigée)", ["Pantalon à pinces Flanelle", shirtGala?.name ?? "Chemises blanches", "Cravate tricot à pois"]),
      g("Activité en extérieur", ["Doudoune Abisko", "Sweat marine", "Sneaker Léon", "Bonnet gris"]),
      { label: "Indispensables", entries: [{ label: "T-shirts blancs (sous les chemises)", qty: 3 }, { label: "Sous-vêtements", qty: 4 }, { label: "Chaussettes (dont 1 paire fine pour le gala)", qty: 4 }, { label: "Trousse de toilette", qty: 1 }, { label: "Embauchoirs pour les derbies", qty: 1 }] },
    ].filter((x) => x.entries.length);
    const bag = f.get("Sac week-end Ferrand");
    const count = groups.reduce((s, x) => s + x.entries.filter((e) => "itemId" in e && e.itemId).length, 0);
    const day1 = { type: "outfit" as const, title: "Jour 1 : arrivée et séminaire", subtitle: `${longDate(ev.date)} · smart casual`, pieces: [...piece(f.avail("Blazer Faubourg"), "Veste"), ...piece(f.avail("Chemise Oxford Saint-Germain", "Chemises bleues"), "Chemise"), ...piece(f.avail("Chino Luberon anthracite", "Chino pierre"), "Pantalon"), ...piece(f.avail("Derby Lucien"), "Chaussures"), ...piece(f.avail("Manteau Hallen", "Trench Malmö"), "Manteau")], explanation: "Le blazer se porte dès le train : il voyage mieux sur le dos que dans le sac." };
    return {
      steps: ["Lecture de votre agenda", "Prévisions saisonnières à Lyon", "Sélection des pièces disponibles", "Optimisation du volume"],
      parts: [
        { text: `Séminaire à Lyon ${relativeDay(ctx.today, ev.date)}, du ${longDate(ev.date)} au ${longDate(ev.endDate)}. Mi-décembre à Lyon : 2 à 8 °C, brouillard le matin.\n\nAu programme : deux journées en salle (smart casual), une soirée de gala le deuxième soir (veste exigée) et une activité en extérieur le troisième jour. ${count} pièces de votre dressing suffisent, rien à acheter${bag ? ", et tout tient dans votre sac week-end Ferrand (36 L, format cabine)" : ""}.` },
        { card: { type: "packing", title: "Valise : séminaire à Lyon", subtitle: `3 jours · ${count} pièces · 3 tenues complètes`, groups } },
        { card: day1 },
        { text: "Astuce : roulez les pulls et t-shirts, pliez les chemises autour du blazer retourné. Je vous rappellerai la veille du départ de récupérer ce qui est au pressing." },
      ],
    };
  }

  if (id === "mariage") {
    const ev = events.find((e) => e.id === "c7");
    const suit = f.get("Veste de costume Trocadéro");
    const shirt = f.any("Chemise Popeline Haussmann", "Chemises blanches");
    const shoes = f.any("Derby Lucien", "Mocassins cognac");
    const veste = productById["verac-riviera-veste"];
    const pantalon = productById["verac-riviera-pantalon"];
    const recV = recommendSizeFor(ctx, veste.id);
    const recP = recommendSizeFor(ctx, pantalon.id);
    const purchase = (p: typeof veste, rec: typeof recV, reason: string): Card => ({
      type: "purchase", productId: p.id, reason,
      ...("erreur" in rec ? {} : { size: rec.size, sizeHeadline: rec.headline, sizeReasons: rec.reasons, confidence: rec.confidence }),
    });
    const total = veste.price + pantalon.price;
    const months = Math.max(1, Math.round(total / Math.max(ctx.budget, 1)));
    const when = ev ? `${longDate(ev.date)} (${relativeDay(ctx.today, ev.date)})` : "en juin";
    return {
      steps: ["Lecture de votre agenda", "Analyse du dress code", "Inventaire de vos pièces habillées", "Recherche chez vos marques connectées", "Calcul de votre taille"],
      parts: [
        { text: `Le mariage de Julien et Inès a lieu le ${when}, au Domaine de la Bergerie : cérémonie en extérieur, dress code **« chic d'été »**, 16 à 26 °C attendus.\n\nCe que vous avez déjà : ${shirt ? `la ${shirt.name.replace("Chemise ", "chemise ")} (blanche)` : "une chemise blanche"}${shoes ? ` et le ${shoes.name.toLowerCase().replace("derby lucien", "derby Lucien")} marron` : ""}, parfaits. ${suit ? "En revanche, votre costume Trocadéro est en laine Super 120's marine : idéal l'hiver, trop chaud et trop sombre pour une cérémonie en plein soleil." : "Il vous manque un costume léger."}\n\n**Il ne manque qu'une pièce : un costume clair et léger.** Chez Maison Vérac, la ligne Riviera en lin et laine est faite pour ça :` },
        { card: purchase(veste, recV, "Lin et laine, couleur sable : la seule pièce qui manque pour un « chic d'été ».") },
        { card: purchase(pantalon, recP, "Le pantalon assorti, pour un costume complet.") },
        { card: { type: "outfit", title: "Tenue du mariage", subtitle: "Chic d'été · 2 pièces à acheter, 3 déjà à vous", pieces: [{ productId: veste.id, role: "Veste" }, { productId: pantalon.id, role: "Pantalon" }, ...piece(shirt, "Chemise"), ...piece(shoes, "Chaussures"), ...piece(f.any("Cravate tricot à pois"), "Cravate (optionnelle)")], explanation: "Le sable éclaire le teint et s'accorde au marron des derbies. Sans cravate pour la cérémonie, avec la tricot marine pour le dîner." } },
        { text: `Total : ${formatPrice(total)}, soit environ ${months} mois de votre budget vêtements (${ctx.budget} €/mois). Le mariage est dans plusieurs mois : vous pouvez commencer par la veste (${formatPrice(veste.price)}), qui ira aussi avec votre chino pierre et votre chemise en lin.` },
      ],
    };
  }

  if (id === "today") {
    const w = weather.days[0];
    const shirt = f.avail("Chemise Oxford Saint-Germain", "Chemises bleues", "Chemise Kolm en denim indigo");
    const trousers = f.avail("Chino Luberon anthracite", "Jean K1 Slim selvedge brut", "Chino pierre");
    const knit = f.avail("Pull col rond Mérinos", "Col roulé marine");
    const shoes = f.avail("Chelsea Marcel", "Derby Lucien", "Sneaker Léon");
    const coat = f.avail("Manteau Hallen", "Trench Malmö");
    return {
      steps: ["Météo du jour", "Vérification du linge", "Composition de la tenue"],
      parts: [
        { text: `Aujourd'hui à Paris : ${w.tempMin} à ${w.tempMax} °C, ciel ${w.condition}. Une tenue smart casual pour la journée :` },
        { card: { type: "outfit", title: "Tenue du jour", subtitle: `${WEEKDAYS[ctx.today.getDay()]} · ${w.tempMax} °C`, pieces: [...piece(shirt, "Chemise"), ...piece(knit, "Pull"), ...piece(trousers, "Pantalon"), ...piece(shoes, "Chaussures"), ...piece(coat, "Manteau")], explanation: "Des neutres superposés, une matière chaude (mérinos) et un manteau en laine pour le matin frais." } },
      ],
    };
  }

  const next = events[0];
  return {
    steps: ["Lecture de votre demande"],
    parts: [{ text: `Je suis votre styliste : je connais vos ${ctx.items.length} pièces, votre agenda et la météo. Je peux composer une tenue pour une occasion, accorder une pièce, préparer une valise ou vous dire ce qui manque vraiment à votre dressing.\n\nProchain événement : **${next.title}** (${next.label.toLowerCase()}). Voulez-vous que je prépare la tenue ?` }],
  };
}

/** Découpe un texte en petits morceaux pour simuler une réponse en streaming. */
export function chunkText(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [text];
}

export const SUGGESTIONS = [
  "Demain j'ai un rendez-vous chez Orsay Conseil, prépare-moi une tenue.",
  "Quel pantalon je mets avec ma chemise oxford bleue ?",
  "Je pars 3 jours à Lyon pour un séminaire, fais-moi ma valise.",
  "Je suis invité à un mariage en juin, il me manque quoi ?",
];

export const tomorrowLabel = (today: Date) => longDate(addDays(today, 1));
