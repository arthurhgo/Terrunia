"""Generate VISUAL_DRAFT Terrúnia pixel art at native resolution.

Requires Pillow: pip install Pillow
Run from the repository root: python3 scripts/build_pixel_assets.py
The PNGs intentionally contain no visible editor grid. Never upscale the files
before committing them; the browser uses CSS image-rendering: pixelated.
"""

from __future__ import annotations

import json
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
    "moss_dark": "#30533F",
    "moss": "#58A96A",
    "moss_light": "#AFD99B",
    "ember_dark": "#742F41",
    "ember": "#CE5764",
    "ember_light": "#F6A37B",
    "violet_dark": "#44365F",
    "violet": "#8668B5",
    "violet_light": "#C1A8E6",
    "sun": "#F7E08B",
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


def gem_variant(primary: str, shine: str, deep: str, glyph: str = 'dot'):
    """Individual gemstones: transparent native 16x16 matrices with distinct facets."""
    im = growth_gem()
    mapping = {
        tuple(bytes.fromhex(COLORS['blue'][1:])): COLORS[primary],
        tuple(bytes.fromhex(COLORS['cyan'][1:])): COLORS[shine],
        tuple(bytes.fromhex(COLORS['gold_dark'][1:])): COLORS[deep],
    }
    im.putdata([tuple(bytes.fromhex(mapping[rgb][1:])) + (a,) if a and
                (rgb := (r, g, b)) in mapping else (r, g, b, a)
                for r, g, b, a in im.getdata()])
    d = ImageDraw.Draw(im)
    if glyph == 'wave':
        d.line([(6, 9), (8, 8), (10, 9)], fill=COLORS['ice'], width=1)
    elif glyph == 'bolt':
        p(d, 'sun', (9, 3), (7, 7), (9, 7), (7, 11), (10, 6), (8, 6))
    elif glyph == 'star':
        d.line((8, 3, 8, 12), fill=COLORS['ice'])
        d.line((5, 8, 11, 8), fill=COLORS['ice'])
    elif glyph == 'fracture':
        d.line([(8, 3), (6, 7), (10, 8), (7, 12)], fill=COLORS['violet_light'], width=1)
    elif glyph == 'leaf':
        p(d, 'moss_light', (7, 10), (7, 6), (11, 4), (10, 8))
    elif glyph == 'heart':
        p(d, 'ember_light', (5, 5), (7, 4), (8, 6), (10, 4), (12, 5), (11, 9), (8, 12), (5, 9))
    else:
        px(d, 'ice', 7, 5)
    return im


def essence_bottle(tone: str):
    im = tonic()
    new_color = COLORS['moss'] if tone == 'fungal' else COLORS['violet']
    new_glow = COLORS['moss_light'] if tone == 'fungal' else COLORS['violet_light']
    replacements = {COLORS['blue']: new_color, COLORS['cyan']: new_glow}
    im.putdata([tuple(bytes.fromhex(replacements[COLORS['blue']][1:])) + (a,)
                if a and '#%02X%02X%02X' % (r, g, b) == COLORS['blue'] else
                tuple(bytes.fromhex(replacements[COLORS['cyan']][1:])) + (a,)
                if a and '#%02X%02X%02X' % (r, g, b) == COLORS['cyan'] else
                (r, g, b, a) for r, g, b, a in im.getdata()])
    return im


def fungorro_crawler():
    im, d = sheet(32, 32)
    # Low predatory silhouette; cap at the back, four dark forelimbs.
    for x in (6, 11, 21, 26):
        p(d, 'outline', (x, 18), (x + 2, 19), (x + 3, 27), (x - 1, 29))
        d.line([(x + 1, 20), (x + 1, 26)], fill=COLORS['leather'], width=2)
    d.ellipse((6, 9, 27, 24), fill=COLORS['outline'])
    d.ellipse((8, 11, 26, 22), fill=COLORS['moss_dark'])
    p(d, 'moss', (5, 11), (9, 6), (18, 3), (26, 7), (29, 14), (23, 17), (9, 16))
    p(d, 'moss_light', (9, 8), (18, 5), (24, 8), (25, 11), (12, 11))
    for x, y in ((12, 8), (19, 9), (24, 12)):
        r(d, 'ice', (x, y, x + 1, y + 1))
    r(d, 'ember', (12, 17, 13, 18))
    r(d, 'ember', (21, 17, 22, 18))
    r(d, 'outline', (12, 18, 12, 18))
    return im


