# Learnings & Entscheidungen (Projektgedächtnis)

Neue Einträge oben anfügen. Format: `## JJJJ-MM-TT – Thema`, dann kurze Stichpunkte.

## 2026-11-24 – Umstellung auf src/ + Build
- Ausgangslage: eine 21,6-MB-`index.html` (per GitHub-Web hochgeladen), darin 46 Base64-Medien
  (33 eindeutige) und 7 Missionen als JSON-String-Array `const documents=[...]` (iframe `srcdoc`).
- Zerlegt in `src/` (~280 KB Text) + `assets/` (33 Dateien). Build ist **byte-identisch** mit
  dem Original → keine Verhaltensänderung durch das Refactoring.
- Entscheidung: `index.html` bleibt als Build-Ergebnis im Repo (Einzeldatei, offline, direkt
  auslieferbar/GitHub Pages). Sie ist in `.gitattributes` als generiert/ohne Diff markiert
  und in `.claude/settings.json` für Read/Grep gesperrt.
- Missionsdateien bestehen aus wenigen sehr langen Zeilen (Original-Formatierung beibehalten,
  um byte-identisch zu bleiben). Mögliche spätere Verbesserung: formatieren (Prettier), dann
  mit `node tools/smoke.cjs --shots` visuell prüfen.
- Wird wieder eine komplette `index.html` hochgeladen (z. B. neue Version aus anderem Tool):
  `python3 tools/import_single.py index.html` – erkennt bekannte Bilder per Hash wieder,
  neue landen in `assets/img/new/` → mit `tools/rename_asset.py` sinnvoll benennen.
- Doppelt genutzte Bilder: mission-1/hero auch in Mission 2; karten/mission-5 auch in Mission 5;
  Hero-Bilder in Missionen 3–6 sowohl als CSS-Hintergrund als auch als `<img>`.
