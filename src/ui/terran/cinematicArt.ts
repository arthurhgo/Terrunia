import type { Cutscene } from '../../domain/terran/cutscenes'
import { ACTOR_PALETTES, drawPixelActor } from './pixelActorArt'

export const CINEMATIC_WIDTH = 384
export const CINEMATIC_HEIGHT = 160

type Tone = Cutscene['tone']

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function portal(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, intense: boolean) {
  const pulse = Math.floor(frame / 15) % 3
  rect(ctx, '#1a242d', x - 28, y - 66, 56, 71)
  rect(ctx, '#77818a', x - 24, y - 66, 48, 66)
  rect(ctx, '#323d52', x - 18, y - 59, 36, 59)
  rect(ctx, pulse === 0 ? '#318fb0' : '#4ab7cb', x - 14, y - 54, 28, 49)
  rect(ctx, '#7bd8d5', x - 8, y - 48, 16, 39)
  rect(ctx, '#c7f2e9', x - 3, y - 42, 6, 26)
  if (intense) {
    rect(ctx, '#93edec', x - 35 - pulse * 3, y - 47, 5, 37)
    rect(ctx, '#93edec', x + 30 + pulse * 3, y - 47, 5, 37)
  }
}

function fungus(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  rect(ctx, '#5c5a6a', x - 2, y - size, 4, size)
  rect(ctx, '#57394f', x - size, y - size - 6, size * 2, 8)
  rect(ctx, '#936e96', x - size + 4, y - size - 10, size * 2 - 8, 6)
  rect(ctx, '#d7b3c5', x - 3, y - size - 8, 3, 3)
}

function colossus(ctx: CanvasRenderingContext2D, x: number, y: number, defeated: boolean) {
  rect(ctx, '#232933', x - 34, y - (defeated ? 30 : 57), 68, defeated ? 28 : 55)
  rect(ctx, '#4a4656', x - 25, y - (defeated ? 22 : 48), 50, defeated ? 19 : 42)
  rect(ctx, '#775773', x - 31, y - (defeated ? 25 : 58), 62, 10)
  rect(ctx, '#a8859a', x - 13, y - (defeated ? 31 : 63), 26, 9)
  if (!defeated) {
    rect(ctx, '#e4bc75', x - 15, y - 39, 9, 5)
    rect(ctx, '#e4bc75', x + 8, y - 39, 9, 5)
    rect(ctx, '#3a2f36', x - 12, y - 38, 3, 3)
    rect(ctx, '#3a2f36', x + 11, y - 38, 3, 3)
  }
}

/** VISUAL_DRAFT: an abstract oath hall, no final Clan heraldry is asserted. */
function riteHall(ctx: CanvasRenderingContext2D, frame: number, classRite: boolean) {
  rect(ctx, '#232936', 57, 19, 270, 103)
  rect(ctx, '#6f6471', 65, 26, 254, 88)
  rect(ctx, '#2f3546', 76, 35, 232, 70)
  for (let x = 85; x <= 287; x += 67) {
    const color = ['#8797b7', '#a88776', '#6f9b84', '#a68caf'][(x - 85) / 67]
    rect(ctx, '#141e2a', x - 4, 33, 36, 59)
    rect(ctx, color, x, 35, 28, 47)
    rect(ctx, '#cfba90', x + 10, 40, 8, 25)
    rect(ctx, '#1d2934', x + 12, 45, 4, 13)
  }
  rect(ctx, '#777081', 150, 96, 84, 17)
  rect(ctx, '#ac9a8c', 158, 91, 68, 14)
  rect(ctx, classRite ? '#4dc1cb' : '#d6b271', 178, 85, 28, 8)
  const pulse = Math.floor(frame / 12) % 3
  rect(ctx, classRite ? '#8adfe3' : '#e9d79b', 188, 61 - pulse, 8, 19)
  rect(ctx, classRite ? '#4dc1cb' : '#a785bc', 182 - pulse, 67, 6, 8)
  rect(ctx, classRite ? '#4dc1cb' : '#a785bc', 204 + pulse, 67, 6, 8)
}

