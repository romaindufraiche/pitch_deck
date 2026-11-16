/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON des API externes */
/**
 * Récupération des photos et de la vidéo de démo depuis une banque d'images libre de droits.
 *
 * Source par défaut : Pixabay (PIXABAY_API_KEY dans .env.local, clé gratuite).
 * Source alternative : Pexels (PEXELS_API_KEY), si une clé est disponible.
 *
 * Deux étapes :
 *   npx tsx scripts/fetch-images.ts harvest   → télécharge des candidats dans .cache/ (pour tri visuel)
 *   npx tsx scripts/fetch-images.ts download  → télécharge en haute définition les photos retenues
 *                                                dans data/image-picks.json, vers public/images/,
 *                                                et écrit data/credits.json
 *
 * Le tri est manuel et visuel : chaque photo retenue est annotée (catégorie, couleur, cadrage)
 * dans data/image-picks.json, et les fiches articles sont ensuite générées à partir de ces
 * annotations (scripts/generate-data.ts). C'est ce qui garantit que la photo correspond à l'article.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CACHE = path.join(ROOT, ".cache", "pixabay");
const UA = { "User-Agent": "wardrobe-demo-fetcher/1.0" };

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}

type Candidate = {
  id: number;
  provider: "pixabay" | "pexels";
  query: string;
  tags: string;
  author: string;
  pageURL: string;
  previewURL: string;
  largeURL: string;
  width: number;
  height: number;
};

/** Requêtes de récolte : larges, en anglais. [requête, catégorie Pixabay ou ""] */
export const HARVEST_QUERIES: [string, string][] = [
  ["white shirt", "fashion"], ["blue shirt", "fashion"], ["shirt folded", ""], ["dress shirt", ""],
  ["linen shirt", ""], ["denim shirt", ""], ["flannel shirt", ""], ["shirt on hanger", ""],
  ["plain t-shirt", ""], ["black t-shirt", ""], ["white t-shirt", ""], ["polo shirt", ""],
  ["sweater", "fashion"], ["knitted sweater", ""], ["cardigan", ""], ["turtleneck", ""], ["sweatshirt", ""],
  ["chinos", ""], ["trousers", "fashion"], ["jeans", "fashion"], ["denim jeans folded", ""], ["shorts men", ""],
  ["jacket men", "fashion"], ["leather jacket", ""], ["parka", ""], ["coat men", ""], ["trench coat", ""],
  ["denim jacket", ""], ["blazer", ""], ["suit men", "fashion"], ["puffer jacket", ""], ["raincoat", ""],
  ["sneakers", "fashion"], ["leather shoes", ""], ["derby shoes", ""], ["chelsea boots", ""], ["loafers", ""],
  ["running shoes", ""], ["boots men", ""], ["leather belt", ""], ["necktie", ""], ["scarf", "fashion"],
  ["beanie", ""], ["leather bag", ""], ["jogging pants", ""], ["sportswear", ""], ["men fashion", "fashion"],
  ["menswear", ""], ["man coat street", ""], ["wardrobe", ""], ["clothes rack", ""], ["flat lay clothes", ""],
  ["man portrait", "people"], ["businessman", "people"], ["wedding guest suit", ""],
  // seconde passe, ciblée sur les pièces manquantes après le premier tri
  ["white leather sneakers", ""], ["minimalist sneakers", ""], ["canvas sneakers", ""], ["sneakers isolated", ""],
  ["grey sweater man", ""], ["navy sweater", ""], ["crew neck sweater", ""], ["folded sweater", ""],
  ["field jacket", ""], ["bomber jacket", ""], ["man trench coat", ""], ["quilted jacket", ""], ["windbreaker", ""],
  ["fleece jacket", ""], ["hiking jacket man", ""], ["linen suit", ""], ["beige suit", ""], ["light grey suit", ""],
  ["joggers man", ""], ["track pants", ""], ["running man", "sports"], ["gym man", "sports"], ["sport shorts", ""],
  ["chino pants man", ""], ["khaki pants", ""], ["corduroy", "fashion"], ["overshirt", ""], ["man white shirt", ""],
  ["man casual outfit", ""], ["man smart casual", ""], ["folded t-shirts", ""], ["folded clothes", ""],
  ["wool scarf", ""], ["knit beanie", ""], ["suitcase packing", ""], ["man rain umbrella", ""],
];

export const VIDEO_QUERIES = ["wardrobe", "closet", "clothes hanger", "clothes rack", "clothing store"];

