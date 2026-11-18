"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Lock, RotateCw, Star, Truck, Undo2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProductBuy } from "@/components/product-sheet";
import { CartButton } from "@/components/checkout";
import { brandById, formatPrice, productById, products } from "@/lib/data";
import { APP_NAME } from "@/lib/config";

/** Fiche article « sur le site de la marque », ouverte dans le navigateur intégré de l'app. */
export default function BrandSite() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const p = productById[id];
  if (!p) return null;
  const brand = brandById[p.brandId];
  const seen = new Set<string>([p.image]);
  const more = products.filter((x) => x.brandId === p.brandId && x.category === p.category && !seen.has(x.image) && seen.add(x.image)).slice(0, 4);
  const slug = brand.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "");

  return (
    <div className="absolute inset-0 flex flex-col bg-white" style={{ paddingTop: "var(--top)" }}>
      {/* barre du navigateur intégré */}
      <div className="flex items-center gap-2 border-b border-line bg-paper px-3 pb-2 pt-1">
        <button onClick={() => router.back()} className="tap flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[13px] font-medium"><ChevronLeft className="size-4" /> {APP_NAME}</button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[12px] text-mute">
          <Lock className="size-3 shrink-0" /><span className="truncate">{slug} · boutique officielle</span>
        </div>
        <RotateCw className="size-4 text-mute" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: "calc(var(--bottom) + 16px)" }}>
        <header className="flex items-center justify-between px-5 py-4" style={{ background: brand.color }}>
          <BrandLogo brand={brand} size={14} color={brand.ink} />
          <CartButton />
        </header>
        <p className="px-5 pt-3 text-[11px] text-mute">Accueil / {p.subcategory} / {p.name}</p>
        <img src={p.image} alt={p.name} className="mt-3 aspect-[4/5] w-full object-cover" />
        <div className="px-5 pt-5">
          <h1 className="text-[22px] font-semibold leading-tight">{p.name}</h1>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="text-[20px] font-semibold">{formatPrice(p.price)}</span>
            <span className="flex items-center gap-1 text-[12.5px] text-mute"><Star className="size-3.5 fill-current" /> {p.rating.toString().replace(".", ",")} ({p.reviews} avis)</span>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink/85">{p.description}</p>
          <p className="mt-2 text-[12px] text-mute">{p.material} · {p.fit} · Réf. {p.ref}</p>
          <div className="mt-5 rounded-2xl bg-paper p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-mute">Connecté avec {APP_NAME} : votre taille est présélectionnée</p>
            <ProductBuy p={p} compact />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px] text-mute">
            <p className="flex items-center gap-1.5 rounded-2xl bg-paper px-3 py-2.5"><Truck className="size-4 shrink-0" /> Livraison offerte dès 60 €</p>
            <p className="flex items-center gap-1.5 rounded-2xl bg-paper px-3 py-2.5"><Undo2 className="size-4 shrink-0" /> Retours sous 30 jours</p>
          </div>
          {more.length > 0 && (
            <>
              <p className="mt-7 text-[13px] font-semibold">Vous aimerez aussi</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {more.map((m) => (
                  <button key={m.id} onClick={() => router.replace(`/site/${m.id}`)} className="text-left">
                    <img src={m.image} alt={m.name} className="aspect-[4/5] w-full rounded-xl object-cover" />
                    <p className="mt-1.5 text-[12px] font-medium leading-tight">{m.name}</p>
                    <p className="text-[12px] text-mute">{formatPrice(m.price)}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
