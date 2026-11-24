// Test: Bleibt der Fortschritt nach einem Neuladen erhalten?
// Für jede Mission: öffnen, per echten Klicks (deterministisch) durchklicken, Zustand merken,
// neu laden -> gleiche Mission offen, gleicher Zustand. Außerdem: Trailer nur beim ersten Besuch,
// "Missionsstände zurücksetzen" stellt den Anfangszustand wieder her.
// Aufruf: node tools/persist.cjs [rundenProMission]
const { chromium } = require('playwright');
const { serve } = require('./testserver.cjs');

const ROUNDS = Number(process.argv[2]) || 18;

const missionFrame = async page => {
  await page.waitForFunction(() => document.getElementById('gameFrame').contentDocument?.readyState === 'complete');
  return page.frames().find(f => f.parentFrame() && f.url() === 'about:srcdoc');
};

// Zustand der Mission (sichtbare Stufe, angehakte Inputs, gesperrte Knöpfe, offene Details)
const snapshot = frame => frame.evaluate(() => {
  const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const stages = [...document.querySelectorAll('.stage, .step')];
  return JSON.stringify({
    stage: stages.map(visible).join(''),
    checked: [...document.querySelectorAll('input')].map(i => i.checked ? 1 : 0).join(''),
    disabled: [...document.querySelectorAll('button')].filter(b => !b.closest('.akte66-endnav')).map(b => b.disabled ? 1 : 0).join(''),
    details: [...document.querySelectorAll('details')].map(d => d.open ? 1 : 0).join(''),
  });
});

async function clickAround(frame, rounds) {
  let clicks = 0;
  for (let r = 0; r < rounds; r++) {
    const n = await frame.evaluate(() => {
      const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      document.querySelectorAll('[data-pw]').forEach(e => e.removeAttribute('data-pw'));
      const c = [...document.querySelectorAll('input[type=radio],input[type=checkbox],button,summary')]
        .filter(e => visible(e) && !e.disabled && !e.closest('.akte66-endnav') && !e.closest('dialog'));
      c.forEach((e, k) => e.setAttribute('data-pw', k));
      return c.length;
    });
    if (!n) break;
    const k = (r * 7 + 3) % n;
    try { await frame.locator(`[data-pw="${k}"]`).click({ timeout: 2000 }); clicks++; } catch (e) { /* verdeckt */ }
    await frame.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    await frame.waitForTimeout(250); // Mission 6 schaltet Stufen per setTimeout(180) frei
  }
  return clicks;
}

(async () => {
  const server = await serve();
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  page.on('dialog', d => d.accept());
  const errors = [];
  page.on('pageerror', e => errors.push('JS-Fehler: ' + e.message));

  await page.goto(base);
  const trailerFirst = await page.evaluate(() => !document.getElementById('trailer').classList.contains('hidden'));
  if (!trailerFirst) errors.push('Erster Besuch: Trailer wird nicht gezeigt');

  for (let i = 0; i < 7; i++) {
    await page.evaluate(n => openMission(n), i);
    let frame = await missionFrame(page);
    const initial = await snapshot(frame);
    const clicks = await clickAround(frame, ROUNDS);
    const before = await snapshot(frame);
    await page.reload();
    const state = await page.evaluate(() => ({ play: !document.getElementById('play').classList.contains('hidden'),
      trailer: !document.getElementById('trailer').classList.contains('hidden'), current }));
    frame = await missionFrame(page);
    const after = await snapshot(frame);
    const ok = state.play && !state.trailer && state.current === i && after === before;
    if (process.env.VERBOSE) console.log("  Stufen:", JSON.parse(before).stage);
    console.log(`Mission ${i + 1}: ${clicks} Klicks, Zustand ${before === initial ? 'unverändert' : 'verändert'} -> ${ok ? 'OK' : 'FEHLER'}`);
    if (!ok) errors.push(`Mission ${i + 1}: nach Reload ${JSON.stringify(state)}\n  vorher  ${before}\n  nachher ${after}`);
  }

  // Zurücksetzen
  await page.evaluate(() => { sceneAction('settings'); document.getElementById('resetMissionState').click(); openMission(0); });
  await page.reload();
  await page.evaluate(() => openMission(0));
  const fresh = await snapshot(await missionFrame(page));
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.evaluate(() => openMission(0));
  const blank = await snapshot(await missionFrame(page));
  console.log(`Zurücksetzen: ${fresh === blank ? 'OK' : 'FEHLER'}`);
  if (fresh !== blank) errors.push('Missionsstände zurücksetzen stellt nicht den Anfangszustand her');

  await browser.close();
  server.close();
  if (errors.length) { console.log('FEHLER:\n' + errors.join('\n')); process.exit(1); }
  console.log('OK: Fortschritt bleibt nach Neuladen erhalten.');
})();
