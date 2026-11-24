# AKTE 66 – Expedition ins verlorene Zeitalter

Deutschsprachige Lern-Web-App (Biologie/Geologie, Aussterben vor 66 Mio. Jahren) mit
Prolog + 7 Missionen. Ergebnisse schreiben die Schüler in ein **analoges Forscherheft**;
die App speichert nur Heft-Checks im `localStorage`.

## Goldene Regeln (Token sparen!)
- **`index.html` im Wurzelverzeichnis NIE lesen/greppen** – generiert, ~21 MB (Base64-Bilder).
  Immer in `src/` arbeiten.
- Bilder/Audio nie als Base64 anfassen: Dateien liegen in `assets/`, referenziert per
  `{{asset:img/...}}`.
- Missionsdateien haben sehr lange Zeilen → gezielt mit `grep -n` / `grep -o '.\{0,80\}Suchwort.\{0,80\}'`
  suchen statt ganze Dateien zu lesen.
- Nach jeder Änderung: `python3 tools/build.py` und `src/` + `assets/` + `index.html` gemeinsam committen.

## Struktur
```
src/index.html              Seitengerüst (Markup aller Ansichten) + Include-Platzhalter
src/css/main.css            Haupt-Styles   | src/css/learning-goals.css  Lernziel-Dialog
src/js/data.js              missionGoals, titles, subtitles, arts (Kartenbilder)
src/js/app.js               Kernlogik: Ansichten, Trailer, Zentrale, Missionen (iframe srcdoc)
src/js/prolog-progress.js   Prolog, Ränge/Abzeichen, Abschlussdialog, Urkunde, Lernziele
src/missions/mission-N.html eigenständige HTML-Seite je Mission (N = 1..7)
assets/img|audio/...        alle Medien (karten/, trailer/, zentrale/, mission-N/)
tools/                      build.py, import_single.py, rename_asset.py, smoke.cjs
docs/                       ARCHITEKTUR.md, LEARNINGS.md (Projektgedächtnis)
index.html                  BUILD-ERGEBNIS (Einzeldatei, offline lauffähig) – nicht editieren
```

## Befehle
```bash
python3 tools/build.py            # src + assets -> index.html
python3 tools/build.py --check    # ist index.html aktuell?
node tools/smoke.cjs [--shots]    # Chromium: Zentrale + 7 Missionen laden, JS-Fehler melden
python3 tools/import_single.py X.html   # Einzeldatei (z. B. Web-Upload) -> src/ + assets/
python3 tools/rename_asset.py alt neu   # Asset umbenennen inkl. Platzhalter
```

## Projektgedächtnis
- Details zu Ablauf, Speicher-Keys, Nachrichten-Protokoll: `docs/ARCHITEKTUR.md`
- **Neue Erkenntnisse, Entscheidungen, Stolperfallen sofort in `docs/LEARNINGS.md` eintragen**
  (kurz, datiert) und mit committen – damit jede neue Sitzung dort weitermachen kann.
- Sprache in UI und Doku: Deutsch. Commits gern auf Deutsch.
