"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Droplets, Sparkles, WashingMachine } from "lucide-react";
import { Screen } from "@/components/screen";
import { Viewer360 } from "@/components/viewer-360";
import { StatusDot } from "@/components/item-tile";
import { useToday, useWardrobe } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { brands, brandById, formatPrice, formatSize } from "@/lib/data";
import { effectiveWearLog } from "@/lib/wardrobe";
import { addDays, frDate, relativeDay, daysSinceLastWeekday } from "@/lib/time";
import { CATEGORY_LABELS } from "@/lib/wardrobe";
import type { ItemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStatusTone } from "@/lib/tone";

const SOURCE: Record<string, string> = { import: "Importé depuis votre compte", video: "Détecté dans la vidéo de votre dressing", photo: "Ajouté par photo" };

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const today = useToday();
  const items = useWardrobe();
  const setStatus = useStore((s) => s.setStatus);
  const override = useStore((s) => s.override);
  useStatusTone("light");
  const item = items.find((i) => i.id === id);
  if (!item) return <Screen back title="Article"><p className="p-8 text-center text-mute">Cet article n&apos;est plus dans votre dressing.</p></Screen>;

  const log = effectiveWearLog(today);
  const wornDays = new Set(log.filter((d) => d.itemIds.includes(item.id)).map((d) => d.daysAgo));
  if (useStore.getState().overrides[item.id]?.wornToday) wornDays.add(0);
  const recent = log.filter((d) => d.itemIds.includes(item.id)).slice(0, 3);
  const byId = new Map(items.map((i) => [i.id, i]));
  const brand = item.brandId ? brandById[item.brandId] : null;
  const ask = item.name === "Chemise Oxford Saint-Germain" ? "Quel pantalon je mets avec ma chemise oxford bleue ?" : `Que porter avec ${item.quantity > 1 ? "mes" : "mon"} ${item.name.toLowerCase()} ?`;

  const rows: [string, React.ReactNode][] = [
    ["Catégorie", `${CATEGORY_LABELS[item.category]} · ${item.subcategory}`],
    ["Couleur", <span key="c" className="inline-flex items-center gap-2"><span className="size-3.5 rounded-full border border-line" style={{ background: item.color.hex }} />{item.color.name}</span>],
    ["Matière", item.material],
    ["Taille portée", item.size ? formatSize(item.size) : null],
    ["Coupe", item.fit],
    ["Saison", item.season],
    ["Formalité", <span key="f" className="inline-flex gap-1">{[1, 2, 3, 4, 5].map((k) => <span key={k} className={cn("size-2 rounded-full", k <= item.formality ? "bg-ink" : "bg-line")} />)}</span>],
    ["Achat", item.purchaseDate ? `${frDate(item.purchaseDate)}${item.price ? ` · ${formatPrice(item.price)}` : ""}` : null],
    ["Commande", item.orderId],
    ["Référence", item.ref],
    ["Origine", item.notes ? `${SOURCE[item.source]} · ${item.notes}` : SOURCE[item.source]],
  ];

  return (
    <Screen noTop>
      <div className="relative aspect-[4/5] w-full bg-paper-2">
        {item.gallery ? <Viewer360 frames={item.gallery} alt={item.name} /> : <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
        <button aria-label="Retour" onClick={() => router.back()} className="tap absolute left-4 flex size-9 items-center justify-center rounded-full bg-paper/90 backdrop-blur" style={{ top: "calc(var(--top) + 4px)" }}><ChevronLeft className="size-5" /></button>
        <div className="absolute right-4" style={{ top: "calc(var(--top) + 10px)" }}><StatusDot status={item.status} /></div>
      </div>

      <div className="px-5 pt-5">
        <p className="eyebrow">{item.brandName}</p>
        <h1 className="mt-1.5 font-display text-[32px] font-medium leading-[1.05]">{item.name}</h1>
        <p className="mt-2 text-[13px] text-mute">
          Porté <b className="font-semibold text-ink">{item.timesWorn} fois</b>
          {item.lastWornDaysAgo !== null && <> · dernier port {item.lastWornDaysAgo === 0 ? "aujourd'hui" : relativeDay(today, addDays(today, -item.lastWornDaysAgo))}</>}
          {item.price && item.timesWorn > 0 && <> · {formatPrice(Math.round((item.price / item.timesWorn) * 100) / 100)} par port</>}
        </p>

        <div className="mt-5 rounded-3xl bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Statut</p>
            <AnimatePresence>
              {item.status !== "disponible" && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStatus(item.id, "disponible")} className="tap flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-medium text-paper">
                  <WashingMachine className="size-3.5" /> Marquer comme lavé
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-paper p-1">
            {(["disponible", "au linge", "au pressing"] as ItemStatus[]).map((s) => (
              <button key={s} onClick={() => setStatus(item.id, s)} className={cn("tap rounded-full py-2 text-[12px] transition", item.status === s ? "bg-ink text-paper" : "text-mute")}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
          {item.wornLastTuesday && item.status === "au linge" && <p className="mt-3 flex items-center gap-1.5 text-[12px] text-mute"><Droplets className="size-3.5" /> Porté {relativeDay(today, addDays(today, -daysSinceLastWeekday(today, 2)))} : passé automatiquement au linge.</p>}
        </div>

        {item.missing.length > 0 && (
          <div className="mt-3 rounded-3xl border border-dashed border-rust/40 bg-rust-soft/50 p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-rust"><Sparkles className="size-3.5" /> Fiche à compléter : {item.missing.join(", ")}</p>
            {item.missing.includes("marque") && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {brands.slice(0, 4).map((b) => <button key={b.id} onClick={() => override(item.id, { brandId: b.id, brandName: b.name })} className="tap rounded-full bg-white px-3 py-1.5 text-[12px]">{b.name}</button>)}
                <button onClick={() => override(item.id, { brandName: "Autre marque" })} className="tap rounded-full bg-white px-3 py-1.5 text-[12px]">Autre</button>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 rounded-3xl bg-white p-4">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Ports sur 30 jours</p>
            <p className="text-[12px] text-mute">{wornDays.size} fois</p>
          </div>
          <div className="mt-3 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5">
            {Array.from({ length: 30 }, (_, k) => 29 - k).map((d) => (
              <span key={d} title={`il y a ${d} j`} className={cn("aspect-square rounded-[5px]", wornDays.has(d) ? "bg-ink" : "bg-paper")} />
            ))}
          </div>
          {recent.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {recent.map((d) => {
                const date = addDays(today, -d.daysAgo);
                const others = d.itemIds.filter((x) => x !== item.id).map((x) => byId.get(x)).filter(Boolean);
                return (
                  <li key={d.daysAgo} className="flex items-center gap-3">
                    <div className="w-[76px] shrink-0 text-[11.5px] leading-tight"><b className="font-medium capitalize">{relativeDay(today, date)}</b><br /><span className="text-mute">{d.occasion}</span></div>
                    <div className="flex -space-x-2">{others.slice(0, 4).map((o) => <img key={o!.id} src={o!.image} alt={o!.name} className="size-9 rounded-full border-2 border-white object-cover" />)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-3 divide-y divide-line rounded-3xl bg-white px-4">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 text-[13px]"><span className="text-mute">{k}</span><span className="text-right">{v}</span></div>
          ))}
        </div>

        {brand && item.source === "import" && <p className="mt-3 flex items-center gap-1.5 px-1 text-[11.5px] text-mute"><Check className="size-3.5 text-ok" /> Taille confirmée par votre historique {brand.name}.</p>}

        <Link href={`/assistant?q=${encodeURIComponent(ask)}`} className="tap mt-5 flex h-[50px] items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-paper">
          <Sparkles className="size-4" /> Que porter avec ?
        </Link>
      </div>
    </Screen>
  );
}
