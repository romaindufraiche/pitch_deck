"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Moon, Search, SlidersHorizontal, X } from "lucide-react";
import { Screen } from "@/components/screen";
import { Sheet } from "@/components/sheet";
import { ItemTile } from "@/components/item-tile";
import { EnrichCard } from "@/components/enrich-card";
import { useWardrobe } from "@/lib/hooks";
import { CATEGORY_LABELS, wardrobeStats } from "@/lib/wardrobe";
import { formatPrice } from "@/lib/data";
import type { ItemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATS = ["chemises", "hauts", "maille", "pantalons", "vestes", "costumes", "chaussures", "accessoires", "sport"];
const STATUSES: ItemStatus[] = ["disponible", "au linge", "au pressing"];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export default function Dressing() {
  const items = useWardrobe();
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [brandsF, setBrandsF] = useState<string[]>([]);
  const [status, setStatus] = useState<ItemStatus | null>(null);
  const [dormant, setDormant] = useState(false);
  const [sheet, setSheet] = useState(false);
  const stats = wardrobeStats(items);

  const palette = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((i) => m.set(i.color.name, i.color.hex));
    return [...m.entries()];
  }, [items]);
  const brandList = useMemo(() => [...new Set(items.map((i) => i.brandName))].sort((a, b) => (a === "Marque inconnue" ? 1 : b === "Marque inconnue" ? -1 : a.localeCompare(b))), [items]);
  const cats = CATS.filter((c) => items.some((i) => i.category === c));

  const shown = items.filter((i) =>
    (!cat || i.category === cat) &&
    (!colors.length || colors.includes(i.color.name)) &&
    (!brandsF.length || brandsF.includes(i.brandName)) &&
    (!status || i.status === status) &&
    (!dormant || i.lastWornDaysAgo === null || i.lastWornDaysAgo > 90) &&
    (!q || norm(`${i.name} ${i.brandName} ${i.color.name} ${i.subcategory}`).includes(norm(q))),
  );
  const activeFilters = colors.length + brandsF.length + (status ? 1 : 0);

  return (
    <Screen>
      <div className="px-5 pt-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">{stats.count} pièces · {stats.brandsCount} marques</p>
            <h1 className="mt-1 font-display text-[28px] leading-tight">Mon dressing</h1>
          </div>
          <Link href="/dressing/ajout" aria-label="Ajouter un article" className="tap flex size-11 items-center justify-center rounded-full bg-ink text-paper"><Camera className="size-[18px]" strokeWidth={1.6} /></Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat value={String(stats.count)} label="pièces" />
          <Stat value={formatPrice(stats.value)} label="valeur connue" />
          <Stat value={`${stats.atLaundry}`} label="au linge / pressing" />
        </div>

        <button onClick={() => setDormant(!dormant)} className={cn("tap mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition", dormant ? "bg-ink text-paper" : "bg-rust-soft")}>
          <Moon className={cn("size-4 shrink-0", dormant ? "text-paper" : "text-rust")} />
          <p className="flex-1 text-[12.5px] leading-snug"><b className="font-semibold">{stats.notWorn90Pct} % de vos articles</b> n&apos;ont pas été portés depuis 3 mois.</p>
          <span className="text-[12px] font-medium underline underline-offset-2">{dormant ? "Tout voir" : "Les voir"}</span>
        </button>

        <div className="mt-3 flex gap-2">
          <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-white px-3.5">
            <Search className="size-4 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher une pièce, une couleur…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-mute" />
            {q && <button aria-label="Effacer" onClick={() => setQ("")}><X className="size-3.5 text-mute" /></button>}
          </label>
          <button onClick={() => setSheet(true)} className={cn("tap relative flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12.5px]", activeFilters ? "bg-ink text-paper" : "bg-white")}>
            <SlidersHorizontal className="size-4" /> Filtres{activeFilters ? ` · ${activeFilters}` : ""}
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-20 mt-3 flex gap-1.5 overflow-x-auto bg-paper/90 px-5 py-2 backdrop-blur no-scrollbar">
        <Chip on={!cat} onClick={() => setCat(null)}>Tout</Chip>
        {cats.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(cat === c ? null : c)}>{CATEGORY_LABELS[c]}</Chip>)}
      </div>

      {!q && !cat && !activeFilters && !dormant && <div className="px-5 pb-1 pt-2"><EnrichCard items={items} /></div>}

      <motion.div layout className="grid grid-cols-3 gap-x-2.5 gap-y-4 px-5 pt-3">
        {shown.map((i) => <ItemTile key={i.id} item={i} />)}
      </motion.div>
      {!shown.length && <p className="px-5 py-12 text-center text-[13px] text-mute">{items.length ? "Aucune pièce ne correspond à ces filtres." : "Votre dressing est vide : connectez une boutique ou filmez votre penderie."}</p>}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filtres">
        <div className="space-y-6 px-5 pt-4">
          <div>
            <p className="eyebrow">Couleur</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {palette.map(([name, hex]) => (
                <button key={name} onClick={() => setColors(colors.includes(name) ? colors.filter((c) => c !== name) : [...colors, name])} className="tap flex flex-col items-center gap-1">
                  <span className={cn("size-9 rounded-full border border-line", colors.includes(name) && "ring-2 ring-ink ring-offset-2 ring-offset-paper")} style={{ background: hex }} />
                  <span className="w-12 truncate text-center text-[10px]">{name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">Marque</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{brandList.map((b) => <Chip key={b} on={brandsF.includes(b)} onClick={() => setBrandsF(brandsF.includes(b) ? brandsF.filter((x) => x !== b) : [...brandsF, b])}>{b}</Chip>)}</div>
          </div>
          <div>
            <p className="eyebrow">Statut</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{STATUSES.map((s) => <Chip key={s} on={status === s} onClick={() => setStatus(status === s ? null : s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Chip>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => { setColors([]); setBrandsF([]); setStatus(null); }} className="tap h-11 rounded-full border border-line text-[13.5px]">Réinitialiser</button>
            <button onClick={() => setSheet(false)} className="tap h-11 rounded-full bg-ink text-[13.5px] font-medium text-paper">Voir {shown.length} pièces</button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2.5">
      <p className="font-display text-[16px] leading-tight tabular-nums">{value}</p>
      <p className="mt-1 text-[10.5px] text-mute">{label}</p>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn("tap shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] transition", on ? "border-ink bg-ink text-paper" : "border-line bg-white")}>{children}</button>;
}
