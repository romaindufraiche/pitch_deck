"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Lock, RotateCcw } from "lucide-react";
import { Screen } from "@/components/screen";
import { Sheet } from "@/components/sheet";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import { brands, baseWardrobe, ordersByBrand, products, user, formatPrice, formatSize } from "@/lib/data";
import { useStore } from "@/lib/store";
import { APP_NAME } from "@/lib/config";
import { recommendSize } from "@/lib/sizing";
import type { Brand } from "@/lib/types";
import { frDate } from "@/lib/time";

const fmtMembers = (n: number) => `${n.toLocaleString("fr-FR")} membres`;

function BoutiquesInner() {
  const onboarding = useSearchParams().get("onboarding") === "1";
  const connected = useStore((s) => s.connected);
  const [flow, setFlow] = useState<Brand | null>(null);
  const [detail, setDetail] = useState<Brand | null>(null);
  const importedCount = (b: Brand) => baseWardrobe.filter((i) => i.source === "import" && i.brandId === b.id).length;

  return (
    <Screen tabs={!onboarding} title={onboarding ? undefined : "Boutiques"}>
      <div className="px-5">
        {onboarding ? (
          <>
            <p className="eyebrow mt-4">Étape 2 sur 3</p>
            <h1 className="mt-2 font-display text-[34px] font-medium leading-[1.05]">Connectez vos boutiques</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-mute">Vos achats en ligne arrivent dans votre dressing avec leur photo, leur matière et surtout leur taille exacte.</p>
          </>
        ) : (
          <p className="mt-2 text-[13.5px] leading-relaxed text-mute">{connected.length} marque{connected.length > 1 ? "s" : ""} connectée{connected.length > 1 ? "s" : ""} sur {brands.length}. Chaque marque partenaire partage vos commandes, tailles et retours, uniquement avec votre accord.</p>
        )}
        <ul className="mt-5 space-y-2.5">
          {brands.map((b) => {
            const on = connected.includes(b.id);
            return (
              <motion.li key={b.id} layout className="flex items-center gap-3.5 rounded-3xl bg-white p-3.5 pr-4">
                <BrandMark brand={b} />
                <button className="min-w-0 flex-1 text-left" onClick={() => setDetail(b)}>
                  <BrandLogo brand={b} size={14} color="#121212" />
                  <p className="mt-1.5 truncate text-[12px] text-mute">{b.positioning.split(",")[0].split(" :")[0]}</p>
                  <p className="mt-0.5 text-[11.5px] text-mute">{on ? <span className="font-medium text-ok">Connectée · {importedCount(b)} articles importés</span> : `${fmtMembers(b.members)} · ${b.priceRange[0]}–${b.priceRange[1]} €`}</p>
                </button>
                {on ? (
                  <span className="flex size-8 items-center justify-center rounded-full bg-ok/10 text-ok"><Check className="size-4" /></span>
                ) : (
                  <button onClick={() => setFlow(b)} className="tap rounded-full bg-ink px-4 py-2 text-[12.5px] font-medium text-paper">Connecter</button>
                )}
              </motion.li>
            );
          })}
        </ul>
        {onboarding && (
          <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-paper from-60% to-transparent px-5 pt-10" style={{ paddingBottom: "calc(var(--bottom) + 8px)" }}>
            <Link href="/scan" className={`tap flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-medium shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] ${connected.length ? "bg-ink text-paper" : "border border-line bg-white text-ink"}`}>
              {connected.length ? `Continuer · ${connected.reduce((s, id) => s + importedCount(brands.find((b) => b.id === id)!), 0)} articles importés` : "Passer cette étape"}
            </Link>
          </div>
        )}
      </div>
      <ConnectFlow brand={flow} onClose={() => setFlow(null)} />
      <BrandDetail brand={detail} onClose={() => setDetail(null)} onConnect={(b) => { setDetail(null); setFlow(b); }} />
    </Screen>
  );
}

export default function Boutiques() {
  return <Suspense><BoutiquesInner /></Suspense>;
}

