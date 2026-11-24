#!/usr/bin/env python3
"""Benennt ein Asset um und passt alle {{asset:...}}-Platzhalter in src/ an.

  python3 tools/rename_asset.py img/new/abc.jpg img/mission-1/hero.jpg [alt neu ...]
"""
import sys

from akte66 import ASSETS, SRC, read, write


def main(pairs: list[str]) -> int:
    if not pairs or len(pairs) % 2:
        print(__doc__)
        return 2
    texts = {p: read(p) for p in SRC.rglob("*") if p.is_file()}
    for old, new in zip(pairs[::2], pairs[1::2]):
        src, dst = ASSETS / old, ASSETS / new
        if not src.is_file():
            print("fehlt:", old)
            return 1
        if dst.exists():
            print("existiert schon:", new)
            return 1
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        for p in texts:
            texts[p] = texts[p].replace("{{asset:" + old + "}}", "{{asset:" + new + "}}")
    for p, t in texts.items():
        if t != read(p):
            write(p, t)
    for d in sorted(ASSETS.rglob("*"), reverse=True):  # leere Ordner entfernen
        if d.is_dir() and not any(d.iterdir()):
            d.rmdir()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
