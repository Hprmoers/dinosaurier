# AKTE 66 – Expedition ins verlorene Zeitalter

Deutschsprachige Lern-Web-App (Biologie/Geologie, Aussterben vor 66 Mio. Jahren) mit
Prolog + 7 Missionen. Ergebnisse schreiben die Schüler in ein **analoges Forscherheft**;
die App speichert nur Heft-Checks im `localStorage`.

## Goldene Regeln (Token sparen!)
- **`index.html` im Wurzelverzeichnis nicht lesen/editieren** – Build-Ergebnis. Immer in `src/` arbeiten.
- Bilder/Audio nie als Base64 anfassen: Dateien liegen in `assets/`, referenziert per
  `{{asset:img/...}}`.
- Alle Quellen in `src/` sind mit Prettier formatiert (Missionen 300–2000 Zeilen, `main.css` ~1400)
  → mit `grep -n` die Stelle suchen und nur den Ausschnitt lesen (Read mit offset/limit).
- In `src/js/*.js` nie ein zusammenhängendes Script-Schluss-Tag in Strings/Kommentaren
  (beendet das Inline-Script) → `"<" + "/script>"`. Der Build bricht sonst ab.
- Bei optischen/HTML-Umbauten vorher `node tools/visual.cjs` als Referenz aufnehmen, danach vergleichen.
- Nach jeder Änderung: `python3 tools/build.py`, `node tools/smoke.cjs`, `node tools/persist.cjs`, dann `src/` + `assets/` +
  `index.html` gemeinsam committen.

## Auslieferung
GitHub Pages (Branch `main`, Wurzelordner) → https://hprmoers.github.io/dinosaurier/
Merge nach `main` = live (Deployment ~1 Min.). `.nojekyll` sorgt für reines statisches Hosting.

## Struktur
```
src/index.html              Seitengerüst (Markup aller Ansichten) + Include-Platzhalter
src/css/main.css            Haupt-Styles   | src/css/learning-goals.css  Lernziel-Dialog
src/js/data.js              missionGoals, titles, subtitles, arts (Kartenbilder)
src/js/app.js               Kernlogik: Ansichten, Trailer, Zentrale, Missionen (iframe srcdoc)
src/js/prolog-progress.js   Prolog, Ränge/Abzeichen, Abschlussdialog, Urkunde, Lernziele
src/js/persistence.js       Ort + Missionsstand über Reload merken (Klicks aufzeichnen/abspielen)
src/missions/mission-N.html eigenständige HTML-Seite je Mission (N = 1..7)
assets/img|audio/...        alle Medien (karten/, trailer/, zentrale/, mission-N/)
tools/                      build.py, import_single.py, rename_asset.py, Tests (smoke/persist/visual)
docs/                       ARCHITEKTUR.md, LEARNINGS.md (Projektgedächtnis)
index.html                  BUILD-ERGEBNIS = ausgelieferte Web-Version (lädt Medien aus assets/)
dist/                       Offline-Einzeldatei (nur bei Bedarf gebaut, nicht im Git)
```

## Befehle
```bash
python3 tools/build.py            # src -> index.html (Web-Version, ~0,4 MB)
python3 tools/build.py --check    # ist index.html aktuell?
python3 tools/build.py --offline  # dist/akte66-offline.html (alles eingebettet, ~19 MB)
node tools/smoke.cjs [--shots]    # Chromium über lokalen HTTP-Server: Zentrale + 7 Missionen,
                                  # meldet JS-Fehler, 404s und nicht geladene Bilder
node tools/persist.cjs [runden]   # Reload-Test: Ort + Missionsstand bleiben erhalten, Reset geht
node tools/visual.cjs DIR [--shell]  # 343 reproduzierbare Screenshots: alle Ansichten der Hauptseite
                                  # (Desktop + Handy) + Missionen; --shell = nur Hauptseite (schnell)
python3 tools/visual_compare.py VORHER NACHHER   # pixelgenau vergleichen (Toleranz ±2)
npx prettier@3.3.3 --write "src/missions/*.html" "src/css/*.css" "src/js/*.js"   # Formatierung
npx prettier@3.3.3 --write --embedded-language-formatting=off src/index.html     # (Konfig: .prettierrc.json)
python3 tools/import_single.py X.html   # Einzeldatei (z. B. Web-Upload) -> src/ + assets/
python3 tools/rename_asset.py alt neu   # Asset umbenennen inkl. Platzhalter
```

## Projektgedächtnis
- Details zu Ablauf, Speicher-Keys, Nachrichten-Protokoll: `docs/ARCHITEKTUR.md`
- **Neue Erkenntnisse, Entscheidungen, Stolperfallen sofort in `docs/LEARNINGS.md` eintragen**
  (kurz, datiert) und mit committen – damit jede neue Sitzung dort weitermachen kann.
- Sprache in UI und Doku: Deutsch. Commits gern auf Deutsch.
