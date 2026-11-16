"use client";

import { useStatusTone } from "@/lib/tone";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ChevronLeft, Lightbulb, Minus, MoveHorizontal, Play, Plus, Sparkles, SunMedium } from "lucide-react";
import { baseWardrobe, brandById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { frDate } from "@/lib/time";
import type { WardrobeItem } from "@/lib/types";

const GROUPS: [string, (i: WardrobeItem) => boolean][] = [
  ["Chemises & blouses", (i) => i.category === "chemises"],
  ["Robes & jupes", (i) => i.category === "robes" || i.category === "jupes"],
  ["T-shirts & polos", (i) => i.category === "hauts"],
  ["Pulls & sweats", (i) => i.category === "maille"],
  ["Pantalons & jeans", (i) => i.category === "pantalons"],
  ["Vestes & manteaux", (i) => i.category === "vestes" || i.category === "costumes"],
  ["Chaussures", (i) => i.category === "chaussures"],
  ["Accessoires", (i) => i.category === "accessoires"],
];

/** Pièces déjà importées que la vidéo retrouve aussi (dédoublonnage). Les 3 premières sont présentées à l'utilisateur. */
const DUPES = ["Blazer Faubourg", "Jean K1 Slim délavé", "Pantalon à pinces Flanelle", "Chemise Oxford Saint-Germain", "Jean K1 Slim selvedge brut", "Derby Lucien", "T-shirt Essentiel", "T-shirt Essentiel noir", "Chemise Popeline rayée Opéra", "Pull col rond Mérinos", "Chino Luberon anthracite", "Chelsea Marcel", "Polo Sorgue"];
/** extraits réels de la vidéo (scripts : recadrage ffmpeg) pour les doublons présentés */
/** Léa : pièces importées retrouvées dans la vidéo */
const DUPES_LEA = ["Veste de tailleur Opéra", "Pantalon large Calanque", "Blazer Palais", "Jean K5 Flare brut", "Pull col bateau Alpilles", "Jean K6 Boyfriend blanc", "Bottines Lucie"];
const DUPE_SHOWN: Record<string, { text: string; img: string }> = {
  "Veste de tailleur Opéra": { text: "Cette veste sombre", img: "/images/scan/blazer.jpg" },
  "Pantalon large Calanque": { text: "Ce pantalon clair", img: "/images/scan/pantalon.jpg" },
  "Blazer Faubourg": { text: "Ce blazer marine", img: "/images/scan/blazer.jpg" },
  "Jean K1 Slim délavé": { text: "Ce jean délavé", img: "/images/scan/jean.jpg" },
  "Pantalon à pinces Flanelle": { text: "Ce pantalon gris clair", img: "/images/scan/pantalon.jpg" },
};

/** Minutage calé sur la vidéo lue en ×2,4 : vestes de 0 à 2,5 s, pantalons et jeans ensuite. */
const BOXES = [
  { t: 0.15, d: 1.0, x: 6, y: 30, w: 30, h: 46, label: "Blouson cuir · noir", p: 97 },
  { t: 0.6, d: 1.1, x: 40, y: 28, w: 24, h: 50, label: "Blazer · marine", p: 93 },
  { t: 1.1, d: 1.1, x: 63, y: 30, w: 30, h: 48, label: "Veste · gris chiné", p: 91 },
  { t: 1.5, d: 0.9, x: 20, y: 34, w: 26, h: 44, label: "Veste · beige", p: 88 },
  { t: 2.75, d: 1.5, x: 8, y: 30, w: 22, h: 54, label: "Pantalon · prince-de-galles", p: 90 },
  { t: 3.3, d: 1.5, x: 33, y: 28, w: 22, h: 56, label: "Pantalon · gris clair", p: 94 },
  { t: 3.9, d: 1.6, x: 60, y: 30, w: 26, h: 52, label: "Jean · délavé", p: 97 },
  { t: 4.6, d: 1.5, x: 20, y: 34, w: 26, h: 46, label: "Chino · beige", p: 91 },
];

export default function Scan() {
  const router = useRouter();
  const st = useStore();
  const [phase, setPhase] = useState<"intro" | "analyse" | "result">("intro");
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  useStatusTone(phase === "analyse" ? "light" : "dark");

  const videoItems = useMemo(() => baseWardrobe.filter((i) => i.persona === st.persona && i.source === "video"), [st.persona]);
  const dupes = useMemo(() => (st.persona === "lea" ? DUPES_LEA : DUPES).map((n) => baseWardrobe.find((i) => i.persona === st.persona && i.name === n)!).filter((i) => i && i.brandId && st.connected.includes(i.brandId)), [st.connected, st.persona]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const groups = useMemo(() => GROUPS.map(([label, fn]) => {
    const n = videoItems.filter(fn).reduce((s, i) => s + i.quantity, 0) + dupes.filter(fn).length;
    return { label, n: qty[label] ?? n };
  }).filter((g) => g.n > 0), [videoItems, dupes, qty]);
  const total = groups.reduce((s, g) => s + g.n, 0);

  const DURATION = 6.2;
  useEffect(() => {
    if (phase !== "analyse") return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const e = (performance.now() - t0) / 1000;
      setElapsed(e);
      if (e < DURATION) raf = requestAnimationFrame(tick);
      else setPhase("result");
    };
    raf = requestAnimationFrame(tick);
    if (videoRef.current) { videoRef.current.playbackRate = 2.4; videoRef.current.play().catch(() => {}); }
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const progress = Math.min(1, elapsed / DURATION);
  const counted = Math.round(total * Math.min(1, progress * 1.08));
  const shownGroups = groups.slice(0, Math.ceil(groups.length * Math.min(1, progress * 1.15)));

  const finish = () => {
    st.set({ scanned: true, onboarded: true });
    router.push("/accueil");
  };

  if (phase === "intro") {
    return (
      <div className="absolute inset-0 flex flex-col bg-paper" style={{ paddingTop: "var(--top)" }}>
        <div className="flex items-center px-4 pt-1"><button aria-label="Retour" onClick={() => router.back()} className="tap rounded-full p-1.5"><ChevronLeft className="size-5" /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 no-scrollbar">
          <p className="eyebrow mt-2">Étape 3 sur 3</p>
          <h1 className="mt-2 font-display text-[25px] leading-tight">Filmez votre dressing en 30 secondes</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-mute">Notre IA repère chaque pièce, sa catégorie et sa couleur. Pas besoin de tout sortir.</p>
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl">
            <img src="/video/dressing-poster.jpg" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-paper/60" />
            <MoveHorizontal className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-paper" />
          </div>
          <ul className="mt-5 space-y-3.5 text-[13.5px]">
            <Tip icon={<SunMedium className="size-4" />} text="Ouvrez grand les portes, à la lumière du jour." />
            <Tip icon={<MoveHorizontal className="size-4" />} text="Balayez lentement de gauche à droite, à un mètre." />
            <Tip icon={<Lightbulb className="size-4" />} text="Pour les piles, filmez de face : on compte les tranches." />
          </ul>
        </div>
        <div className="space-y-2.5 px-5 pt-3" style={{ paddingBottom: "calc(var(--bottom) + 14px)" }}>
          <button onClick={() => setPhase("analyse")} className="tap flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-paper"><Play className="size-4" fill="currentColor" /> Utiliser la vidéo exemple</button>
          <button onClick={() => setPhase("analyse")} className="tap flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line text-[15px]"><Camera className="size-4" /> Filmer mon dressing</button>
        </div>
      </div>
    );
  }

  if (phase === "analyse") {
    return (
      <div className="absolute inset-0 bg-black">
        <video ref={videoRef} src="/video/dressing.mp4" poster="/video/dressing-poster.jpg" muted playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/10" />
        {BOXES.filter((b) => elapsed > b.t && elapsed < b.t + b.d).map((b) => (
          <motion.div key={b.label} className="absolute rounded-xl border-2 border-paper/90" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }} initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded-md bg-paper px-1.5 py-0.5 text-[10.5px] font-medium text-ink">{b.label} · {b.p} %</span>
          </motion.div>
        ))}
        <motion.div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-paper/25 to-transparent" animate={{ top: ["10%", "80%", "10%"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
        <div className="absolute inset-x-0 flex justify-between px-5 text-paper" style={{ top: "calc(var(--top) + 6px)" }}>
          <span className="flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[12px] backdrop-blur"><span className="size-2 animate-pulse rounded-full bg-red-500" /> Analyse en cours</span>
          <button onClick={() => setPhase("result")} className="rounded-full bg-black/45 px-3 py-1.5 text-[12px] backdrop-blur">Passer</button>
        </div>
        <div className="absolute inset-x-3 rounded-[26px] bg-paper/95 p-4 backdrop-blur" style={{ bottom: "calc(var(--bottom) + 8px)" }}>
          <div className="flex items-baseline justify-between">
            <p className="font-display text-[30px] leading-tight tabular-nums">{counted}<span className="ml-2 font-sans text-[13px] text-mute">articles détectés</span></p>
            <Sparkles className="size-5 text-rust" />
          </div>
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-line"><div className="h-full bg-ink transition-[width]" style={{ width: `${progress * 100}%` }} /></div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <AnimatePresence>
              {shownGroups.map((g) => (
                <motion.span key={g.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-full bg-white px-3 py-1.5 text-[12px]">{g.label} <b className="tabular-nums">×{Math.max(1, Math.round(g.n * Math.min(1, progress * 1.2)))}</b></motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-paper no-scrollbar" style={{ paddingTop: "var(--top)" }}>
      <div className="px-6 pb-6">
        <p className="eyebrow mt-4">Analyse terminée</p>
        <h1 className="mt-2 font-display text-[30px] leading-tight">~{total} articles détectés</h1>
        <p className="mt-2 text-[13.5px] text-mute">Ajustez si besoin : les quantités sont des estimations.</p>
        <ul className="mt-5 divide-y divide-line rounded-2xl bg-white px-4">
          {groups.map((g) => (
            <li key={g.label} className="flex items-center justify-between py-3">
              <span className="text-[14px]">{g.label}</span>
              <span className="flex items-center gap-3">
                <button aria-label="Moins" onClick={() => setQty({ ...qty, [g.label]: Math.max(0, g.n - 1) })} className="tap flex size-7 items-center justify-center rounded-full border border-line"><Minus className="size-3.5" /></button>
                <span className="w-6 text-center text-[15px] font-medium tabular-nums">{g.n}</span>
                <button aria-label="Plus" onClick={() => setQty({ ...qty, [g.label]: g.n + 1 })} className="tap flex size-7 items-center justify-center rounded-full border border-line"><Plus className="size-3.5" /></button>
              </span>
            </li>
          ))}
        </ul>

        {dupes.length > 0 && (
          <>
            <p className="eyebrow mt-7">Doublons avec vos achats</p>
            <p className="mt-1 text-[12.5px] text-mute">{dupes.length} pièces filmées correspondent à des achats importés. {dupes.filter((d) => !DUPE_SHOWN[d.name]).length ? `${dupes.filter((d) => !DUPE_SHOWN[d.name]).length} ont été fusionnées automatiquement (correspondance certaine).` : ""}</p>
            <div className="mt-3 space-y-2.5">
              {dupes.filter((d) => DUPE_SHOWN[d.name]).slice(0, 3).map((d) => {
                const choice = st.merges[d.id];
                return (
                  <div key={d.id} className="rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="relative shrink-0"><img src={DUPE_SHOWN[d.name].img} alt="" className="size-14 rounded-xl object-cover" /><span className="absolute -bottom-1 left-1 rounded bg-ink px-1 text-[8.5px] font-medium text-paper">VIDÉO</span></span>
                      <span className="text-mute">→</span>
                      <img src={d.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                      <p className="flex-1 text-[13px] leading-snug">{DUPE_SHOWN[d.name].text} correspond à votre achat {brandById[d.brandId!].name} du {frDate(d.purchaseDate!)}. Fusionner ?</p>
                    </div>
                    {choice ? (
                      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-ok"><Check className="size-4" /> {choice === "merged" ? "Fusionnées : une seule fiche, avec la taille et la référence." : "Gardées comme deux pièces distinctes."}</p>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button onClick={() => st.set({ merges: { ...st.merges, [d.id]: "separate" } })} className="tap h-10 rounded-full border border-line text-[13px]">Deux pièces</button>
                        <button onClick={() => st.set({ merges: { ...st.merges, [d.id]: "merged" } })} className="tap h-10 rounded-full bg-ink text-[13px] font-medium text-paper">Fusionner</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-7 rounded-2xl bg-ink p-5 text-paper">
          <Sparkles className="size-5 text-paper" />
          <p className="mt-3 font-display text-[19px] leading-tight">Votre dressing est prêt.</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-paper/75">Vous complèterez les détails au fil de l&apos;eau, pas besoin de tout saisir maintenant.</p>
        </div>
        <button onClick={finish} className="tap mt-5 h-[52px] w-full rounded-full bg-ink text-[15px] font-medium text-paper" style={{ marginBottom: "var(--bottom)" }}>Découvrir mon dressing</button>
      </div>
    </div>
  );
}

function Tip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <li className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white">{icon}</span>{text}</li>;
}
