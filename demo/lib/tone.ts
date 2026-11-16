"use client";

import { useEffect } from "react";

/** Teinte de la barre d'état simulée : « light » pour les écrans sombres ou plein cadre photo. */
export function useStatusTone(tone: "light" | "dark") {
  useEffect(() => {
    const el = document.getElementById("phone");
    if (!el) return;
    el.dataset.tone = tone;
    return () => { el.dataset.tone = "dark"; };
  }, [tone]);
}
