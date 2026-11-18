/**
 * Mode secours pour le profil de Léa (même principe que Thomas : réponses calculées
 * à partir de son dressing, de l'agenda, de la météo et des guides des tailles).
 */
import type { Card } from "./cards";
import type { ToolContext } from "./assistant-tools";
import { recommendSizeFor } from "./assistant-tools";
import { calendar, longDate, relativeDay, daysSinceLastWeekday, WEEKDAYS } from "./time";
import { formatPrice, productById, weather } from "./data";
import { budgetScenario, finder, parseBudget, piece, type BudgetLook, type Part, type ScenarioId, type Scripted } from "./scenarios";

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const LEA_BUDGET_LOOKS: BudgetLook[] = [
  { title: "Street du week-end", subtitle: "Une mini-jupe plissée sous votre hoodie", options: [["bitume-mini-plissee"], ["bitume-jupe-noire"]], owned: [["Hoodie", ["Hoodie Heavy sable", "Hoodie Marée femme"]], ["Chaussures", ["Bottines Lucie", "Bottines taupe"]], ["Sac", ["Tote en toile"]]], explanation: "Le contraste hoodie oversize et jupe courte plissée : l'équilibre street et féminin, avec des bottines pour l'hiver." },
  { title: "Bureau, version douce", subtitle: "Une jupe midi à pois", options: [["bastide-f-jupe-pois"], ["bastide-f-jupe-fleurie"]], owned: [["Blouse", ["Blouse taupe", "Blouse Haussmann"]], ["Maille", ["Gilet crème", "Pull col bateau Alpilles"]], ["Chaussures", ["Bottines Lucie", "Ballerines Jeanne"]], ["Sac", ["Sac Valmy femme"]]], explanation: "La jupe chocolat à pois crème s'accorde à votre blouse taupe : une tenue de bureau sans tailleur." },
  { title: "Soirée", subtitle: "Une robe fleurie sous le cuir", options: [["bastide-f-robe-fleurie-noire"], ["bitume-jupe-cuir"]], owned: [["Veste", ["Blouson cuir Stockholm femme"]], ["Chaussures", ["Bottines Lucie", "Sandales noires"]], ["Sac", ["Pochette corail", "Sac Pauline"]]], explanation: "La robe nuisette fleurie et votre blouson cuir noir : le mélange doux et rock qui marche en soirée." },
  { title: "Tout neuf, de la tête aux pieds", subtitle: "Une tenue complète du catalogue", options: [["bitume-jupe-noire", "bastide-tote"]], owned: [], explanation: "Une jupe patineuse noire et un tote en toile, à compléter avec un t-shirt blanc." },
];

