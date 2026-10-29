import { useEffect, useRef } from 'react'

/** Original 384×216 scene painted with integer-sized pixels; replaceable by a biome asset later. */
export function BattleArenaBackdrop({ dungeon = false }: { dungeon?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)
    }
    const floorY = 139
    rect(0, 0, 384, 216, dungeon ? '#080e1c' : '#0a1931')
    for (let y = 0; y < 130; y += 8) {
      for (let x = 0; x < 384; x += 8) {
        const n = (x * 7 + y * 13 + (x * y) % 19) % 8
        rect(x, y, 8, 8, ['#0c2343', '#132949', '#182d4a', '#0f2040'][n % 4])
        if (n === 0) rect(x + 2, y + 3, 2, 2, '#18365a')
      }
    }
    // Distant ruins and columns: silhouette, capstone, cool edge.
    for (const [x, h, w] of [[9, 90, 16], [71, 110, 13], [132, 84, 18], [218, 96, 18], [306, 104, 19], [358, 81, 14]] as const) {
      rect(x, 130 - h, w, h, '#16273d')
      rect(x - 4, 130 - h, w + 8, 6, '#31445c')
      rect(x, 130 - h, 2, h, '#2b455e')
      rect(x + 5, 130 - h + 8, 2, h - 10, '#1b3658')
      rect(x - 3, 126, w + 6, 5, '#26394c')
      rect(x + 2, 130 - h - 10, 2, 2, '#3fdde0')
    }
    // Portal is a visual treatment, not a gameplay teleport here.
    rect(166, 36, 50, 91, '#09112a')
    rect(164, 33, 54, 9, '#31445b')
    rect(169, 43, 44, 81, '#123866')
    rect(174, 48, 34, 73, '#1b6698')
    rect(178, 52, 26, 66, '#1dd0ef')
    rect(183, 56, 16, 62, '#0b305a')
    rect(187, 67, 8, 44, '#06213a')
    for (let i = 0; i < 7; i++) {
      rect(158 + i * 10, 29 + (i % 2) * 5, 2, 5, '#35cce4')
    }
    // Glowing fungi on both sides; large caps and crisp stems.
    for (const [x, y, r] of [[30, 130, 20], [49, 107, 11], [340, 119, 22], [359, 93, 12], [119, 133, 8], [285, 127, 9]] as const) {
      rect(x - 2, y - r / 2, 4, r, '#316580')
      rect(x - r, y - r, r * 2, Math.max(4, Math.floor(r / 2)), '#126585')
      rect(x - r + 3, y - r + 3, r * 2 - 6, 3, '#36d8e5')
      rect(x - Math.floor(r / 2), y - r + 1, 4, 3, '#a5f7e8')
      rect(x - 3, y - r - 4, 4, 4, '#58e3ea')
    }
    rect(0, floorY, 384, 77, '#303f48')
    for (let y = floorY; y < 216; y += 9) {
      const row = Math.floor((y - floorY) / 9)
      for (let x = -(row % 2) * 12; x < 384; x += 24) {
        const n = (x * 11 + y * 3) % 7
        rect(x, y, 23, 8, n % 3 === 0 ? '#4c5d64' : n % 3 === 1 ? '#465456' : '#394953')
        rect(x + 1, y + 1, 21, 1, '#5d6970')
        if (n % 5 === 0) rect(x + 9, y + 3, 7, 2, '#365741')
      }
    }
    // Moss and scattered runes along the floor.
    for (let i = 0; i < 38; i++) {
      const x = (i * 71 + 9) % 380
      const y = 142 + (i * 37) % 72
      rect(x, y, 3 + i % 5, 2, i % 6 ? '#426348' : '#299ba1')
    }
  }, [dungeon])
  return <canvas ref={ref} width={384} height={216} className="pixel-battle__canvas" aria-hidden="true" />
}
