import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_WARDROBE, SAMPLE_EMAILS } from "../lib/catalog.ts";
import { demoImport, demoStylist, materialize, parseRequest } from "../lib/engine.ts";

test("parse budget, occasion et alternatives", () => {
  const r = parseRequest("Trouve-moi trois hauts différents pour 80 € avec mon chino", DEMO_WARDROBE);
  assert.equal(r.budget, 80);
  assert.deepEqual(r.target, { category: "haut", count: 3 });
  assert.equal(r.anchor?.name, "Chino slim");
  assert.equal(parseRequest("j'ai un date ce soir, 100 euros", []).style, "date");
});

test("tenue date à 100 € : complète et dans le budget", () => {
  const res = demoStylist("J'ai un date ce soir, je veux une tenue pour 100 €", DEMO_WARDROBE);
  const o = res.outfits[0];
  assert.ok(o, "au moins une tenue");
  const cats = new Set([...o.owned, ...o.toBuy].map((x) => x.category));
  for (const c of ["haut", "bas", "chaussures"]) assert.ok(cats.has(c as never), `catégorie ${c}`);
  assert.ok(o.total <= 100 && o.withinBudget);
  assert.ok(o.owned.length > 0, "réutilise le dressing");
});

test("trois hauts pour 80 € : trois options différentes", () => {
  const res = demoStylist("Trouve-moi trois hauts différents pour 80 € avec mon chino", DEMO_WARDROBE);
  assert.equal(res.outfits.length, 3);
  const ids = new Set(res.outfits.map((o) => o.toBuy[0].id));
  assert.equal(ids.size, 3);
  for (const o of res.outfits) {
    assert.equal(o.toBuy[0].category, "haut");
    assert.ok(o.toBuy[0].price <= 80);
    assert.ok(o.owned.some((w) => w.name === "Chino slim"), "garde le chino");
  }
});

test("de zéro : n'utilise pas le dressing", () => {
  const res = demoStylist("Je n'ai rien à me mettre : une tenue de soirée de zéro pour 200 €", DEMO_WARDROBE);
  assert.equal(res.outfits[0].owned.length, 0);
  assert.ok(res.outfits[0].total <= 200);
});

test("materialize ignore les identifiants inventés et recalcule le total", () => {
  const out = materialize([{ title: "t", why: "w", owned_ids: ["w-1", "fake"], buy_ids: ["zr-h1", "nope"] }], DEMO_WARDROBE, 30);
  assert.equal(out[0].owned.length, 1);
  assert.equal(out[0].toBuy.length, 1);
  assert.equal(out[0].total, 35.95);
  assert.equal(out[0].withinBudget, false);
});

test("import démo : retrouve les articles de l'e-mail", () => {
  const items = demoImport(SAMPLE_EMAILS[0].text);
  assert.deepEqual(items.map((i) => i.name).sort(), ["Blazer structuré", "Chemise en lin oversize"]);
});
