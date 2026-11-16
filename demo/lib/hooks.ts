"use client";

import { useMemo } from "react";
import { useStore, wardrobeStateOf } from "./store";
import { deriveWardrobe } from "./wardrobe";

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
