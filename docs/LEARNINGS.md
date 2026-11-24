# Learnings & Entscheidungen (Projektgedächtnis)

Neue Einträge oben anfügen. Format: `## JJJJ-MM-TT – Thema`, dann kurze Stichpunkte.

## 2026-11-24 – Alle Quellen formatiert
- `src/index.html`, `src/css/*.css`, `src/js/*.js` mit Prettier formatiert (z. B. `data.js`: 1 → 87 Zeilen,
  `main.css`: max. Zeilenlänge 1682 → 102). Verbleibende lange Zeilen = lange Text-/HTML-Strings.
- `src/index.html` nur mit `--embedded-language-formatting=off`: In `<style>`/`<script>` stehen nur
  `{{include:…}}`-Platzhalter, die Prettier sonst als CSS/JS parsen würde.
- Missions-Platzhalter in `app.js` ist jetzt ein String-Literal `"{{missions}}"` (gültiges JS für
  Prettier). Build ersetzt inkl. Anführungszeichen; altes `{{missions}}` wird weiter akzeptiert.
- **Falle:** Prettier „vereinfacht“ `'<\/script>'` zu `"</script>"` → das Inline-Script der Hauptseite
  endet mitten im Code, der Rest erscheint als Text (Seite 312 px höher, auf dem Handy breiter).
  Vom visuellen Test sofort erkannt. Fix: `"<" + "/script>"`; der Build prüft jetzt jede eingebundene
  `.js`-Datei auf `</script` und bricht sonst ab (auch Kommentare zählen!).
- `tools/import_single.py` erkennt `const documents=` jetzt mit oder ohne Leerzeichen und benennt
  das 3. Script `js/persistence.js`. Rundlauf (Offline-Build → Import → Build) ist byte-identisch;
  nach einem Import Prettier erneut laufen lassen (Leerzeilen an Include-Grenzen).
- `tools/visual.cjs` deckt jetzt auch die Hauptseite ab: 14 Ansichten × Desktop 1280 px + Handy 390 px
  (Trailer, Zentrale, Liste, Hilfen, Forscherheft, Prolog, Archiv gesperrt/frei, Einstellungen,
  Urkunde gesperrt/fertig, Lernziel- und Abschlussdialog, Spielkopf) mit fester Uhrzeit
  (`page.clock.setFixedTime`, wegen Datum auf der Urkunde). Gesamt 343 Screenshots, vorher/nachher gleich.

## 2026-11-24 – Missionsdateien formatiert
- `src/missions/*.html` mit Prettier 3.3.3 formatiert (`.prettierrc.json`: printWidth 110,
  `htmlWhitespaceSensitivity: css` → Leerraum zwischen Inline-Elementen bleibt erhalten).
  537 → 8270 Zeilen, längste Zeile 8609 → 278 Zeichen.
- Geprüft mit neuem visuellen Regressionstest: `tools/visual.cjs` (15 Klickrunden × 3 Scrollpositionen
  je Mission = 315 Screenshots, fester Zufall, Animationen aus) + `tools/visual_compare.py`.
  Ergebnis: identisch. Einzelne Screenshots weichen zwischen Läufen um ±1 Farbstufe ab
  (Bild-Dekodierung) → Vergleich mit Toleranz ±2, nicht bytegenau.
- Folge: Missions-Hash ändert sich → gespeicherte Missionsstände (Klickprotokolle) werden einmalig
  verworfen. Bei jeder inhaltlichen Missionsänderung passiert das ebenso (gewollt).
- `index.html` wächst durch Einrückung auf ~410 KB (gzip über Pages macht das fast wett).
- `tools/import_single.py` würde unformatierte Missionen erzeugen → nach einem Import erneut Prettier.

## 2026-11-24 – Fortschritt über Neuladen erhalten
- Problem: Gespeichert wurden nur Heft-Checks + Prolog. Reload startete immer beim Trailer
  (`view('trailer')` am Ende von app.js) und jede Mission wieder bei Stufe 1.
