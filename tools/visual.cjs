// Visueller Regressionstest: erstellt reproduzierbare Screenshots aller Missionen
// (gleiche Klickfolge, fester Zufall, keine Animationen), Vergleich per tools/visual_compare.py.
//   node tools/visual.cjs /tmp/vorher                     # Referenz aufnehmen (vor der Änderung)
//   node tools/visual.cjs /tmp/nachher                    # nach der Änderung aufnehmen
//   python3 tools/visual_compare.py /tmp/vorher /tmp/nachher   # vergleichen (Toleranz ±2)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { serve } = require('./testserver.cjs');

const [outDir] = process.argv.slice(2);
if (!outDir) { console.log('Aufruf: node tools/visual.cjs <ausgabeordner>'); process.exit(2); }
const ROUNDS = 14, SCROLLS = 3;

const missionFrame = async page => {
  await page.waitForFunction(() => document.getElementById('gameFrame').contentDocument?.readyState === 'complete');
  return page.frames().find(f => f.parentFrame() && f.url() === 'about:srcdoc');
};

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await serve();
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  page.on('dialog', d => d.accept());
  await page.addInitScript(() => {
    let s = 42; Math.random = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    document.addEventListener('DOMContentLoaded', () => {
      const st = document.createElement('style');
      st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';
      document.head.appendChild(st);
    });
  });
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  const files = [];
  for (let i = 0; i < 7; i++) {
    await page.evaluate(() => { for (let k = 0; k < 7; k++) localStorage.removeItem('akte66-mission-' + k + '-v1'); });
    await page.evaluate(n => openMission(n), i);
    const frame = await missionFrame(page);
    await frame.evaluate(() => Promise.all([...document.images].map(img => { img.loading = 'eager'; return img.complete ? 0 : new Promise(r => { img.onload = img.onerror = r; }); })));
    for (let r = 0; r <= ROUNDS; r++) {
      if (r > 0) {
        const n = await frame.evaluate(() => {
          const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
          document.querySelectorAll('[data-pw]').forEach(e => e.removeAttribute('data-pw'));
          const c = [...document.querySelectorAll('input[type=radio],input[type=checkbox],button,summary')]
            .filter(e => visible(e) && !e.disabled && !e.closest('.akte66-endnav') && !e.closest('dialog'));
          c.forEach((e, k) => e.setAttribute('data-pw', k));
          return c.length;
        });
        if (n) await frame.locator(`[data-pw="${(r * 7 + 3) % n}"]`).click({ timeout: 2000 }).catch(() => {});
        await frame.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
        await frame.waitForTimeout(250);
      }
      for (let s = 0; s < SCROLLS; s++) {
        await frame.evaluate(y => { window.scrollTo(0, y); document.activeElement?.blur?.(); }, s * 800);
        await page.waitForTimeout(30);
        const file = `m${i + 1}-r${String(r).padStart(2, '0')}-s${s}.png`;
        await page.locator('#gameFrame').screenshot({ path: path.join(outDir, file) });
        files.push(file);
      }
    }
  }
  await browser.close();
  server.close();
  console.log(`${files.length} Screenshots in ${outDir}`);
})();
