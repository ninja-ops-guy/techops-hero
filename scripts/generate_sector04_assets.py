#!/usr/bin/env python3
"""Generate deterministic transparent campaign runtime placeholder assets.

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


def screen_panel(name: str, title: str, glitch: bool = False) -> None:
    img, d = canvas((160, 96))
    d.rounded_rectangle((8, 10, 152, 86), radius=8, fill=DARK, outline=CYAN if not glitch else PURPLE, width=3)
    d.rectangle((20, 24, 140, 64), fill=(15, 23, 42, 255), outline=(51, 65, 85, 255))
    font = ImageFont.load_default()
    if glitch:
        d.text((45, 40), title, fill=VIOLET, font=font)
        for y in range(28, 65, 8):
            d.line((24, y, 136, y - 6), fill=PURPLE, width=2)
        d.rectangle((68, 32, 92, 56), fill=(15, 23, 42, 180), outline=VIOLET)
    else:
        d.ellipse((38, 34, 72, 58), fill=(30, 41, 59, 255), outline=CYAN)
        d.line((76, 34, 128, 34), fill=CYAN, width=3)
        d.line((76, 46, 118, 46), fill=(148, 163, 184, 255), width=2)
        d.line((76, 57, 132, 57), fill=(148, 163, 184, 255), width=2)
    d.rectangle((16, 72, 70, 78), fill=PURPLE if glitch else CYAN)
    save(img, name)


def aircraft_panel(name: str) -> None:
    img, d = canvas((160, 96))
    d.rounded_rectangle((8, 10, 152, 86), radius=8, fill=(15, 23, 42, 230), outline=AMBER, width=3)
    d.polygon([(26, 58), (72, 34), (136, 58), (72, 48)], fill=(30, 41, 59, 255), outline=AMBER)
    d.line((72, 34, 72, 22), fill=CYAN, width=3)
    for x in (44, 92, 122):
        glow(d, (x, 36), 4, AMBER)
    d.line((28, 66, 132, 66), fill=(148, 163, 184, 200), width=2)
    save(img, name)


def standup_board(name: str) -> None:
    img, d = canvas((192, 120))
    colors = [CYAN, AMBER, (239, 68, 68, 255), PURPLE, (34, 197, 94, 255)]
    d.rounded_rectangle((8, 8, 184, 112), radius=10, fill=DARK, outline=CYAN, width=3)
    for i, color in enumerate(colors):
        x = 16 + i * 34
        d.rounded_rectangle((x, 26, x + 26, 92), radius=4, fill=(15, 23, 42, 255), outline=color, width=2)
        d.rectangle((x + 5, 36, x + 21, 43), fill=color)
        d.rectangle((x + 5, 52, x + 21, 59), fill=(51, 65, 85, 255))
        d.rectangle((x + 5, 68, x + 21, 75), fill=(51, 65, 85, 255))
    d.rectangle((46, 96, 146, 102), fill=(34, 197, 94, 230))
    save(img, name)


def ticket_card(name: str) -> None:
    img, d = canvas((96, 80))
    d.rounded_rectangle((10, 10, 86, 70), radius=7, fill=DARK, outline=AMBER, width=3)
    d.rectangle((20, 20, 56, 28), fill=CYAN)
    d.rectangle((20, 38, 76, 44), fill=(148, 163, 184, 240))
    d.rectangle((20, 52, 62, 58), fill=(71, 85, 105, 240))
    glow(d, (76, 24), 5, AMBER)
    save(img, name)


def owner_badge(name: str) -> None:
    img, d = canvas((72, 72))
    d.ellipse((10, 10, 62, 62), fill=DARK, outline=(34, 197, 94, 255), width=3)
    d.ellipse((26, 18, 46, 38), fill=(30, 64, 175, 255), outline=CYAN)
    d.arc((18, 34, 54, 64), 200, 340, fill=(34, 197, 94, 255), width=6)
    d.line((22, 51, 31, 60), fill=(34, 197, 94, 255), width=4)
    d.line((31, 60, 52, 36), fill=(34, 197, 94, 255), width=4)
    save(img, name)


def worker(name: str, accent=CYAN, clipboard: bool = False) -> None:
    img, d = canvas((88, 128))
    d.ellipse((34, 16, 56, 40), fill=(180, 83, 9, 255), outline=INK)
    d.rectangle((30, 39, 60, 84), fill=(30, 64, 175, 255), outline=INK)
    d.line((32, 50, 18, 80), fill=accent, width=7)
    d.line((58, 50, 72, 80), fill=accent, width=7)
    d.line((38, 84, 30, 118), fill=MID, width=8)
    d.line((53, 84, 62, 118), fill=MID, width=8)
    d.rectangle((27, 44, 34, 83), fill=AMBER)
    d.rectangle((56, 44, 63, 83), fill=AMBER)
    d.rectangle((32, 10, 58, 22), fill=accent, outline=INK)
    if clipboard:
        d.rounded_rectangle((58, 54, 80, 86), radius=3, fill=WHITE, outline=INK)
        d.line((62, 64, 75, 64), fill=(71, 85, 105, 255), width=1)
        d.line((62, 72, 75, 72), fill=(71, 85, 105, 255), width=1)
    save(img, name)


def label_printer(name: str) -> None:
    img, d = canvas((96, 80))
    d.rounded_rectangle((18, 20, 76, 58), radius=6, fill=DARK, outline=CYAN, width=3)
    d.rectangle((28, 28, 66, 38), fill=(51, 65, 85, 255))
    d.rectangle((38, 56, 72, 70), fill=WHITE, outline=(148, 163, 184, 255))
    for x in range(43, 68, 5):
        d.line((x, 59, x, 68), fill=INK, width=1)
    save(img, name)


def label_success(name: str) -> None:
    img, d = canvas((96, 80))
    d.rounded_rectangle((14, 12, 82, 68), radius=5, fill=WHITE, outline=CYAN, width=3)
    for x in range(26, 68, 6):
        d.line((x, 30, x, 54), fill=INK, width=2)
    d.ellipse((58, 12, 84, 38), fill=(34, 197, 94, 255))
    d.line((64, 25, 70, 31), fill=WHITE, width=3)
    d.line((70, 31, 80, 18), fill=WHITE, width=3)
    save(img, name)


def dock_background(name: str) -> None:
    img, d = canvas((192, 112))
    d.rectangle((12, 28, 86, 92), fill=(51, 65, 85, 235), outline=CYAN)
    d.rectangle((94, 48, 176, 92), fill=(241, 245, 249, 235), outline=CYAN)
    d.rectangle((132, 60, 170, 84), fill=(30, 64, 175, 255))
    d.rectangle((22, 38, 74, 84), fill=(15, 23, 42, 255), outline=AMBER)
    d.rectangle((48, 86, 80, 96), fill=AMBER)
    d.rectangle((104, 88, 178, 96), fill=(100, 116, 139, 255))
    save(img, name)


def cracked_workstation(name: str) -> None:
    img, d = canvas((112, 88))
    d.rounded_rectangle((18, 16, 94, 62), radius=5, fill=DARK, outline=(239, 68, 68, 255), width=3)
    d.rectangle((28, 26, 84, 50), fill=(30, 27, 75, 255))
    d.line((38, 28, 58, 48), fill=WHITE, width=2)
    d.line((58, 48, 72, 30), fill=WHITE, width=2)
    d.rectangle((46, 62, 66, 72), fill=(71, 85, 105, 255))
    d.rectangle((32, 72, 80, 78), fill=(71, 85, 105, 255))
    glow(d, (80, 24), 5, (239, 68, 68, 255))
    save(img, name)


def line_stopped(name: str) -> None:
    img, d = canvas((160, 96))
    d.rounded_rectangle((8, 12, 152, 84), radius=8, fill=DARK, outline=(239, 68, 68, 255), width=4)
    font = ImageFont.load_default()
    d.text((50, 30), "LINE STOPPED", fill=(248, 113, 113, 255), font=font)
    for y in (50, 62, 74):
        d.rectangle((28, y, 38, y + 7), fill=(239, 68, 68, 255))
        d.rectangle((46, y, 122, y + 5), fill=(100, 116, 139, 255))
    save(img, name)


def plating_line_background(name: str) -> None:
    img, d = canvas((192, 112))
    d.rectangle((12, 34, 180, 88), fill=(15, 23, 42, 235), outline=AMBER)
    for x in (34, 88, 142):
        d.rectangle((x, 42, x + 28, 78), fill=(30, 41, 59, 255), outline=CYAN)
        d.line((x + 14, 34, x + 14, 42), fill=AMBER, width=3)
    d.line((18, 88, 174, 88), fill=AMBER, width=5)
    d.line((24, 96, 168, 96), fill=(100, 116, 139, 255), width=4)
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
    screen_panel("workstation.felicia.video_frame.png", "FELICIA")
    screen_panel("workstation.orpheus.glitch_frame.png", "ORPHEUS", glitch=True)
    aircraft_panel("workstation.corporate_aircraft_panel.png")
    standup_board("ui.standup.board.png")
    ticket_card("ui.standup.ticket_card.png")
    owner_badge("ui.standup.owner_badge.png")
    worker("shipping.clerk.idle.png", accent=CYAN, clipboard=True)
    label_printer("shipping.label_printer.png")
    label_success("shipping.printed_label_success.png")
    dock_background("shipping.dock_background.png")
    worker("plating.operator.idle.png", accent=AMBER, clipboard=False)
    cracked_workstation("plating.workstation_cracked.png")
    line_stopped("plating.line_stopped_display.png")
    plating_line_background("plating.line_background.png")


if __name__ == "__main__":
    main()
