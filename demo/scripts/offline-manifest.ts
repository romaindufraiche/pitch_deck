/** Liste des ressources à mettre en cache pour le mode hors ligne (public/offline-manifest.json). */
import fs from "node:fs";
import path from "node:path";

const pub = path.join(process.cwd(), "public");
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const assets = walk(path.join(pub, "images")).concat(walk(path.join(pub, "video"))).map((f) => "/" + path.relative(pub, f).split(path.sep).join("/"));
const wardrobe = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "wardrobe.json"), "utf8")) as { id: string }[];
const routes = ["/", "/bienvenue", "/inscription", "/boutiques", "/scan", "/accueil", "/dressing", "/dressing/ajout", "/assistant", "/profil", "/profil/credits", "/marque", ...wardrobe.map((w) => `/dressing/${w.id}`)];
fs.writeFileSync(path.join(pub, "offline-manifest.json"), JSON.stringify([...routes, ...assets]));
console.log(`${routes.length} pages, ${assets.length} fichiers`);