def spore_sower():
    im, d = sheet(32, 32)
    d.polygon([(10, 17), (22, 17), (26, 28), (7, 28)], fill=COLORS['outline'])
    d.polygon([(12, 17), (21, 17), (24, 26), (9, 26)], fill=COLORS['violet_dark'])
    d.ellipse((10, 9, 22, 22), fill=COLORS['outline'])
    d.ellipse((11, 10, 21, 20), fill=COLORS['leather_light'])
    d.ellipse((3, 4, 28, 17), fill=COLORS['outline'])
    d.ellipse((4, 5, 27, 15), fill=COLORS['violet'])
    d.ellipse((9, 5, 21, 10), fill=COLORS['violet_light'])
    for x, y in ((8, 8), (17, 7), (22, 11)):
        d.rectangle((x, y, x + 2, y + 1), fill=COLORS['ice'])
    r(d, 'cyan', (13, 17, 14, 18))
    r(d, 'cyan', (18, 17, 19, 18))
    for x, y in ((2, 18), (28, 20), (5, 27)):
        r(d, 'violet_light', (x, y, x + 1, y + 1))
    return im


def mycelium_colossus():
    im, d = sheet(48, 48)
    for x in (7, 37):
        p(d, 'outline', (x, 21), (x + 5, 24), (x + 7, 43), (x + 2, 47), (x - 2, 44))
        p(d, 'leather', (x + 1, 24), (x + 4, 26), (x + 5, 42), (x + 1, 44))
    p(d, 'outline', (13, 17), (34, 16), (41, 26), (37, 43), (11, 43), (7, 28))
    p(d, 'moss_dark', (14, 19), (33, 18), (38, 27), (35, 41), (13, 41), (10, 28))
    p(d, 'moss', (15, 20), (31, 20), (36, 28), (33, 35), (15, 35), (12, 29))
    p(d, 'outline', (5, 16), (8, 5), (22, 2), (38, 5), (44, 16), (39, 23), (11, 22))
    p(d, 'ember_dark', (7, 16), (11, 8), (24, 5), (36, 8), (41, 16), (38, 20), (11, 20))
    p(d, 'ember', (12, 10), (23, 6), (34, 10), (36, 13), (10, 14))
    for x, y in ((15, 11), (24, 9), (32, 13)):
        d.rectangle((x, y, x + 3, y + 2), fill=COLORS['ember_light'])
    r(d, 'cyan', (15, 26, 19, 29))
    r(d, 'cyan', (29, 25, 33, 28))
    r(d, 'outline', (16, 27, 17, 28))
    r(d, 'outline', (30, 26, 31, 27))
    p(d, 'violet', (22, 32), (27, 32), (24, 38), (21, 36))
    px(d, 'ice', 24, 34)
    return im


NPC_THEMES = {
    'eldamar': ('navy', 'blue', 'gold_light', 'scribe'),
    'mireya': ('navy', 'steel_light', 'gold', 'crest'),
    'rustal': ('leather', 'gold_dark', 'cyan', 'rune'),
    'cebios': ('violet_dark', 'violet', 'ice', 'star'),
    'estres': ('ember_dark', 'violet_dark', 'ember_light', 'fracture'),
    'curador': ('moss_dark', 'moss', 'gold_light', 'crest'),
    'sentinela': ('navy', 'blue', 'sun', 'crest'),
    'gladiador': ('steel', 'leather', 'gold', 'shield'),
    'batedor': ('moss_dark', 'moss', 'ice', 'arrow'),
    'forjador': ('leather', 'ember_dark', 'gold_light', 'hammer'),
    'inscricoes': ('navy', 'steel', 'cyan', 'rune'),
    'gravador': ('shade', 'violet_dark', 'violet_light', 'fracture'),
    'astrologo': ('violet_dark', 'violet', 'sun', 'star'),
    'profeta': ('violet_dark', 'blue', 'cyan', 'eye'),
    'cacador': ('moss_dark', 'navy', 'ice', 'arrow'),
    'canalizador': ('ember_dark', 'ember', 'violet_light', 'fracture'),
    'ruptura': ('steel', 'violet_dark', 'ember_light', 'shield'),
    'ruina': ('shade', 'ember_dark', 'ember', 'rune'),
}


