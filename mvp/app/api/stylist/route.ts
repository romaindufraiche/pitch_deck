import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { claudeStylist, hasApiKey, type ChatTurn } from "@/lib/ai";
import { demoStylist } from "@/lib/engine";
import type { WardrobeItem } from "@/lib/catalog";

export async function POST(req: Request) {
  const body = (await req.json()) as { message?: string; history?: ChatTurn[]; wardrobe?: WardrobeItem[] };
  const message = (body.message ?? "").trim().slice(0, 1000);
  const wardrobe = Array.isArray(body.wardrobe) ? body.wardrobe.slice(0, 300) : [];
  if (!message) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  if (!hasApiKey()) return NextResponse.json(demoStylist(message, wardrobe));

  try {
    return NextResponse.json(await claudeStylist(message, body.history ?? [], wardrobe));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.error("Limite de débit atteinte");
    else if (error instanceof Anthropic.APIError) console.error(`Erreur API ${error.status}:`, error.message);
    else console.error(error);
    // On dégrade vers le moteur de démo plutôt que d'afficher une erreur
    return NextResponse.json(demoStylist(message, wardrobe));
  }
}
