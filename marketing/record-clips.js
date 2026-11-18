// Enregistre les séquences de l'application utilisées dans la vidéo de pitch.
// Usage : node marketing/record-clips.js http://localhost:3300   (l'app doit tourner en production)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:3300';
const OUT = path.join(__dirname, 'clips');
const W = 390, H = 844;

async function clip(name, fn, { persona = 'lea', setup = true } = {}) {
  const browser = await chromium.launch();
  // 1) contexte de préparation (non filmé) : on prépare l'état du compte dans localStorage
  const prep = await browser.newContext({ viewport: { width: W, height: H } });
  const pp = await prep.newPage();
  await pp.goto(BASE + '/accueil', { waitUntil: 'networkidle' });
  if (setup) {
    await pp.keyboard.press('Shift+D');
    await pp.getByText(persona === 'lea' ? 'Compte de Léa' : 'Compte de Thomas').click();
    await pp.waitForTimeout(800);
  }
  const state = await prep.storageState();
  await prep.close();
  // 2) contexte filmé
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 2, storageState: state,
    recordVideo: { dir: OUT + '/tmp-' + name, size: { width: W * 2, height: H * 2 } },
    isMobile: true, hasTouch: false,
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const marks = {};
  const mark = (k) => (marks[k] = (Date.now() - t0) / 1000);
  await fn(page, mark);
  mark('end');
  const v = page.video();
  await ctx.close();
  await browser.close();
  const src = await v.path();
  fs.renameSync(src, path.join(OUT, name + '.webm'));
  fs.rmSync(OUT + '/tmp-' + name, { recursive: true, force: true });
  console.log(name, JSON.stringify(marks));
  return marks;
}

const wait = (p, ms) => p.waitForTimeout(ms);
async function smoothScroll(page, sel, to, ms = 1400) {
  await page.evaluate(([sel, to, ms]) => new Promise((res) => {
    const el = document.querySelector(sel); const from = el.scrollTop; const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; el.scrollTop = from + (to - from) * e; k < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  }), [sel, to, ms]);
}
const CHAT = '[class*="min-h-0 flex-1 overflow-y-auto"]';