def npc_portrait(key: str):
    """32x32 half-turn portrait. Tunic, headgear and crest vary by identity."""
    primary, secondary, accent, sigil = NPC_THEMES[key]
    im = character(graphite=True)
    # Recolor only the tunic palette, retaining the neutral face and outline.
    replacements = {
        tuple(bytes.fromhex(COLORS['steel'][1:])): COLORS[primary],
        tuple(bytes.fromhex(COLORS['steel_light'][1:])): COLORS[secondary],
    }
    im.putdata([tuple(bytes.fromhex(replacements[(r, g, b)][1:])) + (a,)
                if a and (r, g, b) in replacements else (r, g, b, a)
                for r, g, b, a in im.getdata()])
    d = ImageDraw.Draw(im)
    index = list(NPC_THEMES).index(key)
    if index % 3 == 0:
        # Scholar hood/cap.
        p(d, primary, (10, 8), (12, 2), (18, 0), (24, 5), (23, 10), (21, 6), (13, 6), (12, 12))
        r(d, accent, (13, 3, 20, 3))
    elif index % 3 == 1:
        # Crest helm or hairband.
        r(d, 'outline', (13, 2, 21, 5))
        r(d, secondary, (14, 2, 20, 4))
        r(d, accent, (17, 1, 18, 4))
    else:
        # Long hair and a high collar.
        r(d, primary, (11, 6, 12, 16))
        r(d, primary, (21, 6, 22, 15))
        r(d, accent, (12, 4, 14, 4))
    r(d, accent, (16, 17, 18, 19))
    if sigil == 'star':
        px(d, 'ice', 17, 16)
        px(d, 'ice', 15, 18)
        px(d, 'ice', 20, 18)
    elif sigil == 'arrow':
        p(d, accent, (15, 16), (21, 19), (16, 19))
    elif sigil == 'fracture':
        d.line([(16, 16), (18, 18), (16, 21)], fill=COLORS[accent], width=1)
    elif sigil == 'shield':
        p(d, accent, (15, 16), (20, 16), (19, 21), (17, 23), (15, 21))
    elif sigil == 'rune':
        r(d, accent, (15, 16, 15, 21))
        r(d, accent, (19, 16, 19, 21))
    elif sigil == 'eye':
        d.ellipse((15, 16, 20, 20), outline=COLORS[accent])
    elif sigil == 'hammer':
        d.line([(16, 16), (19, 21)], fill=COLORS[accent], width=2)
        r(d, accent, (14, 15, 19, 16))
    else:
        r(d, accent, (15, 18, 20, 18))
    return im


def mystic_tunic():
    im, d = sheet()
    p(d, 'outline', (4, 2), (6, 1), (11, 1), (14, 4), (15, 9), (12, 10), (12, 15), (3, 15), (3, 10), (0, 9), (1, 4))
    p(d, 'violet_dark', (4, 3), (7, 3), (11, 3), (13, 5), (13, 9), (11, 9), (11, 14), (4, 14), (4, 9), (2, 9), (2, 5))
    r(d, 'violet', (5, 5, 10, 12))
    p(d, 'cyan', (8, 6), (10, 8), (8, 11), (6, 8))
    px(d, 'ice', 8, 8)
    return im


def star_mantle():
    im, d = sheet()
    p(d, 'outline', (6, 1), (10, 1), (14, 5), (15, 15), (1, 15), (2, 5))
    p(d, 'navy', (6, 2), (10, 2), (13, 6), (14, 14), (2, 14), (3, 6))
    p(d, 'violet_dark', (6, 3), (10, 3), (11, 8), (8, 10), (5, 8))
    r(d, 'gold', (7, 8, 9, 9))
    for x, y in ((5, 6), (11, 5), (5, 12), (11, 12)):
        px(d, 'ice', x, y)
    d.line([(8, 3), (8, 7)], fill=COLORS['gold_light'])
    return im


def enchanted_vestments():
    im = mystic_tunic()
    d = ImageDraw.Draw(im)
    p(d, 'blue', (5, 5), (10, 5), (11, 12), (4, 12))
    r(d, 'gold', (4, 13, 11, 14))
    r(d, 'cyan', (7, 7, 9, 10))
    px(d, 'ice', 8, 8)
    return im


def chain_mail():
    im, d = sheet()
    p(d, 'outline', (4, 2), (6, 1), (11, 1), (14, 4), (15, 10), (12, 11), (12, 15), (3, 15), (3, 11), (0, 10), (1, 4))
    p(d, 'steel', (4, 3), (11, 3), (13, 5), (13, 10), (11, 10), (11, 14), (4, 14), (4, 10), (2, 10), (2, 5))
    r(d, 'steel_light', (5, 4, 10, 13))
    for y in range(5, 13, 2):
        for x in range(5 + (y % 4 == 1), 11, 3):
            px(d, 'ice', x, y)
    r(d, 'gold_dark', (7, 3, 9, 4))
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


