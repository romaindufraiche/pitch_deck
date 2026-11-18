// Rendu image par image de composition.html, puis encodage MP4 avec ffmpeg.
// Usage : node marketing/render.js            → marketing/build/pitch.mp4
//         node marketing/render.js --stills 2,9,18   → images de contrôle
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const HERE = __dirname;
const URL = 'file://' + path.join(HERE, 'composition.html');
const OUT = path.join(HERE, 'build');
const FPS = 30;

async function pageAt() {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(URL + '?t=0', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { browser, page };
}

(async () => {
  const args = process.argv.slice(2);
  if (args[0] === '--stills') {
    const { browser, page } = await pageAt();
    fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
    for (const t of args[1].split(',').map(Number)) {
      await page.evaluate((t) => window.renderFrame(t), t);
      await page.screenshot({ path: path.join(OUT, 'stills', `t${String(t).replace('.', '_')}.jpg`), type: 'jpeg', quality: 80 });
    }
    await browser.close();
    return;
  }
  const workers = Number(process.env.WORKERS || 4);
  const { browser: b0, page: p0 } = await pageAt();
  const total = await p0.evaluate(() => window.TOTAL);
  await b0.close();
  const N = Math.round(total * FPS);
  const dir = path.join(OUT, 'render');
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const { browser, page } = await pageAt();
    for (let f = w; f < N; f += workers) {
      const file = path.join(dir, String(f).padStart(5, '0') + '.jpg');
      if (fs.existsSync(file)) continue;
      await page.evaluate((t) => window.renderFrame(t), f / FPS);
      await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
      if (f % 300 === 0) console.log(`image ${f}/${N} · ${Math.round((Date.now() - t0) / 1000)} s`);
    }
    await browser.close();
  }));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, 'video-silent.mp4')]);
  console.log('vidéo muette écrite :', path.join(OUT, 'video-silent.mp4'));
})();
