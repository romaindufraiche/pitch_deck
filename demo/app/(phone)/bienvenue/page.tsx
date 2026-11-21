"use client";

import { useStatusTone } from "@/lib/tone";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/logo";

const SLIDES = [
  { img: "/images/px/hero-rack.jpg", kicker: "01 — Votre dressing", title: "Tout votre dressing, dans votre poche.", text: "Connectez vos boutiques et filmez votre penderie : en deux minutes, chaque pièce est rangée, photographiée, décrite." },
  { img: "/images/px/lkf-white-blazer.jpg", kicker: "02 — Votre styliste", title: "La bonne tenue, chaque matin.", text: "Votre agenda, la météo, ce qui est au linge : votre styliste compose avec ce que vous avez déjà." },
  { img: "/images/px/lkf-street-duo.jpg", kicker: "03 — Tous les styles", title: "Corporate, street, sport : votre style.", text: "Uniquement ce qui manque vraiment, chez vos marques, à la bonne taille du premier coup." },
];

export default function Bienvenue() {
  useStatusTone("light");
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink text-paper">
      <AnimatePresence mode="popLayout">
        <motion.img key={s.img} src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-[#15112a]/50 via-[#15112a]/5 to-[#15112a]/90" />
      <div className="absolute inset-x-0 flex items-center justify-between px-6" style={{ top: "calc(var(--top) + 6px)" }}>
        <Logo size={26} />
        <Link href="/inscription" className="text-[13px] text-paper/80">Passer</Link>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-6" style={{ paddingBottom: "calc(var(--bottom) + 24px)" }}>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45 }}>
            <p className="text-[11px] uppercase tracking-[0.22em] text-peach">{s.kicker}</p>
            <h1 className="mt-3 font-display text-[30px] leading-tight">{s.title}</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-paper/80">{s.text}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-7 flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, k) => (
              <button key={k} aria-label={`Écran ${k + 1}`} onClick={() => setI(k)} className={`h-1 rounded-full transition-all ${k === i ? "w-7 bg-aura" : "w-3 bg-paper/40"}`} />
            ))}
          </div>
          {i < SLIDES.length - 1 ? (
            <button onClick={() => setI(i + 1)} className="tap rounded-full bg-paper px-6 py-3.5 text-[14px] font-medium text-ink">Suivant</button>
          ) : (
            <Link href="/inscription" className="tap rounded-full bg-paper px-6 py-3.5 text-[14px] font-medium text-ink">Commencer</Link>
          )}
        </div>
      </div>
    </div>
  );
}