def sylwen_ether():
    im, d = sheet()
    r(d, 'outline', (5, 1, 10, 3))
    r(d, 'gold', (6, 1, 9, 2))
    r(d, 'outline', (3, 4, 12, 14))
    r(d, 'blue', (4, 6, 11, 13))
    r(d, 'cyan', (5, 7, 10, 12))
    r(d, 'ice', (6, 8, 7, 9))
    r(d, 'steel_light', (6, 3, 9, 5))
    return im


def field_compress():
    im, d = sheet()
    r(d, 'outline', (1, 4, 14, 11))
    r(d, 'leather', (2, 5, 13, 10))
    r(d, 'skin_light', (3, 6, 12, 9))
    r(d, 'skin', (6, 4, 9, 11))
    r(d, 'gold_light', (7, 6, 8, 9))
    return im


def sylwen_antidote():
    im, d = sheet()
    r(d, 'outline', (6, 1, 9, 4))
    r(d, 'leather_light', (6, 1, 9, 2))
    p(d, 'outline', (5, 3), (10, 3), (13, 8), (10, 14), (5, 14), (2, 8))
    p(d, 'steel', (5, 4), (10, 4), (12, 8), (10, 13), (5, 13), (3, 8))
    r(d, 'cyan', (4, 8, 11, 11))
    r(d, 'ice', (7, 8, 8, 11))
    r(d, 'ice', (5, 9, 10, 10))
    return im


def terran_healer():
    im, d = sheet()
    r(d, 'outline', (5, 1, 10, 7))
    r(d, 'skin', (5, 3, 10, 7))
    r(d, 'leather', (4, 1, 10, 3))
    r(d, 'gold_light', (5, 2, 9, 2))
    r(d, 'outline', (3, 8, 12, 15))
    r(d, 'blue', (4, 9, 11, 14))
    r(d, 'skin_light', (7, 9, 8, 14))
    px(d, 'outline', 9, 5)
    return im


def terran_alchemist():
    im, d = sheet()
    r(d, 'outline', (5, 2, 10, 8))
    r(d, 'skin', (5, 4, 10, 8))
    r(d, 'shade', (4, 2, 11, 4))
    r(d, 'gold', (5, 3, 10, 3))
    r(d, 'outline', (3, 9, 12, 15))
    r(d, 'leather_light', (4, 10, 11, 14))
    r(d, 'blue', (7, 10, 8, 13))
    px(d, 'outline', 9, 6)
    return im


def terran_tracker():
    im, d = sheet()
    r(d, 'outline', (5, 2, 10, 8))
    r(d, 'skin', (5, 4, 10, 8))
    r(d, 'leather', (3, 2, 12, 3))
    r(d, 'gold_dark', (6, 1, 9, 2))
    r(d, 'outline', (2, 9, 13, 15))
    r(d, 'leather_light', (3, 10, 12, 14))
    r(d, 'navy', (7, 10, 8, 14))
    px(d, 'outline', 9, 5)
    return im


def terran_inscriber():
    im, d = sheet()
    r(d, 'outline', (5, 2, 10, 8))
    r(d, 'skin_light', (5, 4, 10, 8))
    r(d, 'steel', (4, 1, 11, 3))
    r(d, 'cyan', (7, 2, 8, 2))
    r(d, 'outline', (2, 9, 13, 15))
    r(d, 'navy', (3, 10, 12, 14))
    r(d, 'steel_light', (6, 10, 9, 14))
    px(d, 'outline', 9, 5)
    return im


def fungal_slime():
    im, d = sheet(32, 32)
    d.ellipse((2, 12, 29, 29), fill=COLORS['outline'])
    p(d, 'moss_dark', (3, 19), (8, 11), (14, 8), (19, 9), (26, 13), (29, 22), (27, 28), (7, 28))
    p(d, 'moss', (5, 19), (10, 13), (15, 11), (23, 13), (27, 19), (26, 26), (8, 26))
    p(d, 'moss_light', (8, 18), (12, 14), (20, 14), (24, 17), (21, 22), (11, 22))
    for x, y in ((10, 11), (16, 6), (24, 12), (5, 24)):
        r(d, 'cyan', (x, y, x + 2, y + 2))
    for x, y in ((11, 18), (20, 18)):
        r(d, 'outline', (x, y, x + 2, y + 2))
    r(d, 'moss_dark', (15, 23, 18, 24))
    px(d, 'ice', 15, 17)
    r(d, 'moss_dark', (8, 26, 10, 29))
    r(d, 'moss_dark', (23, 26, 25, 29))
    return im


