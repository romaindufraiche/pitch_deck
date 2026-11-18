/**
 * Option 2 : génération de packshots par IA (si OPENAI_API_KEY est fourni dans .env.local).
 *   npx tsx scripts/generate-images.ts [--only <id produit>] [--force]
 *
 * Pour chaque produit du catalogue (data/products.json), génère un packshot e-commerce cohérent
 * (mannequin invisible, lumière studio douce, fond blanc cassé) d'après sa couleur, sa matière et sa coupe,
 * l'enregistre dans public/images/gen/<id>.jpg et met à jour le champ `image` du produit.
 * Les photos Pixabay restent utilisées pour la garde-robe de Thomas et les visuels d'ambiance.
 * Après génération, vérifiez chaque image (bon vêtement, bonne couleur, aucun texte ni logo).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Product } from "../lib/types";

const ROOT = process.cwd();
for (const f of [".env.local", ".env"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) for (const l of fs.readFileSync(p, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
}
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY absent : utilisez scripts/fetch-images.ts (Pixabay)."); process.exit(1); }

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const force = args.includes("--force");
const file = path.join(ROOT, "data", "products.json");
const products: Product[] = JSON.parse(fs.readFileSync(file, "utf8"));

const EN: Record<string, string> = { chemises: "men's shirt", hauts: "men's top", maille: "men's knitwear", pantalons: "men's trousers", vestes: "men's jacket", costumes: "men's suit piece", chaussures: "pair of men's shoes", accessoires: "men's accessory", sport: "men's sportswear" };

function prompt(p: Product) {
  const kind = p.category === "chaussures" ? "product photo, pair of shoes at three-quarter angle" : p.category === "accessoires" ? "product photo, centered" : "ghost mannequin";
  return [
    `E-commerce packshot, ${kind}, soft studio lighting, off-white seamless background (#F5F2EC), subtle shadow.`,
    `${EN[p.category]}: ${p.subcategory}, colour ${p.color.name} (${p.color.hex}), material ${p.material}, fit ${p.fit}.`,
    "Premium menswear, realistic fabric texture, sharp focus, no text, no logo, no label visible, no model face.",
  ].join(" ");
}

async function gen(p: Product) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt: prompt(p), size: "1024x1536", n: 1 }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data: { b64_json: string }[] };
  const out = path.join(ROOT, "public", "images", "gen", `${p.id}.jpg`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(json.data[0].b64_json, "base64")).resize({ width: 1000, height: 1250, fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  return `/images/gen/${p.id}.jpg`;
}

(async () => {
  for (const p of products) {
    if (only && p.id !== only) continue;
    if (!force && p.image.startsWith("/images/gen/")) continue;
    try {
      p.image = await gen(p);
      console.log("✓", p.id);
      fs.writeFileSync(file, JSON.stringify(products, null, 1) + "\n");
    } catch (e) {
      console.warn("✗", p.id, String(e).slice(0, 200));
    }
  }
})();
