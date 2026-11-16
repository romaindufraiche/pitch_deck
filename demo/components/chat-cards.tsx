"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, Luggage, Package, Ruler, ShoppingBag, WashingMachine } from "lucide-react";
import type { Card, LaundryCard, OutfitCard, PackingCard, PurchaseCard } from "@/lib/cards";
import type { DerivedItem } from "@/lib/wardrobe";
import { brandById, formatPrice, formatSize, productById } from "@/lib/data";
import { BrandLogo } from "./brand-logo";
import { Sheet } from "./sheet";
import { useStore } from "@/lib/store";
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
  return (
    <div className="overflow-hidden rounded-[22px] bg-white">
      <div className="px-4 pb-3 pt-3.5">
        <p className="font-display text-[22px] leading-tight">{card.title}</p>
        {card.subtitle && <p className="mt-0.5 text-[11.5px] text-mute">{card.subtitle}</p>}
      </div>
      <FlatLay pieces={pieces} />
      <ul className="divide-y divide-line px-4">
        {pieces.map((p) => {
          const body = (
            <>
              <span className="w-[74px] shrink-0 text-[10.5px] uppercase tracking-wider text-mute">{p.role}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{p.name}</span><span className="block truncate text-[11px] text-mute">{p.brand}</span></span>
              {p.buy ? <span className="text-[12px] font-medium text-rust">{formatPrice(p.buy.price)}</span> : <ArrowRight className="size-3.5 text-mute" />}
            </>
          );
          return <li key={p.key}>{p.href ? <Link href={p.href} className="flex items-center gap-2 py-2.5">{body}</Link> : <div className="flex items-center gap-2 py-2.5">{body}</div>}</li>;
        })}
      </ul>
      <p className="border-t border-line px-4 py-3 text-[12.5px] leading-relaxed text-ink/80">{card.explanation}</p>
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

function Checkout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useStore((s) => s.cart);
  const placeOrder = useStore((s) => s.placeOrder);
  const [done, setDone] = useState<{ id: string; total: number; brands: string[] } | null>(null);
  const [paying, setPaying] = useState(false);
  const lines = cart.map((c) => ({ ...c, p: productById[c.productId] })).filter((l) => l.p);
  const total = lines.reduce((s, l) => s + l.p.price, 0);
  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const id = `MV-26-${String(51000 + Math.floor(Math.random() * 8999)).padStart(6, "0")}`;
      placeOrder({ id, date: new Date().toISOString().slice(0, 10), lines: cart, total });
      setDone({ id, total, brands: [...new Set(lines.map((l) => brandById[l.p.brandId].name))] });
      setPaying(false);
    }, 1200);
  };
  return (
    <Sheet open={open} onClose={() => { onClose(); setTimeout(() => setDone(null), 300); }} title={done ? undefined : "Votre panier"}>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="px-6 pb-4 pt-8 text-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok text-paper"><Check className="size-8" /></motion.span>
            <p className="mt-5 font-display text-[30px] leading-tight">Commande confirmée</p>
            <p className="mt-2 text-[13px] text-mute">N° {done.id} · {formatPrice(done.total)}</p>
            <div className="mt-6 space-y-2 rounded-3xl bg-white p-4 text-left text-[12.5px]">
              <p className="flex items-center gap-2"><Package className="size-4 text-mute" /> Livraison prévue sous 2 à 3 jours ouvrés, à domicile.</p>
              <p className="flex items-center gap-2"><Ruler className="size-4 text-mute" /> Tailles transmises à {done.brands.join(", ")}.</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-mute" /> Les pièces apparaîtront dans votre dressing à la livraison.</p>
            </div>
            <button onClick={() => { onClose(); setTimeout(() => setDone(null), 300); }} className="tap mt-6 h-12 w-full rounded-full bg-ink text-[14px] font-medium text-paper">Revenir au styliste</button>
          </motion.div>
        ) : (
          <motion.div key="cart" className="px-5 pt-4">
            <ul className="space-y-2">
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-4">
                  <img src={l.p.image} alt="" className="size-14 rounded-xl object-cover" />
                  <div className="flex-1"><p className="text-[13px] font-medium">{l.p.name}</p><p className="text-[11.5px] text-mute">{brandById[l.p.brandId].name} · taille {formatSize(l.size)}</p></div>
                  <span className="text-[13px] tabular-nums">{formatPrice(l.p.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 rounded-2xl bg-white p-4 text-[13px]">
              <div className="flex justify-between"><span className="text-mute">Sous-total</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between"><span className="text-mute">Livraison</span><span>Offerte</span></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
            <p className="mt-3 text-[11.5px] text-mute">Paiement avec la carte enregistrée •••• 4421 · Livraison : 18 rue Oberkampf, 75011 Paris</p>
            <button disabled={paying || !lines.length} onClick={pay} className="tap mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-paper disabled:opacity-60">
              {paying ? <span className="size-4 animate-spin rounded-full border-2 border-paper border-t-transparent" /> : null}
              {paying ? "Paiement…" : `Payer ${formatPrice(total)}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
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
