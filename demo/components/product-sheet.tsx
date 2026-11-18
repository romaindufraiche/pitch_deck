"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, ExternalLink, Ruler, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { brandById, formatPrice, formatSize } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToolContext } from "@/lib/hooks";
import { recommendSizeFor } from "@/lib/assistant-tools";
import { BrandLogo } from "./brand-logo";
import { Sheet } from "./sheet";
import { Checkout } from "./checkout";
import { cn } from "@/lib/utils";

/** Taille recommandée pour un produit (moteur de tailles + historique). */
export function useRecommendation(p: Product | null) {
  const ctx = useToolContext();
  if (!p || p.sizes.length < 2) return null;
  const r = recommendSizeFor(ctx, p.id);
  return "erreur" in r ? null : r;
}

/** Bloc produit commun à la fiche du catalogue et à la page « site de la marque ». */
export function ProductBuy({ p, compact = false }: { p: Product; compact?: boolean }) {
  const rec = useRecommendation(p);
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const [size, setSize] = useState<string>(rec?.size ?? p.sizes[0].size);
  const [checkout, setCheckout] = useState(false);
  useEffect(() => setSize(rec?.size ?? p.sizes[0].size), [p.id, rec?.size, p.sizes]);
  const inCart = cart.some((c) => c.productId === p.id);
  const stock = p.sizes.find((s) => s.size === size)?.stock ?? 0;
  return (
    <div>
      {p.sizes.length > 1 && (
        <>
          <div className="flex items-baseline justify-between"><p className="eyebrow">Taille</p>{rec && <p className="text-[11.5px] text-mute">Recommandée : <b className="text-ink">{formatSize(rec.size)}</b></p>}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.sizes.map((s) => (
              <button key={s.size} disabled={!s.stock} onClick={() => setSize(s.size)} className={cn("tap relative min-w-11 rounded-xl border px-2.5 py-2 text-[12.5px] transition disabled:text-mute/50 disabled:line-through", size === s.size ? "border-ink bg-ink text-paper" : "border-line bg-white")}>
                {formatSize(s.size)}
                {rec?.size === s.size && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-ok ring-2 ring-paper" />}
              </button>
            ))}
          </div>
          {rec && (
            <div className="mt-3 rounded-2xl bg-white p-3.5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium leading-snug"><Ruler className="size-3.5 shrink-0" /> {rec.headline}</p>
              {!compact && rec.reasons.slice(1).map((r) => <p key={r} className="mt-1 flex gap-1.5 text-[11.5px] leading-snug text-mute"><Check className="mt-0.5 size-3 shrink-0 text-ok" />{r}</p>)}
              <p className="mt-1.5 text-[11px] font-medium text-ok">Confiance {Math.round(rec.confidence * 100)} %</p>
            </div>
          )}
          <p className={cn("mt-2 text-[11.5px]", stock ? "text-ok" : "text-rust")}>{stock ? (stock < 4 ? `Plus que ${stock} en stock dans cette taille` : "En stock, expédié sous 24 h") : "Épuisé dans cette taille"}</p>
        </>
      )}
      <div className="mt-4 space-y-2">
        {inCart ? (
          <button onClick={() => setCheckout(true)} className="tap flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ok text-[14px] font-medium text-paper"><CheckCircle2 className="size-4" /> Dans le panier · Commander</button>
        ) : (
          <button disabled={!stock && p.sizes.length > 1} onClick={() => addToCart({ productId: p.id, size })} className="tap flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-paper disabled:opacity-50"><ShoppingBag className="size-4" /> Ajouter au panier · {formatPrice(p.price)}</button>
        )}
      </div>
      <Checkout open={checkout} onClose={() => setCheckout(false)} />
    </div>
  );
}

export function ProductSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <Sheet open={!!product} onClose={onClose} full>
      {product && (
        <div>
          <img src={product.image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
          <div className="px-5 pt-5">
            <BrandLogo brand={brandById[product.brandId]} size={12} />
            <h2 className="mt-2 font-display text-[22px] leading-tight">{product.name}</h2>
            <div className="mt-1 flex items-center gap-3 text-[13px]">
              <span className="font-display text-[18px]">{formatPrice(product.price)}</span>
              <span className="flex items-center gap-1 text-mute"><Star className="size-3.5 fill-current" /> {product.rating.toString().replace(".", ",")} · {product.reviews} avis</span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink/85">{product.description}</p>
            <div className="mt-4 divide-y divide-line rounded-2xl bg-white px-4 text-[12.5px]">
              <div className="flex justify-between gap-4 py-2.5"><span className="text-mute">Couleur</span><span className="flex items-center gap-1.5"><span className="size-3 rounded-full border border-line" style={{ background: product.color.hex }} />{product.color.name}{product.otherColors.length ? ` · +${product.otherColors.length} coloris` : ""}</span></div>
              <div className="flex justify-between gap-4 py-2.5"><span className="text-mute">Matière</span><span className="text-right">{product.material}</span></div>
              <div className="flex justify-between gap-4 py-2.5"><span className="text-mute">Coupe</span><span className="text-right">{product.fit}</span></div>
              <div className="flex justify-between gap-4 py-2.5"><span className="text-mute">Référence</span><span>{product.ref}</span></div>
            </div>
            <div className="mt-5"><ProductBuy p={product} /></div>
            <Link href={`/site/${product.id}`} className="tap mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-[14px]">Voir sur le site {brandById[product.brandId].name} <ExternalLink className="size-4" /></Link>
          </div>
        </div>
      )}
    </Sheet>
  );
}
