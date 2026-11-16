"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, ExternalLink, Luggage, Ruler, ShoppingBag, WashingMachine } from "lucide-react";
import type { Card, LaundryCard, OutfitCard, PackingCard, PurchaseCard } from "@/lib/cards";
import type { DerivedItem } from "@/lib/wardrobe";
import { brandById, formatPrice, formatSize, productById } from "@/lib/data";
import { BrandLogo } from "./brand-logo";
import { Checkout } from "./checkout";
import { useStore } from "@/lib/store";
import { useToolContext } from "@/lib/hooks";
import { recommendSizeFor } from "@/lib/assistant-tools";
import { cn } from "@/lib/utils";

type Resolved = { key: string; role: string; name: string; brand: string; image: string; href?: string; buy?: { price: number; productId: string } };

function resolve(pieces: OutfitCard["pieces"], items: DerivedItem[]): Resolved[] {
  return pieces.flatMap((p, k): Resolved[] => {
    if (p.itemId) {
      const i = items.find((x) => x.id === p.itemId);
      return i ? [{ key: i.id + k, role: p.role, name: i.name, brand: i.brandName, image: i.image, href: `/dressing/${i.id}` }] : [];
    }
    const pr = p.productId ? productById[p.productId] : undefined;
    return pr ? [{ key: pr.id + k, role: p.role, name: pr.name, brand: brandById[pr.brandId].name, image: pr.image, buy: { price: pr.price, productId: pr.id } }] : [];
  });
}

