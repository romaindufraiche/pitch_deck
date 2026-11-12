import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CATALOG, CATALOG_BY_ID, type WardrobeItem } from "./catalog";
import { materialize, productToWardrobe, type StylistResponse } from "./engine";

const MODEL = "claude-opus-5-5";

export const hasApiKey = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

// Le catalogue est stable : il est placé dans le prompt système pour profiter du cache.
const CATALOG_JSON = JSON.stringify(
  CATALOG.map(({ id, brand, name, category, color, price, styles }) => ({ id, brand, name, category, color, price, styles })),
);

const STYLIST_SYSTEM = `Tu es Dressr, un styliste personnel bienveillant et concret. Tu réponds en français, en tutoyant.

Ton travail : composer des tenues à partir du DRESSING de l'utilisateur (ce qu'il possède déjà, toutes marques confondues) et, seulement si nécessaire, de pièces du CATALOGUE à acheter.

Règles :
- Pars toujours du dressing. N'ajoute à l'achat que les pièces qui manquent vraiment.
- Une tenue complète contient au minimum un haut, un bas et des chaussures (veste et accessoires en option).
- Respecte le budget demandé : la somme des pièces à ACHETER doit être inférieure ou égale au budget. Les pièces déjà possédées ne comptent pas.
- Si l'utilisateur demande plusieurs alternatives (ex. « trois hauts pour 80 € »), propose une tenue par alternative, chacune avec une pièce différente. Si le budget est ambigu (total ou par pièce), choisis l'interprétation la plus utile et dis-la dans ta réponse.
- Si l'utilisateur veut partir de zéro, n'utilise pas son dressing.
- Utilise uniquement les identifiants exacts : "owned_ids" pour le dressing, "buy_ids" pour le catalogue. N'invente jamais d'article.
- Accorde les couleurs et les styles à l'occasion (date, soirée, travail, casual…).
- "reply" : 1 à 3 phrases chaleureuses qui résument ta proposition. "why" : une phrase qui explique l'accord de la tenue.
- "budget" : le budget demandé en euros, ou null s'il n'y en a pas.
- Si la demande n'a rien à voir avec la mode, réponds poliment dans "reply" et renvoie une liste de tenues vide.

CATALOGUE (JSON) :
${CATALOG_JSON}`;

const StylistSchema = z.object({
  reply: z.string(),
  budget: z.number().nullable(),
  outfits: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      owned_ids: z.array(z.string()),
      buy_ids: z.array(z.string()),
    }),
  ),
});

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function claudeStylist(
  message: string,
  history: ChatTurn[],
  wardrobe: WardrobeItem[],
): Promise<StylistResponse> {
  const wardrobeJson = JSON.stringify(
    wardrobe.map(({ id, brand, name, category, color, styles }) => ({ id, brand, name, category, color, styles })),
  );
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.slice(-10).map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: `MON DRESSING (JSON) :\n${wardrobeJson}\n\nMA DEMANDE : ${message}` },
  ];

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(StylistSchema) },
    system: [{ type: "text", text: STYLIST_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages,
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { reply: "Désolé, je n'ai pas pu traiter cette demande. Peux-tu la reformuler ?", outfits: [], engine: "claude" };
  }
  const out = response.parsed_output;
  return { reply: out.reply, outfits: materialize(out.outfits, wardrobe, out.budget), engine: "claude" };
}

const ImportSchema = z.object({
  items: z.array(
    z.object({
      catalog_id: z.string().nullable(),
      brand: z.string(),
      name: z.string(),
      category: z.enum(["haut", "bas", "chaussures", "veste", "accessoire"]),
      color: z.string(),
      hex: z.string(),
      price: z.number().nullable(),
      styles: z.array(z.string()),
    }),
  ),
});

const IMPORT_SYSTEM = `Tu extrais les vêtements achetés à partir d'un e-mail de confirmation de commande.
Pour chaque article acheté (ignore les frais de port, totaux, publicités) renvoie : marque, nom court en français, catégorie, couleur en français, une couleur hexadécimale approchante, le prix unitaire en euros (ou null) et 1 à 3 styles parmi : casual, chic, business, sport, soirée, date.
Si l'article correspond clairement à un produit du catalogue ci-dessous (même marque et même produit), renseigne son identifiant dans "catalog_id", sinon null.

CATALOGUE (JSON) :
${CATALOG_JSON}`;

export async function claudeImport(emailText: string): Promise<WardrobeItem[]> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(ImportSchema) },
    system: [{ type: "text", text: IMPORT_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `E-MAIL :\n${emailText}` }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return [];

  return response.parsed_output.items.map((it) => {
    const known = it.catalog_id ? CATALOG_BY_ID.get(it.catalog_id) : undefined;
    if (known) return productToWardrobe(known, "import");
    return {
      id: `w-ai-${Math.random().toString(36).slice(2, 9)}`,
      brand: it.brand, name: it.name, category: it.category, color: it.color,
      hex: /^#[0-9a-f]{6}$/i.test(it.hex) ? it.hex : "#bbbbbb",
      price: it.price ?? undefined, styles: it.styles, source: "import" as const,
    };
  });
}