/** VISUAL_DRAFT cinematic plates, frame-driven and independent from the quest engine. */
export function drawCinematicFrame(
  ctx: CanvasRenderingContext2D, tone: Tone, step: number, frame: number, variant: 'terririan' | 'sigil',
) {
  const ruins = tone === 'ruins', victory = tone === 'victory', ritual = tone === 'clan' || tone === 'class'
  const night = ruins || tone === 'portal' || ritual
  ctx.imageSmoothingEnabled = false
  rect(ctx, ritual ? '#1b2434' : night ? '#17233a' : victory ? '#3a4556' : '#2c5260', 0, 0, CINEMATIC_WIDTH, CINEMATIC_HEIGHT)
  rect(ctx, night ? '#27344a' : '#54717a', 0, 44, CINEMATIC_WIDTH, 54)
  for (let x = 0; x < CINEMATIC_WIDTH; x += 31) {
    const height = 8 + (x * 7 % 25)
    rect(ctx, night ? '#1d2d38' : '#365052', x, 90 - height, 19, height + 16)
  }
  rect(ctx, night ? '#2d3b3c' : '#4c6150', 0, 97, CINEMATIC_WIDTH, 63)
  for (let y = 101; y < CINEMATIC_HEIGHT; y += 12) {
    for (let x = 0; x < CINEMATIC_WIDTH; x += 16) {
      const seed = (x * 3 + y * 7) % 6
      if (seed < 3) rect(ctx, night ? '#384544' : '#63715a', x + seed, y + 2, 4, 3)
    }
  }
  if (ritual) riteHall(ctx, frame, tone === 'class')
  else if (ruins || victory) {
    rect(ctx, '#32313b', 242, 30, 105, 90)
    rect(ctx, '#615664', 250, 29, 90, 79)
    rect(ctx, '#252f3d', 268, 46, 54, 60)
    fungus(ctx, 49, 122, 13)
    fungus(ctx, 347, 130, 16)
    fungus(ctx, 89, 148, 11)
    colossus(ctx, 291, 129, victory)
  } else {
    rect(ctx, '#7b725e', 142, 104, 100, 20)
    rect(ctx, '#968975', 153, 100, 78, 14)
    portal(ctx, 192, 109, frame, tone === 'portal')
    rect(ctx, '#3f534f', 45, 75, 56, 43)
    rect(ctx, '#7c7264', 50, 85, 46, 33)
    rect(ctx, '#556c83', 42, 69, 62, 17)
    rect(ctx, '#3f534f', 290, 77, 56, 41)
    rect(ctx, '#8a776b', 297, 86, 43, 33)
    rect(ctx, '#6f5953', 290, 69, 57, 18)
  }
  const pulse = Math.floor(frame / 10 + step * 3)
  for (let i = 0; i < 12; i += 1) {
    const x = (i * 67 + pulse * (i % 3 + 1) * 2) % CINEMATIC_WIDTH
    const y = (i * 23 + 55 - pulse * 2 + 1600) % 115
    rect(ctx, ruins ? '#ad86ba' : ritual ? '#d7b1db' : victory ? '#eacb91' : '#81cbd4', x, y, 2 + i % 2, 2 + i % 2)
  }
  drawPixelActor(ctx, ritual ? 192 : ruins ? 143 : victory ? 150 : 126, 137, ritual || victory ? 'down' : 'right',
    Math.floor(frame / 12) % 3, ACTOR_PALETTES[variant], 2)
  if (tone === 'portal') {
    rect(ctx, '#bfe8e4', 180, 18 + pulse % 17, 5, 12)
    rect(ctx, '#98cfd8', 200, 31 + pulse % 12, 5, 16)
  }
  if (victory) rect(ctx, '#d7c197', 0, 4, CINEMATIC_WIDTH, 4)
}