/** Tenue composée en flat lay : les vraies photos des pièces, disposées comme sur une table. */
function FlatLay({ pieces }: { pieces: Resolved[] }) {
  const tilt = [-2.5, 2, -1.5, 3, -3, 1.5, -1];
  const cols = [pieces.filter((_, k) => k % 2 === 0), pieces.filter((_, k) => k % 2 === 1)];
  return (
    <div className="grid grid-cols-2 gap-2.5 bg-[#ebe6dd] p-3.5">
      {cols.map((col, c) => (
        <div key={c} className={cn("space-y-2.5", c === 1 && "pt-7")}>
          {col.map((p, k) => (
            <motion.div key={p.key} initial={{ opacity: 0, y: 14, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: tilt[(k * 2 + c) % tilt.length] }} transition={{ delay: (k * 2 + c) * 0.09, type: "spring", damping: 18 }} className="relative">
              <img src={p.image} alt={p.name} className={cn("w-full rounded-[10px] object-cover shadow-[0_10px_22px_-10px_rgba(0,0,0,0.45)] ring-[3px] ring-white", (k * 2 + c) % 3 === 0 ? "aspect-[4/5]" : "aspect-square")} />
              {p.buy && <span className="absolute left-2 top-2 rounded-full bg-rust px-2 py-0.5 text-[9.5px] font-semibold text-paper">À acheter</span>}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function OutfitView({ card, items }: { card: OutfitCard; items: DerivedItem[] }) {
  const pieces = resolve(card.pieces, items);
  const ctx = useToolContext();
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const [checkout, setCheckout] = useState(false);
  const buys = pieces.filter((p) => p.buy);
  const total = buys.reduce((s, p) => s + p.buy!.price, 0);
  const allIn = buys.length > 0 && buys.every((b) => cart.some((c) => c.productId === b.buy!.productId));
  const addAll = () => buys.forEach((b) => {
    const rec = recommendSizeFor(ctx, b.buy!.productId);
    addToCart({ productId: b.buy!.productId, size: "erreur" in rec ? productById[b.buy!.productId].sizes[0].size : rec.size });
  });
  return (
    <div className="overflow-hidden rounded-[22px] bg-white">
      <div className="flex items-start gap-3 px-4 pb-3 pt-3.5">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[22px] leading-tight">{card.title}</p>
          {card.subtitle && <p className="mt-0.5 text-[11.5px] text-mute">{card.subtitle}</p>}
        </div>
        {buys.length > 0 && <span className="shrink-0 rounded-full bg-rust-soft px-2.5 py-1 text-[12px] font-semibold text-rust">{formatPrice(total)}</span>}
      </div>
      <FlatLay pieces={pieces} />
      <ul className="divide-y divide-line px-4">
        {pieces.map((p) => {
          const body = (
            <>
              <span className="w-[74px] shrink-0 text-[10.5px] uppercase tracking-wider text-mute">{p.role}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{p.name}</span><span className="block truncate text-[11px] text-mute">{p.buy ? `${p.brand} · à acheter` : `${p.brand} · dans votre dressing`}</span></span>
              {p.buy ? <span className="text-[12px] font-medium text-rust">{formatPrice(p.buy.price)}</span> : <ArrowRight className="size-3.5 text-mute" />}
            </>
          );
          return (
            <li key={p.key}>
              {p.href ? <Link href={p.href} className="flex items-center gap-2 py-2.5">{body}</Link> : (
                <div className="py-2.5">
                  <div className="flex items-center gap-2">{body}</div>
                  <Link href={`/site/${p.buy!.productId}`} className="ml-[82px] mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium underline underline-offset-2">Voir sur le site <ExternalLink className="size-3" /></Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line px-4 py-3 text-[12.5px] leading-relaxed text-ink/80">{card.explanation}</p>
      {buys.length > 0 && (
        <div className="border-t border-line p-3.5">
          {card.budget ? <p className="mb-2.5 flex justify-between px-1 text-[12px] text-mute"><span>À acheter : {buys.length} pièce{buys.length > 1 ? "s" : ""}, à votre taille</span><span>{formatPrice(total)} / {formatPrice(card.budget)}</span></p> : null}
          {allIn ? (
            <button onClick={() => setCheckout(true)} className="tap flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ok text-[13.5px] font-medium text-paper"><CheckCircle2 className="size-4" /> Dans le panier · Commander</button>
          ) : (
            <button onClick={addAll} className="tap flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-medium text-paper"><ShoppingBag className="size-4" /> {buys.length > 1 ? "Tout ajouter au panier" : "Ajouter au panier"} · {formatPrice(total)}</button>
          )}
        </div>
      )}
      <Checkout open={checkout} onClose={() => setCheckout(false)} />
    </div>
  );
}

export function LaundryView({ card, items }: { card: LaundryCard; items: DerivedItem[] }) {
  const a = items.find((i) => i.id === card.unavailableId);
  const b = items.find((i) => i.id === card.replacementId);
  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-[#e7edf3] p-3">
      <div className="relative shrink-0">
        {a && <img src={a.image} alt="" className="size-14 rounded-2xl object-cover opacity-60 grayscale" />}
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#2c4a6b] text-paper"><WashingMachine className="size-3.5" /></span>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[#2c4a6b]" />
      {b && <img src={b.image} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />}
      <p className="text-[12.5px] leading-snug text-[#1f3550]">{card.message}</p>
    </div>
  );
}

export function PurchaseView({ card }: { card: PurchaseCard }) {
  const p = productById[card.productId];
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const [checkout, setCheckout] = useState(false);
  if (!p) return null;
  const brand = brandById[p.brandId];
  const inCart = cart.some((c) => c.productId === p.id);
  const conf = Math.round((card.confidence ?? 0.9) * 100);
  return (
    <div className="overflow-hidden rounded-[22px] bg-white">
      <div className="flex gap-3.5 p-3.5">
        <img src={p.image} alt={p.name} className="h-[132px] w-[106px] shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <BrandLogo brand={brand} size={11} />
          <p className="mt-1.5 text-[14.5px] font-medium leading-snug">{p.name}</p>
          <p className="mt-0.5 text-[11.5px] text-mute">{p.color.name} · {p.material.split(",")[0]}</p>
          <p className="mt-2 font-display text-[24px] leading-none">{formatPrice(p.price)}</p>
          <p className="mt-1 text-[11px] text-mute">{p.rating.toString().replace(".", ",")}/5 · {p.reviews} avis</p>
          <Link href={`/site/${p.id}`} className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium underline underline-offset-2">Voir sur le site <ExternalLink className="size-3" /></Link>
        </div>
      </div>
      <p className="px-4 text-[12.5px] leading-relaxed text-ink/80">{card.reason}</p>
      {card.size && (
        <div className="mx-3.5 mt-3 rounded-2xl bg-paper p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-mute"><Ruler className="size-3.5" /> Taille recommandée</span>
            <span className="font-display text-[30px] leading-none">{formatSize(card.size)}</span>
          </div>
          <p className="mt-2 text-[13px] font-medium leading-snug">{card.sizeHeadline}</p>
          {card.sizeReasons && card.sizeReasons.length > 1 && (
            <ul className="mt-1.5 space-y-1">{card.sizeReasons.slice(1).map((r) => <li key={r} className="flex gap-1.5 text-[11.5px] leading-snug text-mute"><Check className="mt-0.5 size-3 shrink-0 text-ok" />{r}</li>)}</ul>
          )}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><motion.div className="h-full rounded-full bg-ok" initial={{ width: 0 }} animate={{ width: `${conf}%` }} transition={{ duration: 0.8, delay: 0.2 }} /></div>
            <span className="text-[11.5px] font-medium tabular-nums text-ok">Confiance {conf} %</span>
          </div>
        </div>
      )}
      <div className="p-3.5">
        {inCart ? (
          <button onClick={() => setCheckout(true)} className="tap flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ok text-[13.5px] font-medium text-paper"><CheckCircle2 className="size-4" /> Dans le panier · Commander</button>
        ) : (
          <button onClick={() => addToCart({ productId: p.id, size: card.size ?? p.sizes[0].size })} className="tap flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-medium text-paper"><ShoppingBag className="size-4" /> Ajouter au panier · taille {formatSize(card.size ?? "")}</button>
        )}
      </div>
      <Checkout open={checkout} onClose={() => setCheckout(false)} />
    </div>
  );
}

export function PackingView({ card, items }: { card: PackingCard; items: DerivedItem[] }) {
  const [checked, setChecked] = useState<string[]>([]);
  const all = card.groups.flatMap((g, gi) => g.entries.map((e, ei) => `${gi}-${ei}`));
  return (
    <div className="overflow-hidden rounded-[22px] bg-white">
      <div className="flex items-center gap-3 bg-ink px-4 py-3.5 text-paper">
        <Luggage className="size-5" strokeWidth={1.5} />
        <div className="flex-1"><p className="font-display text-[21px] leading-tight">{card.title}</p>{card.subtitle && <p className="text-[11.5px] text-paper/60">{card.subtitle}</p>}</div>
        <span className="text-[12px] tabular-nums text-paper/70">{checked.length}/{all.length}</span>
      </div>
      <div className="h-1 bg-line"><motion.div className="h-full bg-ok" animate={{ width: `${(checked.length / Math.max(all.length, 1)) * 100}%` }} /></div>
      <div className="divide-y divide-line">
        {card.groups.map((g, gi) => (
          <div key={g.label} className="px-4 py-3">
            <p className="eyebrow">{g.label}</p>
            <ul className="mt-2 space-y-1.5">
              {g.entries.map((e, ei) => {
                const key = `${gi}-${ei}`;
                const on = checked.includes(key);
                const it = e.itemId ? items.find((i) => i.id === e.itemId) : undefined;
                return (
                  <li key={key}>
                    <button onClick={() => setChecked(on ? checked.filter((x) => x !== key) : [...checked, key])} className="tap flex w-full items-center gap-3 text-left">
                      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition", on ? "border-ok bg-ok text-paper" : "border-line")}>{on && <Check className="size-3.5" />}</span>
                      {it ? <img src={it.image} alt="" className="size-9 rounded-lg object-cover" /> : <span className="w-9 shrink-0" />}
                      <span className={cn("flex-1 text-[12.5px] leading-snug transition", on && "text-mute line-through")}>{e.label}</span>
                      {e.qty > 1 && <span className="text-[11.5px] tabular-nums text-mute">×{e.qty}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardView({ card, items }: { card: Card; items: DerivedItem[] }) {
  if (card.type === "outfit") return <OutfitView card={card} items={items} />;
  if (card.type === "laundry") return <LaundryView card={card} items={items} />;
  if (card.type === "purchase") return <PurchaseView card={card} />;
  return <PackingView card={card} items={items} />;
}
