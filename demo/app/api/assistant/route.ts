import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ASSISTANT_MODEL, APP_NAME } from "@/lib/config";
import { ShowCardsInput, type StreamEvent } from "@/lib/cards";
import { deriveWardrobe, type WardrobeState } from "@/lib/wardrobe";
import { getCalendar, getWardrobe, getWeather, getWearHistory, recommendSizeFor, sanitizeCards, searchCatalog, type ToolContext } from "@/lib/assistant-tools";
import { buildScenario, chunkText, detectScenario } from "@/lib/scenarios";
import { user } from "@/lib/data";
import { longDate } from "@/lib/time";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).min(1),
  state: z.object({
    connected: z.array(z.string()),
    scanned: z.boolean(),
    prefilled: z.boolean(),
    overrides: z.record(z.string(), z.any()),
    added: z.array(z.any()),
  }),
  today: z.string(),
  budget: z.number().optional(),
  forceSecours: z.boolean().optional(),
});

const SYSTEM = `Tu es le styliste personnel de l'application ${APP_NAME}, une app mobile pour hommes qui numérise leur garde-robe.
Tu parles à ${user.firstName} ${user.lastName}, ${user.age} ans, ${user.job.toLowerCase()}, ${user.city}. ${user.heightCm / 100} m, ${user.weightKg} kg, ${user.build.toLowerCase()}.
Son style : ${user.style}. Couleurs préférées : ${user.favoriteColors.map((c) => c.name.toLowerCase()).join(", ")}. Il n'aime pas : ${user.dislikes.join(", ").toLowerCase()}. Budget vêtements : environ ${user.monthlyBudget} € par mois.

Ta personnalité : un styliste masculin chaleureux, précis et concis. Tu vouvoies ${user.firstName}. Tu réponds en français, en 2 à 4 phrases courtes autour des cartes, sans listes à puces interminables. Tu peux utiliser **gras** avec parcimonie.

Règles impératives :
- Avant de proposer une tenue, consulte le dressing (get_wardrobe) et, si une date ou un événement est en jeu, l'agenda (get_calendar) et la météo (get_weather).
- Ne propose QUE des articles dont le statut est « disponible ». Si la pièce idéale est « au linge » ou « au pressing », dis-le et remplace-la par la meilleure alternative disponible, avec une carte « laundry ».
- Respecte le dress code de l'événement et adapte la tenue à la météo (pluie : matières déperlantes, chaussures adaptées).
- Ne recommande un achat que s'il manque vraiment quelque chose dans le dressing pour l'occasion. Cherche d'abord chez les marques connectées (search_catalog), puis appelle recommend_size pour la taille. Explique pourquoi la pièce manque.
- Pour une valise, utilise une carte « packing » avec des articles du dressing (itemId) groupés par moment du séjour.
- Affiche toujours le résultat avec l'outil show_cards (cartes riches : outfit, laundry, purchase, packing), en utilisant uniquement des ids réels renvoyés par les outils (itemId pour le dressing, productId pour le catalogue). Une carte « outfit » contient 3 à 6 pièces.
- N'invente jamais d'article, de prix, de taille ni d'événement.`;

