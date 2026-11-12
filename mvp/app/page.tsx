"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BRANDS, CATALOG, DEMO_WARDROBE, SAMPLE_EMAILS, type Category, type Product, type WardrobeItem } from "@/lib/catalog";
import { productToWardrobe, type Outfit, type StylistResponse } from "@/lib/engine";

type Tab = "stylist" | "wardrobe" | "connect";
type Msg = { role: "user" | "assistant"; content: string; outfits?: Outfit[] };

const ICON: Record<Category, string> = { haut: "👕", bas: "👖", chaussures: "👟", veste: "🧥", accessoire: "👜" };
const CATEGORY_LABEL: Record<Category, string> = { haut: "Hauts", bas: "Bas", chaussures: "Chaussures", veste: "Vestes", accessoire: "Accessoires" };
const STORAGE_KEY = "dressr.wardrobe.v1";

const SUGGESTIONS = [
  "J'ai un date ce soir, je veux une tenue pour 100 €",
  "Je ne sais jamais quoi mettre avec mon chino : trouve-moi trois hauts différents pour 80 €",
  "Une tenue pour un entretien d'embauche, budget 150 €",
  "Je n'ai rien à me mettre : une tenue de soirée de zéro pour 200 €",
];

const eur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

function Swatch({ hex, category }: { hex: string; category: Category }) {
  return <div className="swatch" style={{ background: hex }}>{ICON[category]}</div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("stylist");
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setWardrobe(saved ? JSON.parse(saved) : DEMO_WARDROBE);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobe));
  }, [wardrobe, loaded]);

  const add = (items: WardrobeItem[]) => setWardrobe((w) => [...w, ...items]);
  const remove = (id: string) => setWardrobe((w) => w.filter((x) => x.id !== id));

  return (
    <div className="app">
      <header className="top">
        <div className="logo">Dressr<span>.</span></div>
        <div className="engine">{wardrobe.length} pièces · {new Set(wardrobe.map((w) => w.brand)).size} marques</div>
      </header>
      <main>
        {tab === "stylist" && <Stylist wardrobe={wardrobe} onBought={(p) => add([productToWardrobe(p, "import")])} />}
        {tab === "wardrobe" && <Wardrobe wardrobe={wardrobe} onRemove={remove} onAdd={add} onReset={() => setWardrobe(DEMO_WARDROBE)} />}
        {tab === "connect" && <Connect onAdd={(items) => { add(items); setTab("wardrobe"); }} />}
      </main>
      <nav className="tabs">
        <div className="tabs-inner">
          <button className={tab === "stylist" ? "on" : ""} onClick={() => setTab("stylist")}><b>✨</b>Styliste</button>
          <button className={tab === "wardrobe" ? "on" : ""} onClick={() => setTab("wardrobe")}><b>🚪</b>Mon dressing</button>
          <button className={tab === "connect" ? "on" : ""} onClick={() => setTab("connect")}><b>🔗</b>Mes marques</button>
        </div>
      </nav>
    </div>
  );
}

/* ───────────────────────── Styliste IA ───────────────────────── */

function Stylist({ wardrobe, onBought }: { wardrobe: WardrobeItem[]; onBought: (p: Product) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<string>("");
  const [bought, setBought] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history = msgs.map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, wardrobe }),
      });
      const data = (await res.json()) as StylistResponse;
      setEngine(data.engine);
      setMsgs((m) => [...m, { role: "assistant", content: data.reply, outfits: data.outfits }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Oups, je n'arrive pas à joindre le serveur. Réessaie dans un instant." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {msgs.length === 0 && (
        <>
          <h2>Que veux-tu porter aujourd'hui ?</h2>
          <p className="sub">Je pars de ton dressing et je te dis seulement ce qu'il te manque, dans ton budget.</p>
          <div className="chips">
            {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
          </div>
        </>
      )}
      {msgs.map((m, i) => (
        <div key={i}>
          <div className={`bubble ${m.role === "user" ? "user" : "bot"}`}>{m.content}</div>
          {m.outfits?.map((o, j) => (
            <OutfitCard key={j} outfit={o} bought={bought} onBuy={(p) => { onBought(p); setBought((b) => new Set(b).add(p.id)); }} />
          ))}
        </div>
      ))}
      {busy && <div className="typing">Dressr compose ta tenue…</div>}
      {engine === "demo" && msgs.length > 0 && (
        <p className="notice">Mode démo : moteur de règles sans IA. Ajoute une clé ANTHROPIC_API_KEY pour activer le styliste IA.</p>
      )}
      <div ref={endRef} style={{ height: 70 }} />
      <div className="composer">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex. une tenue à 100 € pour un date" />
          <button className="btn" disabled={busy || !input.trim()}>Envoyer</button>
        </form>
      </div>
    </>
  );
}

