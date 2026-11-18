"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ImageIcon, Sparkles, X, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { productById } from "@/lib/data";
import { useStatusTone } from "@/lib/tone";
import type { WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** pièce photographiée pendant la démo, selon le profil */
const SHOTS = {
  thomas: { photo: "/images/px/fo-oxford-olive.jpg", match: "ferrand-auguste-olive", guess: "Richelieu en cuir vert olive", sub: "Richelieu", color: { name: "Vert olive", hex: "#5E6440" }, sizes: ["42.5", "43", "43.5"], size: "43", note: "vous chaussez 43 dans vos quatre paires Atelier Ferrand (la marque chausse grand d'une demi-pointure)", fallbackMaterial: "Cuir lisse (estimé)" },
  lea: { photo: "/images/px/wf-pumps-navy.jpg", match: "ferrand-f-escarpins-marine", guess: "Escarpins à bride marine", sub: "Escarpins", color: { name: "Marine", hex: "#1F2A44" }, sizes: ["37", "37.5", "38"], size: "37.5", note: "vous chaussez 37,5 dans vos trois paires Atelier Ferrand (la marque chausse grand d'une demi-pointure)", fallbackMaterial: "Cuir glacé (estimé)" },
} as const;

export default function Ajout() {
  const router = useRouter();
  const addItem = useStore((s) => s.addItem);
  const persona = useStore((s) => s.persona);
  const shot = SHOTS[persona];
  const PHOTO = shot.photo;
  const MATCH = productById[shot.match];
  const [step, setStep] = useState<"camera" | "cutout" | "form">("camera");
  const [flash, setFlash] = useState(false);
  const [useMatch, setUseMatch] = useState(true);
  const [name, setName] = useState<string>(shot.guess);
  const [size, setSize] = useState<string>(shot.size);
  useStatusTone(step === "form" ? "dark" : "light");

  const shoot = () => {
    setFlash(true);
    setTimeout(() => { setFlash(false); setStep("cutout"); }, 180);
    setTimeout(() => setStep("form"), 1700);
  };

  const save = () => {
    const id = `a${Date.now().toString(36)}`;
    const item: WardrobeItem = {
      id, persona, source: "photo", category: "chaussures", subcategory: shot.sub, name: useMatch ? MATCH.name : name,
      brandId: useMatch ? "ferrand" : null, brandName: useMatch ? "Atelier Ferrand" : "Marque inconnue",
      color: shot.color, material: useMatch ? MATCH.material : shot.fallbackMaterial, size, fit: useMatch ? MATCH.fit : null,
      season: "toutes saisons", formality: 4, purchaseDate: null, price: useMatch ? MATCH.price : null, ref: useMatch ? MATCH.ref : null,
      productId: useMatch ? MATCH.id : null, orderId: null, baseWears: 0, baseLastWornDaysAgo: null, status: "disponible", image: PHOTO,
      quantity: 1, missing: ["date d'achat"], notes: "Photographié aujourd'hui",
    };
    addItem(item);
    router.replace(`/dressing/${id}`);
  };

  return (
    <div className="absolute inset-0 bg-ink">
      <AnimatePresence mode="wait">
        {step !== "form" ? (
          <motion.div key="cam" className="absolute inset-0" exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#d8d1c5_0%,#b9b0a2_100%)]">
              <motion.img src={PHOTO} alt="" className="absolute inset-0 h-full w-full object-contain" animate={step === "cutout" ? { scale: 0.82, y: -20 } : { scale: 1 }} transition={{ duration: 0.8 }} style={{ mixBlendMode: "multiply" }} />
              {step === "cutout" && <motion.div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_30px_8px_rgba(255,255,255,0.7)]" initial={{ top: "15%" }} animate={{ top: "85%" }} transition={{ duration: 1.1, ease: "easeInOut" }} />}
            </div>
            <div className="absolute inset-x-0 flex items-center justify-between px-5 text-paper" style={{ top: "calc(var(--top) + 6px)" }}>
              <button aria-label="Fermer" onClick={() => router.back()} className="tap flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur"><X className="size-5" /></button>
              <span className="rounded-full bg-black/40 px-3 py-1.5 text-[12px] backdrop-blur">{step === "camera" ? "Posez la pièce à plat, fond uni" : "Détourage et analyse…"}</span>
              <span className="flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur"><Zap className="size-4" /></span>
            </div>
            {step === "camera" && (
              <>
                {[["left-8 top-[22%]", "border-l-2 border-t-2"], ["right-8 top-[22%]", "border-r-2 border-t-2"], ["left-8 bottom-[26%]", "border-l-2 border-b-2"], ["right-8 bottom-[26%]", "border-r-2 border-b-2"]].map(([pos, b]) => (
                  <span key={pos} className={cn("absolute size-10 rounded-sm border-paper", pos, b)} />
                ))}
                <div className="absolute inset-x-0 flex items-center justify-around px-10" style={{ bottom: "calc(var(--bottom) + 26px)" }}>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-black/40 text-paper"><ImageIcon className="size-5" /></span>
                  <button aria-label="Prendre la photo" onClick={shoot} className="tap flex size-[74px] items-center justify-center rounded-full border-4 border-paper"><span className="size-[58px] rounded-full bg-paper" /></button>
                  <span className="size-11" />
                </div>
              </>
            )}
            <AnimatePresence>{flash && <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="form" className="absolute inset-0 overflow-y-auto bg-paper no-scrollbar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingTop: "var(--top)", paddingBottom: "calc(var(--bottom) + 16px)" }}>
            <div className="flex items-center px-4"><button aria-label="Reprendre" onClick={() => setStep("camera")} className="tap rounded-full p-1.5"><ChevronLeft className="size-5" /></button><span className="text-[14px] font-medium">Nouvelle pièce</span></div>
            <div className="relative mx-auto mt-2 aspect-square w-[62%]">
              <div className="absolute inset-x-6 bottom-3 h-6 rounded-[50%] bg-black/15 blur-xl" />
              <img src={PHOTO} alt="" className="relative h-full w-full object-contain" style={{ mixBlendMode: "multiply" }} />
            </div>
            <div className="px-5">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-rust"><Sparkles className="size-3.5" /> Pré-rempli par l&apos;IA · vérifiez</p>
              <button onClick={() => setUseMatch(!useMatch)} className={cn("tap mt-3 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition", useMatch ? "bg-ink text-paper" : "bg-white")}>
                <img src={MATCH.image} alt="" className="size-14 rounded-2xl object-cover" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium leading-snug">Est-ce le modèle « {MATCH.name} » d&apos;Atelier Ferrand ?</p>
                  <p className={cn("text-[11.5px]", useMatch ? "text-paper/65" : "text-mute")}>Correspondance visuelle 92 % · fiche produit complète</p>
                </div>
                <span className={cn("flex size-6 items-center justify-center rounded-full border", useMatch ? "border-paper bg-paper text-ink" : "border-line")}>{useMatch && <Check className="size-3.5" />}</span>
              </button>
              <div className="mt-3 divide-y divide-line rounded-2xl bg-white px-4">
                <Row label="Nom">{useMatch ? MATCH.name : <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-right outline-none" />}</Row>
                <Row label="Catégorie">Chaussures · {shot.sub}</Row>
                <Row label="Couleur"><span className="inline-flex items-center gap-2"><span className="size-3.5 rounded-full" style={{ background: shot.color.hex }} />{shot.color.name}</span></Row>
                <Row label="Matière">{useMatch ? MATCH.material : "Cuir lisse (estimé)"}</Row>
                <Row label="Pointure">
                  <span className="inline-flex gap-1">{shot.sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={cn("rounded-full px-2.5 py-1 text-[12px]", size === s ? "bg-ink text-paper" : "bg-paper")}>{s.replace(".", ",")}</button>)}</span>
                </Row>
                <Row label="Formalité">4 / 5 · bureau, cérémonie</Row>
              </div>
              <p className="mt-2 px-1 text-[11.5px] text-mute">Pointure {shot.size.replace(".", ",")} suggérée : {shot.note}.</p>
              <button onClick={save} className="tap mt-5 h-[52px] w-full rounded-full bg-ink text-[15px] font-medium text-paper">Ajouter à mon dressing</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-[13px]"><span className="shrink-0 text-mute">{label}</span><span className="min-w-0 text-right">{children}</span></div>;
}
