"use client";

import Link from "next/link";
import { ChevronRight, Camera, LayoutDashboard, Presentation, ShieldCheck } from "lucide-react";
import { Screen } from "@/components/screen";
import { BrandMark } from "@/components/brand-logo";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { brands, orders, products, user, formatPrice, formatSize } from "@/lib/data";
import { recommendSize, usualSize } from "@/lib/sizing";
import { openPresentationMenu } from "@/components/presentation-menu";
import { APP_NAME } from "@/lib/config";
import type { Brand, Category } from "@/lib/types";

const SWATCH: Record<string, string> = { Marine: "#1F2A44", Gris: "#9A9DA1", Blanc: "#F7F6F2", Beige: "#C8B48F", "Vert olive": "#5E6440", Noir: "#141414", Camel: "#B08355", "Bleu ciel": "#AFC8E0", Bordeaux: "#6E1F2E", Marron: "#6B4428", Écru: "#EFE8DA", Terracotta: "#B5552D" };

function sizeAt(b: Brand, cats: Category[]) {
  const p = products.find((x) => x.brandId === b.id && cats.includes(x.category) && x.sizes.length > 2);
  if (!p) return "—";
  return formatSize(recommendSize(user, b, p.category, p.sizes.map((s) => s.size)).size);
}

export default function Profil() {
  const st = useStore();
  const name = st.profile.firstName || user.firstName;
  return (
    <Screen>
      <div className="flex flex-col items-center px-5 pt-6 text-center">
        <img src={user.avatar} alt="" className="size-24 rounded-full object-cover ring-4 ring-white" />
        <h1 className="mt-3 font-display text-[32px] font-medium leading-none">{name} {user.lastName}</h1>
        <p className="mt-1.5 text-[12.5px] text-mute">{st.profile.age} ans · {user.city} · {user.job.split(",")[0]}</p>
        <p className="mt-1 text-[12.5px] text-mute">{(st.profile.heightCm / 100).toFixed(2).replace(".", ",")} m · {st.profile.weightKg} kg · carrure {st.profile.build.toLowerCase()}</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 px-5">
        <div className="col-span-2 rounded-2xl bg-white p-3.5">
          <p className="eyebrow">Couleurs</p>
          <div className="mt-2 flex -space-x-1.5">{(st.colors.length ? st.colors : user.favoriteColors.map((c) => c.name)).map((c) => <span key={c} title={c} className="size-7 rounded-full border-2 border-white" style={{ background: SWATCH[c] ?? "#ccc" }} />)}</div>
        </div>
        <div className="rounded-2xl bg-white p-3.5">
          <p className="eyebrow">Budget</p>
          <p className="mt-1.5 font-display text-[24px] leading-none">{st.budget} €</p>
          <p className="text-[10.5px] text-mute">par mois</p>
        </div>
      </div>

      <section className="mt-6 px-5">
        <h2 className="font-display text-[24px]">Mes tailles par marque</h2>
        <p className="mt-1 text-[12px] text-mute">Calculées à partir de vos tailles habituelles (haut {usualSize(user, "lettres")}, col {usualSize(user, "col")}, W{user.reference.waist} L{user.reference.inseam}, pointure {formatSize(user.reference.shoe)}) et du guide de chaque marque.</p>
        <div className="mt-3 overflow-hidden rounded-3xl bg-white">
          <div className="grid grid-cols-[1fr_52px_62px_52px] gap-2 border-b border-line px-4 py-2.5 text-[10px] uppercase tracking-wider text-mute"><span>Marque</span><span className="text-center">Haut</span><span className="text-center">Bas</span><span className="text-center">Pied</span></div>
          {brands.map((b) => (
            <div key={b.id} className="grid grid-cols-[1fr_52px_62px_52px] items-center gap-2 border-b border-line/60 px-4 py-2.5 last:border-0">
              <span className="flex min-w-0 items-center gap-2.5"><BrandMark brand={b} size={28} /><span className="min-w-0"><span className="block truncate text-[12.5px] font-medium">{b.name}</span><span className="block text-[10.5px] text-mute">{b.sizeGuide.summary}</span></span></span>
              <span className="text-center text-[13px] font-medium">{sizeAt(b, ["chemises", "maille", "hauts", "vestes", "sport"])}</span>
              <span className="text-center text-[12px] font-medium">{sizeAt(b, ["pantalons"])}</span>
              <span className="text-center text-[13px] font-medium">{sizeAt(b, ["chaussures"])}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5">
        <h2 className="font-display text-[24px]">Mes données</h2>
        <div className="mt-3 divide-y divide-line rounded-3xl bg-white px-4">
          {([["wardrobe", "Données de garde-robe"], ["purchases", "Import de vos achats"], ["anonymized", "Partage anonymisé avec les marques"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center justify-between py-3.5 text-[13.5px]">{l}<Switch checked={st.consents[k]} onCheckedChange={(v) => st.setConsents({ [k]: v })} /></label>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 px-1 text-[11.5px] text-mute"><ShieldCheck className="size-3.5 text-ok" /> Export et suppression de vos données à tout moment (RGPD).</p>
      </section>

      <section className="mt-6 px-5">
        <h2 className="font-display text-[24px]">Commandes</h2>
        <div className="mt-3 divide-y divide-line rounded-3xl bg-white px-4 text-[13px]">
          {st.placedOrders.map((o) => <div key={o.id} className="flex justify-between py-3"><span>N° {o.id} <span className="text-mute">· via {APP_NAME}</span></span><span>{formatPrice(o.total)}</span></div>)}
          <div className="flex justify-between py-3"><span className="text-mute">{orders.filter((o) => st.connected.includes(o.brandId)).length} commandes importées de vos marques</span><span className="text-mute">18 mois</span></div>
        </div>
      </section>

      <section className="mt-6 space-y-2 px-5 pb-4">
        <Row href="/profil/credits" icon={<Camera className="size-4" />} label="Crédits photos" />
        <Row href="/marque" icon={<LayoutDashboard className="size-4" />} label="Espace marque (démo B2B)" />
        <button onClick={openPresentationMenu} className="tap flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-[13.5px]"><Presentation className="size-4" /><span className="flex-1">Mode présentation</span><kbd className="rounded bg-paper px-1.5 text-[10px] text-mute">Shift + D</kbd></button>
      </section>
    </Screen>
  );
}

function Row({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="tap flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-[13.5px]">{icon}<span className="flex-1">{label}</span><ChevronRight className="size-4 text-mute" /></Link>;
}