function OutfitCard({ outfit, bought, onBuy }: { outfit: Outfit; bought: Set<string>; onBuy: (p: Product) => void }) {
  return (
    <div className="card outfit">
      <h3>{outfit.title}</h3>
      <p className="why">{outfit.why}</p>
      {outfit.owned.map((w) => (
        <div className="item" key={w.id}>
          <Swatch hex={w.hex} category={w.category} />
          <div className="meta"><div className="name">{w.name}</div><div className="brand">{w.brand} · {w.color}</div></div>
          <span className="badge own">Dans ton dressing</span>
        </div>
      ))}
      {outfit.toBuy.map((p) => (
        <div className="item" key={p.id}>
          <Swatch hex={p.hex} category={p.category} />
          <div className="meta"><div className="name">{p.name}</div><div className="brand">{p.brand} · {p.color}</div></div>
          <div style={{ textAlign: "right" }}>
            <div className="price">{eur(p.price)}</div>
            <button className="btn small" disabled={bought.has(p.id)} onClick={() => onBuy(p)}>
              {bought.has(p.id) ? "Ajouté ✓" : `Acheter chez ${p.brand}`}
            </button>
          </div>
        </div>
      ))}
      <div className="total">
        <span>À acheter : <b>{eur(outfit.total)}</b></span>
        {outfit.budget != null && (
          <span className={outfit.withinBudget ? "ok" : "ko"}>
            {outfit.withinBudget ? `✓ dans ton budget (${eur(outfit.budget)})` : `dépasse ton budget (${eur(outfit.budget)})`}
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Mon dressing ───────────────────────── */

function Wardrobe({ wardrobe, onRemove, onAdd, onReset }: {
  wardrobe: WardrobeItem[]; onRemove: (id: string) => void; onAdd: (i: WardrobeItem[]) => void; onReset: () => void;
}) {
  const [filter, setFilter] = useState<string>("Toutes");
  const [query, setQuery] = useState("");

  const brands = useMemo(() => {
    const counts = new Map<string, { n: number; value: number }>();
    for (const w of wardrobe) {
      const c = counts.get(w.brand) ?? { n: 0, value: 0 };
      counts.set(w.brand, { n: c.n + 1, value: c.value + (w.price ?? 0) });
    }
    return [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [wardrobe]);
  const value = wardrobe.reduce((s, w) => s + (w.price ?? 0), 0);
  const shown = filter === "Toutes" ? wardrobe : wardrobe.filter((w) => w.brand === filter);
  const results = query.length > 1
    ? CATALOG.filter((p) => `${p.brand} ${p.name} ${p.color}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  return (
    <>
      <h2>Mon dressing</h2>
      <div className="card">
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="stat"><b>{wardrobe.length}</b><span>pièces</span></div>
          <div className="stat"><b>{brands.length}</b><span>marques</span></div>
          <div className="stat"><b>{Math.round(value)} €</b><span>valeur</span></div>
        </div>
      </div>

      {brands.length > 0 && (
        <div className="card">
          <b style={{ fontSize: 14 }}>Top marques</b>
          {brands.slice(0, 5).map(([b, c]) => (
            <div key={b} style={{ marginTop: 8, fontSize: 13 }}>
              <div className="row" style={{ justifyContent: "space-between" }}><span>{b}</span><span>{c.n} pièce{c.n > 1 ? "s" : ""} · {Math.round(c.value)} €</span></div>
              <div className="bar"><i style={{ width: `${(c.n / brands[0][1].n) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="chips">
        {["Toutes", ...brands.map(([b]) => b)].map((b) => (
          <button key={b} className={`chip ${filter === b ? "on" : ""}`} onClick={() => setFilter(b)}>{b}</button>
        ))}
      </div>

      {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => {
        const items = shown.filter((w) => w.category === cat);
        if (!items.length) return null;
        return (
          <div className="card" key={cat}>
            <b style={{ fontSize: 14 }}>{CATEGORY_LABEL[cat]} ({items.length})</b>
            {items.map((w) => (
              <div className="item" key={w.id}>
                <Swatch hex={w.hex} category={w.category} />
                <div className="meta"><div className="name">{w.name}</div><div className="brand">{w.brand} · {w.color}</div></div>
                <button className="btn ghost small" onClick={() => onRemove(w.id)} aria-label="Retirer">✕</button>
              </div>
            ))}
          </div>
        );
      })}
      {shown.length === 0 && <div className="empty">Ton dressing est vide. Connecte tes marques pour l'importer.</div>}

      <div className="card">
        <b style={{ fontSize: 14 }}>Ajouter une pièce à la main</b>
        <input style={{ marginTop: 8 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher : chemise Zara, jean Uniqlo…" />
        {results.map((p) => (
          <div className="item" key={p.id}>
            <Swatch hex={p.hex} category={p.category} />
            <div className="meta"><div className="name">{p.name}</div><div className="brand">{p.brand} · {p.color}</div></div>
            <button className="btn small" onClick={() => { onAdd([productToWardrobe(p, "manuel")]); setQuery(""); }}>+ J'ai</button>
          </div>
        ))}
      </div>
      <button className="btn ghost small" onClick={onReset}>Réinitialiser le dressing de démo</button>
    </>
  );
}

/* ───────────────────────── Connecter mes marques ───────────────────────── */

function Connect({ onAdd }: { onAdd: (items: WardrobeItem[]) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<WardrobeItem[] | null>(null);

  async function analyse() {
    setBusy(true);
    setFound(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { items: WardrobeItem[] };
      setFound(data.items ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Connecter mes marques</h2>
      <p className="sub">Retrouve automatiquement tes achats grâce à tes e-mails de confirmation de commande.</p>
      <div className="chips">
        {BRANDS.map((b) => <span key={b} className="chip">{b}</span>)}
      </div>

      <div className="card">
        <b style={{ fontSize: 14 }}>1. Colle un e-mail de commande</b>
        <p className="notice" style={{ marginTop: 4 }}>
          Bientôt : transfère simplement tes e-mails à ton adresse Dressr personnelle, ou connecte ta boîte mail.
        </p>
        <div className="chips">
          {SAMPLE_EMAILS.map((s) => (
            <button key={s.brand} className="chip" onClick={() => setText(s.text)}>Exemple {s.brand}</button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Colle ici le contenu d'un e-mail de confirmation de commande…" />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" disabled={busy || !text.trim()} onClick={analyse}>{busy ? "Analyse…" : "Analyser l'e-mail"}</button>
        </div>
      </div>

      {found && (
        <div className="card">
          <b style={{ fontSize: 14 }}>2. Articles trouvés ({found.length})</b>
          {found.length === 0 && <div className="empty">Aucun vêtement reconnu dans cet e-mail.</div>}
          {found.map((w) => (
            <div className="item" key={w.id}>
              <Swatch hex={w.hex} category={w.category} />
              <div className="meta"><div className="name">{w.name}</div><div className="brand">{w.brand} · {w.color}</div></div>
              {w.price != null && <div className="price">{eur(w.price)}</div>}
            </div>
          ))}
          {found.length > 0 && (
            <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={() => { onAdd(found); setFound(null); setText(""); }}>
              Ajouter à mon dressing
            </button>
          )}
        </div>
      )}
      <p className="notice">Catalogue et prix de démonstration, fictifs. Dressr n'est pas affilié aux marques citées.</p>
    </>
  );
}