function ConnectFlow({ brand, onClose }: { brand: Brand | null; onClose: () => void }) {
  const [step, setStep] = useState<"login" | "auth" | "import">("login");
  const [phase, setPhase] = useState(0);
  const connect = useStore((s) => s.connect);
  const close = () => { onClose(); setTimeout(() => { setStep("login"); setPhase(0); }, 300); };
  if (!brand) return <Sheet open={false} onClose={close}>{null}</Sheet>;

  const ords = ordersByBrand(brand.id);
  const items = baseWardrobe.filter((i) => i.source === "import" && i.brandId === brand.id);
  const returns = ords.flatMap((o) => o.items.filter((i) => i.returned));

  const startImport = () => {
    setStep("import");
    setPhase(0);
    setTimeout(() => setPhase(1), 1300);
    setTimeout(() => { setPhase(2); connect(brand.id); }, 2300);
  };

  return (
    <Sheet open={!!brand} onClose={close} full>
      <AnimatePresence mode="wait">
        {step === "login" && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
            <div className="flex h-40 items-center justify-center" style={{ background: brand.color }}>
              <BrandLogo brand={brand} size={22} color={brand.ink} />
            </div>
            <div className="flex-1 px-6 pt-6">
              <h2 className="text-[20px] font-semibold">Connexion à votre compte</h2>
              <p className="mt-1 text-[13px] text-mute">Identifiez-vous sur {brand.name} pour relier votre compte à {APP_NAME}.</p>
              <div className="mt-6 space-y-3">
                <label className="block rounded-xl border border-line bg-white px-4 py-2.5">
                  <span className="text-[11px] text-mute">Adresse e-mail</span>
                  <input readOnly value="thomas.lefevre@icloud.com" className="block w-full bg-transparent text-[15px] outline-none" />
                </label>
                <label className="block rounded-xl border border-line bg-white px-4 py-2.5">
                  <span className="text-[11px] text-mute">Mot de passe</span>
                  <input readOnly type="password" value="motdepasse-demo" className="block w-full bg-transparent text-[15px] outline-none" />
                </label>
              </div>
              <button onClick={() => setStep("auth")} className="tap mt-5 h-12 w-full rounded-xl text-[15px] font-medium" style={{ background: brand.color, color: brand.ink }}>Se connecter</button>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-mute"><Lock className="size-3" /> Connexion sécurisée : {APP_NAME} ne voit jamais votre mot de passe.</p>
            </div>
          </motion.div>
        )}
        {step === "auth" && (
          <motion.div key="auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-6 pt-10">
            <div className="flex items-center justify-center gap-3">
              <BrandMark brand={brand} size={52} />
              <span className="text-mute">⇄</span>
              <span className="flex size-[52px] items-center justify-center rounded-2xl bg-ink font-display text-[24px] font-semibold text-paper">{APP_NAME[0]}</span>
            </div>
            <h2 className="mt-6 text-center text-[19px] font-semibold leading-snug">{APP_NAME} souhaite accéder à votre compte {brand.name}</h2>
            <p className="mt-1 text-center text-[12.5px] text-mute">Connecté en tant que thomas.lefevre@icloud.com</p>
            <ul className="mt-6 divide-y divide-line rounded-2xl bg-white">
              {brand.dataRequested.map((d) => (
                <li key={d} className="flex items-center gap-3 px-4 py-3.5 text-[14px]"><Check className="size-4 text-ok" />{d}</li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] leading-relaxed text-mute">Pas d&apos;accès à vos moyens de paiement ni à votre adresse. Révocable à tout moment depuis {APP_NAME} ou depuis votre compte {brand.name}.</p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button onClick={close} className="tap h-12 rounded-xl border border-line text-[14px]">Refuser</button>
              <button onClick={startImport} className="tap h-12 rounded-xl text-[14px] font-medium" style={{ background: brand.color, color: brand.ink }}>Autoriser</button>
            </div>
          </motion.div>
        )}
        {step === "import" && (
          <motion.div key="import" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pt-8">
            <BrandLogo brand={brand} size={15} color="#121212" />
            <h2 className="mt-4 font-display text-[30px] leading-tight">
              {phase === 0 ? `Récupération de ${ords.length} commande${ords.length > 1 ? "s" : ""}…` : items.length ? `${items.length} articles trouvés` : "Aucune commande en ligne"}
            </h2>
            <p className="mt-1 text-[13px] text-mute">
              {phase === 0 ? "Historique, tailles, retours" : items.length ? `${ords.length} commandes · ${returns.length ? `${returns.length} retour${returns.length > 1 ? "s" : ""} pris en compte pour vos tailles` : "aucun retour"}` : "Vos prochains achats arriveront automatiquement dans votre dressing."}
            </p>
            <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-line">
              <motion.div className="h-full" style={{ background: brand.color }} initial={{ width: "4%" }} animate={{ width: phase === 0 ? "62%" : "100%" }} transition={{ duration: phase === 0 ? 1.2 : 0.5 }} />
            </div>
            <ul className="mt-5 space-y-2">
              {phase >= 1 && items.map((it, k) => (
                <motion.li key={it.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.16 }} className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-4">
                  <img src={it.image} alt="" className="size-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{it.name}</p>
                    <p className="text-[11.5px] text-mute">{it.color.name} · taille {formatSize(it.size)} · {frDate(it.purchaseDate!)}</p>
                  </div>
                  <span className="text-[12px] tabular-nums text-mute">{formatPrice(it.price!)}</span>
                </motion.li>
              ))}
              {phase >= 1 && returns.map((r, k) => (
                <motion.li key={r.name + k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: items.length * 0.16 + 0.1 }} className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-3 text-[12px] text-mute">
                  <RotateCcw className="size-3.5" /> Retour : {r.name} en {formatSize(r.size)} — « {r.returned!.reason} »
                </motion.li>
              ))}
            </ul>
            {phase >= 2 && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: items.length * 0.16 + 0.2 }} onClick={close} className="tap mt-6 h-12 w-full rounded-full bg-ink text-[15px] font-medium text-paper">
                Terminé
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

function BrandDetail({ brand, onClose, onConnect }: { brand: Brand | null; onClose: () => void; onConnect: (b: Brand) => void }) {
  const connected = useStore((s) => s.connected);
  const selection = useMemo(() => {
    if (!brand) return [];
    const seen = new Set<string>();
    return products.filter((p) => p.brandId === brand.id && !seen.has(p.image) && seen.add(p.image)).slice(0, 6);
  }, [brand]);
  if (!brand) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const sample = (cat: string) => products.find((p) => p.brandId === brand.id && p.category === cat && p.sizes.length > 1);
  const recs = (["chemises", "vestes", "pantalons", "chaussures", "maille", "sport"] as const)
    .map((c) => ({ c, p: sample(c) }))
    .filter((x) => x.p)
    .slice(0, 3)
    .map(({ c, p }) => ({ c, r: recommendSize(user, brand, p!.category, p!.sizes.map((s) => s.size), [], p!.fit) }));
  const labels: Record<string, string> = { chemises: "Chemises", vestes: "Vestes", pantalons: "Pantalons", chaussures: "Chaussures", maille: "Maille", sport: "Sport" };
  return (
    <Sheet open={!!brand} onClose={onClose} full>
      <div className="flex h-32 items-center justify-center" style={{ background: brand.color }}>
        <BrandLogo brand={brand} size={20} color={brand.ink} />
      </div>
      <div className="px-5 pt-5">
        <p className="text-[14px] leading-relaxed">{brand.positioning}</p>
        <p className="mt-1 text-[12px] text-mute">{brand.tagline} · {brand.city} · {fmtMembers(brand.members)}</p>
        <div className="mt-5 rounded-3xl bg-white p-4">
          <p className="eyebrow">Guide des tailles · {brand.sizeGuide.summary}</p>
          <p className="mt-2 text-[13px] leading-relaxed">{brand.sizeGuide.advice}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {recs.map(({ c, r }) => (
              <div key={c} className="rounded-2xl bg-paper p-3 text-center">
                <p className="text-[10.5px] uppercase tracking-wider text-mute">{labels[c]}</p>
                <p className="mt-1 font-display text-[26px] leading-none">{formatSize(r.size)}</p>
                <p className="mt-1 text-[10.5px] text-mute">{r.size !== r.usual ? `au lieu de ${formatSize(r.usual)}` : "votre taille"}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-mute">Vos tailles chez {brand.name}, calculées d&apos;après votre profil de {user.firstName}.</p>
        </div>
        <p className="eyebrow mt-6">Sélection</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {selection.map((p) => (
            <div key={p.id}>
              <img src={p.image} alt={p.name} className="aspect-[4/5] w-full rounded-2xl object-cover" />
              <p className="mt-2 text-[12.5px] font-medium leading-tight">{p.name}</p>
              <p className="text-[12px] text-mute">{formatPrice(p.price)}</p>
            </div>
          ))}
        </div>
        {!connected.includes(brand.id) && (
          <button onClick={() => onConnect(brand)} className="tap mt-6 flex h-12 w-full items-center justify-center gap-1 rounded-full text-[14px] font-medium" style={{ background: brand.color, color: brand.ink }}>
            Connecter mon compte {brand.name} <ChevronRight className="size-4" />
          </button>
        )}
      </div>
    </Sheet>
  );
}
