// Smoke-Test der Web-Version wie auf GitHub Pages (lokaler HTTP-Server):
// lädt index.html, öffnet Zentrale + alle 7 Missionen, meldet JS-Fehler,
// fehlgeschlagene Requests und nicht geladene Bilder.
// Aufruf: node tools/smoke.cjs [--shots]   (Screenshots -> /tmp/akte66-shots)
const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.png': 'image/png', '.mp3': 'audio/mpeg', '.js': 'text/javascript', '.css': 'text/css' };

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, () => r(server)));
}

async function brokenImages(frame) {
  return frame.evaluate(async () => {
    const imgs = [...document.images];
    imgs.forEach(i => { i.loading = 'eager'; }); // lazy-Bilder in versteckten Stufen erzwingen
    const wait = i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); });
    await Promise.all(imgs.map(wait));
    return imgs.filter(i => i.getAttribute('src') && i.naturalWidth === 0).map(i => i.getAttribute('src'));
  });
}

(async () => {
  const shots = process.argv.includes('--shots');
  const outDir = '/tmp/akte66-shots';
  if (shots) fs.mkdirSync(outDir, { recursive: true });
  const server = await serve();
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('Seite: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('Konsole: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('requestfailed', r => { if (!/\.mp3$/.test(r.url())) errors.push('Request fehlgeschlagen: ' + r.url()); });
  await page.goto(base, { waitUntil: 'load' });
  if (shots) await page.screenshot({ path: `${outDir}/0-trailer.png` });
  await page.evaluate(() => hub());
  (await brokenImages(page.mainFrame())).forEach(s => errors.push('Bild fehlt (Zentrale): ' + s));
  if (shots) await page.screenshot({ path: `${outDir}/0-zentrale.png` });
  for (let i = 0; i < 7; i++) {
    await page.evaluate(n => openMission(n), i);
    await page.waitForFunction(() => document.getElementById('gameFrame').contentDocument?.readyState === 'complete');
    const frame = page.frames().find(f => f.parentFrame() && f.url() === 'about:srcdoc');
    const title = frame ? await frame.title() : null;
    console.log(`Mission ${i + 1}: ${title || 'NICHT GELADEN'}`);
    if (!title) { errors.push(`Mission ${i + 1} nicht geladen`); continue; }
    (await brokenImages(frame)).forEach(s => errors.push(`Bild fehlt (Mission ${i + 1}): ${s}`));
    if (shots) await page.screenshot({ path: `${outDir}/mission-${i + 1}.png` });
  }
  await browser.close();
  server.close();
  if (errors.length) { console.log('FEHLER:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
  console.log('OK: keine JS-Fehler, alle Bilder geladen.');
})();