const tools: Anthropic.Tool[] = [
  { name: "get_wardrobe", description: "Liste les articles du dressing de l'utilisateur (id, nom, marque, catégorie, couleur, taille, formalité 1-5, statut disponible/au linge/au pressing, nombre de ports, dernier port).", eager_input_streaming: true, input_schema: { type: "object", properties: { category: { type: "string", enum: ["hauts", "chemises", "maille", "pantalons", "vestes", "costumes", "chaussures", "accessoires", "sport"] }, availableOnly: { type: "boolean" } } } },
  { name: "get_wear_history", description: "Journal des tenues portées sur les derniers jours (30 max).", eager_input_streaming: true, input_schema: { type: "object", properties: { days: { type: "integer", minimum: 1, maximum: 30 } } } },
  { name: "get_calendar", description: "Agenda des prochains jours et événements à venir, avec le dress code de chacun.", eager_input_streaming: true, input_schema: { type: "object", properties: {} } },
  { name: "get_weather", description: "Météo à Paris sur 7 jours, plus des prévisions saisonnières (Lyon en décembre, juin en Île-de-France).", eager_input_streaming: true, input_schema: { type: "object", properties: {} } },
  { name: "search_catalog", description: "Cherche des produits dans les catalogues des marques partenaires (prix, matières, tailles en stock). Préférer connectedOnly=true.", eager_input_streaming: true, input_schema: { type: "object", properties: { query: { type: "string", description: "mots-clés en français, ex. « costume lin été »" }, category: { type: "string", enum: ["hauts", "chemises", "maille", "pantalons", "vestes", "costumes", "chaussures", "accessoires", "sport"] }, color: { type: "string" }, maxPrice: { type: "number" }, connectedOnly: { type: "boolean" } } } },
  { name: "recommend_size", description: "Calcule la taille recommandée pour un produit, d'après le guide des tailles de la marque, les tailles habituelles de l'utilisateur et son historique d'achats et de retours. Renvoie la taille, une justification et un indice de confiance.", eager_input_streaming: true, input_schema: { type: "object", properties: { productId: { type: "string" } }, required: ["productId"] } },
  {
    name: "show_cards", eager_input_streaming: true,
    description: "Affiche des cartes riches dans le chat. Types : outfit {title, subtitle?, pieces:[{itemId|productId, role}], explanation} ; laundry {unavailableId, replacementId, message} ; purchase {productId, reason} (la taille est ajoutée automatiquement) ; packing {title, subtitle?, groups:[{label, entries:[{itemId?, label, qty}]}]}.",
    input_schema: z.toJSONSchema(ShowCardsInput) as Anthropic.Tool.InputSchema,
  },
];

const STEP_LABELS: Record<string, string> = {
  get_wardrobe: "Consultation de votre dressing",
  get_wear_history: "Lecture de vos tenues récentes",
  get_calendar: "Lecture de votre agenda",
  get_weather: "Météo à Paris",
  search_catalog: "Recherche chez vos marques connectées",
  recommend_size: "Calcul de votre taille",
  show_cards: "Mise en forme",
};

