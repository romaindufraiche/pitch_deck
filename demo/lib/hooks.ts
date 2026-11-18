"use client";

import { useMemo } from "react";
import { useStore, wardrobeStateOf } from "./store";
import { personaOf } from "./data";
import { deriveWardrobe } from "./wardrobe";
import type { ToolContext } from "./assistant-tools";

let TODAY: Date | null = null;
/** Date du jour (figée pour la session, pour éviter les sauts à minuit en pleine démo). */
export function useToday() {
  if (!TODAY) TODAY = new Date();
  return TODAY;
}

export function useWardrobe() {
  const today = useToday();
  const persona = useStore((s) => s.persona);
  const connected = useStore((s) => s.connected);
  const scanned = useStore((s) => s.scanned);
  const prefilled = useStore((s) => s.prefilled);
  const overrides = useStore((s) => s.overrides);
  const added = useStore((s) => s.added);
  return useMemo(() => deriveWardrobe(wardrobeStateOf({ persona, connected, scanned, prefilled, overrides, added }), today), [persona, connected, scanned, prefilled, overrides, added, today]);
}

/** Contexte utilisé par le moteur de tailles et l'assistant (garde-robe dérivée, marques connectées, budget). */
export function useToolContext(): ToolContext {
  const items = useWardrobe();
  const today = useToday();
  const connected = useStore((s) => s.connected);
  const budget = useStore((s) => s.budget);
  const persona = useStore((s) => s.persona);
  return useMemo(() => ({ items, today, connected, budget, user: personaOf(persona) }), [items, today, connected, budget, persona]);
}

/** profil de démo actif (Thomas ou Léa) */
export function usePersona() {
  const id = useStore((s) => s.persona);
  return personaOf(id);
}
