// Smoke-Test: lädt index.html in Chromium, öffnet Zentrale + alle 7 Missionen,
// meldet JS-Fehler. Aufruf: node tools/smoke.cjs [--shots]  (Screenshots -> /tmp/akte66-shots)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const shots = process.argv.includes('--shots');
  const outDir = '/tmp/akte66-shots';
  if (shots) fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('Seite: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('Konsole: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  if (shots) await page.screenshot({ path: `${outDir}/0-trailer.png` });
  await page.evaluate(() => hub());
  if (shots) await page.screenshot({ path: `${outDir}/0-zentrale.png` });
  for (let i = 0; i < 7; i++) {
    await page.evaluate(n => openMission(n), i);
    const frame = page.frameLocator('#gameFrame');
    const title = await frame.locator('title').textContent({ timeout: 10000 }).catch(() => null);
    console.log(`Mission ${i + 1}: ${title ?? 'NICHT GELADEN'}`);
    if (!title) errors.push(`Mission ${i + 1} nicht geladen`);
    if (shots) await page.screenshot({ path: `${outDir}/mission-${i + 1}.png` });
  }
  await browser.close();
  if (errors.length) { console.log('FEHLER:\n' + errors.join('\n')); process.exit(1); }
  console.log('OK: keine JS-Fehler.');
})();
