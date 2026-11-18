import { z } from "zod";

/** Blocs structurés que l'assistant peut afficher sous forme de cartes riches. */
export const PieceSchema = z.object({
  itemId: z.string().optional().describe("id d'un article du dressing (ex. w012)"),
  productId: z.string().optional().describe("id d'un produit du catalogue d'une marque, si la pièce est à acheter"),
  role: z.string().describe("rôle dans la tenue : haut, bas, veste, chaussures, accessoire…"),
});

export const OutfitCardSchema = z.object({
  type: z.literal("outfit"),
  title: z.string(),
  subtitle: z.string().optional(),
  pieces: z.array(PieceSchema).min(2).max(7),
  explanation: z.string().describe("explication courte (2 phrases maximum)"),
  budget: z.number().optional().describe("budget de l'utilisateur en euros, si la tenue répond à une demande avec budget"),
});

export const LaundryCardSchema = z.object({
  type: z.literal("laundry"),
  unavailableId: z.string(),
  replacementId: z.string(),
  message: z.string(),
});

export const PurchaseCardSchema = z.object({
  type: z.literal("purchase"),
  productId: z.string(),
  reason: z.string().describe("pourquoi cette pièce manque vraiment"),
  size: z.string().optional(),
  sizeHeadline: z.string().optional(),
  sizeReasons: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const PackingCardSchema = z.object({
  type: z.literal("packing"),
  title: z.string(),
  subtitle: z.string().optional(),
  groups: z.array(
    z.object({
      label: z.string(),
      entries: z.array(z.object({ itemId: z.string().optional(), label: z.string(), qty: z.number().int().min(1).default(1) })),
    }),
  ),
});

export const CardSchema = z.discriminatedUnion("type", [OutfitCardSchema, LaundryCardSchema, PurchaseCardSchema, PackingCardSchema]);
export const ShowCardsInput = z.object({ cards: z.array(CardSchema).min(1).max(4) });

export type Card = z.infer<typeof CardSchema>;
export type OutfitCard = z.infer<typeof OutfitCardSchema>;
export type LaundryCard = z.infer<typeof LaundryCardSchema>;
export type PurchaseCard = z.infer<typeof PurchaseCardSchema>;
export type PackingCard = z.infer<typeof PackingCardSchema>;

/** Événements envoyés par /api/assistant (une ligne JSON par événement). */
export type StreamEvent =
  | { type: "mode"; mode: "live" | "secours" }
  | { type: "step"; label: string }
  | { type: "text"; delta: string }
  | { type: "card"; card: Card }
  | { type: "done" }
  | { type: "error"; message: string };
