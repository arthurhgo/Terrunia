"""Native 32px character designs; generate portraits and world sprites from one source.
VISUAL_DRAFT. Input: src/content/npcVisuals.json. Never derives gameplay from an image.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from build_pixel_assets import COLORS, sheet, p, r, px
ROOT=Path(__file__).resolve().parents[1]

def draw(profile):
    im,d=sheet(32,32)
    cloth,light,hair,skin,prop,style=profile['design']
    outline='outline'
    # Distinct silhouettes: cape, apron, shoulder plates, hood, or travelling coat.
    wide = style in ('armor','apron')
    left,right=(7,25) if wide else (9,23)
    p(d,outline,(left,14),(right,14),(right+2,26),(right-2,28),(19,25),(13,27),(left-2,28))
    p(d,cloth,(left+1,15),(right-1,15),(right+1,25),(right-2,26),(19,23),(13,25),(left,26))
    r(d,light,(left+1,16,left+3,24));r(d,'leather',(11,25,14,29));r(d,'leather',(20,25,23,29))
    r(d,outline,(10,29,15,31));r(d,outline,(19,29,24,31));r(d,'leather_light',(11,29,14,29));r(d,'leather_light',(20,29,23,29))
    # Face is shared by the standing portrait and the in-game sprite.
    p(d,outline,(12,4),(19,3),(23,7),(22,13),(18,16),(12,13),(10,8))
    p(d,skin,(12,6),(19,5),(21,8),(21,12),(18,14),(13,12),(11,8))
    p(d,hair,(10,7),(12,3),(18,2),(22,5),(22,8),(18,6),(15,8),(12,7),(11,11))
    if style in ('robe','herbalist','mystic'):
        r(d,hair,(10,8,12,17));r(d,hair,(21,8,23,16));r(d,light,(12,16,14,23))
    if style in ('ranger','hood'):
        p(d,cloth,(9,8),(12,2),(20,2),(24,9),(23,15),(21,12),(21,6),(13,5),(11,13),(9,14))
        r(d,light,(12,3,20,3))
    if style=='scholar':
        r(d,cloth,(9,3,22,5));p(d,light,(11,3),(14,0),(20,2),(20,3))
    if style=='armor':
        r(d,'steel',(8,14,13,19));r(d,'steel_light',(9,14,12,15));r(d,'steel',(21,14,26,19))
        r(d,light,(13,18,20,21));r(d,'gold_dark',(14,22,20,23))
    if style=='apron':
        r(d,'leather',(12,16,21,26));r(d,'leather_light',(13,17,14,24));r(d,'steel_light',(16,19,20,20))
        r(d,hair,(13,12,20,14))
    if style=='merchant':
        r(d,light,(11,2,21,4));r(d,'gold_light',(15,17,17,21));r(d,'leather_light',(19,20,24,25))
    r(d,outline,(15,9,15,10));r(d,outline,(19,9,20,10));px(d,'skin_light',18,12)
    r(d,'gold',(15,23,19,24));r(d,'gold_light',(17,23,18,23))
    r(d,skin,(6,21,9,24));r(d,skin,(24,21,27,24))
    if prop=='staff':
        r(d,outline,(3,6,5,28));r(d,'gold',(4,7,4,27));r(d,'cyan',(2,4,6,8));r(d,'ice',(3,3,5,5))
    elif prop=='hammer':
        r(d,'leather_light',(25,12,26,26));r(d,outline,(22,9,30,15));r(d,'steel',(23,10,29,14));r(d,'steel_light',(23,10,28,11))
    elif prop=='shield':
        p(d,outline,(1,17),(9,16),(11,22),(8,28),(4,27),(1,22));p(d,light,(2,18),(8,18),(9,22),(7,26),(4,25),(2,21));r(d,'gold',(5,19,6,24))
    elif prop=='bow':
        p(d,outline,(28,5),(31,10),(31,23),(28,29),(26,28),(28,22),(28,11),(26,6));r(d,'gold',(29,9,29,24));r(d,'skin_light',(26,9,26,25))
    elif prop=='potion':
        r(d,'gold',(3,17,7,19));r(d,outline,(1,20,9,27));r(d,'cyan',(2,21,8,26));r(d,'ice',(3,21,4,24))
    elif prop in ('book','map','scroll'):
        r(d,outline,(1,19,10,27));r(d,light,(2,20,9,26));r(d,'skin_light',(3,21,8,25));r(d,'gold_dark',(4,22,7,22));r(d,'gold_dark',(4,24,7,24))
    elif prop=='gem':
        p(d,outline,(4,16),(9,20),(8,25),(3,26),(0,21));p(d,'cyan',(4,18),(7,20),(6,24),(3,24),(2,21));px(d,'ice',4,19)
    elif prop=='herbs':
        r(d,'leather',(1,23,10,28));r(d,'moss',(3,16,5,24));r(d,'moss_light',(1,17,4,20));r(d,'moss',(6,18,8,24))
    else:
        p(d,outline,(2,20),(8,19),(10,25),(7,29),(1,27));r(d,'gold',(3,22,7,27));r(d,'gold_light',(4,22,5,24))
    return im

def build():
    profiles=json.loads((ROOT/'src/content/npcVisuals.json').read_text())
    for profile in profiles:
        path=ROOT/'public'/profile['path'].lstrip('/')
        path.parent.mkdir(parents=True,exist_ok=True)
        draw(profile).save(path)
    # Three 16px native materials use the same palette as the cast/equipment.
    for name,color in [('runic_alloy','steel_light'),('weapon_core','cyan'),('mycelial_resin','moss')]:
        im,d=sheet();p(d,'outline',(3,4),(11,2),(14,6),(12,13),(3,14),(1,10));p(d,color,(4,5),(10,3),(12,6),(11,11),(4,12),(2,9));r(d,'ice',(5,5,9,6));r(d,'gold',(6,9,9,10))
        im.save(ROOT/'public/assets/items'/f'item_{name}.png')
    print(f'{len(profiles)} distinctive NPCs generated; portraits and world sprites share the same PNG.')
if __name__=='__main__':build()
