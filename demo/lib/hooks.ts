"use client";

import { useMemo } from "react";
import { useStore, wardrobeStateOf } from "./store";
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
  const connected = useStore((s) => s.connected);
  const scanned = useStore((s) => s.scanned);
  const prefilled = useStore((s) => s.prefilled);
  const overrides = useStore((s) => s.overrides);
  const added = useStore((s) => s.added);
  return useMemo(() => deriveWardrobe(wardrobeStateOf({ connected, scanned, prefilled, overrides, added }), today), [connected, scanned, prefilled, overrides, added, today]);
}

/** Contexte utilisé par le moteur de tailles et l'assistant (garde-robe dérivée, marques connectées, budget). */
export function useToolContext(): ToolContext {
  const items = useWardrobe();
  const today = useToday();
  const connected = useStore((s) => s.connected);
  const budget = useStore((s) => s.budget);
  return useMemo(() => ({ items, today, connected, budget }), [items, today, connected, budget]);
}