(async () => {
  const only = process.argv[3] ? process.argv[3].split(',') : null;
  const all = fs.existsSync(path.join(OUT, 'marks.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'marks.json'), 'utf8')) : {};
  const run = (n) => !only || only.includes(n);
  if (run('welcome')) all.welcome = await clip('welcome', async (p, mark) => {
    await p.goto(BASE + '/bienvenue', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 1800); await p.getByRole('button', { name: 'Suivant' }).click();
    await wait(p, 1800); await p.getByRole('button', { name: 'Suivant' }).click();
    await wait(p, 2000);
  }, { setup: false });

  if (run('onboarding')) all.onboarding = await clip('onboarding', async (p, mark) => {
    await p.goto(BASE + '/inscription', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 600); await p.getByText('Continuer avec Apple').click(); await wait(p, 1400);
    await p.getByText('Une femme').click(); await wait(p, 700);
    await p.getByRole('button', { name: 'Continuer', exact: true }).click(); await wait(p, 1300);
    await p.getByRole('button', { name: 'Continuer', exact: true }).click(); await wait(p, 900); mark('quiz');
    for (const lbl of ['Corporate', 'Streetwear', 'Tailleur']) { await p.locator('button', { hasText: lbl }).first().click(); await wait(p, 450); }
    await wait(p, 900);
  }, { setup: false });

  if (run('connect')) all.connect = await clip('connect', async (p, mark) => {
    await p.goto(BASE + '/profil/credits');
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('dressr-demo')); s.state.connected = []; s.state.scanned = false; localStorage.setItem('dressr-demo', JSON.stringify(s)); });
    await p.goto(BASE + '/boutiques?onboarding=1', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 1000); await p.getByRole('button', { name: 'Connecter' }).first().click(); await wait(p, 1300);
    await p.getByText('Se connecter', { exact: true }).click(); await wait(p, 1500);
    await p.getByText('Autoriser', { exact: true }).click(); mark('import');
    await wait(p, 5200);
  });

  if (run('scan')) all.scan = await clip('scan', async (p, mark) => {
    await p.goto(BASE + '/scan', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 900); await p.getByText('Utiliser la vidéo exemple').click(); mark('analyse');
    await wait(p, 7000); mark('result'); await wait(p, 1200);
    await smoothScroll(p, '.overflow-y-auto', 620, 1600); await wait(p, 900);
    await p.getByRole('button', { name: 'Fusionner' }).first().click(); await wait(p, 1200);
  });

  if (run('dressing')) all.dressing = await clip('dressing', async (p, mark) => {
    await p.goto(BASE + '/dressing', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 1200); await smoothScroll(p, '#screen', 520, 1500); await wait(p, 600);
    await smoothScroll(p, '#screen', 1100, 1500); await wait(p, 800);
  });

  if (run('item360')) all.item360 = await clip('item360', async (p, mark) => {
    await p.goto(BASE + '/dressing', { waitUntil: 'networkidle' });
    await p.getByText('Chelsea Marcel').first().click(); mark('start');
    await wait(p, 3200);
    const box = await p.locator('#screen img').first().boundingBox();
    await p.mouse.move(box.x + 300, box.y + 200); await p.mouse.down();
    for (let i = 0; i < 30; i++) { await p.mouse.move(box.x + 300 - i * 8, box.y + 200); await wait(p, 40); }
    await p.mouse.up(); await wait(p, 900);
  }, { persona: 'thomas' });

  if (run('budget')) all.budget = await clip('budget', async (p, mark) => {
    await p.goto(BASE + '/assistant', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 1200); await p.getByRole('button', { name: /80 € de budget/ }).first().click(); mark('ask');
    await wait(p, 6500);
    const start = await p.locator(CHAT).evaluate((e) => { const ms = e.querySelectorAll('.justify-end'); return ms[ms.length - 1].offsetTop - 10; });
    await smoothScroll(p, CHAT, start, 900); await wait(p, 700); mark('cards');
    await smoothScroll(p, CHAT, start + 700, 2200); await wait(p, 500);
    await smoothScroll(p, CHAT, start + 1250, 1600); await wait(p, 500);
    await p.getByRole('button', { name: /Ajouter au panier|Tout ajouter/ }).first().click(); await wait(p, 900);
    await p.getByRole('button', { name: /Dans le panier · Commander/ }).first().click(); await wait(p, 1300); mark('cart');
    await p.getByRole('button', { name: /Payer/ }).click(); await wait(p, 2600); mark('paid');
  });

  if (run('wedding')) all.wedding = await clip('wedding', async (p, mark) => {
    await p.goto(BASE + '/assistant', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 900); await p.getByRole('button', { name: /mariage en juin/ }).first().click(); mark('ask');
    await wait(p, 7500);
    const start = await p.locator(CHAT).evaluate((e) => { const ms = e.querySelectorAll('.justify-end'); return ms[ms.length - 1].offsetTop - 10; });
    await smoothScroll(p, CHAT, start + 330, 1800); await wait(p, 2200); mark('size');
    await smoothScroll(p, CHAT, start + 1250, 2000); await wait(p, 1200);
  });

  if (run('rdv')) all.rdv = await clip('rdv', async (p, mark) => {
    await p.goto(BASE + '/assistant', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 900); await p.getByRole('button', { name: /rendez-vous chez Orsay/ }).first().click(); mark('ask');
    await wait(p, 6000);
    const start = await p.locator(CHAT).evaluate((e) => { const ms = e.querySelectorAll('.justify-end'); return ms[ms.length - 1].offsetTop - 10; });
    await smoothScroll(p, CHAT, start + 200, 1400); await wait(p, 1200);
    await smoothScroll(p, CHAT, start + 1050, 1800); await wait(p, 1500);
  }, { persona: 'thomas' });

  if (run('catalogue')) all.catalogue = await clip('catalogue', async (p, mark) => {
    await p.goto(BASE + '/catalogue', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 1200); await smoothScroll(p, '#screen', 700, 2000); await wait(p, 600);
    await p.getByText('Robe portefeuille Riviera').first().click(); await wait(p, 1400);
    await smoothScroll(p, '#phone [class*="overflow-y-auto"]:last-of-type', 760, 1600).catch(() => {}); await wait(p, 1500);
  });

  if (run('home')) all.home = await clip('home', async (p, mark) => {
    await p.goto(BASE + '/accueil', { waitUntil: 'networkidle' }); mark('start');
    await wait(p, 1500); await smoothScroll(p, '#screen', 640, 1800); await wait(p, 1200);
  }, { persona: 'thomas' });

  fs.writeFileSync(path.join(OUT, 'marks.json'), JSON.stringify(all, null, 1));
})();
