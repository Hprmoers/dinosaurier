#!/usr/bin/env python3
"""Baut AKTE 66 aus src/ + assets/.

  python3 tools/build.py            # Web-Version -> index.html (lädt Medien aus assets/)
  python3 tools/build.py --check    # prüfen, ob index.html aktuell ist (Exit 1 wenn nicht)
  python3 tools/build.py --offline  # Einzeldatei mit eingebetteten Medien -> dist/akte66-offline.html
"""
import sys

from akte66 import ASSETS, OFFLINE_OUTPUT, OUTPUT, build, read, referenced_assets, write


def main() -> int:
    refs = referenced_assets()
    unused = [str(p.relative_to(ASSETS)) for p in sorted(ASSETS.rglob("*"))
              if p.is_file() and str(p.relative_to(ASSETS)) not in refs]
    if unused:
        print("Hinweis: nicht verwendete Assets:", *unused, sep="\n  ")
    if "--offline" in sys.argv:
        html = build(offline=True)
        write(OFFLINE_OUTPUT, html)
        print(f"dist/{OFFLINE_OUTPUT.name} geschrieben ({len(html.encode()) / 1e6:.1f} MB)")
        return 0
    html = build()
    if "--check" in sys.argv:
        if not OUTPUT.exists() or read(OUTPUT) != html:
            print("index.html ist NICHT aktuell -> python3 tools/build.py ausführen")
            return 1
        print("index.html ist aktuell.")
        return 0
    write(OUTPUT, html)
    print(f"index.html geschrieben ({len(html.encode()) / 1e3:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
