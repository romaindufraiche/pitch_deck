"use client";

import type { StreamEvent } from "./cards";
import type { WardrobeState } from "./wardrobe";
import { deriveWardrobe } from "./wardrobe";
import { buildScenario, chunkText, detectScenario } from "./scenarios";
import type { BrandId } from "./types";

type Params = {
  messages: { role: "user" | "assistant"; text: string }[];
  state: WardrobeState;
  today: Date;
  budget: number;
  forceSecours?: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mode secours exécuté dans le navigateur (hors ligne ou serveur injoignable). */
async function localScripted(p: Params, on: (e: StreamEvent) => void) {
  const items = deriveWardrobe(p.state, p.today);
  const s = buildScenario(detectScenario(p.messages[p.messages.length - 1].text), { items, today: p.today, connected: p.state.connected as BrandId[], budget: p.budget });
  on({ type: "mode", mode: "secours" });
  for (const label of s.steps) { on({ type: "step", label }); await sleep(380); }
  for (const part of s.parts) {
    if ("text" in part) { for (const c of chunkText(part.text)) { on({ type: "text", delta: c }); await sleep(14); } on({ type: "text", delta: "\n\n" }); }
    else { on({ type: "card", card: part.card }); await sleep(260); }
  }
  on({ type: "done" });
}

/** Appelle /api/assistant (flux NDJSON) ; bascule en mode secours local si le réseau échoue. */
export async function streamAssistant(p: Params, on: (e: StreamEvent) => void) {
  let got = false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: p.messages, state: p.state, today: p.today.toISOString(), budget: p.budget, forceSecours: p.forceSecours }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      clearTimeout(timer);
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        const e = JSON.parse(line) as StreamEvent;
        if (e.type === "text" || e.type === "card") got = true;
        on(e);
      }
    }
    if (!got) throw new Error("réponse vide");
  } catch {
    if (!got) await localScripted(p, on);
    else on({ type: "done" });
  }
}
