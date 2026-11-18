"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { warmOfflineCache } from "./service-worker";
import { APP_NAME } from "@/lib/config";
import { baseWardrobe } from "@/lib/data";

export const openPresentationMenu = () => window.dispatchEvent(new Event("open-presentation"));

/** Appui long : ouvre le menu de présentation (à poser sur le logo). */
export function useLongPress(ms = 700) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const start = () => { t = setTimeout(openPresentationMenu, ms); };
  const stop = () => t && clearTimeout(t);
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onContextMenu: (e: React.MouseEvent) => e.preventDefault() };
}

const chelsea = baseWardrobe.find((i) => i.name === "Chelsea Marcel")!.id;

const JUMPS: [string, string][] = [
  ["Splash", "/"],
  ["Bienvenue (carrousel)", "/bienvenue"],
  ["Création de compte", "/inscription"],
  ["Connexion des boutiques", "/boutiques?onboarding=1"],
  ["Scan vidéo du dressing", "/scan"],
  ["Accueil", "/accueil"],
  ["Mon dressing", "/dressing"],
  ["Fiche article 360° (Thomas)", `/dressing/${chelsea}`],
  ["Ajout par photo", "/dressing/ajout"],
  ["Catalogue des marques", "/catalogue"],
  ["Assistant IA", "/assistant"],
  ["Profil et tailles", "/profil"],
  ["Espace marque (B2B)", "/marque"],
];

export function PresentationMenu() {
  const [open, setOpen] = useState(false);
  const [offline, setOffline] = useState<string | null>(null);
  const router = useRouter();
  const s = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "D" || e.key === "d")) { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-presentation", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("open-presentation", onOpen); };
  }, []);

  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-[100] flex items-end bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.div
            className="max-h-[88%] w-full overflow-y-auto rounded-t-[28px] bg-ink px-5 pt-5 text-paper"
            style={{ paddingBottom: "calc(var(--bottom) + 16px)" }}
            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.2em] text-paper/50">Mode présentation · {APP_NAME} · profil : {s.persona === "lea" ? "Léa" : "Thomas"}</p>
              <kbd className="rounded bg-paper/10 px-1.5 py-0.5 text-[10px] text-paper/60">Shift + D</kbd>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="rounded-2xl bg-paper px-3 py-3 text-left text-[13px] font-medium text-ink" onClick={() => { s.prefill("thomas"); go("/accueil"); }}>
                Compte de Thomas
                <span className="mt-0.5 block text-[11px] font-normal text-mute">28 ans · smart casual · 61 pièces</span>
              </button>
              <button className="rounded-2xl bg-paper px-3 py-3 text-left text-[13px] font-medium text-ink" onClick={() => { s.prefill("lea"); go("/accueil"); }}>
                Compte de Léa
                <span className="mt-0.5 block text-[11px] font-normal text-mute">26 ans · street et corporate · 39 pièces</span>
              </button>
              <button className="col-span-2 rounded-2xl bg-paper/10 px-3 py-3 text-left text-[13px] font-medium" onClick={() => { s.reset(); go("/"); }}>
                Réinitialiser la démo
                <span className="mt-0.5 block text-[11px] font-normal text-paper/50">Repart du splash</span>
              </button>
            </div>
            <p className="mb-2 mt-5 text-[11px] uppercase tracking-[0.2em] text-paper/50">Aller à l&apos;étape</p>
            <div className="grid grid-cols-2 gap-1.5">
              {JUMPS.map(([label, href]) => (
                <button key={href} className="rounded-xl bg-paper/[0.06] px-3 py-2.5 text-left text-[12.5px] hover:bg-paper/10" onClick={() => {
                  if (href === `/dressing/${chelsea}` && s.persona !== "thomas") s.prefill("thomas");
                  else if (!["/", "/bienvenue", "/inscription", "/boutiques?onboarding=1", "/scan"].includes(href) && !s.onboarded) s.prefill(s.persona);
                  go(href);
                }}>{label}</button>
              ))}
            </div>
            <p className="mb-2 mt-5 text-[11px] uppercase tracking-[0.2em] text-paper/50">Assistant</p>
            <div className="flex flex-wrap gap-1.5 text-[12px]">
              <button className="rounded-full bg-paper/[0.06] px-3 py-2" onClick={() => s.clearChat()}>Effacer la conversation</button>
              <button className="rounded-full bg-paper/[0.06] px-3 py-2" onClick={async () => {
                setOffline("Préparation…");
                const n = await warmOfflineCache((d, t) => setOffline(`${d}/${t}`));
                setOffline(`${n} ressources en cache`);
              }}>{offline ?? "Préparer le mode hors ligne"}</button>
              <span className="rounded-full px-3 py-2 text-paper/50">Dernière réponse : {s.lastAssistantMode === "live" ? "IA en direct" : s.lastAssistantMode === "secours" ? "mode secours" : "—"}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
