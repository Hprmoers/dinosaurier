"""Gemeinsame Hilfsfunktionen für Build und Import von AKTE 66.

Platzhalter in den Quelldateien (src/):
  {{include:<pfad>}}  -> Inhalt von src/<pfad> (rekursiv)
  {{missions}}        -> JS-Array mit den HTML-Strings aus src/missions/mission-N.html
  {{asset:<pfad>}}    -> data:-URI der Datei assets/<pfad>
"""
from __future__ import annotations

import base64
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "index.html"

MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "video/mp4": "mp4",
}
EXT_TO_MIME = {v: k for k, v in MIME_TO_EXT.items()}

INCLUDE_RE = re.compile(r"\{\{include:([^}]+)\}\}")
ASSET_RE = re.compile(r"\{\{asset:([^}]+)\}\}")
MISSIONS_TOKEN = "{{missions}}"
DATA_URI_RE = re.compile(r"data:([a-z]+/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)")
MISSION_FILE_RE = re.compile(r"mission-(\d+)\.html$")


def read(path: Path) -> str:
    with open(path, encoding="utf-8", newline="") as f:
        return f.read()


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def encode_missions(docs: list[str]) -> str:
    """Kodiert die Missionen exakt so wie in der Original-Datei (JSON, `</` -> `<\\/`)."""
    return json.dumps(docs, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def mission_files() -> list[Path]:
    files = [p for p in (SRC / "missions").glob("mission-*.html") if MISSION_FILE_RE.search(p.name)]
    return sorted(files, key=lambda p: int(MISSION_FILE_RE.search(p.name).group(1)))


def asset_data_uri(rel: str) -> str:
    path = ASSETS / rel
    if not path.is_file():
        raise SystemExit(f"Asset fehlt: assets/{rel}")
    mime = EXT_TO_MIME.get(path.suffix[1:].lower())
    if not mime:
        raise SystemExit(f"Unbekannter Dateityp: assets/{rel}")
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def resolve_includes(text: str, depth: int = 0) -> str:
    if depth > 10:
        raise SystemExit("Include-Tiefe > 10 (Zyklus?)")

    def repl(m: re.Match) -> str:
        p = SRC / m.group(1)
        if not p.is_file():
            raise SystemExit(f"Include fehlt: src/{m.group(1)}")
        return resolve_includes(read(p), depth + 1)

    return INCLUDE_RE.sub(repl, text)


def build() -> str:
    html = resolve_includes(read(SRC / "index.html"))
    if MISSIONS_TOKEN in html:
        docs = [read(p) for p in mission_files()]
        html = html.replace(MISSIONS_TOKEN, encode_missions(docs), 1)
    cache: dict[str, str] = {}

    def asset(m: re.Match) -> str:
        rel = m.group(1)
        if rel not in cache:
            cache[rel] = asset_data_uri(rel)
        return cache[rel]

    return ASSET_RE.sub(asset, html)


def referenced_assets() -> set[str]:
    refs: set[str] = set()
    for p in SRC.rglob("*"):
        if p.is_file():
            refs.update(ASSET_RE.findall(read(p)))
    return refs
