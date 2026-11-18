"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { DerivedItem } from "@/lib/wardrobe";
import { brandById } from "@/lib/data";
import type { BrandId } from "@/lib/types";

type Prompt = { key: string; item: string; question: (i: DerivedItem) => string; options: { label: string; brandId?: BrandId | null; brandName?: string; size?: string }[] };

const PROMPTS: Prompt[] = [
  { key: "brand-tshirts-noirs", item: "T-shirts noirs", question: (i) => `Ces t-shirts noirs, vous les avez portés ${i.timesWorn} fois. De quelle marque sont-ils ?`, options: [{ label: "Ligne Bastide", brandId: "bastide" }, { label: "Kolm Denim", brandId: "kolm" }, { label: "Studio Rivage", brandId: "rivage" }, { label: "Je ne sais plus", brandName: "Marque inconnue" }] },
  { key: "size-blazer-gris", item: "Blazer gris chiné", question: () => "Quelle taille fait votre blazer gris chiné ?", options: [{ label: "46", size: "46" }, { label: "48", size: "48" }, { label: "50", size: "50" }, { label: "Je ne sais pas" }] },
  { key: "brand-chemises-blanches", item: "Chemises blanches", question: (i) => `Vos ${i.quantity} chemises blanches viennent-elles de Maison Vérac ?`, options: [{ label: "Oui", brandId: "verac" }, { label: "Non, autre marque", brandName: "Autre marque" }] },
];

/** Enrichissement progressif : une question à la fois, réponse en deux taps. */
const PROMPTS_LEA: Prompt[] = [
  { key: "lea-brand-tshirts", item: "T-shirts blancs", question: (i) => `Vos ${i.quantity} t-shirts blancs, vous les avez portés ${i.timesWorn} fois. De quelle marque sont-ils ?`, options: [{ label: "Ligne Bastide", brandId: "bastide" }, { label: "Bitume Club", brandId: "bitume" }, { label: "Je ne sais plus", brandName: "Marque inconnue" }] },
  { key: "lea-size-blazer-jaune", item: "Blazer jaune", question: () => "Quelle taille fait votre blazer jaune ?", options: [{ label: "34", size: "34" }, { label: "36", size: "36" }, { label: "38", size: "38" }, { label: "Je ne sais pas" }] },
  { key: "lea-brand-escarpins", item: "Escarpins noirs", question: () => "Vos escarpins noirs viennent-ils d'Atelier Ferrand ?", options: [{ label: "Oui", brandId: "ferrand" }, { label: "Non, autre marque", brandName: "Autre marque" }] },
];

export function EnrichCard({ items }: { items: DerivedItem[] }) {
  const answered = useStore((s) => s.answeredPrompts);
  const answer = useStore((s) => s.answerPrompt);
  const override = useStore((s) => s.override);
  const [done, setDone] = useState<string | null>(null);
  const persona = useStore((s) => s.persona);
  const p = (persona === "lea" ? PROMPTS_LEA : PROMPTS).find((x) => !answered.includes(x.key) && items.some((i) => i.name === x.item));
  const item = p && items.find((i) => i.name === p.item);

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-2xl bg-ok/10 p-4 text-[13px] text-ok"><Check className="size-4" /> {done}</motion.div>
      ) : p && item ? (
        <motion.div key={p.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex gap-3.5 rounded-2xl bg-white p-3.5">
          <img src={item.image} alt="" className="h-[92px] w-[74px] shrink-0 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[10.5px] uppercase tracking-[0.16em] text-rust"><Sparkles className="size-3" /> 1 question · 2 secondes</p>
            <p className="mt-1 text-[13.5px] font-medium leading-snug">{p.question(item)}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.options.map((o) => (
                <button key={o.label} className="tap rounded-full border border-line px-3 py-1.5 text-[12px] hover:bg-paper" onClick={() => {
                  if (o.brandId) override(item.id, { brandId: o.brandId, brandName: brandById[o.brandId].name });
                  else if (o.brandName) override(item.id, { brandName: o.brandName });
                  if (o.size) override(item.id, { size: o.size });
                  answer(p.key);
                  setDone(o.brandId || o.size ? "Merci, fiche mise à jour." : "C'est noté, je ne vous le redemanderai pas.");
                  setTimeout(() => setDone(null), 1600);
                }}>{o.label}</button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