def fungal_horror():
    im, d = sheet(32, 32)
    p(d, 'outline', (13, 16), (19, 15), (24, 21), (28, 30), (4, 30), (8, 22))
    p(d, 'violet_dark', (11, 18), (20, 17), (23, 25), (24, 29), (7, 29), (9, 23))
    p(d, 'violet', (13, 19), (19, 18), (19, 28), (14, 28))
    p(d, 'outline', (5, 15), (11, 6), (20, 5), (28, 15), (27, 20), (6, 20))
    p(d, 'ember_dark', (6, 15), (12, 7), (21, 7), (27, 15), (25, 18), (8, 18))
    p(d, 'ember', (10, 12), (14, 8), (20, 8), (24, 13))
    for x, y in ((12, 11), (19, 10), (23, 14)):
        r(d, 'ember_light', (x, y, x + 2, y + 1))
    r(d, 'outline', (12, 18, 19, 22))
    r(d, 'cyan', (13, 19, 14, 20))
    r(d, 'cyan', (18, 19, 19, 20))
    d.line(((9, 22), (5, 25), (3, 29)), fill=COLORS['violet'], width=3)
    d.line(((23, 22), (27, 24), (29, 29)), fill=COLORS['violet'], width=3)
    r(d, 'outline', (11, 29, 14, 31))
    r(d, 'outline', (20, 29, 23, 31))
    return im



def street_portrait(name: str):
    """VISUAL_DRAFT 32x32 RGBA street NPC; generated by palette, not by gameplay state."""
    themes = {
        'arlen': ('#586c82', '#e0bc83', '#443c35', '#ccb982', 'scroll'),
        'liora': ('#3b866e', '#e4b8a1', '#724835', '#a2c96e', 'leaf'),
        'garrik': ('#7a4b4a', '#d9a67f', '#332e37', '#c4c4c6', 'shield'),
        'siven': ('#576995', '#e6c6a8', '#b29663', '#7ab7c8', 'map'),
        'nara': ('#795a8d', '#d2a991', '#2d273e', '#c6a7da', 'star'),
        'ruven': ('#4d6476', '#aa886e', '#b1a18a', '#82d8d7', 'lamp'),
    }
    cloth, skin, hair, accent, prop = themes[name]
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    def box(x0, y0, x1, y1, color):
        d.rectangle((x0, y0, x1, y1), fill=color)
    ink = '#17212b'
    for rect, color in [
        ((8,27,23,30),ink),((7,19,24,28),ink),((9,21,22,28),cloth),
        ((5,22,9,28),ink),((23,22,27,28),ink),((6,23,8,27),cloth),
        ((24,23,26,27),cloth),((10,7,21,19),ink),((11,8,20,18),skin),
        ((9,8,22,12),hair),((10,5,20,9),hair),((11,11,12,12),'#f4d4b9'),
        ((19,11,20,12),'#f4d4b9'),((13,14,14,15),ink),((18,14,19,15),ink),
        ((15,17,17,17),'#9c6656'),((13,20,19,21),accent),((15,23,17,26),accent),
        ((10,29,13,31),ink),((18,29,22,31),ink),
    ]: box(*rect, color)
    details = {
        'scroll': [(3,21,7,24,accent),(4,19,6,27,'#dcd3a1'),(5,21,6,24,'#a97c3a'),(24,8,25,12,'#d5c68f')],
        'leaf': [(4,18,7,23,'#3d9d6b'),(3,17,5,19,'#73c88d'),(24,17,27,20,'#70bd75'),(25,16,26,22,'#456e45')],
        'shield': [(24,21,29,28,'#263744'),(25,22,28,26,'#b0afb4'),(26,23,27,25,'#577d9d'),(6,9,9,13,'#b2a8a2')],
        'map': [(3,21,8,26,'#decaa2'),(4,22,7,25,'#9b875e'),(5,23,6,24,'#2c8698'),(24,8,26,9,'#a9c9e5')],
        'star': [(2,19,7,24,'#382a58'),(4,20,5,24,'#e4d3a9'),(3,22,6,22,'#e4d3a9'),(25,7,26,9,'#e4d3a9')],
        'lamp': [(24,18,28,23,'#295663'),(25,19,27,22,'#84e0d8'),(26,17,26,24,'#cabd7e'),(7,10,9,12,'#969a9c')],
    }
    for x0, y0, x1, y1, color in details[prop]: box(x0, y0, x1, y1, color)
    return im


def imported_visual(relative_path: str) -> Image.Image:
    """Read unmerged-PR visual drafts, mapping to the canonical 16-color sprite palette."""
    image = Image.open(ROOT / relative_path).convert('RGBA')
    palette = [tuple(bytes.fromhex(value[1:])) for value in COLORS.values()]
    def nearest(rgba):
        if rgba[3] == 0:
            return (0, 0, 0, 0)
        rgb = min(palette, key=lambda color: sum((a - b) ** 2 for a, b in zip(rgba[:3], color)))
        return (*rgb, rgba[3])
    image.putdata([nearest(pixel) for pixel in image.getdata()])
    return image

