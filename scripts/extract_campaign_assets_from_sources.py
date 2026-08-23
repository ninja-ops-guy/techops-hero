#!/usr/bin/env python3
"""Extract production-aligned TechOps Hero campaign PNGs from source sheets.

This script is intentionally conservative:
  - it uses only user-provided source sheets in upload/
  - it removes white sheet backgrounds into alpha
  - it writes a manifest with source filename, crop, canvas, and QC notes

The deterministic generator remains available as a fallback, but these exports
move Act I day-job runtime art toward the intended production look.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, Optional, Tuple

from PIL import Image, ImageChops, ImageFilter, ImageOps, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
UPLOAD = ROOT / "upload"
OUT = ROOT / "assets" / "campaign"
MANIFEST = OUT / "production_source_manifest.json"


Box = Tuple[int, int, int, int]
Canvas = Tuple[int, int]


@dataclass(frozen=True)
class Extract:
    slot_id: str
    source: str
    crop: Box
    canvas: Canvas
    mode: str
    qc: str
    preserve_panel: bool = False
    threshold: int = 246


EXTRACTS: tuple[Extract, ...] = (
    Extract(
        "workstation.corporate_aircraft_panel",
        "447C6CBF-89A4-4944-815E-58EE4F913E89.jpeg",
        (20, 105, 580, 485),
        (640, 432),
        "panel",
        "source panel is clean, readable, and matches the corporate-video aircraft beat",
        preserve_panel=True,
    ),
    Extract(
        "workstation.felicia.video_frame",
        "447C6CBF-89A4-4944-815E-58EE4F913E89.jpeg",
        (615, 20, 1008, 488),
        (512, 512),
        "panel",
        "source panel provides Felicia violin identity without pre-reveal Violinist labeling",
        preserve_panel=True,
    ),
    Extract(
        "workstation.orpheus.glitch_frame",
        "447C6CBF-89A4-4944-815E-58EE4F913E89.jpeg",
        (18, 530, 465, 1015),
        (512, 512),
        "panel",
        "source panel includes exact ORPHEUS visual language and glitch treatment",
        preserve_panel=True,
    ),
    Extract(
        "ui.standup.board",
        "50E9D510-F28F-4A50-8B53-69EA441E2830.jpeg",
        (20, 75, 1426, 1008),
        (800, 600),
        "ui_panel",
        "full standup board is legible enough for native UI context and ticket-ownership beat",
        preserve_panel=True,
    ),
    Extract(
        "ui.standup.ticket_card",
        "50E9D510-F28F-4A50-8B53-69EA441E2830.jpeg",
        (323, 688, 583, 855),
        (320, 224),
        "ui_card",
        "label-printer ticket card directly matches Shipping Printer Offline story beat",
        preserve_panel=True,
    ),
    Extract(
        "ui.standup.owner_badge",
        "50E9D510-F28F-4A50-8B53-69EA441E2830.jpeg",
        (1130, 112, 1335, 178),
        (256, 128),
        "ui_badges",
        "team ownership avatars support the all-tickets-owned mechanic",
        preserve_panel=False,
    ),
    Extract(
        "shipping.clerk.idle",
        "A80875E1-1183-46B7-811F-06291CAE24B3.jpeg",
        (5, 5, 155, 405),
        (256, 512),
        "character",
        "primary Shipping clerk pose is high resolution and readable after alpha cleanup",
    ),
    Extract(
        "shipping.label_printer",
        "A80875E1-1183-46B7-811F-06291CAE24B3.jpeg",
        (690, 48, 775, 155),
        (192, 192),
        "prop",
        "compact printer prop matches the printer-offline ticket",
    ),
    Extract(
        "shipping.printed_label_success",
        "A80875E1-1183-46B7-811F-06291CAE24B3.jpeg",
        (900, 55, 1024, 190),
        (256, 192),
        "verification_screen",
        "ShipScan Pro success screen carries the green check verification state",
        preserve_panel=True,
    ),
    Extract(
        "shipping.dock_background",
        "A80875E1-1183-46B7-811F-06291CAE24B3.jpeg",
        (1005, 585, 1526, 858),
        (768, 432),
        "environment",
        "assembled shipping dock environment is style-matched and scene-readable",
        preserve_panel=True,
    ),
    Extract(
        "plating.operator.idle",
        "11F70540-0D02-43B4-8461-46FF96C295AF.jpeg",
        (8, 420, 75, 585),
        (192, 384),
        "character",
        "plating operator pose is clean and canon-safe for the production-line ticket",
    ),
    Extract(
        "plating.workstation_cracked",
        "11F70540-0D02-43B4-8461-46FF96C295AF.jpeg",
        (862, 292, 1002, 435),
        (256, 224),
        "prop",
        "cracked workstation prop clearly communicates the failed-plating-workstation issue",
        preserve_panel=False,
    ),
    Extract(
        "plating.line_stopped_display",
        "11F70540-0D02-43B4-8461-46FF96C295AF.jpeg",
        (1212, 292, 1432, 443),
        (384, 256),
        "verification_screen",
        "LINE STOPPED display has baked canonical operational text and is intentionally preserved",
        preserve_panel=True,
    ),
    Extract(
        "plating.line_background",
        "11F70540-0D02-43B4-8461-46FF96C295AF.jpeg",
        (866, 580, 1525, 844),
        (768, 432),
        "environment",
        "assembled plating line background gives the day-job scene production context",
        preserve_panel=True,
    ),
    Extract(
        "sector04.access_guard.idle",
        "1165222B-2BEA-4D1B-B96E-CA1713153403.jpeg",
        (20, 0, 175, 225),
        (192, 256),
        "enemy",
        "front/side idle guard pose is readable and matches the Night Walker armor style",
    ),
    Extract(
        "sector04.access_guard.attack",
        "1165222B-2BEA-4D1B-B96E-CA1713153403.jpeg",
        (905, 450, 1225, 630),
        (384, 256),
        "enemy",
        "firing pose provides a clear side-view attack silhouette with purple muzzle FX",
    ),
    Extract(
        "sector04.access_guard.suppressed",
        "1165222B-2BEA-4D1B-B96E-CA1713153403.jpeg",
        (152, 660, 320, 790),
        (256, 192),
        "enemy",
        "kneeling/downed frame separates suppression from identity-controller severing",
    ),
    Extract(
        "sector04.access_guard.respawn",
        "1165222B-2BEA-4D1B-B96E-CA1713153403.jpeg",
        (290, 805, 590, 970),
        (320, 256),
        "fx",
        "purple reconstitution frame supports respawn/phase-in combat feedback",
    ),
    Extract(
        "sector04.purple_damage.enemy",
        "5A83036E-44D6-4E68-AE67-064E56DD88F5.jpeg",
        (500, 215, 780, 385),
        (320, 224),
        "clue",
        "collapsed already-injured enemy frame directly supports the Sector 04 clue beat",
    ),
    Extract(
        "sector04.purple_damage.fx",
        "5A83036E-44D6-4E68-AE67-064E56DD88F5.jpeg",
        (1008, 54, 1218, 390),
        (256, 384),
        "fx",
        "static purple burn shimmer gives a separate readable damage residue effect",
    ),
    Extract(
        "sector04.identity_controller.active",
        "92347444-9D26-42FD-9501-2B6029C84407.jpeg",
        (420, 18, 785, 385),
        (384, 384),
        "prop",
        "active controller source has the strongest intact powered core silhouette",
    ),
    Extract(
        "sector04.identity_controller.severed",
        "92347444-9D26-42FD-9501-2B6029C84407.jpeg",
        (0, 438, 385, 790),
        (384, 384),
        "prop",
        "severed controller source shows broken cables and unstable purple core state",
    ),
    Extract(
        "sector04.identity_controller.spark_fx",
        "92347444-9D26-42FD-9501-2B6029C84407.jpeg",
        (982, 835, 1224, 984),
        (288, 192),
        "fx",
        "relay-snap spark source is isolated and suitable for controller break feedback",
    ),
    Extract(
        "sector04.locked_violin_door",
        "5A83036E-44D6-4E68-AE67-064E56DD88F5.jpeg",
        (28, 500, 397, 1005),
        (384, 512),
        "prop",
        "locked door prop preserves the behind-door violin foreshadow without extra labels",
        preserve_panel=True,
    ),
    Extract(
        "sector04.violin_note.fx",
        "5A83036E-44D6-4E68-AE67-064E56DD88F5.jpeg",
        (405, 500, 795, 1005),
        (384, 512),
        "foreshadow",
        "musical note VFX source matches the locked-door violin sound cue",
    ),
    Extract(
        "sector04.terminal.symptoms",
        "5A83036E-44D6-4E68-AE67-064E56DD88F5.jpeg",
        (818, 514, 1428, 1006),
        (768, 640),
        "terminal",
        "terminal crop preserves the exact YOU ARE FIXING THE SYMPTOMS canon text",
        preserve_panel=True,
    ),
)


def remove_white_background(image: Image.Image, threshold: int) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            # Remove scanner/sheet whites and slightly warm near-whites while leaving
            # bright UI strokes intact where at least one channel has saturated color.
            low_delta = max(r, g, b) - min(r, g, b) < 20
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
            elif low_delta and r > 235 and g > 235 and b > 235:
                fade = max(0, min(255, (245 - max(r, g, b)) * 18))
                pixels[x, y] = (r, g, b, fade)
            else:
                pixels[x, y] = (r, g, b, a)
    alpha = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(0.35))
    rgba.putalpha(alpha)
    return rgba


def alpha_bbox(image: Image.Image) -> Optional[Box]:
    return image.getchannel("A").point(lambda a: 255 if a > 10 else 0).getbbox()


def pad_to_canvas(image: Image.Image, canvas: Canvas, pad: int = 14) -> Image.Image:
    bbox = alpha_bbox(image)
    content = image.crop(bbox) if bbox else image
    max_w = max(1, canvas[0] - pad * 2)
    max_h = max(1, canvas[1] - pad * 2)
    content.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    x = (canvas[0] - content.width) // 2
    y = canvas[1] - content.height - pad if content.height < canvas[1] * 0.86 else (canvas[1] - content.height) // 2
    out.alpha_composite(content, (x, max(pad, y)))
    return out


def extract_one(spec: Extract) -> dict:
    source_path = UPLOAD / spec.source
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    source = Image.open(source_path).convert("RGB")
    crop = source.crop(spec.crop)
    rgba = remove_white_background(crop, spec.threshold)
    canvas = pad_to_canvas(rgba, spec.canvas)

    info = PngImagePlugin.PngInfo()
    info.add_text("asset_id", spec.slot_id)
    info.add_text("source_image", spec.source)
    info.add_text("source_crop", ",".join(map(str, spec.crop)))
    info.add_text("qc", spec.qc)

    out_path = OUT / f"{spec.slot_id}.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path, pnginfo=info)

    bbox = alpha_bbox(canvas)
    opaque = 0
    white_opaque = 0
    alpha = canvas.getchannel("A")
    pix = canvas.load()
    for y in range(canvas.height):
        for x in range(canvas.width):
            if alpha.getpixel((x, y)) > 16:
                opaque += 1
                r, g, b, _ = pix[x, y]
                if r > 245 and g > 245 and b > 245:
                    white_opaque += 1
    transparent = canvas.width * canvas.height - opaque
    return {
        **asdict(spec),
        "filename": out_path.name,
        "content_bbox": bbox,
        "opaque_pixels": opaque,
        "transparent_pixels": transparent,
        "white_opaque_pixels": white_opaque,
        "white_opaque_ratio": round(white_opaque / opaque, 4) if opaque else None,
    }


def main() -> None:
    entries = [extract_one(spec) for spec in EXTRACTS]
    manifest = {
        "kind": "techops_hero_production_source_extract_manifest",
        "version": 1,
        "scope": "Act I day-job and Sector 04 runtime PNGs",
        "source_policy": "user_provided_asset_library_sheets_from_upload_workspace",
        "qc_gates": [
            "source crop chosen from identifiable production-intent subject",
            "white sheet background removed to alpha",
            "transparent runtime padding preserved",
            "baked labels limited to UI, screen, and verification assets",
            "manifest records crop traceability",
        ],
        "entries": entries,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {len(entries)} extracted assets")
    print(MANIFEST)


if __name__ == "__main__":
    main()
