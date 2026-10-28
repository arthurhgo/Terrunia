"""Generate VISUAL_DRAFT Terrúnia pixel art at native resolution.

Requires Pillow: pip install Pillow
Run from the repository root: python3 scripts/build_pixel_assets.py
The PNGs intentionally contain no visible editor grid. Never upscale the files
before committing them; the browser uses CSS image-rendering: pixelated.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1] / "public" / "assets"

COLORS = {
    "outline": "#11131A",
    "shade": "#222936",
    "steel": "#3D4B5E",
    "steel_light": "#657C8C",
    "navy": "#102C50",
    "blue": "#255A8C",
    "cyan": "#55B4E5",
    "ice": "#E2F6FF",
    "gold_dark": "#785025",
    "gold": "#BB853C",
    "gold_light": "#F1C778",
    "leather": "#503831",
    "leather_light": "#85624B",
    "skin_dark": "#8F655D",
    "skin": "#D5A78B",
    "skin_light": "#F0DDC0",
}


def sheet(width: int = 16, height: int = 16):
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def p(draw, color: str, *points):
    draw.polygon(points, fill=COLORS[color])


def r(draw, color: str, box):
    draw.rectangle(box, fill=COLORS[color])


def px(draw, color: str, x: int, y: int):
    draw.point((x, y), fill=COLORS[color])


def character(graphite: bool = False):
    """Neutral Terrírian; slight 3/4 upper view, no Clan/Class/equipment."""
    im, d = sheet(32, 32)
    p(d, "outline", (11, 22), (16, 23), (16, 30), (10, 31), (10, 28))
    p(d, "leather", (12, 23), (16, 24), (15, 29), (11, 29))
    p(d, "outline", (18, 23), (23, 22), (24, 30), (19, 31), (18, 28))
    p(d, "leather", (19, 24), (22, 24), (23, 29), (19, 29))
    r(d, "leather_light", (11, 30, 15, 30))
    r(d, "leather_light", (20, 30, 23, 30))

    # Plain cloak, intentionally free of heraldry.
    p(d, "outline", (10, 12), (21, 12), (24, 18), (25, 27),
      (22, 29), (20, 24), (16, 27), (11, 24), (8, 28), (7, 25), (8, 18))
    p(d, "shade" if graphite else "navy", (10, 13), (21, 13), (23, 19),
      (24, 26), (22, 27), (20, 23), (16, 26), (11, 23), (9, 26), (8, 24))
    p(d, "steel" if graphite else "blue", (9, 18), (11, 17), (11, 23), (9, 26))
    p(d, "steel_light" if graphite else "blue", (22, 17), (24, 22), (24, 26), (22, 24))

    # Face slightly to the southeast: one visible far-side cheek, offset eyes.
    p(d, "outline", (12, 4), (15, 2), (20, 3), (23, 6),
      (22, 11), (19, 14), (15, 13), (12, 10))
    p(d, "skin", (13, 6), (19, 5), (21, 7), (21, 10),
      (19, 12), (15, 12), (13, 10))
    p(d, "skin_dark", (13, 8), (15, 8), (15, 11), (16, 12), (14, 11))
    r(d, "skin_light", (18, 11, 20, 11))
    p(d, "shade", (12, 5), (15, 2), (19, 2), (22, 5),
      (21, 7), (18, 6), (16, 8), (13, 7), (12, 9))
    r(d, "steel", (15, 4, 18, 4))
    r(d, "shade", (17, 6, 19, 7))
    px(d, "outline", 17, 9)
    px(d, "outline", 20, 9)
    px(d, "skin_dark", 19, 10)

    # Simple field tunic/vest, leather belt and detached hands.
    p(d, "outline", (11, 12), (16, 14), (21, 12), (24, 16),
      (23, 24), (11, 25), (9, 17))
    p(d, "blue" if not graphite else "steel", (12, 14), (16, 15),
      (21, 14), (22, 17), (21, 23), (12, 23), (11, 17))
    p(d, "navy" if not graphite else "shade", (12, 15), (15, 17),
      (14, 23), (12, 23), (11, 18))
    r(d, "steel_light", (17, 16, 20, 16))
    r(d, "gold", (16, 14, 17, 14))
    r(d, "leather", (11, 22, 22, 23))
    r(d, "leather_light", (12, 22, 21, 22))
    r(d, "gold", (16, 22, 18, 23))
    px(d, "outline", 17, 22)

    # Two unarmed hands: equipment remains empty in the initial save.
    p(d, "outline", (9, 16), (12, 17), (11, 25), (8, 26), (7, 23))
    p(d, "steel", (9, 18), (11, 18), (10, 23), (8, 22))
    r(d, "skin", (8, 24, 9, 25))
    p(d, "outline", (22, 16), (25, 16), (27, 23), (26, 26), (23, 25), (22, 20))
    p(d, "steel", (23, 17), (25, 18), (26, 23), (24, 24), (23, 22))
    r(d, "skin", (24, 24, 25, 25))
    return im


def shield():
    im, d = sheet()
    p(d, "outline", (8, 0), (12, 2), (14, 4), (14, 9), (11, 13), (8, 15), (5, 13), (1, 9), (1, 4), (4, 2))
    p(d, "gold", (8, 1), (12, 3), (13, 5), (13, 9), (10, 12), (8, 14), (6, 12), (2, 9), (2, 5), (4, 3))
    p(d, "navy", (8, 3), (11, 4), (12, 6), (12, 9), (9, 12), (8, 12), (5, 10), (3, 8), (4, 5))
    r(d, "gold_dark", (7, 4, 8, 11))
    r(d, "gold_dark", (4, 7, 11, 8))
    r(d, "gold", (7, 5, 8, 10))
    r(d, "gold", (5, 7, 10, 8))
    r(d, "cyan", (7, 6, 8, 9))
    r(d, "cyan", (6, 7, 9, 8))
    r(d, "ice", (7, 7, 8, 8))
    px(d, "gold_light", 8, 2)
    return im


def weapon():
    im, d = sheet()
    p(d, "outline", (9, 1), (11, 2), (10, 10), (8, 12), (5, 9))
    p(d, "steel", (9, 2), (10, 3), (9, 9), (8, 10), (6, 9))
    r(d, "steel_light", (9, 3, 9, 8))
    p(d, "gold_dark", (4, 9), (7, 9), (10, 11), (9, 12), (6, 11), (4, 11))
    r(d, "gold", (5, 10, 9, 10))
    p(d, "outline", (6, 11), (8, 12), (6, 15), (4, 14))
    p(d, "leather_light", (6, 12), (7, 12), (6, 14), (5, 14))
    return im


def armor():
    im, d = sheet()
    p(d, "outline", (4, 2), (6, 1), (10, 1), (12, 2), (15, 6), (12, 9), (12, 14), (4, 14), (4, 9), (1, 6))
    p(d, "steel", (4, 3), (6, 2), (10, 2), (12, 3), (13, 6), (11, 8), (11, 13), (5, 13), (5, 8), (3, 6))
    p(d, "steel_light", (5, 4), (7, 3), (8, 5), (6, 9), (5, 11))
    r(d, "gold", (5, 12, 11, 12))
    r(d, "gold_dark", (6, 9, 10, 9))
    r(d, "navy", (7, 4, 9, 5))
    px(d, "cyan", 8, 7)
    return im


def necklace():
    im, d = sheet()
    p(d, "outline", (3, 2), (5, 2), (6, 7), (8, 9), (10, 7), (11, 2), (13, 2), (12, 8), (8, 12), (4, 8))
    px(d, "gold", 4, 3)
    px(d, "gold", 11, 3)
    r(d, "gold", (5, 6, 5, 8))
    r(d, "gold", (10, 6, 10, 8))
    p(d, "gold_dark", (8, 8), (11, 11), (8, 15), (5, 11))
    p(d, "gold", (8, 9), (10, 11), (8, 14), (6, 11))
    r(d, "cyan", (7, 10, 9, 12))
    px(d, "ice", 8, 10)
    return im


def bracelet():
    im, d = sheet()
    p(d, "outline", (5, 3), (11, 3), (14, 6), (14, 10), (11, 13), (5, 13), (2, 10), (2, 6))
    p(d, "gold_dark", (5, 4), (11, 4), (13, 6), (13, 10), (11, 12), (5, 12), (3, 10), (3, 6))
    p(d, "gold", (5, 4), (11, 4), (12, 6), (10, 7), (6, 7), (4, 6))
    p(d, "gold", (4, 10), (6, 9), (10, 9), (12, 10), (10, 12), (6, 12))
    r(d, "navy", (7, 4, 9, 6))
    px(d, "cyan", 8, 5)
    return im


def fungal_nucleus():
    im, d = sheet()
    p(d, "outline", (6, 2), (10, 2), (13, 5), (13, 10), (10, 13), (6, 13), (3, 10), (3, 5))
    p(d, "leather", (6, 3), (10, 3), (12, 6), (12, 9), (9, 12), (6, 12), (4, 9), (4, 6))
    r(d, "blue", (6, 5, 10, 10))
    r(d, "cyan", (7, 6, 9, 9))
    px(d, "ice", 8, 7)
    return im


def spores():
    im, d = sheet()
    for cx, cy in ((5, 6), (11, 7), (8, 11)):
        p(d, "outline", (cx, cy - 3), (cx + 3, cy - 1), (cx + 2, cy + 2), (cx - 1, cy + 2), (cx - 2, cy))
        r(d, "blue", (cx - 1, cy - 1, cx + 1, cy + 1))
        px(d, "cyan", cx, cy)
    return im


def tonic():
    im, d = sheet()
    r(d, "outline", (5, 1, 10, 3))
    r(d, "leather_light", (6, 1, 9, 2))
    p(d, "outline", (5, 3), (10, 3), (10, 5), (13, 8), (13, 13), (11, 15), (4, 15), (2, 13), (2, 8), (5, 5))
    p(d, "steel", (5, 5), (10, 5), (12, 8), (12, 13), (10, 14), (5, 14), (3, 12), (3, 8))
    r(d, "blue", (4, 9, 11, 13))
    r(d, "cyan", (5, 10, 10, 12))
    r(d, "ice", (5, 7, 5, 9))
    return im


def mycelial_fragment():
    im, d = sheet()
    p(d, "outline", (8, 0), (11, 4), (14, 7), (11, 13), (6, 15), (2, 9), (4, 4))
    p(d, "blue", (8, 1), (10, 5), (13, 7), (10, 12), (6, 14), (3, 9), (5, 5))
    p(d, "cyan", (8, 2), (9, 6), (11, 7), (8, 12), (6, 12), (5, 7))
    r(d, "ice", (7, 5, 8, 8))
    return im


def growth_gem():
    im, d = sheet()
    p(d, "outline", (8, 0), (13, 4), (13, 10), (8, 15), (3, 10), (3, 4))
    p(d, "gold_dark", (8, 1), (12, 5), (12, 10), (8, 14), (4, 10), (4, 5))
    p(d, "blue", (8, 2), (11, 5), (11, 9), (8, 13), (5, 9), (5, 5))
    p(d, "cyan", (8, 3), (10, 6), (9, 10), (8, 12), (6, 9), (6, 6))
    r(d, "ice", (7, 5, 8, 7))
    return im


def record():
    im, d = sheet()
    p(d, "outline", (3, 1), (12, 1), (14, 3), (14, 13), (12, 15), (2, 15), (1, 12), (1, 3))
    r(d, "gold_light", (3, 3, 12, 12))
    r(d, "gold_dark", (3, 4, 3, 12))
    r(d, "gold", (4, 5, 11, 5))
    r(d, "leather_light", (4, 7, 10, 7))
    r(d, "leather_light", (4, 9, 9, 9))
    r(d, "outline", (2, 1, 13, 2))
    r(d, "outline", (2, 13, 13, 14))
    return im


# Equipment catalog: manual weapon archetypes and four families of visual concepts.
# Each design is an actual 16x16 matrix, never a resized illustration.
def sword_long():
    im, d = sheet()
    p(d, 'outline', (11, 0), (13, 2), (7, 11), (5, 10))
    p(d, 'steel_light', (11, 1), (12, 2), (7, 9), (6, 9))
    d.line([(5, 8), (9, 12)], fill=COLORS['gold_dark'], width=3)
    d.line([(5, 8), (9, 12)], fill=COLORS['gold'], width=1)
    d.line([(6, 11), (3, 14)], fill=COLORS['outline'], width=3)
    px(d, 'gold_light', 3, 14)
    return im


def war_axe():
    im, d = sheet()
    d.line([(5, 14), (10, 2)], fill=COLORS['outline'], width=4)
    d.line([(5, 14), (10, 2)], fill=COLORS['leather_light'], width=2)
    p(d, 'outline', (8, 1), (14, 2), (15, 7), (13, 9), (8, 7), (6, 4))
    p(d, 'steel', (9, 2), (13, 3), (14, 7), (12, 8), (8, 6), (7, 4))
    p(d, 'steel_light', (9, 2), (13, 3), (13, 5), (10, 4))
    return im


def long_bow():
    im, d = sheet()
    d.line([(11, 1), (6, 3), (4, 7), (6, 12), (11, 14)], fill=COLORS['outline'], width=3)
    d.line([(11, 1), (6, 3), (4, 7), (6, 12), (11, 14)], fill=COLORS['gold'], width=1)
    d.line([(11, 1), (11, 14)], fill=COLORS['steel_light'], width=1)
    r(d, 'leather_light', (4, 7, 6, 8))
    return im


def dagger():
    im, d = sheet()
    p(d, 'outline', (11, 2), (12, 5), (7, 11), (5, 9))
    p(d, 'steel_light', (11, 3), (11, 5), (7, 9), (6, 9))
    d.line([(4, 9), (9, 12)], fill=COLORS['gold'], width=2)
    d.line([(6, 11), (4, 14)], fill=COLORS['leather_light'], width=3)
    px(d, 'gold_light', 4, 14)
    return im


def arcane_scepter():
    im, d = sheet()
    d.line([(5, 14), (10, 5)], fill=COLORS['outline'], width=4)
    d.line([(5, 14), (10, 5)], fill=COLORS['gold'], width=2)
    p(d, 'outline', (9, 0), (12, 2), (13, 5), (10, 8), (7, 5), (7, 2))
    p(d, 'cyan', (9, 1), (11, 3), (11, 5), (10, 6), (8, 4))
    px(d, 'ice', 9, 3)
    return im


def spellbook():
    im, d = sheet()
    p(d, 'outline', (2, 3), (8, 4), (14, 2), (14, 13), (8, 15), (2, 13))
    p(d, 'navy', (3, 4), (8, 5), (8, 13), (3, 12))
    p(d, 'gold_dark', (9, 5), (13, 3), (13, 12), (9, 13))
    d.line([(8, 5), (8, 13)], fill=COLORS['gold_light'], width=1)
    px(d, 'cyan', 5, 7)
    px(d, 'ice', 5, 8)
    px(d, 'gold_light', 11, 8)
    return im


def conjuration_staff():
    im, d = sheet()
    d.line([(5, 15), (10, 3)], fill=COLORS['outline'], width=4)
    d.line([(5, 14), (10, 3)], fill=COLORS['leather_light'], width=2)
    p(d, 'gold_dark', (7, 2), (8, 0), (12, 0), (14, 3), (12, 7), (9, 6))
    p(d, 'blue', (9, 1), (12, 1), (13, 3), (11, 5), (9, 4))
    r(d, 'cyan', (10, 2, 11, 4))
    px(d, 'ice', 10, 2)
    return im


def round_shield():
    im, d = sheet()
    p(d, 'outline', (5, 1), (11, 1), (15, 5), (15, 11), (11, 15), (5, 15), (1, 11), (1, 5))
    p(d, 'gold', (5, 2), (11, 2), (14, 5), (14, 11), (11, 14), (5, 14), (2, 11), (2, 5))
    p(d, 'navy', (5, 4), (11, 4), (12, 6), (12, 10), (10, 12), (6, 12), (4, 10), (4, 6))
    r(d, 'steel_light', (7, 6, 9, 9))
    px(d, 'cyan', 8, 7)
    return im


def arcane_shield():
    im, d = sheet()
    p(d, 'outline', (8, 0), (14, 5), (14, 10), (8, 15), (2, 10), (2, 5))
    p(d, 'navy', (8, 1), (13, 6), (13, 9), (8, 14), (3, 9), (3, 6))
    p(d, 'cyan', (8, 3), (11, 6), (11, 9), (8, 12), (5, 9), (5, 6))
    p(d, 'ice', (8, 4), (9, 6), (8, 9), (7, 6))
    return im


def leather_armor():
    im = armor()
    dark, base = COLORS['steel'], COLORS['steel_light']
    data = list(im.getdata())
    im.putdata([tuple(bytes.fromhex(COLORS['leather'][1:])) + (a,) if (r, g, b) == tuple(bytes.fromhex(dark[1:])) and a else
                tuple(bytes.fromhex(COLORS['leather_light'][1:])) + (a,) if (r, g, b) == tuple(bytes.fromhex(base[1:])) and a else
                (r, g, b, a) for r, g, b, a in data])
    return im


def moon_necklace():
    im, d = sheet()
    d.line([(3, 2), (5, 8), (8, 10), (11, 8), (13, 2)], fill=COLORS['outline'], width=3)
    d.line([(3, 2), (5, 8), (8, 10), (11, 8), (13, 2)], fill=COLORS['steel_light'], width=1)
    p(d, 'gold_dark', (7, 9), (12, 10), (10, 14), (6, 14), (5, 11))
    p(d, 'steel_light', (7, 10), (10, 11), (9, 13), (7, 13), (6, 11))
    px(d, 'ice', 8, 11)
    return im


def leather_bracelet():
    im, d = sheet()
    p(d, 'outline', (4, 3), (12, 3), (15, 6), (15, 10), (12, 13), (4, 13), (1, 10), (1, 6))
    p(d, 'leather', (4, 4), (12, 4), (14, 6), (14, 10), (11, 12), (5, 12), (2, 10), (2, 6))
    r(d, 'leather_light', (4, 5, 12, 6))
    r(d, 'gold_dark', (7, 4, 9, 7))
    px(d, 'gold_light', 8, 5)
    return im


def weapon_grade(grade: int):
    im = weapon()
    d = ImageDraw.Draw(im)
    if grade >= 2:
        r(d, 'cyan', (9, 4, 9, 6))
    if grade >= 3:
        r(d, 'ice', (8, 10, 8, 10))
    if grade >= 4:
        px(d, 'gold_light', 10, 3)
        px(d, 'cyan', 8, 8)
    if grade >= 5:
        r(d, 'gold_light', (5, 9, 8, 9))
    if grade >= 6:
        px(d, 'ice', 10, 2)
        px(d, 'cyan', 7, 10)
    if grade >= 7:
        px(d, 'gold_light', 6, 7)
        px(d, 'ice', 11, 1)
        px(d, 'ice', 5, 6)
    return im


ASSETS = {
    "characters/terririan/player_default.png": lambda: character(False),
    "characters/terririan/player_sigil.png": lambda: character(True),
    "equipment/slot-previews/weapon.png": weapon,
    "equipment/slot-previews/shield.png": shield,
    "equipment/slot-previews/armor.png": armor,
    "equipment/slot-previews/necklace.png": necklace,
    "equipment/slot-previews/bracelet.png": bracelet,
    "equipment/weapon/weapon_prologue_g1.png": weapon,
    **{f"equipment/weapon/weapon_prologue_g{grade}.png":
       (lambda grade=grade: weapon_grade(grade)) for grade in range(2, 8)},
    "equipment/catalog/weapon_long_sword.png": sword_long,
    "equipment/catalog/weapon_war_axe.png": war_axe,
    "equipment/catalog/weapon_long_bow.png": long_bow,
    "equipment/catalog/weapon_dagger.png": dagger,
    "equipment/catalog/weapon_arcane_scepter.png": arcane_scepter,
    "equipment/catalog/weapon_spellbook.png": spellbook,
    "equipment/catalog/weapon_conjuration_staff.png": conjuration_staff,
    "equipment/catalog/shield_round.png": round_shield,
    "equipment/catalog/shield_arcane.png": arcane_shield,
    "equipment/catalog/armor_leather.png": leather_armor,
    "equipment/catalog/armor_plate.png": armor,
    "equipment/catalog/necklace_moon.png": moon_necklace,
    "equipment/catalog/necklace_rune.png": necklace,
    "equipment/catalog/bracelet_leather.png": leather_bracelet,
    "equipment/catalog/bracelet_resonance.png": bracelet,
    "items/item_fungal_nucleus.png": fungal_nucleus,
    "items/item_spore_cluster.png": spores,
    "items/item_minor_tonic.png": tonic,
    "items/item_mycelial_fragment.png": mycelial_fragment,
    "items/item_astravel_record.png": record,
    "gems/gem_emerald_growth.png": growth_gem,
}


def build_reference_board(images: dict[str, Image.Image]):
    """Large nearest-neighbor visual QA sheet; never used as game asset."""
    board = Image.new('RGBA', (1600, 850), '#11131A')
    d = ImageDraw.Draw(board)
    font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
    if Path(font_path).exists():
        title = ImageFont.truetype(font_path, 32)
        heading = ImageFont.truetype(font_path, 20)
        small = ImageFont.truetype(font_path, 14)
    else:
        title = heading = small = ImageFont.load_default()

    d.text((42, 33), 'TERRUNIA / PIXEL ART v0.1', font=title, fill=COLORS['gold_light'])
    d.text((43, 81), 'VISUAL_DRAFT   /   3-4 superior   /   escala NN   /   PNG com alpha',
           font=small, fill='#97A7B6')
    panels = [(40, 124, 594, 734), (617, 124, 1120, 734), (1141, 124, 1560, 734)]
    for panel in panels:
        d.rounded_rectangle(panel, radius=8, fill='#1A202B', outline=COLORS['gold_dark'], width=2)
    d.text((63, 148), 'TERRIRIAN NEUTRO / 32x32', font=heading, fill=COLORS['skin_light'])
    d.text((641, 148), '5 SLOTS / 16x16', font=heading, fill=COLORS['skin_light'])
    d.text((1163, 148), 'LOOT / 16x16', font=heading, fill=COLORS['skin_light'])

    def display(path: str, x: int, y: int, scale: int, label: str):
        img = images[path]
        enlargement = img.resize((img.width * scale, img.height * scale), Image.Resampling.NEAREST)
        board.alpha_composite(enlargement, (x, y))
        d.text((x, y + img.height * scale + 8), label, font=small, fill='#D9D0BC')

    display('characters/terririan/player_default.png', 64, 228, 7, 'Viajante Azul')
    display('characters/terririan/player_sigil.png', 342, 228, 7, 'Viajante Grafite')
    for i, slot in enumerate(('weapon', 'shield', 'armor', 'necklace', 'bracelet')):
        col, row = i % 3, i // 3
        display(f'equipment/slot-previews/{slot}.png', 643 + col * 157,
                218 + row * 235, 8, slot)
    icons = (
        ('items/item_fungal_nucleus.png', 'Nucleo'),
        ('items/item_spore_cluster.png', 'Esporos'),
        ('items/item_minor_tonic.png', 'Tonico'),
        ('items/item_mycelial_fragment.png', 'Fragmento'),
        ('gems/gem_emerald_growth.png', 'Joia'),
        ('items/item_astravel_record.png', 'Registro'),
    )
    for i, (path, label) in enumerate(icons):
        col, row = i % 3, i // 3
        display(path, 1154 + col * 133, 220 + row * 242, 7, label)
    d.text((43, 763), 'PALETA 16 CORES', font=small, fill=COLORS['skin_light'])
    for i, color in enumerate(COLORS.values()):
        x = 258 + i * 80
        d.rectangle((x, 758, x + 66, 804), fill=color, outline='#7D8691')
    output = ROOT.parents[1] / 'docs' / 'reference' / 'terrunia-pixel-art-v0.1.png'
    board.convert('RGB').save(output)


def build_catalog_board(images: dict[str, Image.Image]):
    """VISUAL_DRAFT catalog board for approval; the UI loads individual 16px PNGs."""
    board = Image.new('RGBA', (1480, 1210), '#11131A')
    d = ImageDraw.Draw(board)
    font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
    title = ImageFont.truetype(font_path, 33) if Path(font_path).exists() else ImageFont.load_default()
    small = ImageFont.truetype(font_path, 16) if Path(font_path).exists() else ImageFont.load_default()
    d.text((40, 32), 'TERRUNIA / INVENTARIO PIXEL v0.2', fill=COLORS['gold_light'], font=title)
    d.text((40, 80), '7 ARMAS DO MANUAL + 8 ESTUDOS DE EQUIPAMENTO  /  16x16 NATIVOS  /  VISUAL_DRAFT', fill=COLORS['steel_light'], font=small)
    catalog = (
        ('weapon_long_sword', 'Espada Longa'), ('weapon_war_axe', 'Machado de Guerra'),
        ('weapon_long_bow', 'Arco Longo'), ('weapon_dagger', 'Adaga'),
        ('weapon_arcane_scepter', 'Cetro Arcano'), ('weapon_spellbook', 'Livro de Magias'),
        ('weapon_conjuration_staff', 'Cajado de Conjuracao'), ('shield_round', 'Escudo Redondo'),
        ('shield_arcane', 'Protetor Arcano'), ('armor_leather', 'Armadura de Couro'),
        ('armor_plate', 'Armadura de Placas'), ('necklace_moon', 'Colar Lunar'),
        ('necklace_rune', 'Colar Runico'), ('bracelet_leather', 'Pulseira de Couro'),
        ('bracelet_resonance', 'Pulseira Ressonancia'),
    )
    for i, (name, label) in enumerate(catalog):
        x, y = 40 + (i % 5) * 290, 128 + (i // 5) * 245
        d.rectangle((x, y, x + 262, y + 222), fill='#1A202B', outline=COLORS['gold_dark'], width=2)
        art = images[f'equipment/catalog/{name}.png'].resize((128, 128), Image.Resampling.NEAREST)
        board.alpha_composite(art, (x + 66, y + 16))
        d.text((x + 12, y + 164), label, font=small, fill=COLORS['skin_light'])
        d.text((x + 12, y + 190), '16 x 16', font=small, fill=COLORS['steel_light'])
    d.text((40, 896), 'ARMA VINCULADA / GRAUS I - VII', font=title, fill=COLORS['gold_light'])
    for grade in range(1, 8):
        x, y = 40 + (grade - 1) * 206, 957
        d.rectangle((x, y, x + 185, y + 182), fill='#1A202B', outline=COLORS['steel'])
        art = images[f'equipment/weapon/weapon_prologue_g{grade}.png'].resize((112, 112), Image.Resampling.NEAREST)
        board.alpha_composite(art, (x + 35, y + 15))
        d.text((x + 57, y + 140), f'GRAU {grade}', font=small, fill=COLORS['skin_light'])
    output = ROOT.parents[1] / 'docs' / 'reference' / 'terrunia-inventory-pixel-v0.2.png'
    board.convert('RGB').save(output)


def build():
    permitted = {tuple(bytes.fromhex(value[1:])) for value in COLORS.values()}
    images = {}
    for relative_path, generator in ASSETS.items():
        im = generator()
        images[relative_path] = im
        expected = (32, 32) if relative_path.startswith("characters/") else (16, 16)
        assert im.mode == "RGBA" and im.size == expected, relative_path
        assert im.getbbox(), relative_path
        opaque_colors = {rgba[:3] for rgba in im.getdata() if rgba[3] > 0}
        assert opaque_colors.issubset(permitted) and len(opaque_colors) <= 16, relative_path
        if relative_path.startswith("characters/"):
            bbox = im.getbbox()
            assert bbox[2] - bbox[0] <= 24, relative_path
        path = ROOT / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        im.save(path)
        print(f"{relative_path}: {im.width}x{im.height} / {len(opaque_colors)} colors")
    build_reference_board(images)
    build_catalog_board(images)


if __name__ == "__main__":
    build()