IMPORTED_PR17_ASSETS = (
    'enemies/portal/enemy_luminous_slime_idle.png',
    'enemies/portal/enemy_void_moth_idle.png',
    'enemies/portal/enemy_spore_mantis_idle.png',
    'enemies/portal/enemy_ruin_sentinel_idle.png',
    'items/item_resonance_flask.png',
    'items/item_field_rune.png',
    'items/item_vital_essence.png',
    'items/item_luminous_gel.png',
    'items/item_void_dust.png',
    'items/item_spore_chitin.png',
    'items/item_ruin_shard.png',
)

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
    "equipment/catalog/armor_mystic_tunic.png": mystic_tunic,
    "equipment/catalog/armor_star_mantle.png": star_mantle,
    "equipment/catalog/armor_enchanted_vestments.png": enchanted_vestments,
    "equipment/catalog/armor_chain.png": chain_mail,
    "equipment/catalog/necklace_moon.png": moon_necklace,
    "equipment/catalog/necklace_rune.png": necklace,
    "equipment/catalog/bracelet_leather.png": leather_bracelet,
    "equipment/catalog/bracelet_resonance.png": bracelet,
    "items/item_fungal_nucleus.png": fungal_nucleus,
    "items/item_spore_cluster.png": spores,
    "items/item_minor_tonic.png": tonic,
    "items/item_simple_ether.png": sylwen_ether,
    "items/item_field_compress.png": field_compress,
    "items/item_antidote.png": sylwen_antidote,
    "npcs/npc_daeryn_portrait.png": lambda: terran_healer().resize((32, 32), Image.Resampling.NEAREST),
    "npcs/npc_sylwen_portrait.png": lambda: terran_alchemist().resize((32, 32), Image.Resampling.NEAREST),
    "npcs/npc_vorren_portrait.png": lambda: terran_tracker().resize((32, 32), Image.Resampling.NEAREST),
    "npcs/npc_lithwynn_portrait.png": lambda: terran_inscriber().resize((32, 32), Image.Resampling.NEAREST),
    **{f"npcs/npc_street_{name}_portrait.png": (lambda name=name: street_portrait(name))
       for name in ('arlen', 'liora', 'garrik', 'siven', 'nara', 'ruven')},
    "items/item_mycelial_fragment.png": mycelial_fragment,
    "items/item_astravel_record.png": record,
    "gems/gem_emerald_growth.png": lambda: gem_variant('moss', 'moss_light', 'moss_dark', 'leaf'),
    "gems/gem_sapphire_tides.png": lambda: gem_variant('blue', 'cyan', 'navy', 'wave'),
    "gems/gem_ruby_wrath.png": lambda: gem_variant('ember', 'ember_light', 'ember_dark', 'bolt'),
    "gems/gem_onyx_shadow.png": lambda: gem_variant('shade', 'steel', 'outline', 'fracture'),
    "gems/gem_amethyst_mind.png": lambda: gem_variant('violet', 'violet_light', 'violet_dark', 'star'),
    "gems/gem_topaz_lightning.png": lambda: gem_variant('gold', 'sun', 'gold_dark', 'bolt'),
    "gems/gem_diamond_celestial.png": lambda: gem_variant('steel_light', 'ice', 'steel', 'star'),
    "gems/gem_opal_chaos.png": lambda: gem_variant('violet', 'cyan', 'violet_dark', 'fracture'),
    "gems/gem_jade_eternity.png": lambda: gem_variant('moss', 'moss_light', 'moss_dark', 'leaf'),
    "gems/gem_kethzar_heart.png": lambda: gem_variant('ember', 'ember_light', 'ember_dark', 'heart'),
    "essences/essence_fungal_weak.png": lambda: essence_bottle('fungal'),
    "essences/essence_mycelial.png": lambda: essence_bottle('mycelial'),
    "enemies/fungorros/enemy_fungorro_crawler_idle.png": fungorro_crawler,
    "enemies/fungorros/enemy_spore_sower_idle.png": spore_sower,
    "enemies/fungorros/enemy_fungal_slime_idle.png": fungal_slime,
    "enemies/fungorros/enemy_fungal_horror_idle.png": fungal_horror,
    "enemies/bosses/enemy_colossus_mycelium_idle.png": mycelium_colossus,
    "npcs/npc_eldamar_portrait.png": lambda: npc_portrait('eldamar'),
    "npcs/npc_mireya_dunavar_portrait.png": lambda: npc_portrait('mireya'),
    "npcs/npc_master_rustal_portrait.png": lambda: npc_portrait('rustal'),
    "npcs/npc_observador_cebios_portrait.png": lambda: npc_portrait('cebios'),
    "npcs/npc_guardador_estres_portrait.png": lambda: npc_portrait('estres'),
    "npcs/npc_curador_nexo_portrait.png": lambda: npc_portrait('curador'),
    **{f"npcs/npc_master_{key}_portrait.png": (lambda key=key: npc_portrait(key))
       for key in ('sentinela', 'gladiador', 'batedor', 'forjador', 'inscricoes',
                   'gravador', 'astrologo', 'profeta', 'cacador', 'canalizador',
                   'ruptura', 'ruina')},
    **{path: (lambda path=path: imported_visual(path)) for path in IMPORTED_PR17_ASSETS},
}


