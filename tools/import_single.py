#!/usr/bin/env python3
"""Zerlegt eine Einzeldatei-Version (z. B. per GitHub-Weboberfläche hochgeladen)
in src/ + assets/ und prüft, dass der Build wieder byte-identisch ist.

  python3 tools/import_single.py [pfad/zur/datei.html]   (Standard: index.html)

- Bilder/Audio werden anhand ihres Inhalts (SHA-256) wiedererkannt: bereits
  vorhandene Dateien in assets/ werden weiterverwendet, neue landen unter
  assets/<img|audio>/new/<hash>.<ext> und sollten danach sinnvoll umbenannt
  werden (Platzhalter in src/ mit anpassen, z. B. per sed).
- src/ wird komplett neu geschrieben. Ungenutzte Assets meldet tools/build.py.
"""
import base64
import json
import re
import shutil
import sys
from pathlib import Path

from akte66 import (ASSETS, DATA_URI_RE, MIME_TO_EXT, MISSIONS_TOKEN, SRC, build,
                    read, sha, write)

STYLE_NAMES = ["css/main.css", "css/learning-goals.css"]
SCRIPT_NAMES = ["js/app.js", "js/prolog-progress.js", "js/persistence.js"]
DOCS_RE = re.compile(r"const documents\s*=\s*")  # mit/ohne Leerzeichen (Original vs. Prettier)


def known_assets() -> dict[str, str]:
    return {sha(p.read_bytes()): str(p.relative_to(ASSETS))
            for p in ASSETS.rglob("*") if p.is_file()} if ASSETS.exists() else {}


def extract_assets(text: str, known: dict[str, str]) -> str:
    def repl(m: re.Match) -> str:
        mime, b64 = m.group(1), m.group(2)
        data = base64.b64decode(b64)
        if base64.b64encode(data).decode("ascii") != b64:
            return m.group(0)  # nicht verlustfrei rekonstruierbar -> unverändert lassen
        h = sha(data)
        if h not in known:
            kind = "audio" if mime.startswith("audio/") else "img"
            ext = MIME_TO_EXT.get(mime)
            if not ext:
                return m.group(0)
            rel = f"{kind}/new/{h[:10]}.{ext}"
            (ASSETS / rel).parent.mkdir(parents=True, exist_ok=True)
            (ASSETS / rel).write_bytes(data)
            known[h] = rel
            print("  neues Asset:", rel)
        return "{{asset:" + known[h] + "}}"

    return DATA_URI_RE.sub(repl, text)


def split_blocks(shell: str, files: dict[str, str]) -> str:
    """Lagert alle <style>/<script>-Blöcke der Hauptseite in Dateien aus."""
    out, pos, n_style, n_script = [], 0, 0, 0
    opener = re.compile(r"<(style|script)(\s[^>]*)?>")
    while True:
        m = opener.search(shell, pos)
        if not m:
            break
        tag = m.group(1)
        end = shell.find(f"</{tag}>", m.end())
        body = shell[m.end():end]
        if tag == "style":
            name = STYLE_NAMES[n_style] if n_style < len(STYLE_NAMES) else f"css/style-{n_style + 1}.css"
            n_style += 1
            repl = "{{include:" + name + "}}"
            files[name] = body
        else:
            name = SCRIPT_NAMES[n_script] if n_script < len(SCRIPT_NAMES) else f"js/script-{n_script + 1}.js"
            n_script += 1
            docs_match = DOCS_RE.search(body)
            if docs_match:  # Datenteil (Lernziele, Titel, Kartenbilder) separat
                i = docs_match.start()
                files["js/data.js"], files[name] = body[:i], body[i:]
                repl = "{{include:js/data.js}}{{include:" + name + "}}"
            else:
                files[name] = body
                repl = "{{include:" + name + "}}"
        out.append(shell[pos:m.end()] + repl)
        pos = end
    out.append(shell[pos:])
    return "".join(out)


def main() -> int:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "index.html").resolve()
    original = read(source)
    known = known_assets()

    docs_match = DOCS_RE.search(original)
    if not docs_match:
        print("FEHLER: 'const documents=' (Missions-Array) nicht gefunden in", source)
        return 1
    a = docs_match.end()
    docs, end = json.JSONDecoder().raw_decode(original, a)
    shell = original[:a] + MISSIONS_TOKEN + original[end:]

    if SRC.exists():
        shutil.rmtree(SRC)
    for i, doc in enumerate(docs, 1):
        write(SRC / "missions" / f"mission-{i}.html", extract_assets(doc, known))

    files: dict[str, str] = {}
    shell = split_blocks(extract_assets(shell, known), files)
    write(SRC / "index.html", shell)
    for name, body in files.items():
        write(SRC / name, body)

    if build(offline=True) != original:
        print("FEHLER: Build ist nicht byte-identisch mit", source)
        return 1
    print(f"OK: {source.name} importiert, Build ist byte-identisch.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
