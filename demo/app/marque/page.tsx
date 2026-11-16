"use client";

import Link from "next/link";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Leaf, Lightbulb, Ruler, ShoppingBag, Undo2, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dashboard from "@/data/brand-dashboard.json";
import { brandById, productById, formatPrice } from "@/lib/data";
import { BrandLogo } from "@/components/brand-logo";
import { APP_NAME } from "@/lib/config";

/** Palette validée (scripts dataviz) : app = bleu, moyenne marque = terracotta. */
const APP = "#3f6fb5";
const BRAND = "#c0623a";
const INK = "#121212";
const MUTED = "#847f76";
const GRID = "#ebe6dd";

const d = dashboard;
const k = d.kpis;
const brand = brandById.verac;
const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const costPerReturn = k.costPerReturn + k.averageBasket * k.markdownRate;
const savings = k.returnsAvoided * costPerReturn;
const annualCost = k.subscription.monthly * 12 + (k.revenueViaApp * k.subscription.commission) / 100;
const margin = k.revenueViaApp * k.contributionMargin;
const roi = (savings + margin) / annualCost;
const tooltipStyle = { borderRadius: 12, border: "1px solid #e3ddd2", boxShadow: "0 8px 24px -12px rgba(0,0,0,.25)", fontSize: 12 };