ITEM_IDS = {
    'items/item_fungal_nucleus.png': 'item.fungal-nucleus',
    'items/item_spore_cluster.png': 'item.spore-cluster',
    'items/item_minor_tonic.png': 'item.minor-tonic',
    'items/item_simple_ether.png': 'item.simple-ether',
    'items/item_field_compress.png': 'item.field-compress',
    'items/item_antidote.png': 'item.antidote',
    'items/item_mycelial_fragment.png': 'item.mycelial-fragment',
    'items/item_astravel_record.png': 'item.quest-record',
    **{f'items/item_{name}.png': f'item.{name.replace("_", "-")}' for name in (
        'resonance_flask', 'field_rune', 'vital_essence',
        'luminous_gel', 'void_dust', 'spore_chitin', 'ruin_shard'
    )},
}
ENEMY_IDS = {
    'enemy_fungorro_crawler_idle': 'enemy.fungorro-crawler',
    'enemy_spore_sower_idle': 'enemy.spore-sower',
    'enemy_fungal_slime_idle': 'enemy.fungal-slime',
    'enemy_fungal_horror_idle': 'enemy.fungal-horror',
    'enemy_colossus_mycelium_idle': 'enemy.colossus-mycelium',
    **{f'enemy_{name}_idle': f'enemy.{name.replace("_", "-")}' for name in (
        'luminous_slime', 'void_moth', 'spore_mantis', 'ruin_sentinel'
    )},
}
NPC_IDS = {
    'npc_eldamar': 'npc.eldamar.portrait',
    'npc_daeryn': 'npc.daeryn.portrait',
    'npc_sylwen': 'npc.sylwen.portrait',
    'npc_vorren': 'npc.vorren.portrait',
    'npc_lithwynn': 'npc.lithwynn.portrait',
    **{f'npc_street_{name}': f'npc.street.{name}'
       for name in ('arlen', 'liora', 'garrik', 'siven', 'nara', 'ruven')},
    'npc_mireya_dunavar': 'npc.mireya.portrait',
    'npc_master_rustal': 'npc.rustal.portrait',
    'npc_observador_cebios': 'npc.cebios.portrait',
    'npc_guardador_estres': 'npc.estres.portrait',
    'npc_curador_nexo': 'npc.curador.nexo.portrait',
}


def sprite_identity(path: str):
    """Return registry key and asset family; no gameplay rules live here."""
    file_name = Path(path).stem
    if path.startswith('characters/'):
        return ('character.terririan.default' if file_name == 'player_default' else
                'character.terririan.sigil'), 'player'
    if path.startswith('equipment/catalog/'):
        return 'equipment.catalog.' + file_name, 'item'
    if path.startswith('equipment/slot-previews/'):
        return 'equipment.slot-preview.' + file_name, 'item'
    if path.startswith('equipment/weapon/'):
        return 'equipment.weapon.prologue.' + file_name.rsplit('_', 1)[-1], 'item'
    if path.startswith('items/'):
        return ITEM_IDS[path], 'item'
    if path.startswith('gems/'):
        return 'gem.' + file_name.removeprefix('gem_').replace('_', '-'), 'item'
    if path.startswith('essences/'):
        return 'essence.' + file_name.removeprefix('essence_').replace('_', '-'), 'item'
    if path.startswith('enemies/'):
        return ENEMY_IDS[file_name], 'monster'
    if path.startswith('npcs/'):
        npc_id = file_name.removesuffix('_portrait')
        return NPC_IDS.get(npc_id, npc_id + '.portrait'), 'npc'
    raise ValueError(path)