- Lösung in `src/js/persistence.js` ohne Änderung der Missionsdateien: Ort merken + Klicks im
  iframe aufzeichnen und beim Öffnen abspielen (Details: ARCHITEKTUR.md). Funktioniert, weil
  Missionen deterministische Klick-Abläufe sind.
- Stolperfallen: `</script>` in einem JS-String innerhalb eines Inline-Scripts beendet das Script →
  `<\/script>` schreiben. Mission 6 schaltet per `setTimeout(…,180)` frei → beim Abspielen sofort
  ausführen. Mission 4 nutzt `confirm` → Antwort mitprotokollieren. Label-Klicks erzeugen einen
  zweiten Klick auf das Input → nur einen aufzeichnen (sonst Checkbox doppelt umgeschaltet).
  Mission 7 zieht Fragen per `Math.random` → nach Reload evtl. andere Frage (kosmetisch).
- Test `tools/persist.cjs`: klickt deterministisch in jeder Mission, lädt neu, vergleicht Zustand.
- `.claude/settings.json`: `Read(./index.html)` sperrte auch `src/index.html`, wenn das Arbeits-
  verzeichnis `src/` war (`./` = relativ zum cwd). Korrigiert auf `Read(/index.html)` /
  `Grep(/index.html)` (führendes `/` = relativ zum Projektordner).

## 2026-11-24 – Ausgeliefert wird die optimierte Web-Version
- `index.html` referenziert Medien jetzt als `assets/...` statt Base64: 21,6 MB → 0,3 MB HTML.
  Vorteile: kein 33-%-Base64-Overhead, paralleles Laden, Browser-Cache, Missionsbilder erst bei Bedarf.
- Offline-Einzeldatei bleibt per `python3 tools/build.py --offline` möglich (`dist/`, gitignored).
- `expeditionszentrale.webp` war quasi verlustfrei (2,2 MB) → WebP q90 (0,54 MB), visuell identisch
  geprüft (Text auf den Karten scharf). Übrige Bilder sind bereits angemessen komprimiert.
- `srcdoc`-iframes erben die Basis-URL der Elternseite → relative Pfade in Missionen funktionieren
  (per Smoke-Test über HTTP-Server bestätigt, inkl. CSS-`url()`-Hintergründe).
- Smoke-Test: Bilder mit `loading="lazy"` in versteckten Stufen laden nie → Test setzt sie auf eager,
  sonst hängt er.
- `.nojekyll` angelegt: Pages liefert statisch aus, ohne Jekyll/Liquid (Doku enthält `{{...}}`).

## 2026-11-24 – Umstellung auf src/ + Build
- Ausgangslage: eine 21,6-MB-`index.html` (per GitHub-Web hochgeladen), darin 46 Base64-Medien
  (33 eindeutige) und 7 Missionen als JSON-String-Array `const documents=[...]` (iframe `srcdoc`).
- Zerlegt in `src/` (~280 KB Text) + `assets/` (33 Dateien). Build ist **byte-identisch** mit
  dem Original → keine Verhaltensänderung durch das Refactoring.
- `index.html` bleibt als Build-Ergebnis im Repo (GitHub Pages liefert sie aus); in
  `.gitattributes` als generiert/ohne Diff markiert, in `.claude/settings.json` für Read/Grep gesperrt.
- Missionsdateien bestanden anfangs aus wenigen sehr langen Zeilen (inzwischen formatiert, s. o.).
- Wird wieder eine komplette `index.html` hochgeladen (z. B. neue Version aus anderem Tool):
  `python3 tools/import_single.py index.html` – erkennt bekannte Bilder per Hash wieder,
  neue landen in `assets/img/new/` → mit `tools/rename_asset.py` sinnvoll benennen.
- Doppelt genutzte Bilder: mission-1/hero auch in Mission 2; karten/mission-5 auch in Mission 5;
  Hero-Bilder in Missionen 3–6 sowohl als CSS-Hintergrund als auch als `<img>`.
