#!/usr/bin/env python3
"""Generate deterministic transparent Sector 04 runtime placeholder assets.

These are production-slot stand-ins, not concept sheets. They satisfy the
runtime contract until hand-painted transparent exports replace them.
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path("assets/campaign")
PURPLE = (168, 85, 247, 255)
VIOLET = (217, 70, 239, 255)
ORANGE = (249, 115, 22, 255)
AMBER = (245, 158, 11, 255)
CYAN = (56, 189, 248, 255)
DARK = (15, 23, 42, 245)
MID = (30, 41, 59, 255)
INK = (2, 6, 23, 255)
WHITE = (241, 245, 249, 255)


def canvas(size: tuple[int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    return img, ImageDraw.Draw(img, "RGBA")


def glow(draw: ImageDraw.ImageDraw, xy: tuple[int, int], radius: int, color=PURPLE) -> None:
    cx, cy = xy
    for i in range(4, 0, -1):
        alpha = 26 * i
        r = radius + i * 6
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color[:3] + (alpha,))
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color)


def save(img: Image.Image, name: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img.save(OUT_DIR / name)


def guard_pose(name: str, pose: str) -> None:
    img, d = canvas((112, 128))
    if pose == "suppressed":
        d.rounded_rectangle((22, 78, 92, 98), radius=12, fill=DARK, outline=PURPLE, width=3)
        d.rounded_rectangle((42, 60, 72, 84), radius=10, fill=MID, outline=PURPLE, width=2)
        d.rectangle((55, 70, 66, 94), fill=VIOLET)
        d.line((25, 103, 88, 74), fill=PURPLE, width=4)
        glow(d, (62, 74), 7)
        save(img, name)
        return

    d.rounded_rectangle((40, 24, 72, 54), radius=12, fill=DARK, outline=PURPLE, width=3)
    d.rounded_rectangle((30, 50, 84, 92), radius=14, fill=DARK, outline=PURPLE, width=3)
    d.rectangle((48, 36, 64, 42), fill=VIOLET)
    d.line((36, 62, 20, 86), fill=MID, width=8)
    d.line((76, 62, 96, 86), fill=MID, width=8)
    d.line((43, 90, 34, 118), fill=MID, width=9)
    d.line((69, 90, 78, 118), fill=MID, width=9)
    d.rectangle((47, 58, 65, 82), fill=(88, 28, 135, 255))
    if pose == "attack":
        d.line((77, 62, 108, 57), fill=PURPLE, width=7)
        d.polygon([(106, 48), (112, 58), (106, 68), (100, 58)], fill=VIOLET)
    glow(d, (56, 70), 6)
    save(img, name)


def respawn(name: str) -> None:
    img, d = canvas((96, 96))
    for y in range(80, 18, -12):
        width = int((88 - y) * 0.5 + 14)
        d.ellipse((48 - width, y - 4, 48 + width, y + 5), outline=PURPLE, width=3)
    glow(d, (48, 52), 10, VIOLET)
    d.line((48, 16, 48, 84), fill=VIOLET, width=3)
    save(img, name)


def purple_damage_enemy(name: str) -> None:
    img, d = canvas((128, 96))
    d.rounded_rectangle((18, 58, 106, 78), radius=12, fill=DARK, outline=PURPLE, width=3)
    d.rounded_rectangle((44, 36, 84, 62), radius=10, fill=MID, outline=PURPLE, width=2)
    d.polygon([(62, 34), (72, 14), (82, 38)], fill=(51, 65, 85, 255), outline=PURPLE)
    d.rectangle((58, 44, 72, 69), fill=VIOLET)
    glow(d, (67, 52), 9, VIOLET)
    d.line((26, 82, 104, 42), fill=PURPLE, width=4)
    save(img, name)


def purple_fx(name: str) -> None:
    img, d = canvas((96, 96))
    for i in range(10):
        ang = math.pi * 2 * i / 10
        x2 = 48 + int(math.cos(ang) * 38)
        y2 = 48 + int(math.sin(ang) * 38)
        d.line((48, 48, x2, y2), fill=VIOLET, width=2)
    glow(d, (48, 48), 12, VIOLET)
    save(img, name)


def controller(name: str, severed: bool = False, spark: bool = False) -> None:
    img, d = canvas((112, 112))
    for ang in range(0, 360, 60):
        r = math.radians(ang)
        x = 56 + int(math.cos(r) * 42)
        y = 56 + int(math.sin(r) * 42)
        d.line((56, 56, x, y), fill=MID, width=8)
    d.ellipse((22, 22, 90, 90), fill=DARK, outline=PURPLE, width=4)
    if spark:
        d.line((18, 88, 94, 18), fill=AMBER, width=5)
        d.line((68, 22, 94, 50), fill=ORANGE, width=4)
        glow(d, (75, 35), 8, AMBER)
    elif severed:
        d.ellipse((40, 40, 72, 72), fill=(15, 23, 42, 255), outline=(100, 116, 139, 255), width=3)
        d.line((20, 92, 92, 20), fill=ORANGE, width=5)
    else:
        glow(d, (56, 56), 14, VIOLET)
    save(img, name)


def locked_door(name: str) -> None:
    img, d = canvas((96, 144))
    d.rounded_rectangle((20, 8, 76, 136), radius=8, fill=DARK, outline=(71, 85, 105, 255), width=4)
    d.rectangle((31, 26, 65, 82), fill=(30, 27, 75, 230), outline=PURPLE)
    d.line((48, 35, 48, 74), fill=VIOLET, width=3)
    d.ellipse((38, 60, 50, 76), outline=VIOLET, width=3)
    d.rectangle((37, 96, 59, 116), fill=(127, 29, 29, 255), outline=ORANGE)
    d.arc((39, 86, 57, 106), start=180, end=360, fill=WHITE, width=2)
    save(img, name)


def violin_note(name: str) -> None:
    img, d = canvas((96, 96))
    d.line((42, 22, 42, 68), fill=VIOLET, width=5)
    d.line((42, 22, 70, 16), fill=VIOLET, width=5)
    d.ellipse((24, 62, 46, 82), fill=VIOLET)
    d.ellipse((56, 56, 78, 76), fill=PURPLE)
    d.arc((20, 26, 80, 86), 190, 335, fill=(192, 132, 252, 210), width=3)
    glow(d, (50, 50), 6, VIOLET)
    save(img, name)


def terminal(name: str) -> None:
    img, d = canvas((192, 112))
    d.rounded_rectangle((6, 8, 186, 104), radius=10, fill=DARK, outline=PURPLE, width=4)
    d.rectangle((18, 24, 174, 58), fill=(30, 27, 75, 255), outline=VIOLET)
    font = ImageFont.load_default()
    d.text((36, 35), "YOU ARE FIXING", fill=WHITE, font=font)
    d.text((46, 47), "THE SYMPTOMS.", fill=WHITE, font=font)
    d.rectangle((24, 70, 78, 78), fill=(239, 68, 68, 220))
    d.rectangle((24, 84, 148, 90), fill=(100, 116, 139, 220))
    d.rectangle((24, 94, 126, 99), fill=PURPLE)
    save(img, name)


def main() -> None:
    guard_pose("sector04.access_guard.idle.png", "idle")
    guard_pose("sector04.access_guard.attack.png", "attack")
    guard_pose("sector04.access_guard.suppressed.png", "suppressed")
    respawn("sector04.access_guard.respawn.png")
    purple_damage_enemy("sector04.purple_damage.enemy.png")
    purple_fx("sector04.purple_damage.fx.png")
    controller("sector04.identity_controller.active.png")
    controller("sector04.identity_controller.severed.png", severed=True)
    controller("sector04.identity_controller.spark_fx.png", spark=True)
    locked_door("sector04.locked_violin_door.png")
    violin_note("sector04.violin_note.fx.png")
    terminal("sector04.terminal.symptoms.png")


if __name__ == "__main__":
    main()
