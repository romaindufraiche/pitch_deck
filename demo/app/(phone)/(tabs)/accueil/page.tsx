"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shirt, CalendarDays } from "lucide-react";
import { WeatherIcon } from "@/components/weather-icon";
import { Screen } from "@/components/screen";
import { Logo } from "@/components/logo";
import { EnrichCard } from "@/components/enrich-card";
import { usePersona, useToday, useToolContext, useWardrobe } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { weather } from "@/lib/data";
import { calendar, cap, longDate, relativeDay, addDays } from "@/lib/time";
import { wardrobeStats } from "@/lib/wardrobe";
import { buildScenario } from "@/lib/scenarios";

const LOOKS_LEA = [
  { img: "/images/px/lkf-street-cargo.jpg", title: "Cargo et crop", text: "Le streetwear du week-end, en neutres." },
  { img: "/images/px/lkf-beige-suit.jpg", title: "Le tailleur beige", text: "Gilet et pantalon, avec un sac en cuir." },
  { img: "/images/px/lkf-white-blazer.jpg", title: "Blazer blanc", text: "Sur un jean brut, pour le bureau." },
  { img: "/images/px/lkf-run.jpg", title: "Course du dimanche", text: "Legging et haut technique." },
];
const LOOKS = [
  { img: "/images/px/lk-camel-street.jpg", title: "Le manteau camel", text: "Sur un col roulé marine et un jean brut." },
  { img: "/images/px/lk-navy-blazer.jpg", title: "Bureau, sans cravate", text: "Blazer marine, chemise bleu ciel, pochette." },
  { img: "/images/px/lk-wedding.jpg", title: "Cérémonie", text: "Gris clair et nœud papillon ivoire." },
  { img: "/images/px/lk-travel.jpg", title: "48 heures", text: "Un sac week-end, trois tenues." },
];

