# Architektur AKTE 66

## Build-Prinzip
`tools/build.py` setzt `src/index.html` zusammen:
1. `{{include:pfad}}` → Inhalt von `src/pfad` (rekursiv)
2. `{{missions}}` (in `src/js/app.js`, `const documents={{missions}};`) → JSON-Array der
   Dateien `src/missions/mission-1..N.html` (kodiert mit `</` → `<\/`)
3. `{{asset:pfad}}` → Web-Build: `assets/pfad` (relative URL) · Offline-Build: `data:`-URI

- **Web-Version** (`index.html`, ausgeliefert über GitHub Pages): ~0,3 MB HTML, Bilder werden
  einzeln, parallel und vom Browser gecacht geladen; Missionsbilder erst beim Öffnen der Mission.
- **Offline-Version** (`--offline` → `dist/akte66-offline.html`): eine Datei mit allem eingebettet,
  zum Weitergeben per USB-Stick/Mail ohne Internet.
- Relative Asset-Pfade funktionieren auch in den Missionen, weil `srcdoc`-iframes die Basis-URL
  der Elternseite erben.

## Ansichten (alle in `src/index.html`, Umschalten per `view(id)`)
`trailer` (Vorspann mit Musik) → `cover` (Expeditionszentrale: großes Bild mit unsichtbaren
Klickflächen `.scene-hit`) · `prolog` · `hub` (Missionsliste) · `helpers` (Forscherheft-Hilfe) ·
`play` (Mission im `#gameFrame`) · `archive` (ab 3 Heft-Checks frei) · `settings` · `certificate`
(nur bei 7/7). Dialoge: `#learningGoalDialog`, `#missionSolved`.

Klicks laufen zentral über `data-scene="..."` → `sceneAction(action)`
(Werte: home, prolog, notebook, help, archive, settings, fullscreen, replay, certificate, mission-0..6).

## Missionen
- `openMission(i)` setzt `gameFrame.srcdoc = missionWithNavigation(documents[i], i)`;
  dabei wird vor `</body>` eine Endnavigation (`.akte66-endnav`) eingefügt.
- Mission → Elternseite per `postMessage({type:'akte66-mission-navigation', mission:i,
  target:'naechste'|'zentrale'|'abschluss'})`.
- Jede Mission ist eine komplette HTML-Seite mit eigenem CSS/JS, Stufen als
  `<section class="stage" id="s0..">` bzw. `stage0..`/`step`.

| Nr | Titel | Bilder (`assets/img/`) |
|----|-------|------------------------|
| 1 | Die verborgene Schicht (Iridium, Gubbio) | mission-1/ |
| 2 | Spuren aus dem All (Schockquarz, Krater) | mission-2/, nutzt auch mission-1/hero |
| 3 | Eine Welt gerät aus dem Gleichgewicht (Nahrungsnetz) | mission-3/ |
| 4 | Die geteilte Expedition (Teamarbeit, Rollen) | mission-4/ |
| 5 | Der zweite Verdächtige (Dekkan-Trapps, Vulkanismus) | mission-5/, karten/mission-5 |
| 6 | Die Überlebenden | mission-6/ |
| 7 | Der Forschungskongress (Vortrag) | mission-7/ |

## Zustand / Speicher
- `localStorage['akte66-expedition-2026']` – Array(7) Booleans (Heft-Checks der Missionen)
- `localStorage['akte66-prolog-v1']` – `'true'|'false'` (Prolog bestätigt)
- Rang aus Anzahl Checks: 0 Auf Spurensuche · ≤2 Feldforschung · ≤4 Beweisforschung ·
  ≤6 Expeditionsprofi · 7 Forschungsleitung; 100 Punkte je Check.

## Wichtig: Erweiterungsmuster
`src/js/prolog-progress.js` erweitert `app.js` durch **Überschreiben** globaler Funktionen
(`openMission`, `drawCards`, `sceneAction`, `refreshScene`) nach dem Muster
`const base=fn; fn=function(){base(); ...}`. Reihenfolge der Scripts daher nicht ändern;
`refreshScene` wird dort komplett ersetzt.