const InputSchemas: Record<string, z.ZodTypeAny> = {
  get_wardrobe: z.object({ category: z.string().optional(), availableOnly: z.boolean().optional() }),
  get_wear_history: z.object({ days: z.number().int().optional() }),
  get_calendar: z.object({}).passthrough(),
  get_weather: z.object({}).passthrough(),
  search_catalog: z.object({ query: z.string().optional(), category: z.string().optional(), color: z.string().optional(), maxPrice: z.number().optional(), connectedOnly: z.boolean().optional() }),
  recommend_size: z.object({ productId: z.string() }),
  show_cards: ShowCardsInput,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function* scripted(message: string, ctx: ToolContext): AsyncGenerator<StreamEvent> {
  yield { type: "mode", mode: "secours" };
  const s = buildScenario(detectScenario(message), ctx);
  for (const label of s.steps) {
    yield { type: "step", label };
    await sleep(380);
  }
  for (const part of s.parts) {
    if ("text" in part) {
      for (const c of chunkText(part.text)) {
        yield { type: "text", delta: c };
        await sleep(14);
      }
      yield { type: "text", delta: "\n\n" };
    } else {
      yield { type: "card", card: part.card };
      await sleep(260);
    }
  }
  yield { type: "done" };
}

async function* live(messages: { role: "user" | "assistant"; text: string }[], ctx: ToolContext): AsyncGenerator<StreamEvent> {
  const client = new Anthropic({ timeout: 20000, maxRetries: 1 });
  const history: Anthropic.Beta.BetaMessageParam[] = messages.map((m) => ({ role: m.role, content: m.text }));
  history[history.length - 1] = {
    role: "user",
    content: `[Nous sommes ${longDate(ctx.today)}.]\n${messages[messages.length - 1].text}`,
  };
  let emitted = false;
  yield { type: "mode", mode: "live" };

  // Repli serveur en cas de refus du modèle (fallbacks: "default"). Si l'API refuse ce paramètre (400),
  // on relance une fois sans lui plutôt que de basculer en mode secours.
  let withFallbacks = true;
  for (let turn = 0; turn < 8; turn++) {
    const params = {
      model: ASSISTANT_MODEL,
      max_tokens: 16000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: tools as Anthropic.Beta.BetaTool[],
      messages: history,
      output_config: { effort: "low" },
      ...(withFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
    } as Anthropic.Beta.MessageCreateParamsStreaming;
    const stream = client.beta.messages.stream(params);

    const queue: string[] = [];
    stream.on("text", (d) => queue.push(d));
    const done = stream.finalMessage();
    let finished = false;
    done.finally(() => (finished = true)).catch(() => {});
    while (!finished || queue.length) {
      while (queue.length) {
        emitted = true;
        yield { type: "text", delta: queue.shift()! };
      }
      if (!finished) await sleep(25);
    }
    let msg: Anthropic.Beta.BetaMessage;
    try {
      msg = await done;
    } catch (err) {
      if (err instanceof Anthropic.BadRequestError && withFallbacks && !emitted) {
        console.warn("[assistant] paramètre fallbacks refusé, nouvel essai sans :", err.message);
        withFallbacks = false;
        turn--;
        continue;
      }
      throw err;
    }

    if (msg.stop_reason === "refusal") throw new Error("refusal");
    const uses = msg.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (!uses.length) break;
    if (msg.stop_reason === "max_tokens") throw new Error("max_tokens");

    history.push({ role: "assistant", content: msg.content as Anthropic.Beta.BetaContentBlockParam[] });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const u of uses) {
      yield { type: "step", label: STEP_LABELS[u.name] ?? "Analyse" };
      const parsed = InputSchemas[u.name]?.safeParse(u.input);
      if (!parsed || !parsed.success) {
        results.push({ type: "tool_result", tool_use_id: u.id, is_error: true, content: JSON.stringify({ INVALID_JSON: JSON.stringify(u.input) }) });
        continue;
      }
      const input = parsed.data as Record<string, unknown>;
      let out: unknown;
      switch (u.name) {
        case "get_wardrobe": out = getWardrobe(ctx, input); break;
        case "get_wear_history": out = getWearHistory(ctx, input); break;
        case "get_calendar": out = getCalendar(ctx); break;
        case "get_weather": out = getWeather(ctx); break;
        case "search_catalog": out = searchCatalog(ctx, input); break;
        case "recommend_size": out = recommendSizeFor(ctx, String(input.productId)); break;
        case "show_cards": {
          const cards = sanitizeCards(ctx, (input as z.infer<typeof ShowCardsInput>).cards);
          for (const card of cards) {
            emitted = true;
            yield { type: "card", card };
          }
          out = { affiche: cards.length, ignorees: (input as z.infer<typeof ShowCardsInput>).cards.length - cards.length };
          break;
        }
      }
      results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(out) });
    }
    history.push({ role: "user", content: results });
  }
  if (!emitted) throw new Error("empty");
  yield { type: "done" };
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Requête invalide", { status: 400 });
  const { messages, state, today, budget, forceSecours } = parsed.data;
  const day = new Date(today);
  const items = deriveWardrobe(state as WardrobeState, day);
  const ctx: ToolContext = { items, today: day, connected: state.connected as ToolContext["connected"], budget: budget ?? user.monthlyBudget };
  const last = messages[messages.length - 1].text;
  const useLive = !!process.env.ANTHROPIC_API_KEY && !forceSecours;

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      let sentContent = false;
      try {
        if (useLive) {
          try {
            for await (const e of live(messages, ctx)) {
              if (e.type === "text" || e.type === "card") sentContent = true;
              send(e);
            }
          } catch (err) {
            console.error("[assistant] bascule en mode secours :", err instanceof Error ? err.message : err);
            if (sentContent) {
              send({ type: "done" });
            } else {
              for await (const e of scripted(last, ctx)) send(e);
            }
          }
        } else {
          for await (const e of scripted(last, ctx)) send(e);
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
