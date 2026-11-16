"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Settings2, X } from "lucide-react";
import { Screen } from "@/components/screen";
import { BrandLogo } from "@/components/brand-logo";
import { CartButton } from "@/components/checkout";
import { ProductSheet } from "@/components/product-sheet";
import { brandById, brands, forGender, formatPrice, formatSize, products } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToolContext } from "@/lib/hooks";
import { recommendSizeFor } from "@/lib/assistant-tools";
import { CATEGORY_LABELS } from "@/lib/wardrobe";
import type { BrandId, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export default function Catalogue() {
  const connected = useStore((s) => s.connected);
  const budget = useStore((s) => s.budget);
  const ctx = useToolContext();
  const [brand, setBrand] = useState<BrandId | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [inBudget, setInBudget] = useState(false);
  const [q, setQ] = useState("");
  const [rayon, setRayon] = useState<"femme" | "homme" | "tous">(ctx.user.gender);
  const [open, setOpen] = useState<Product | null>(null);

  /** une fiche par photo : le catalogue reste lisible */
  const catalog = useMemo(() => {
    const seen = new Set<string>();
    // les pièces du rayon choisi d'abord, les pièces mixtes ensuite
    return products
      .filter((p) => connected.includes(p.brandId) && forGender(rayon)(p) && !seen.has(p.image) && seen.add(p.image))
      .sort((a, b) => Number(a.gender === "mixte") - Number(b.gender === "mixte"));
  }, [connected, rayon]);
  const cats = Object.keys(CATEGORY_LABELS).filter((c) => catalog.some((p) => p.category === c && (!brand || p.brandId === brand)));
  const shown = catalog.filter((p) =>
    (!brand || p.brandId === brand) &&
    (!cat || p.category === cat) &&
    (!inBudget || p.price <= budget) &&
    (!q || norm(`${p.name} ${p.subcategory} ${p.color.name} ${brandById[p.brandId].name}`).includes(norm(q))),
  );
  const sizeOf = (p: Product) => {
    if (p.sizes.length < 2 || (p.gender !== "mixte" && p.gender !== ctx.user.gender)) return null;
    const r = recommendSizeFor(ctx, p.id);
    return "erreur" in r ? null : r.size;
  };

  return (
    <Screen>
      <div className="px-5 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{connected.length} marque{connected.length > 1 ? "s" : ""} connectée{connected.length > 1 ? "s" : ""} · à votre taille</p>
            <h1 className="mt-1 font-display text-[28px] leading-tight">Catalogue</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/boutiques" aria-label="Gérer mes marques" className="tap flex size-10 items-center justify-center rounded-full bg-white"><Settings2 className="size-[18px]" strokeWidth={1.6} /></Link>
            <CartButton dark />
          </div>
        </div>
        {connected.length > 0 && (
          <label className="mt-4 flex h-10 items-center gap-2 rounded-full bg-white px-3.5">
            <Search className="size-4 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chemise, chino, derby…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-mute" />
            {q && <button aria-label="Effacer" onClick={() => setQ("")}><X className="size-3.5 text-mute" /></button>}
          </label>
        )}
      </div>

      {connected.length === 0 ? (
        <div className="mx-5 mt-6 rounded-2xl bg-white p-6 text-center">
          <p className="font-display text-[18px] leading-tight">Aucune marque connectée</p>
          <p className="mt-2 text-[13px] text-mute">Connectez vos boutiques pour voir leurs articles, à votre taille.</p>
          <Link href="/boutiques" className="tap mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[13.5px] font-medium text-paper">Connecter mes boutiques</Link>
        </div>
      ) : (
        <>
          <div className="mx-5 mt-3 grid grid-cols-3 gap-1 rounded-full bg-white p-1 text-[12.5px]">
            {(["femme", "homme", "tous"] as const).map((r) => (
              <button key={r} onClick={() => { setRayon(r); setCat(null); }} className={cn("tap rounded-full py-1.5 transition", rayon === r ? "bg-ink text-paper" : "text-mute")}>{r === "femme" ? "Femme" : r === "homme" ? "Homme" : "Tout"}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
            <button onClick={() => { setBrand(null); setCat(null); }} className={cn("tap flex h-12 shrink-0 items-center rounded-2xl border px-4 text-[12.5px]", !brand ? "border-ink bg-ink text-paper" : "border-line bg-white")}>Toutes</button>
            {connected.map((id) => (
              <button key={id} onClick={() => { setBrand(brand === id ? null : id); setCat(null); }} className={cn("tap flex h-12 shrink-0 items-center rounded-2xl border px-4", brand === id ? "border-ink bg-ink" : "border-line bg-white")}>
                <BrandLogo brand={brandById[id]} size={11} color={brand === id ? "#f5f2ec" : "#121212"} />
              </button>
            ))}
          </div>
          <div className="sticky top-0 z-20 flex gap-1.5 overflow-x-auto bg-paper/90 px-5 py-2 backdrop-blur no-scrollbar">
            <button onClick={() => setInBudget(!inBudget)} className={cn("tap shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px]", inBudget ? "border-rust bg-rust text-paper" : "border-rust/40 bg-white text-rust")}>≤ {budget} €</button>
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(cat === c ? null : c)} className={cn("tap shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px]", cat === c ? "border-ink bg-ink text-paper" : "border-line bg-white")}>{CATEGORY_LABELS[c]}</button>
            ))}
          </div>

          <motion.div layout className="grid grid-cols-2 gap-x-3 gap-y-5 px-5 pt-3">
            {shown.map((p) => {
              const sz = sizeOf(p);
              const stock = sz ? (p.sizes.find((s) => s.size === sz)?.stock ?? 0) : 1;
              return (
                <button key={p.id} onClick={() => setOpen(p)} className="tap group text-left">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-paper-2">
                    <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    {sz && <span className={cn("absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10.5px] font-medium backdrop-blur", stock ? "bg-paper/90 text-ink" : "bg-rust/90 text-paper")}>{stock ? `Votre taille : ${formatSize(sz)}` : `${formatSize(sz)} épuisé`}</span>}
                  </div>
                  <p className="mt-2 text-[10.5px] uppercase tracking-wider text-mute">{brandById[p.brandId].name}</p>
                  <p className="mt-0.5 text-[13px] font-medium leading-tight">{p.name}</p>
                  <p className="mt-0.5 text-[12.5px]">{formatPrice(p.price)}</p>
                </button>
              );
            })}
          </motion.div>
          {!shown.length && <p className="px-5 py-12 text-center text-[13px] text-mute">Aucun article ne correspond.</p>}
          {brands.length > connected.length && (
            <Link href="/boutiques" className="mx-5 mt-8 block rounded-2xl border border-dashed border-line p-4 text-center text-[12.5px] text-mute">
              {brands.length - connected.length} autre{brands.length - connected.length > 1 ? "s" : ""} marque{brands.length - connected.length > 1 ? "s" : ""} disponible{brands.length - connected.length > 1 ? "s" : ""} : <span className="font-medium text-ink underline underline-offset-2">connecter</span>
            </Link>
          )}
        </>
      )}
      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}