export default function Marque() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-6 py-4">
          <Link href="/profil" className="flex items-center gap-1.5 text-[13px] text-mute hover:text-ink"><ArrowLeft className="size-4" /> App</Link>
          <span className="h-5 w-px bg-line" />
          <span className="font-display text-[16px] font-semibold">{APP_NAME}<span className="text-rust">.</span> <span className="font-sans text-[13px] font-normal text-mute">for Brands</span></span>
          <span className="ml-auto flex items-center gap-3">
            <span className="hidden text-[12px] text-mute sm:inline">{d.period} · données anonymisées et agrégées</span>
            <span className="flex h-9 items-center rounded-full px-4" style={{ background: brand.color }}><BrandLogo brand={brand} size={11} color={brand.ink} /></span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Tableau de bord partenaire · {k.subscription.plan}</p>
            <h1 className="mt-2 font-display text-[33px] leading-tight">Bonjour, {brand.name}.</h1>
            <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-mute">
              Vos clients connectés à {APP_NAME} achètent la bonne taille et des pièces qui complètent ce qu&apos;ils possèdent déjà. Résultat : un taux de retour divisé par {(k.returnRateBrand / k.returnRateApp).toFixed(1).replace(".", ",")}.
            </p>
          </div>
        </div>

        {/* Indicateurs clés */}
        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={<Users className="size-4" />} label="Clients connectés" value={k.connectedMembers.toLocaleString("fr-FR")} delta={`+${pct(k.connectedGrowth)} sur 30 jours`} up />
          <Kpi icon={<ShoppingBag className="size-4" />} label="Ventes générées via l'app" value={eur(k.revenueViaApp)} delta={`${k.ordersViaApp.toLocaleString("fr-FR")} commandes · panier ${eur(k.averageBasket)} (vs ${eur(k.averageBasketBrand)})`} up />
          <Kpi icon={<Undo2 className="size-4" />} label="Taux de retour (ventes via l'app)" value={pct(k.returnRateApp)} delta={`vs ${pct(k.returnRateBrand)} en moyenne chez vous`} down good />
          <Kpi icon={<Ruler className="size-4" />} label="Précision des tailles recommandées" value={pct(k.sizePrecision)} delta="article gardé dans la taille conseillée" up />
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl bg-ink p-6 text-paper lg:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-paper/60">Retours évités sur 12 mois</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-10 gap-y-4">
              <div><p className="font-display text-[41px] leading-tight">{k.returnsAvoided.toLocaleString("fr-FR")}</p><p className="mt-1 text-[12.5px] text-paper/60">retours évités</p></div>
              <div><p className="font-display text-[41px] leading-tight">{eur(savings)}</p><p className="mt-1 text-[12.5px] text-paper/60">économisés : {eur(costPerReturn)} par retour ({eur(k.costPerReturn)} de logistique + {Math.round(k.markdownRate * 100)} % de démarque)</p></div>
              <div><p className="flex items-center gap-2 font-display text-[30px] leading-tight"><Leaf className="size-6" />{(Math.round((k.returnsAvoided * k.co2PerReturnKg) / 100) / 10).toLocaleString("fr-FR")} t</p><p className="mt-1 text-[12.5px] text-paper/60">de CO₂ évitées</p></div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6">
            <p className="eyebrow">Votre abonnement</p>
            <p className="mt-3 font-display text-[25px] leading-tight">{eur(k.subscription.monthly)}<span className="font-sans text-[13px] text-mute"> / mois</span></p>
            <p className="mt-1 text-[12.5px] text-mute">+ {k.subscription.commission} % de commission sur les ventes générées</p>
            <div className="mt-4 border-t border-line pt-4 text-[13px]">
              <div className="flex justify-between"><span className="text-mute">Coût annuel (abonnement + commission)</span><span>{eur(annualCost)}</span></div>
              <div className="mt-1.5 flex justify-between"><span className="text-mute">Marge sur ventes générées</span><span>{eur(margin)}</span></div>
              <div className="mt-1.5 flex justify-between"><span className="text-mute">Retours évités</span><span>{eur(savings)}</span></div>
              <div className="mt-1.5 flex justify-between font-semibold"><span>Retour sur investissement</span><span className="text-ok">× {roi.toFixed(1).replace(".", ",")}</span></div>
              <p className="mt-2 text-[11px] text-mute">Marge contributive estimée à {Math.round(k.contributionMargin * 100)} % des ventes générées.</p>
            </div>
          </div>
        </section>

        {/* Graphiques */}
        <section className="mt-3 grid gap-3 lg:grid-cols-2">
          <ChartCard title="Clients connectés" sub="Comptes reliés à votre boutique, fin de mois">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={d.series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={APP} stopOpacity={0.22} /><stop offset="100%" stopColor={APP} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: MUTED }} />
                <YAxis tickLine={false} axisLine={false} width={44} tick={{ fontSize: 11, fill: MUTED }} tickFormatter={(v) => `${(v / 1000).toLocaleString("fr-FR")} k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toLocaleString("fr-FR"), "Clients connectés"]} cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="members" stroke={APP} strokeWidth={2} fill="url(#g1)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ventes générées via l'app" sub="Chiffre d'affaires mensuel, en euros">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.series} margin={{ top: 18, right: 8, left: 0, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: MUTED }} />
                <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 11, fill: MUTED }} tickFormatter={(v) => `${Math.round(v / 1000)} k€`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [eur(Number(v)), "Ventes via l'app"]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="revenue" fill={APP} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="revenue" position="top" content={(p) => (p.index === d.series.length - 1 ? <text x={Number(p.x) + Number(p.width) / 2} y={Number(p.y) - 6} textAnchor="middle" fontSize={11} fill={INK}>{eur(Number(p.value))}</text> : null)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Taux de retour" sub="Ventes via l'app vs moyenne de la marque, en %" legend={[["Ventes via l'app", APP], ["Moyenne de la marque", BRAND]]}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d.series} margin={{ top: 10, right: 46, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: MUTED }} />
                <YAxis tickLine={false} axisLine={false} width={44} domain={[0, 35]} ticks={[0, 10, 20, 30]} tick={{ fontSize: 11, fill: MUTED }} tickFormatter={(v) => `${v} %`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [pct(Number(v)), n === "returnRateApp" ? "Via l'app" : "Moyenne marque"]} cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} />
                <Line type="monotone" dataKey="returnRateBrand" stroke={BRAND} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}>
                  <LabelList dataKey="returnRateBrand" content={(p) => (p.index === d.series.length - 1 ? <text x={Number(p.x) + 6} y={Number(p.y) + 4} fontSize={11} fill={INK}>{pct(Number(p.value))}</text> : null)} />
                </Line>
                <Line type="monotone" dataKey="returnRateApp" stroke={APP} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}>
                  <LabelList dataKey="returnRateApp" content={(p) => (p.index === d.series.length - 1 ? <text x={Number(p.x) + 6} y={Number(p.y) + 4} fontSize={11} fill={INK}>{pct(Number(p.value))}</text> : null)} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Motifs de retour" sub="Part de chaque motif, pour 100 ventes" legend={[["Ventes via l'app", APP], ["Moyenne de la marque", BRAND]]}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.returnReasons} layout="vertical" margin={{ top: 4, right: 30, left: 8, bottom: 0 }} barGap={2} barCategoryGap={10}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: MUTED }} tickFormatter={(v) => `${v}`} />
                <YAxis type="category" dataKey="reason" tickLine={false} axisLine={false} width={108} tick={{ fontSize: 11.5, fill: INK }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} pour 100 ventes`, n === "app" ? "Via l'app" : "Moyenne marque"]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="brand" fill={BRAND} radius={[0, 4, 4, 0]} barSize={9} />
                <Bar dataKey="app" fill={APP} radius={[0, 4, 4, 0]} barSize={9} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 lg:col-span-2">
            <h2 className="font-display text-[19px] leading-tight">Insights clients</h2>
            <p className="text-[12.5px] text-mute">Calculés sur les dressings de vos {k.connectedMembers.toLocaleString("fr-FR")} clients connectés ayant accepté le partage anonymisé.</p>
            <ul className="mt-4 divide-y divide-line">
              {d.insights.map((i) => (
                <li key={i.text} className="flex gap-5 py-4">
                  <span className="w-[84px] shrink-0 font-display text-[22px] leading-tight">{i.value}</span>
                  <div>
                    <p className="text-[14px] leading-snug">{i.text}</p>
                    <p className="mt-1 flex items-start gap-1.5 text-[12.5px] text-mute"><Lightbulb className="mt-0.5 size-3.5 shrink-0 text-rust" />{i.action}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-6">
              <h2 className="font-display text-[16px]">Précision des tailles</h2>
              <ul className="mt-4 space-y-3">
                {d.sizeAccuracy.map((s) => (
                  <li key={s.category}>
                    <div className="flex justify-between text-[12.5px]"><span>{s.category}</span><span className="font-medium tabular-nums">{pct(s.precision)}</span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full" style={{ width: `${s.precision}%`, background: APP }} /></div>
                    <p className="mt-1 text-[11px] text-mute">{pct(s.returnsSize)} de retours pour taille</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-6">
              <h2 className="font-display text-[16px]">Meilleures ventes via l&apos;app</h2>
              <ul className="mt-3 space-y-2.5">
                {d.topProducts.map((t) => {
                  const p = productById[t.productId];
                  return (
                    <li key={t.productId} className="flex items-center gap-3">
                      <img src={p.image} alt="" className="size-11 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-medium">{p.name}</p><p className="text-[11px] text-mute">{t.sales} ventes · {t.viaRecommendation} % sur recommandation</p></div>
                      <span className="text-[12px] tabular-nums text-mute">{formatPrice(p.price)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <details className="mt-3 rounded-2xl bg-white p-6 text-[13px]">
          <summary className="cursor-pointer font-medium">Voir les données en tableau</summary>
          <table className="mt-4 w-full text-left tabular-nums">
            <thead className="text-[11px] uppercase tracking-wider text-mute"><tr><th className="py-2">Mois</th><th>Clients connectés</th><th>Commandes</th><th>Ventes</th><th>Retour via l&apos;app</th><th>Retour moyen</th></tr></thead>
            <tbody>{d.series.map((s) => <tr key={s.month} className="border-t border-line"><td className="py-2">{s.month}</td><td>{s.members.toLocaleString("fr-FR")}</td><td>{s.orders}</td><td>{eur(s.revenue)}</td><td>{pct(s.returnRateApp)}</td><td>{pct(s.returnRateBrand)}</td></tr>)}</tbody>
          </table>
        </details>
        <p className="mt-6 text-center text-[11.5px] text-mute">Démo : marque et chiffres fictifs, générés de façon cohérente par scripts/generate-data.ts.</p>
      </div>
    </main>
  );
}

function Kpi({ icon, label, value, delta, up, down, good }: { icon: React.ReactNode; label: string; value: string; delta: string; up?: boolean; down?: boolean; good?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <p className="flex items-center gap-2 text-[12px] text-mute">{icon}{label}</p>
      <p className="mt-3 font-display text-[30px] leading-tight tabular-nums">{value}</p>
      <p className={`mt-2 flex items-center gap-1 text-[12px] ${up || good ? "text-ok" : "text-mute"}`}>{up && <ArrowUpRight className="size-3.5" />}{down && <ArrowDownRight className="size-3.5" />}{delta}</p>
    </div>
  );
}

function ChartCard({ title, sub, legend, children }: { title: string; sub: string; legend?: [string, string][]; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="font-display text-[16px] leading-tight">{title}</h2><p className="text-[12px] text-mute">{sub}</p></div>
        {legend && <div className="flex gap-3 text-[11.5px]">{legend.map(([l, c]) => <span key={l} className="flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full" style={{ background: c }} />{l}</span>)}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