export function buildLeaScenario(id: ScenarioId, ctx: ToolContext, message = ""): Scripted {
  const f = finder(ctx.items);
  const events = calendar(ctx.today);
  const tue = daysSinceLastWeekday(ctx.today, 2);
  const tueLabel = tue <= 6 ? "mardi" : "mardi dernier";

  if (id === "budget") return budgetScenario(ctx, parseBudget(message) ?? ctx.budget, f, LEA_BUDGET_LOOKS);

  if (id === "rdv") {
    const ev = events.find((e) => e.id === "c1")!;
    const w = weather.days[1];
    const preferred = f.any("Blouse Haussmann");
    const blouse = f.avail("Blouse Haussmann", "Blouse taupe", "T-shirts blancs");
    const cards: Card[] = [{
      type: "outfit",
      title: "Présentation chez Orsay Conseil",
      subtitle: `${ev.label}, ${ev.time?.replace(":", " h ")} · business formel · ${w.tempMax} °C, pluie`,
      pieces: [
        ...piece(f.avail("Veste de tailleur Opéra", "Blazer Palais"), "Veste"),
        ...piece(blouse, "Blouse"),
        ...piece(f.avail("Pantalon de tailleur Opéra", "Pantalon large Calanque"), "Pantalon"),
        ...piece(f.avail("Bottines Lucie", "Escarpins noirs"), "Chaussures"),
        ...piece(f.avail("Trench Malmö femme"), "Par-dessus"),
        ...piece(f.avail("Sac Valmy femme"), "Sac"),
      ],
      explanation: "Le tailleur noir est la valeur sûre face à un comité de direction ; la blouse taupe l'adoucit. Le trench Malmö est déperlant : il remplace le parapluie entre le métro et l'avenue de l'Opéra.",
    }];
    if (preferred && blouse && preferred.id !== blouse.id && preferred.status !== "disponible") {
      cards.push({ type: "laundry", unavailableId: preferred.id, replacementId: blouse.id, message: `Votre ${lowerFirst(preferred.name)} est ${preferred.status}. Je l'ai remplacée par la ${lowerFirst(blouse.name)}, tout aussi habillée.` });
    }
    return {
      steps: ["Lecture de votre agenda", "Météo de demain à Paris", "Vérification du linge", "Composition de la tenue"],
      parts: [
        { text: `${ev.label} à ${ev.time?.replace(":", " h ")}, présentation chez Orsay Conseil : le dress code est **business formel**. Météo : ${w.tempMax} °C, pluie (${w.rainProb} %) et vent à ${w.wind} km/h.\n\nVoici ce que je vous propose :` },
        ...cards.map((card) => ({ card })),
        { text: "J'ai choisi vos bottines Lucie plutôt que les escarpins : talon de 4 cm et cuir froncé, elles tiennent sous la pluie et toute la journée." },
      ],
    };
  }

  if (id === "oxford") {
    const blazer = f.any("Blazer Palais");
    const flare = f.get("Jean K5 Flare brut");
    const flareOk = flare && flare.status === "disponible";
    const jean = flareOk ? flare : f.avail("Jean K6 Boyfriend blanc", "Cargo Parachute kaki");
    const parts: Part[] = [
      { text: `Votre ${blazer?.name ?? "blazer beige"} est une pièce très polyvalente (${blazer?.timesWorn ?? 0} ports) : le beige chiné va avec le noir, le blanc et le denim, et il passe très bien sur une pièce street.` },
    ];
    if (flare && !flareOk && jean) {
      parts.push({ card: { type: "laundry", unavailableId: flare.id, replacementId: jean.id, message: `Votre jean flare brut a été porté ${tueLabel}, il est sans doute au linge. Je l'ai remplacé par le ${lowerFirst(jean.name)}.` } });
    }
    parts.push({ card: { type: "outfit", title: "Au bureau", subtitle: "Corporate · semaine", pieces: [...piece(blazer, "Blazer"), ...piece(f.avail("Pantalon de tailleur Opéra", "Pantalon large Calanque"), "Pantalon"), ...piece(f.avail("Blouse taupe", "Pull col bateau Alpilles"), "Haut"), ...piece(f.avail("Bottines Lucie", "Ballerines Jeanne"), "Chaussures"), ...piece(f.avail("Sac Valmy femme"), "Sac")], explanation: "Le pantalon noir évasé donne de la tenue au beige ; la blouse taupe reste dans les mêmes tons." } });
    parts.push({ card: { type: "outfit", title: "Le week-end", subtitle: "Street · casual", pieces: [...piece(blazer, "Blazer"), ...piece(f.avail("Hoodie Heavy sable", "Pull col bateau Alpilles"), "Hoodie"), ...piece(jean, "Bas"), ...piece(f.avail("Bottines taupe", "Bottines Lucie"), "Chaussures"), ...piece(f.avail("Tote en toile"), "Sac")], explanation: "Le blazer sur un hoodie sable : le mélange corporate et streetwear le plus simple, à porter ouvert." } });
    return { steps: ["Recherche dans votre dressing", "Vérification du linge", "Accords de couleurs"], parts };
  }

  if (id === "lyon") {
    const ev = events.find((e) => e.id === "c6")!;
    const g = (label: string, names: string[]) => ({
      label,
      entries: names.flatMap((name) => {
        const it = f.get(name);
        if (!it) return [];
        return [{ itemId: it.id, label: `${it.name}${it.status !== "disponible" ? ` (${it.status} : à récupérer avant le départ)` : ""}`, qty: 1 }];
      }),
    });
    const groups = [
      g("À porter dans le train", ["Trench Malmö femme", "Pull col bateau Alpilles", "Jean K6 Boyfriend blanc", "Bottines Lucie", "Sac Valmy femme"]),
      g("Journées de séminaire", ["Blazer Palais", "Blouse taupe", "Blouse Haussmann", "Pantalon large Calanque", "Jupe plissée Concorde", "Gilet crème", "Ballerines Jeanne"]),
      g("Soirée de gala", ["Robe noire satinée", "Sandales noires", "Pochette corail"]),
      g("Activité en extérieur", ["Hoodie Heavy sable", "Cargo Parachute kaki", "Bottines taupe"]),
      { label: "Indispensables", entries: [{ label: "T-shirts et débardeurs", qty: 3 }, { label: "Sous-vêtements", qty: 4 }, { label: "Collants (dont 1 paire fine pour le gala)", qty: 2 }, { label: "Trousse de toilette", qty: 1 }] },
    ].filter((x) => x.entries.length);
    const count = groups.reduce((s, x) => s + x.entries.filter((e) => "itemId" in e && e.itemId).length, 0);
    return {
      steps: ["Lecture de votre agenda", "Prévisions saisonnières à Lyon", "Sélection des pièces disponibles", "Optimisation du volume"],
      parts: [
        { text: `Séminaire à Lyon ${relativeDay(ctx.today, ev.date)}, du ${longDate(ev.date)} au ${longDate(ev.endDate)}. Mi-décembre à Lyon : 2 à 8 °C, brouillard le matin.\n\nDeux journées en salle (smart casual), une soirée de gala le deuxième soir et une activité en extérieur le troisième jour. ${count} pièces de votre dressing suffisent, rien à acheter.` },
        { card: { type: "packing", title: "Valise : séminaire à Lyon", subtitle: `3 jours · ${count} pièces · 4 tenues`, groups } },
        { card: { type: "outfit", title: "Jour 1 : arrivée et séminaire", subtitle: `${longDate(ev.date)} · smart casual`, pieces: [...piece(f.avail("Blazer Palais"), "Blazer"), ...piece(f.avail("Blouse taupe", "Pull col bateau Alpilles"), "Haut"), ...piece(f.avail("Pantalon large Calanque", "Jean K6 Boyfriend blanc"), "Pantalon"), ...piece(f.avail("Bottines Lucie"), "Chaussures"), ...piece(f.avail("Trench Malmö femme"), "Manteau")], explanation: "Le blazer se porte dès le train : il voyage mieux sur les épaules que dans la valise." } },
        { text: "Astuce : roulez les mailles et les t-shirts, et glissez la robe du soir dans une housse sur le dessus. Je vous rappellerai la veille de récupérer votre blouse au pressing." },
      ],
    };
  }

  if (id === "mariage") {
    const ev = events.find((e) => e.id === "c7");
    const robe = productById["verac-f-robe-riviera"];
    const alt = productById["verac-f-robe-blush"];
    const rec = recommendSizeFor(ctx, robe.id);
    const recAlt = recommendSizeFor(ctx, alt.id);
    const buy = (p: typeof robe, r: typeof rec, reason: string): Card => ({ type: "purchase", productId: p.id, reason, ...("erreur" in r ? {} : { size: r.size, sizeHeadline: r.headline, sizeReasons: r.reasons, confidence: r.confidence }) });
    const sandals = f.any("Sandales Rose");
    const bag = f.any("Pochette corail");
    const when = ev ? `${longDate(ev.date)} (${relativeDay(ctx.today, ev.date)})` : "en juin";
    return {
      steps: ["Lecture de votre agenda", "Analyse du dress code", "Inventaire de vos pièces habillées", "Recherche chez vos marques connectées", "Calcul de votre taille"],
      parts: [
        { text: `Le mariage de Julien et Inès a lieu le ${when}, au Domaine de la Bergerie : cérémonie en extérieur, dress code **« chic d'été »**, 16 à 26 °C attendus.\n\nCe que vous avez déjà : ${sandals ? "les sandales Rose nude" : "des sandales"}${bag ? " et la pochette corail" : ""}, parfaites. Votre robe noire satinée est une robe du soir : trop sombre pour une cérémonie de jour, et le blanc est réservé à la mariée.\n\n**Il ne manque qu'une pièce : une robe de cérémonie légère.** Chez Maison Vérac :` },
        { card: buy(robe, rec, "Satin bleu acier, coupe portefeuille : une couleur de cérémonie qui va avec vos sandales nude.") },
        { card: buy(alt, recAlt, "L'alternative plus douce, en rose blush.") },
        { card: { type: "outfit", title: "Tenue du mariage", subtitle: "Chic d'été · 1 pièce à acheter, 2 déjà à vous", pieces: [{ productId: robe.id, role: "Robe" }, ...piece(sandals, "Chaussures"), ...piece(bag, "Pochette"), ...piece(f.any("Trench Malmö femme"), "Pour le soir")], explanation: "Le bleu acier et le nude se répondent ; la pochette corail apporte la touche de couleur. Le trench pour la fraîcheur du soir." } },
        { text: `${formatPrice(robe.price)}, soit environ ${Math.max(1, Math.round(robe.price / Math.max(ctx.budget, 1)))} mois de votre budget vêtements (${ctx.budget} €/mois). La robe se reportera aussi l'été, avec vos sandales noires.` },
      ],
    };
  }

  const w = weather.days[0];
  if (id === "today") {
    return {
      steps: ["Météo du jour", "Vérification du linge", "Composition de la tenue"],
      parts: [
        { text: `Aujourd'hui à Paris : ${w.tempMin} à ${w.tempMax} °C, ciel ${w.condition}. Une tenue pour la journée :` },
        { card: { type: "outfit", title: "Tenue du jour", subtitle: `${WEEKDAYS[ctx.today.getDay()]} · ${w.tempMax} °C`, pieces: [...piece(f.avail("Blazer Palais"), "Blazer"), ...piece(f.avail("Pull col bateau Alpilles", "Blouse taupe"), "Haut"), ...piece(f.avail("Pantalon large Calanque", "Jean K6 Boyfriend blanc"), "Pantalon"), ...piece(f.avail("Bottines Lucie"), "Chaussures"), ...piece(f.avail("Trench Malmö femme"), "Manteau")], explanation: "Des tons sable et taupe superposés, et un trench pour le matin frais." } },
      ],
    };
  }

  const next = events[0];
  return {
    steps: ["Lecture de votre demande"],
    parts: [{ text: `Je connais vos ${ctx.items.length} pièces, votre agenda et la météo. Je peux composer une tenue pour une occasion, accorder une pièce, préparer une valise, ou trouver ce qui manque vraiment, dans votre budget.\n\nProchain événement : **${next.title}** (${next.label.toLowerCase()}). Voulez-vous que je prépare la tenue ?` }],
  };
}