def build_atlas(images: dict[str, Image.Image], family: str, cell: int, columns: int):
    paths = [p for p in images if sprite_identity(p)[1] == family and images[p].size == (cell, cell)]
    rows = (len(paths) + columns - 1) // columns
    atlas = Image.new('RGBA', (columns * cell, rows * cell), (0, 0, 0, 0))
    positions = {}
    for i, path in enumerate(paths):
        x, y = (i % columns) * cell, (i // columns) * cell
        atlas.alpha_composite(images[path], (x, y))
        positions[path] = {'path': f'/assets/atlas/terrunia-{family}-v0.1.png',
                           'x': x, 'y': y, 'width': cell, 'height': cell}
    output = ROOT / 'atlas' / f'terrunia-{family}-v0.1.png'
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output)
    return positions


def build_sprite_manifest(images: dict[str, Image.Image]):
    item_positions = build_atlas(images, 'item', 16, 8)
    npc_positions = build_atlas(images, 'npc', 32, 6)
    records = []
    for path, img in images.items():
        asset_id, family = sprite_identity(path)
        records.append({
            'assetId': asset_id, 'path': '/assets/' + path,
            'family': family, 'width': img.width, 'height': img.height,
            'perspective': '3/4 superior', 'pixelArt': True,
            'status': 'VISUAL_DRAFT',
            'atlas': item_positions.get(path) or npc_positions.get(path),
        })
    assert len(set(record['assetId'] for record in records)) == len(records)
    payload = {'schemaVersion': '0.1', 'grid': {'item': [16, 16], 'npc': [32, 32],
                                             'monster': [32, 32], 'boss': [48, 48]},
               'entries': records}
    output = ROOT / 'manifests' / 'terrunia-sprites-v0.1.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf8')


def build_sprite_preview(images: dict[str, Image.Image], family: str):
    sprites = [(path, im) for path, im in images.items() if sprite_identity(path)[1] == family]
    columns = 8 if family == 'item' else 6
    cell_width, cell_height = (170, 160) if family == 'item' else (210, 210)
    rows = (len(sprites) + columns - 1) // columns
    board = Image.new('RGB', (columns * cell_width + 32, rows * cell_height + 142), '#11131A')
    d = ImageDraw.Draw(board)
    font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
    font = ImageFont.truetype(font_path, 14) if Path(font_path).exists() else ImageFont.load_default()
    id_font = ImageFont.truetype(font_path, 11) if Path(font_path).exists() else font
    title = ImageFont.truetype(font_path, 25) if Path(font_path).exists() else font
    d.text((30, 30), 'TERRUNIA / ' + family.upper() + ' / SPRITES v0.1',
           font=title, fill=COLORS['gold_light'])
    d.text((32, 78), 'GRADE NATIVA - PNG RGBA - AMPLIACAO NEAREST NEIGHBOR / VISUAL_DRAFT',
           font=font, fill=COLORS['steel_light'])
    for i, (path, im) in enumerate(sprites):
        x = 20 + (i % columns) * cell_width
        y = 120 + (i // columns) * cell_height
        d.rectangle((x, y, x + cell_width - 10, y + cell_height - 10),
                    fill='#202936', outline=COLORS['gold_dark'], width=1)
        scale = 6 if family == 'item' else 4
        if im.width == 48:
            scale = 3
        sample = im.resize((im.width * scale, im.height * scale), Image.Resampling.NEAREST)
        board.paste(sample, (x + (cell_width - 10 - sample.width) // 2, y + 7), sample)
        label = Path(path).stem
        d.text((x + 9, y + cell_height - 41), label[:23], font=id_font, fill=COLORS['skin_light'])
        if len(label) > 23:
            d.text((x + 9, y + cell_height - 28), label[23:46], font=id_font,
                   fill=COLORS['skin_light'])
        d.text((x + 9, y + cell_height - 15), f'{im.width}x{im.height}', font=id_font,
               fill=COLORS['steel_light'])
    output = ROOT.parents[1] / 'docs' / 'reference' / f'terrunia-sprites-{family}-v0.1.png'
    board.save(output)


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
    d.text((43, 763), 'PALETA BASE 16 CORES', font=small, fill=COLORS['skin_light'])
    for i, color in enumerate(list(COLORS.values())[:16]):
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
        expected = ((48, 48) if 'enemy_colossus' in relative_path else
                    (32, 32) if relative_path.startswith(('characters/', 'npcs/', 'enemies/'))
                    else (16, 16))
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
    build_sprite_manifest(images)
    for family in ('item', 'monster', 'npc'):
        build_sprite_preview(images, family)


if __name__ == "__main__":
    build()