async function getJSON(url: string, headers: Record<string, string> = {}) {
  const r = await fetch(url, { headers: { ...UA, ...headers } });
  if (!r.ok) throw new Error(`${r.status} ${url.replace(/key=[^&]+/, "key=***")}`);
  return r.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string, dest: string, tries = 6) {
  let r = await fetch(url, { headers: UA });
  for (let t = 1; r.status === 429 && t < tries; t++) {
    await sleep(2000 * t); // limite de débit Pixabay : on patiente puis on réessaie
    r = await fetch(url, { headers: UA });
  }
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

async function searchPixabay(q: string, category: string, perPage = 30): Promise<Candidate[]> {
  const key = process.env.PIXABAY_API_KEY!;
  const params = new URLSearchParams({ key, q, image_type: "photo", per_page: String(perPage), safesearch: "true" });
  if (category) params.set("category", category);
  const d = await getJSON(`https://pixabay.com/api/?${params}`);
  return d.hits.map((h: any) => ({
    id: h.id, provider: "pixabay", query: q, tags: h.tags, author: h.user, pageURL: h.pageURL,
    previewURL: h.webformatURL, largeURL: h.largeImageURL, width: h.imageWidth, height: h.imageHeight,
  }));
}

async function searchPexels(q: string, perPage = 30): Promise<Candidate[]> {
  const d = await getJSON(
    `https://api.pexels.com/v1/search?${new URLSearchParams({ query: q, per_page: String(perPage) })}`,
    { Authorization: process.env.PEXELS_API_KEY! },
  );
  return d.photos.map((p: any) => ({
    id: p.id, provider: "pexels", query: q, tags: p.alt ?? "", author: p.photographer, pageURL: p.url,
    previewURL: p.src.medium, largeURL: p.src.large2x, width: p.width, height: p.height,
  }));
}

async function harvest() {
  fs.mkdirSync(path.join(CACHE, "thumbs"), { recursive: true });
  const all = new Map<number, Candidate>();
  const prev = path.join(CACHE, "candidates.json");
  if (fs.existsSync(prev)) for (const c of JSON.parse(fs.readFileSync(prev, "utf8")) as Candidate[]) all.set(c.id, c);
  const done = new Set([...all.values()].map((c) => c.query));
  for (const [q, cat] of HARVEST_QUERIES) {
    if (done.has(q)) continue;
    const hits = process.env.PIXABAY_API_KEY ? await searchPixabay(q, cat) : await searchPexels(q);
    for (const h of hits) if (!all.has(h.id)) all.set(h.id, h);
    console.log(`${q.padEnd(24)} ${hits.length} résultats (total unique ${all.size})`);
  }
  let i = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      const list = [...all.values()];
      while (i < list.length) {
        const c = list[i++];
        const dest = path.join(CACHE, "thumbs", `${c.id}.jpg`);
        if (fs.existsSync(dest)) continue;
        try { await download(c.previewURL, dest); } catch (e) { console.warn(String(e)); }
      }
    }),
  );
  fs.writeFileSync(path.join(CACHE, "candidates.json"), JSON.stringify([...all.values()], null, 1));

  // Vidéos (dressing filmé) — Pixabay Videos
  if (process.env.PIXABAY_API_KEY) {
    const vids: any[] = [];
    for (const q of VIDEO_QUERIES) {
      const d = await getJSON(`https://pixabay.com/api/videos/?${new URLSearchParams({ key: process.env.PIXABAY_API_KEY!, q, per_page: "20", safesearch: "true" })}`);
      for (const h of d.hits) vids.push({ id: h.id, query: q, tags: h.tags, duration: h.duration, author: h.user, pageURL: h.pageURL, thumb: h.videos.medium.thumbnail, url: h.videos.medium.url, small: h.videos.small.url });
    }
    fs.writeFileSync(path.join(CACHE, "videos.json"), JSON.stringify(vids, null, 1));
    console.log(`${vids.length} vidéos candidates`);
  }
}

type Pick = { id: number; file: string; crop?: "top" | "center" | "bottom" | "left" | "right" | "attention" };

async function downloadPicks() {
  const picks: { images: Pick[]; video?: { id: number; file: string }[] } = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "image-picks.json"), "utf8"),
  );
  const cands: Candidate[] = JSON.parse(fs.readFileSync(path.join(CACHE, "candidates.json"), "utf8"));
  const byId = new Map(cands.map((c) => [c.id, c]));
  const credits: any[] = [];
  for (const p of picks.images) {
    const c = byId.get(p.id);
    if (!c) throw new Error(`Photo ${p.id} absente des candidats : relancer harvest`);
    const out = path.join(ROOT, "public", "images", p.file);
    if (!fs.existsSync(out)) {
      const tmp = path.join(CACHE, "large", `${c.id}.jpg`);
      if (!fs.existsSync(tmp)) await download(c.largeURL, tmp);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(tmp).resize({ width: 1000, height: 1250, fit: "cover", position: p.crop ?? "attention" }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
      console.log("✓", p.file);
    }
    credits.push({ file: `/images/${p.file}`, author: c.author, source: c.provider === "pixabay" ? "Pixabay" : "Pexels", url: c.pageURL, license: c.provider === "pixabay" ? "Licence de contenu Pixabay" : "Licence Pexels" });
  }
  // Vidéos : téléchargées dans .cache/, puis assemblées en un plan vertical (format téléphone)
  // par scripts/build-video.sh (ffmpeg) → public/video/dressing.mp4
  const vids: any[] = picks.video?.length ? JSON.parse(fs.readFileSync(path.join(CACHE, "videos.json"), "utf8")) : [];
  for (const pv of picks.video ?? []) {
    const v = vids.find((x) => x.id === pv.id);
    const out = path.join(CACHE, "video", pv.file);
    if (!fs.existsSync(out)) await download(v.url, out);
    credits.push({ file: "/video/dressing.mp4", author: v.author, source: "Pixabay", url: v.pageURL, license: "Licence de contenu Pixabay" });
  }
  fs.writeFileSync(path.join(ROOT, "data", "credits.json"), JSON.stringify(credits, null, 2));
  console.log(`${credits.length} crédits écrits dans data/credits.json`);
}

loadEnv();
if (!process.env.PIXABAY_API_KEY && !process.env.PEXELS_API_KEY) {
  console.error("Renseignez PIXABAY_API_KEY (ou PEXELS_API_KEY) dans .env.local");
  process.exit(1);
}
const cmd = process.argv[2] ?? "harvest";
(cmd === "download" ? downloadPicks() : harvest()).catch((e) => { console.error(e); process.exit(1); });
