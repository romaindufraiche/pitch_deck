import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { claudeImport, hasApiKey } from "@/lib/ai";
import { demoImport } from "@/lib/engine";

export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  const email = (text ?? "").trim().slice(0, 20000);
  if (!email) return NextResponse.json({ error: "E-mail vide" }, { status: 400 });

  if (!hasApiKey()) return NextResponse.json({ items: demoImport(email), engine: "demo" });
  try {
    return NextResponse.json({ items: await claudeImport(email), engine: "claude" });
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error(`Erreur API ${error.status}:`, error.message);
    else console.error(error);
    return NextResponse.json({ items: demoImport(email), engine: "demo" });
  }
}