export default function Accueil() {
  const today = useToday();
  const items = useWardrobe();
  const user = usePersona();
  const ctx = useToolContext();
  const firstName = useStore((s) => s.profile.firstName) || user.firstName;
  const override = useStore((s) => s.override);
  const [worn, setWorn] = useState(false);
  const events = calendar(today).filter((e) => e.dayOffset >= 0 && e.dayOffset <= 7);
  const next = events[0];
  const w0 = weather.days[0];
  const w1 = weather.days[1];
  const stats = wardrobeStats(items);
  const laundry = items.filter((i) => i.status !== "disponible");
  const look = useMemo(() => buildScenario("today", ctx), [ctx]);
  const lookCard = look.parts.find((p) => "card" in p && p.card.type === "outfit");
  const lookPieces = lookCard && "card" in lookCard && lookCard.card.type === "outfit" ? lookCard.card.pieces.map((p) => items.find((i) => i.id === p.itemId)).filter(Boolean) : [];

  return (
    <Screen>
      <div className="flex items-center justify-between px-5 pt-2">
        <Logo size={24} />
        <Link href="/profil"><img src={user.avatar} alt="" className="size-9 rounded-full object-cover ring-1 ring-line" /></Link>
      </div>
      <div className="px-5 pt-6">
        <p className="eyebrow">{cap(longDate(today))}</p>
        <h1 className="mt-1.5 font-display text-[30px] leading-tight">Bonjour {firstName}.</h1>
      </div>

      <div className="mt-5 flex gap-2 px-5">
        {[w0, w1].map((w, k) => (
          <div key={k} className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-3.5 py-3">
            <WeatherIcon c={w.condition} />
            <div className="leading-tight">
              <p className="text-[11px] text-mute">{k === 0 ? "Aujourd'hui" : "Demain"} · Paris</p>
              <p className="text-[14px] font-medium">{w.tempMax} °C, {w.condition}</p>
            </div>
          </div>
        ))}
      </div>

      {next && (
        <div className="px-5 pt-3">
          <div className="overflow-hidden rounded-2xl bg-ink text-paper">
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-paper/60"><CalendarDays className="size-3.5" /> {next.label}{next.time ? ` · ${next.time.replace(":", " h ")}` : ""}</p>
              <p className="mt-2 font-display text-[18px] leading-tight">{next.title}</p>
              <p className="mt-1.5 text-[12.5px] text-paper/65">Dress code : {next.dressCode} · {next.dayOffset === 1 ? `${w1.tempMax} °C, ${w1.condition}` : relativeDay(today, next.date)}</p>
            </div>
            <Link href={`/assistant?q=${encodeURIComponent(user.id === "lea" ? "Demain j'ai une présentation chez Orsay Conseil, prépare-moi une tenue." : "Demain j'ai un rendez-vous chez Orsay Conseil, prépare-moi une tenue.")}`} className="flex items-center justify-between border-t border-paper/10 px-5 py-3.5 text-[13.5px] font-medium">
              Préparer ma tenue <ArrowRight className="size-4" />
            </Link>
          </div>
          {events.length > 1 && (
            <ul className="mt-2 space-y-1.5">
              {events.slice(1, 4).map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-[12.5px]">
                  <span className="truncate"><b className="font-medium">{e.label}</b> · {e.title}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10.5px] text-mute">{e.dressCode}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {lookPieces.length > 0 && (
        <section className="px-5 pt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[18px]">Tenue du jour</h2>
            <span className="text-[12px] text-mute">{w0.tempMin}–{w0.tempMax} °C</span>
          </div>
          <div className="mt-3 rounded-2xl bg-white p-3">
            <div className="grid grid-cols-5 gap-1.5">
              {lookPieces.map((i) => (
                <Link key={i!.id} href={`/dressing/${i!.id}`}><img src={i!.image} alt={i!.name} className="aspect-[4/5] w-full rounded-xl object-cover" /></Link>
              ))}
            </div>
            <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-mute">{lookPieces.map((i) => i!.name).join(" · ")}</p>
            <button disabled={worn} onClick={() => { lookPieces.forEach((i) => override(i!.id, { wornToday: true })); setWorn(true); }} className="tap mt-3 h-10 w-full rounded-full bg-ink text-[13px] font-medium text-paper disabled:bg-ok">
              {worn ? "Noté pour aujourd'hui ✓" : "Je la porte aujourd'hui"}
            </button>
          </div>
        </section>
      )}

      <section className="px-5 pt-7">
        <h2 className="font-display text-[18px]">À compléter</h2>
        <div className="mt-3"><EnrichCard items={items} /></div>
      </section>

      <section className="pt-7">
        <h2 className="px-5 font-display text-[18px]">Inspirations</h2>
        <div className="mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {(user.id === "lea" ? LOOKS_LEA : LOOKS).map((l, k) => (
            <motion.div key={l.img} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.08 }} className="relative h-[270px] w-[210px] shrink-0 snap-start overflow-hidden rounded-2xl">
              <img src={l.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-paper">
                <p className="font-display text-[16px] leading-tight">{l.title}</p>
                <p className="mt-1 text-[11.5px] text-paper/80">{l.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-7">
        <Link href="/dressing" className="flex items-center gap-4 rounded-2xl bg-white p-4">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-paper"><Shirt className="size-5" strokeWidth={1.5} /></span>
          <div className="flex-1">
            <p className="text-[14px] font-medium">{stats.count} pièces · {stats.atLaundry} au linge ou au pressing</p>
            <p className="text-[12px] text-mute">{stats.notWorn90Pct} % de vos articles n&apos;ont pas été portés depuis 3 mois</p>
          </div>
          <ArrowRight className="size-4 text-mute" />
        </Link>
        {laundry.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {laundry.map((i) => (
              <Link key={i.id} href={`/dressing/${i.id}`} className="flex shrink-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[11.5px]">
                <img src={i.image} alt="" className="size-7 rounded-full object-cover" />{i.name} <span className="text-mute">· {i.status}</span>
              </Link>
            ))}
          </div>
        )}
        <p className="mt-6 text-center text-[11px] text-mute">Prévisions pour {longDate(addDays(today, 1))} : {w1.tempMin}–{w1.tempMax} °C, pluie {w1.rainProb} %</p>
      </section>
    </Screen>
  );
}
