#!/usr/bin/env python3
"""Baut die auslieferbare Einzeldatei index.html aus src/ + assets/.

  python3 tools/build.py          # index.html neu schreiben
  python3 tools/build.py --check  # nur prüfen, ob index.html aktuell ist (Exit 1 wenn nicht)
"""
import sys

from akte66 import ASSETS, OUTPUT, build, read, referenced_assets, write


def main() -> int:
    html = build()
    unused = sorted(
        str(p.relative_to(ASSETS)) for p in ASSETS.rglob("*") if p.is_file()
    )
    unused = [a for a in unused if a not in referenced_assets()]
    if unused:
        print("Hinweis: nicht verwendete Assets:", *unused, sep="\n  ")
    if "--check" in sys.argv:
        current = read(OUTPUT) if OUTPUT.exists() else ""
        if current != html:
            print("index.html ist NICHT aktuell -> python3 tools/build.py ausführen")
            return 1
        print("index.html ist aktuell.")
        return 0
    write(OUTPUT, html)
    print(f"index.html geschrieben ({len(html.encode('utf-8')) / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
