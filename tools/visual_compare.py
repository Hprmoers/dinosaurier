#!/usr/bin/env python3
"""Vergleicht zwei Screenshot-Ordner von tools/visual.cjs mit kleiner Toleranz
(Rendering-Rauschen von ±2 Farbstufen wird ignoriert).

  python3 tools/visual_compare.py <referenz> <neu>
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

TOLERANCE = 2


def main(ref: Path, new: Path) -> int:
    bad = []
    files = sorted(p.name for p in ref.glob("*.png"))
    for name in files:
        if not (new / name).exists():
            bad.append(f"{name}: fehlt")
            continue
        a, b = Image.open(ref / name).convert("RGB"), Image.open(new / name).convert("RGB")
        if a.size != b.size:
            bad.append(f"{name}: Größe {a.size} -> {b.size}")
            continue
        diff = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v > TOLERANCE else 0)
        if diff.getbbox():
            bad.append(f"{name}: Unterschied in Bereich {diff.getbbox()}")
    if bad:
        print(f"UNTERSCHIEDE ({len(bad)} von {len(files)}):", *bad, sep="\n  ")
        return 1
    print(f"OK: {len(files)} Screenshots gleich (Toleranz ±{TOLERANCE}).")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(Path(sys.argv[1]), Path(sys.argv[2])))
