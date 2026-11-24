// Visueller Regressionstest: reproduzierbare Screenshots aller Ansichten der Hauptseite
// (Desktop 1280 px + Handy 390 px) und aller Missionen (gleiche Klickfolge, fester Zufall,
// feste Uhrzeit, keine Animationen). Vergleich per tools/visual_compare.py.
// Option --shell: nur Hauptseite (schnell).
//   node tools/visual.cjs /tmp/vorher                     # Referenz aufnehmen (vor der Änderung)
//   node tools/visual.cjs /tmp/nachher                    # nach der Änderung aufnehmen
//   python3 tools/visual_compare.py /tmp/vorher /tmp/nachher   # vergleichen (Toleranz ±2)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { serve } = require('./testserver.cjs');

const args = process.argv.slice(2);
const outDir = args.find(a => !a.startsWith('--'));
const shellOnly = args.includes('--shell');
if (!outDir) { console.log('Aufruf: node tools/visual.cjs <ausgabeordner>'); process.exit(2); }
const ROUNDS = 14, SCROLLS = 3;

const missionFrame = async page => {
  await page.waitForFunction(() => document.getElementById('gameFrame').contentDocument?.readyState === 'complete');
  return page.frames().find(f => f.parentFrame() && f.url() === 'about:srcdoc');
};

const FIXED_TIME = new Date('2026-11-24T10:00:00+01:00');
const STABLE = () => {
    let s = 42; Math.random = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    document.addEventListener('DOMContentLoaded', () => {
      const st = document.createElement('style');
      st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';
      document.head.appendChild(st);
    });
};

async function newPage(browser, viewport) {
  const page = await browser.newPage({ viewport });
  page.on('dialog', d => d.accept());
  await page.clock.setFixedTime(FIXED_TIME);
  await page.addInitScript(STABLE);
  return page;
}

async function settle(page) {
  await page.evaluate(() => Promise.all([...document.images].map(img => {
    img.loading = 'eager'; return img.complete ? 0 : new Promise(r => { img.onload = img.onerror = r; });
  })));
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  await page.waitForTimeout(80);
}

// Alle Ansichten der Hauptseite (ohne Missionsinhalt)
async function shellShots(browser, base, tag, viewport, files) {
  const page = await newPage(browser, viewport);
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const shot = async name => {
    await settle(page);
    const file = `shell-${tag}-${name}.png`;
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    files.push(file);
  };
  const setDone = n => page.evaluate(k => { completed = Array(7).fill(false).map((_, i) => i < k); save(); refreshScene(); drawCards(); }, n);
  await shot('01-trailer');
  await page.evaluate(() => hub()); await shot('02-zentrale');
  await page.evaluate(() => view('hub')); await shot('03-missionsliste');
  await page.evaluate(() => sceneAction('help')); await shot('04-hilfen');
  await page.evaluate(() => sceneAction('notebook')); await shot('05-forscherheft');
  await page.evaluate(() => sceneAction('prolog')); await shot('06-prolog');
  await page.evaluate(() => sceneAction('archive')); await shot('07-archiv-gesperrt');
  await setDone(3); await page.evaluate(() => sceneAction('archive')); await shot('08-archiv-frei');
  await page.evaluate(() => sceneAction('settings')); await shot('09-einstellungen');
  await page.evaluate(() => showCertificate()); await shot('10-urkunde-gesperrt');
  await setDone(7); await page.evaluate(() => showCertificate()); await shot('11-urkunde');
  await page.evaluate(() => { hub(); document.getElementById('learningGoalDialog').showModal(); }); await shot('12-lernziele');
  await page.evaluate(() => { document.getElementById('learningGoalDialog').close(); openMission(0); });
  await missionFrame(page); await shot('13-spielkopf');
  await page.evaluate(() => showSolved('mission', 0)); await shot('14-abschlussdialog');
  await page.close();
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await serve();
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const files = [];
  await shellShots(browser, base, 'desktop', { width: 1280, height: 860 }, files);
  await shellShots(browser, base, 'handy', { width: 390, height: 844 }, files);
  const page = await newPage(browser, { width: 1280, height: 860 });
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  for (let i = 0; i < (shellOnly ? 0 : 7); i++) {
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
