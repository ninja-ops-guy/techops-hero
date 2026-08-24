#!/usr/bin/env python3
"""Extract the v7.36 Katrin/Manchez gameplay frames from the Library sheet.

The source PNG has a baked checkerboard background, so this script keys out the
near-white checker, trims each authored cell, exports individual transparent
frame PNGs, and packs the same frames into the runtime atlas consumed by
KATRIN_MANCHEZ.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "library-downloads" / "Manchez and Katrin Knockdown Atlas.png"
FRAME_DIR = ROOT / "assets" / "v736" / "katrin_manchez"
ATLAS_PATH = ROOT / "assets" / "v736" / "katrin_manchez_atlas.png"
MANIFEST_PATH = ROOT / "assets" / "v736" / "katrin_manchez_manifest.json"
ATLAS_JS_PATH = ROOT / "katrin_manchez.atlas.js"

X_BOUNDS = [0, 210, 400, 595, 775, 930, 1090, 1254]
Y_BOUNDS = [50, 270, 500, 780, 1000, 1210]

ROWS = [
    ("man", ["idle0", "idle1", "hack", "pounce", "bark", "roll", "wall_hit"]),
    ("man", ["bark", "look", "strike", "crouch", "leap", "down", "wall_down"]),
    ("kat", ["idle0", "idle1", "hack", "pounce", "leap", "roll", "wall_hit"]),
    ("kat", ["bark", "look", "strike", "crouch", "shield", "down", "cheer"]),
    ("kat", ["shield", "down_heavy", "hack_low", "pounce_low", "leap_low", "dizzy", "stand"]),
]

ALIASES = {
    "man_strike": "man_pounce",
    "man_crouch": "man_shield",
    "man_wall_down": "man_down_wall",
    "kat_strike": "kat_pounce",
    "kat_crouch": "kat_shield",
    "kat_down_heavy": "kat_sleep",
    "kat_hack_low": "kat_hack2",
    "kat_pounce_low": "kat_pounce2",
    "kat_leap_low": "kat_leap2",
}


def is_checker_pixel(r: int, g: int, b: int) -> bool:
    return r > 225 and g > 225 and b > 225 and max(r, g, b) - min(r, g, b) < 14


def clean_cell(sheet: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    cell = sheet.crop(box).convert("RGBA")
    px = cell.load()
    w, h = cell.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_checker_pixel(r, g, b):
                px[x, y] = (r, g, b, 0)
            else:
                px[x, y] = (r, g, b, a)
    bbox = cell.getchannel("A").getbbox()
    if not bbox:
        raise ValueError(f"empty source cell {box}")
    pad = 8
    x1 = max(0, bbox[0] - pad)
    y1 = max(0, bbox[1] - pad)
    x2 = min(w, bbox[2] + pad)
    y2 = min(h, bbox[3] + pad)
    return cell.crop((x1, y1, x2, y2))


def pack(frames: dict[str, Image.Image]) -> tuple[Image.Image, dict[str, list[int]]]:
    max_w = 1024
    gap = 4
    x = gap
    y = gap
    row_h = 0
    placements: dict[str, list[int]] = {}
    rows: list[tuple[str, Image.Image, int, int]] = []
    for key, frame in frames.items():
        w, h = frame.size
        if x + w + gap > max_w:
            x = gap
            y += row_h + gap
            row_h = 0
        placements[key] = [x, y, w, h]
        rows.append((key, frame, x, y))
        x += w + gap
        row_h = max(row_h, h)
    atlas_h = y + row_h + gap
    atlas = Image.new("RGBA", (max_w, atlas_h), (0, 0, 0, 0))
    for key, frame, fx, fy in rows:
        atlas.alpha_composite(frame, (fx, fy))
    return atlas, placements


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"missing source sheet: {SOURCE}")
    sheet = Image.open(SOURCE).convert("RGBA")
    if sheet.size != (1254, 1254):
        raise SystemExit(f"unexpected source dimensions: {sheet.size}")

    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    ATLAS_PATH.parent.mkdir(parents=True, exist_ok=True)

    frames: dict[str, Image.Image] = {}
    source_cells: dict[str, list[int]] = {}
    for row_idx, (prefix, names) in enumerate(ROWS):
        y1, y2 = Y_BOUNDS[row_idx], Y_BOUNDS[row_idx + 1]
        for col_idx, name in enumerate(names):
            x1, x2 = X_BOUNDS[col_idx], X_BOUNDS[col_idx + 1]
            key = f"{prefix}_{name}"
            frame = clean_cell(sheet, (x1, y1, x2, y2))
            frames[key] = frame
            source_cells[key] = [x1, y1, x2 - x1, y2 - y1]
            frame.save(FRAME_DIR / f"{key}.png")

    for alias, target in ALIASES.items():
        if alias in frames and target not in frames:
            frames[target] = frames[alias]
            source_cells[target] = source_cells[alias]
            frames[alias].save(FRAME_DIR / f"{target}.png")

    # Reuse the authored stand/leap/down poses for the runtime's existing names.
    fallbacks = {
        "man_idle2": "man_idle1",
        "man_idle3": "man_pounce",
        "man_idle4": "man_leap",
        "man_idle5": "man_roll",
        "man_idle6": "man_look",
        "man_hack": "man_hack",
        "man_bark": "man_bark",
        "man_shield": "man_shield",
        "man_down": "man_down",
        "kat_idle2": "kat_hack",
        "kat_idle3": "kat_pounce",
        "kat_idle4": "kat_leap",
        "kat_idle5": "kat_roll",
        "kat_idle6": "kat_look",
        "kat_hack": "kat_hack",
        "kat_bark": "kat_bark",
        "kat_shield": "kat_shield",
        "kat_down": "kat_down",
    }
    for key, target in fallbacks.items():
        if key not in frames and target in frames:
            frames[key] = frames[target]
            source_cells[key] = source_cells[target]

    for key, frame in frames.items():
        frame.save(FRAME_DIR / f"{key}.png")

    atlas, rects = pack(frames)
    atlas.save(ATLAS_PATH)

    manifest = {
        "source": SOURCE.name,
        "source_size": list(sheet.size),
        "generated_at": "2026-08-24",
        "background_key": "near-white checkerboard alpha key",
        "frame_count": len(frames),
        "runtime_atlas": str(ATLAS_PATH.relative_to(ROOT)),
        "frame_directory": str(FRAME_DIR.relative_to(ROOT)),
        "frames": {
            key: {
                "source_cell": source_cells[key],
                "atlas_rect": rects[key],
                "png": str((FRAME_DIR / f"{key}.png").relative_to(ROOT)),
            }
            for key in frames
        },
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    js = (
        "// katrin_manchez.atlas.js -- source-derived v7.36 Good Dogs runtime atlas.\n"
        "// Generated by scripts/extract_katrin_manchez_assets.py from "
        "Manchez and Katrin Knockdown Atlas.png.\n"
        "window.KATRIN_MANCHEZ = "
        + json.dumps(
            {
                "src": "assets/v736/katrin_manchez_atlas.png",
                "cell": 0,
                "cellH": 0,
                "pivot": [0, 0],
                "frames": rects,
            },
            separators=(",", ":"),
        )
        + ";\n"
    )
    ATLAS_JS_PATH.write_text(js, encoding="utf-8")
    print(json.dumps({"frames": len(frames), "atlas": str(ATLAS_PATH), "manifest": str(MANIFEST_PATH)}, indent=2))


if __name__ == "__main__":
    main()
